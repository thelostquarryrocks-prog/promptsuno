import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Called only by the existing empty, disposable, loopback-only PG harness.
export async function runSpendChecks({ sql, check, session, a, b }) {
  await sql(readFileSync(new URL('../../supabase/migrations/20261007022852_aggregate_ai_spend_guard.sql', import.meta.url), 'utf8'))
  await sql(`insert into auth.users values ('${a}'); update compiler_quota_private.policy set burst_limit=100,sustained_limit=100; truncate compiler_quota_private.usage;`)
  const reserve = async (id = a, action = 'compile', ending = 'commit') => JSON.parse(await sql(session(id, `select public.reserve_ai_attempt('${action}')`, ending)))
  const counters = () => sql('select lifetime_reserved_microusd || \',\' || daily_reserved_microusd from compiler_quota_private.ai_spend_policy')
  const reset = () => sql(`truncate compiler_quota_private.usage; update compiler_quota_private.ai_spend_policy set enabled=true,pricing_valid_until=clock_timestamp()+interval '1 hour',lifetime_limit_microusd=100,daily_limit_microusd=100,lifetime_reserved_microusd=0,daily_reserved_microusd=0,usage_day=(clock_timestamp() at time zone 'UTC')::date;`)
  await check('aggregate RPC and table preserve private schema, RLS and narrow grants', async () => {
    const metadata = JSON.parse(await sql("select json_build_object('definer',prosecdef,'config',proconfig,'arguments',pronargs) from pg_proc where oid='public.reserve_ai_attempt(text)'::regprocedure"))
    assert.equal(metadata.definer,true); assert.equal(metadata.arguments,1)
    assert.ok(metadata.config.includes('search_path=""')); assert.ok(metadata.config.includes('lock_timeout=3s'))
    for (const role of ['anon','authenticated','service_role']) {
      assert.equal(await sql(`select has_function_privilege('${role}','public.reserve_ai_attempt(text)','EXECUTE')`), role === 'authenticated' ? 't' : 'f')
      for (const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) assert.equal(await sql(`select has_table_privilege('${role}','compiler_quota_private.ai_spend_policy','${privilege}')`),'f')
    }
    assert.equal(await sql("select relrowsecurity from pg_class where oid='compiler_quota_private.ai_spend_policy'::regclass"),'t')
    assert.equal(await sql("select count(*) from pg_policies where schemaname='compiler_quota_private'"),'0')
    assert.equal(await sql('begin; grant usage on schema compiler_quota_private to authenticated; grant select on compiler_quota_private.ai_spend_policy to authenticated; set local role authenticated; select count(*) from compiler_quota_private.ai_spend_policy; rollback;'),'0')
  })
  await check('aggregate policy is unseeded and missing configuration fails closed', async () => {
    await assert.rejects(reserve(),/not configured/)
    assert.equal(await sql('select count(*) from compiler_quota_private.usage'),'0')
  })
  // Synthetic integer prices ONLY in this disposable database. NOT live pricing.
  await sql("insert into compiler_quota_private.ai_spend_policy(singleton,model,pricing_version,pricing_valid_until,input_microusd_per_million,output_microusd_per_million,lifetime_limit_microusd,daily_limit_microusd) values(true,'gpt-5.6-luna','synthetic-test-only',clock_timestamp()+interval '1 hour',1,1,100,100)")
  await check('aggregate enablement is durable and defaults disabled', async () => {
    assert.equal((await reserve()).reason,'paused'); assert.equal(await counters(),'0,0')
    assert.equal(await sql('select count(*) from compiler_quota_private.usage'),'0')
  })
  await check('aggregate rejects identity/action/price/ceiling misuse', async () => {
    await assert.rejects(reserve(''),/Authentication required/)
    await assert.rejects(reserve(a,'refund'),/Unsupported AI action/)
    await assert.rejects(sql('set role anon; select public.reserve_ai_attempt(\'compile\')'),/permission denied/)
    for (const assignment of ['input_microusd_per_million=0','output_microusd_per_million=-1','daily_limit_microusd=101','lifetime_limit_microusd=0',"model='unapproved'"]) await assert.rejects(sql(`update compiler_quota_private.ai_spend_policy set ${assignment}`),/constraint/)
    await assert.rejects(sql(session(a,"select public.reserve_ai_attempt('compile',0)")),/does not exist/)
  })
  await reset()
  await check('fractional liability rounds up and both tools consume the same counters', async () => {
    const first = await reserve(a,'compile'); const second = await reserve(b,'assist')
    assert.equal(first.reserved_microusd,1); assert.equal(second.reserved_microusd,1)
    assert.equal(first.input_token_reservation,131072); assert.equal(first.output_token_cap,2048)
    assert.equal(await counters(),'2,2')
  })
  await check('concurrent accounts and tools cannot exceed the shared lifetime ceiling', async () => {
    await reset(); await sql('update compiler_quota_private.ai_spend_policy set lifetime_limit_microusd=7,daily_limit_microusd=7')
    const results = await Promise.all(Array.from({length:32},(_,i)=>reserve(i%2?a:b,i%3?'compile':'assist')))
    assert.equal(results.filter(result=>result.allowed).length,7)
    assert.equal(results.filter(result=>result.reason==='paused').length,25)
    assert.equal(await counters(),'7,7')
    assert.equal(await sql('select sum(burst_used) from compiler_quota_private.usage'),'7')
  })
  await check('daily denial does not spend user quota and UTC rollover retains lifetime usage', async () => {
    await reset(); await sql('update compiler_quota_private.ai_spend_policy set daily_limit_microusd=1')
    assert.equal((await reserve()).allowed,true); assert.equal((await reserve()).reason,'paused')
    assert.equal(await sql('select sum(burst_used) from compiler_quota_private.usage'),'1')
    await sql("update compiler_quota_private.ai_spend_policy set usage_day=usage_day-1")
    assert.equal((await reserve(b,'assist')).allowed,true); assert.equal(await counters(),'2,1')
  })
  await check('user quota denial spends no aggregate allowance', async () => {
    await reset(); await sql('update compiler_quota_private.policy set burst_limit=1')
    assert.equal((await reserve()).allowed,true); assert.equal((await reserve(a,'assist')).reason,'quota')
    assert.equal(await counters(),'1,1')
    await sql('update compiler_quota_private.policy set burst_limit=100')
  })
  await check('pricing expiry and operator shutoff preserve all reservations', async () => {
    await reset(); await reserve()
    await sql("update compiler_quota_private.ai_spend_policy set pricing_valid_until=clock_timestamp()")
    assert.equal((await reserve()).reason,'paused'); assert.equal(await counters(),'1,1')
    await sql("update compiler_quota_private.ai_spend_policy set pricing_valid_until=clock_timestamp()+interval '1 hour',enabled=false")
    assert.equal((await reserve()).reason,'paused'); assert.equal(await counters(),'1,1')
  })
  await check('transaction rollback undoes both budgets; committed unused reservations remain', async () => {
    await reset(); await reserve(a,'assist','rollback')
    assert.equal(await counters(),'0,0'); assert.equal(await sql('select count(*) from compiler_quota_private.usage'),'0')
    await reserve(); assert.equal(await counters(),'1,1')
    await sql(`delete from auth.users where id='${a}'`)
    assert.equal(await counters(),'1,1')
    await sql(`insert into auth.users values ('${a}')`)
    await reserve(); assert.equal(await counters(),'2,2')
  })
  await check('missing nested quota policy rolls back aggregate and user reservations', async () => {
    await reset(); await sql('delete from compiler_quota_private.policy')
    await assert.rejects(reserve(),/not configured/)
    assert.equal(await counters(),'0,0'); assert.equal(await sql('select count(*) from compiler_quota_private.usage'),'0')
    await sql('insert into compiler_quota_private.policy values(true,100,86400,100,86400)')
  })
  await check('aggregate lock timeout fails closed without charging either budget', async () => {
    await reset()
    const blocker = sql("begin; set application_name='aggregate-lock-test'; select 1 from compiler_quota_private.ai_spend_policy for update; select pg_sleep(15); rollback;").catch(error=>error)
    try {
      let locked=false
      for(let i=0;i<80;i++) {
        if(await sql("select count(*) from pg_stat_activity where application_name='aggregate-lock-test' and wait_event='PgSleep'")==='1'){locked=true;break}
        await new Promise(resolve=>setTimeout(resolve,25))
      }
      assert.ok(locked); await assert.rejects(reserve(),/lock timeout/)
      assert.equal(await counters(),'0,0'); assert.equal(await sql('select count(*) from compiler_quota_private.usage'),'0')
    } finally { await sql("select pg_terminate_backend(pid) from pg_stat_activity where application_name='aggregate-lock-test'"); await blocker }
  })
  await check('lost aggregate response retains committed liability and rolls back uncommitted liability', async () => {
    for(const committed of [false,true]) {
      await reset()
      const name=committed?'spend-lost-committed':'spend-lost-uncommitted'
      const lost=sql(`set application_name='${name}'; ${session(a,"select public.reserve_ai_attempt('assist')",committed?'commit':'select pg_sleep(20)')} ${committed?'select pg_sleep(20);':''}`).catch(error=>error)
      try {
        let sleeping=false
        for(let i=0;i<80;i++) {
          if(await sql(`select count(*) from pg_stat_activity where application_name='${name}' and wait_event='PgSleep'`)==='1'){sleeping=true;break}
          await new Promise(resolve=>setTimeout(resolve,25))
        }
        assert.ok(sleeping)
      } finally { await sql(`select pg_terminate_backend(pid) from pg_stat_activity where application_name='${name}'`); await lost }
      assert.equal(await counters(),committed?'1,1':'0,0')
      assert.equal(await sql('select coalesce(sum(burst_used),0) from compiler_quota_private.usage'),committed?'1':'0')
    }
  })
}
