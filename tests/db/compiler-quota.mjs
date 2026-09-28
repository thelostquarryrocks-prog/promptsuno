// Opt-in only. Requires psql and a NEW EMPTY disposable local database named
// promptsuno_quota_test, owned by postgres. Never accepts a remote host/URL.
// Auth claims below simulate PostgREST's verified-JWT context, not JWT validation.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const port = process.env.LOCAL_QUOTA_TEST_PORT ?? '54322'
if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid local test port')
const args = ['-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', port, '-U', 'postgres', '-d', 'promptsuno_quota_test']
// libpq PGHOSTADDR/PGSERVICE can override host resolution: do not inherit them.
const dbEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('PG')))
dbEnv.PGCONNECT_TIMEOUT = '3'
if (process.env.LOCAL_QUOTA_TEST_PASSWORD) dbEnv.PGPASSWORD = process.env.LOCAL_QUOTA_TEST_PASSWORD
function sql(text) {
  return new Promise((resolve, reject) => {
    const child = spawn('psql', args, { windowsHide: true, env: dbEnv })
    let stdout = ''; let stderr = ''
    child.on('error', reject)
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.stdin.on('error', () => {})
    child.on('exit', code => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim())))
    child.stdin.end(text)
  })
}
const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
const session = (id, command, ending = 'commit') => `begin; set local role authenticated; set local "request.jwt.claim.sub" = '${id}'; ${command}; ${ending};`
const reserve = async id => JSON.parse(await sql(session(id, 'select public.reserve_compiler_attempt()')))
let passed = 0
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`) }

try {
  const empty = await sql("select count(*) from pg_namespace where nspname not in ('public','information_schema') and nspname not like 'pg_%';")
  assert.equal(empty, '0', 'Refusing a nonempty database (including an existing Supabase project)')
  assert.equal(await sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public';"), '0')
  // Roles are cluster-wide: use a disposable local test cluster, never a shared DB.
  await sql(`do $$ begin
    if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin; end if;
    end $$;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    insert into auth.users values ('${a}'), ('${b}');`)
  await sql(readFileSync(new URL('../../supabase/migrations/202609280001_compiler_quota.sql', import.meta.url), 'utf8'))
  await check('missing launch policy fails closed', async () => {
    await assert.rejects(reserve(a), /not configured/)
    assert.equal(await sql('select count(*) from compiler_quota_private.usage'), '0')
  })
  await sql('insert into compiler_quota_private.policy values (true, 3, 60, 5, 86400)')
  await check('anonymous, missing identity and direct access denied', async () => {
    await assert.rejects(sql('set role anon; select public.reserve_compiler_attempt()'), /permission denied/)
    await assert.rejects(reserve(''), /Authentication required/)
    for (const role of ['anon', 'authenticated', 'service_role']) {
      await assert.rejects(sql(`set role ${role}; select * from compiler_quota_private.usage`), /permission denied/)
      await assert.rejects(sql(`set role ${role}; update compiler_quota_private.policy set burst_limit=999`), /permission denied/)
    }
    await assert.rejects(sql(session(a, `select public.reserve_compiler_attempt('${b}')`)), /does not exist/)
  })
  await check('constraints reject zero, missing, invalid windows and allowances', async () => {
    for (const assignment of ['burst_limit=0', 'burst_limit=null', 'burst_window_seconds=0', 'sustained_window_seconds=2678401', 'burst_limit=6']) {
      await assert.rejects(sql(`update compiler_quota_private.policy set ${assignment}`), /constraint|null value/)
    }
  })
  await check('concurrent connections reserve exactly three attempts per user', async () => {
    // Use a long current window to avoid a naturally occurring minute rollover.
    await sql('update compiler_quota_private.policy set burst_window_seconds=86400')
    const results = await Promise.all(Array.from({ length: 32 }, (_, index) => reserve(index % 2 ? a : b)))
    assert.equal(results.filter(result => result.allowed).length, 6)
    assert.equal(results.filter(result => !result.allowed).length, 26)
    for (const id of [a, b]) assert.equal(await sql(`select burst_used || ',' || sustained_used from compiler_quota_private.usage where user_id='${id}'`), '3,3')
  })
  await check('one exhausted budget changes neither counter and reports later reset', async () => {
    await sql(`update compiler_quota_private.usage set burst_ends_at=clock_timestamp()+interval '20 seconds', sustained_used=5, sustained_ends_at=clock_timestamp()+interval '120 seconds' where user_id='${a}'`)
    const denied = await reserve(a)
    assert.equal(denied.allowed, false)
    assert.ok(denied.retry_after_seconds > 100 && denied.retry_after_seconds <= 120)
    assert.equal(await sql(`select burst_used || ',' || sustained_used from compiler_quota_private.usage where user_id='${a}'`), '3,5')
  })
  await check('independent window rollover, no refund, and transaction rollback', async () => {
    await sql(`update compiler_quota_private.usage set burst_ends_at=clock_timestamp(), sustained_used=4 where user_id='${a}'`)
    assert.equal((await reserve(a)).allowed, true)
    assert.equal(await sql(`select burst_used || ',' || sustained_used from compiler_quota_private.usage where user_id='${a}'`), '1,5')
    assert.equal((await reserve(a)).allowed, false)
    await sql(`update compiler_quota_private.usage set burst_ends_at=clock_timestamp(), sustained_ends_at=clock_timestamp() where user_id='${a}'`)
    await sql(session(a, 'select public.reserve_compiler_attempt()', 'rollback'))
    assert.equal(await sql(`select burst_used || ',' || sustained_used from compiler_quota_private.usage where user_id='${a}'`), '1,5')
    assert.equal((await reserve(a)).allowed, true)
    assert.equal(await sql(`select burst_used || ',' || sustained_used from compiler_quota_private.usage where user_id='${a}'`), '1,1')
  })
  await check('wall clock is read after waiting across a boundary', async () => {
    await sql(`update compiler_quota_private.usage set burst_used=3, burst_ends_at=clock_timestamp()+interval '1 second' where user_id='${a}'`)
    // A separate session holds the row until after expiry. Wait until it owns the lock.
    const blocker = sql(`begin; set application_name='quota-boundary-blocker'; select 1 from compiler_quota_private.usage where user_id='${a}' for update; select pg_sleep(2); commit;`)
    let locked = false
    for (let i = 0; i < 20; i++) {
      if (await sql("select count(*) from pg_stat_activity where application_name='quota-boundary-blocker' and wait_event='PgSleep'") === '1') { locked = true; break }
      await new Promise(resolve => setTimeout(resolve, 25))
    }
    assert.ok(locked, 'Blocker must own the row lock before reservation starts')
    const result = await reserve(a)
    await blocker
    assert.equal(result.allowed, true)
  })
  await check('duration changes preserve current windows; allowance decreases apply immediately', async () => {
    const before = await sql(`select burst_ends_at from compiler_quota_private.usage where user_id='${a}'`)
    await sql('update compiler_quota_private.policy set burst_window_seconds=60, burst_limit=1')
    assert.equal((await reserve(a)).allowed, false)
    assert.equal(await sql(`select burst_ends_at from compiler_quota_private.usage where user_id='${a}'`), before)
  })
  await check('account deletion removes only its own bounded row', async () => {
    await sql(`delete from auth.users where id='${a}'`)
    assert.equal(await sql('select count(*) from compiler_quota_private.usage'), '1')
    assert.equal(await sql('select user_id from compiler_quota_private.usage'), b)
  })
  console.log(`${passed} database checks passed; no remote host accepted. Disposable database retained for inspection.`)
} catch (error) {
  console.error(`${passed} database checks completed. Verification failed/unavailable: ${error.message}`)
  process.exitCode = 1
}
