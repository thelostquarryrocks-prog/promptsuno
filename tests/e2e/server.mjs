// Local verification only: simulate Supabase so the real middleware/login flow runs.
// This file does not alter application authentication or configure any real account.
import http from 'node:http'
import { spawn } from 'node:child_process'

const user = {
  id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated',
  email: 'test@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {},
  created_at: '2026-01-01T00:00:00Z', identities: [],
}
const jwt = () => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url'),
  'local-fixture-signature',
].join('.')
const issuedTokens = new Set()
let sessionActive = false
let modelCalls = 0
let lastIntent = null
let quotaUsed = 0
let quotaLimit = 10000
let quotaMode = 'normal'

const fixture = http.createServer((request, response) => {
  // Software-rendered UI steps can outlast Node's idle keep-alive window.
  // Disposable fixture connections must not race reuse against idle teardown.
  // This does not retry any request or change the application's RPC deadline.
  response.setHeader('Connection', 'close')
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3131')
  response.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-supabase-api-version')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Content-Type', 'application/json')
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return }
  if (request.url === '/__fixture/stats') {
    response.end(JSON.stringify({ modelCalls, lastIntent, quotaUsed }))
  } else if (request.url?.startsWith('/__fixture/quota') && request.method === 'POST') {
    const settings = new URL(request.url, 'http://127.0.0.1:3132')
    quotaUsed = 0
    quotaLimit = Number(settings.searchParams.get('limit') ?? 10000)
    quotaMode = settings.searchParams.get('mode') ?? 'normal'
    response.end('{}')
  } else if (request.url === '/rest/v1/rpc/reserve_compiler_attempt' && request.method === 'POST') {
    const token = request.headers.authorization?.replace(/^Bearer /, '')
    if (!sessionActive || !issuedTokens.has(token)) {
      response.writeHead(401); response.end('{}'); return
    }
    if (['store-error', 'missing-policy'].includes(quotaMode)) {
      response.writeHead(503); response.end(JSON.stringify({ code: '55000', message: 'Fixture quota unavailable' })); return
    }
    // HTTP fixture, NOT a proof of database concurrency or grants.
    const allowed = quotaUsed < quotaLimit
    if (allowed) quotaUsed += 1
    response.end(JSON.stringify({ allowed, retry_after_seconds: allowed ? 0 : 60 }))
  } else if (request.url === '/__fixture/revoke' && request.method === 'POST') {
    sessionActive = false
    response.end('{}')
  } else if (request.url?.startsWith('/auth/v1/token')) {
    if (request.url.includes('grant_type=refresh_token')) {
      response.writeHead(400)
      response.end(JSON.stringify({ code: 'refresh_token_not_found', message: 'Invalid fixture refresh token' }))
      return
    }
    const token = jwt()
    issuedTokens.add(token)
    sessionActive = true
    response.end(JSON.stringify({ access_token: token, refresh_token: 'local-fixture-refresh', token_type: 'bearer', expires_in: 3600, user }))
  } else if (request.url?.startsWith('/auth/v1/user')) {
    const token = request.headers.authorization?.replace(/^Bearer /, '')
    if (!sessionActive || !issuedTokens.has(token)) {
      response.writeHead(401)
      response.end(JSON.stringify({ code: 'bad_jwt', message: 'Invalid fixture session' }))
    } else response.end(JSON.stringify(user))
  } else if (request.url?.startsWith('/auth/v1/logout')) {
    response.end('{}')
  } else if (request.url === '/v1/chat/completions' && request.method === 'POST') {
    modelCalls += 1
    if (quotaMode === 'provider-failure') {
      response.writeHead(500); response.end(JSON.stringify({ error: { message: 'Fixture provider failure' } })); return
    }
    let body = ''
    request.on('data', chunk => { body += chunk })
    request.on('end', () => {
      const payload = JSON.parse(body)
      lastIntent = JSON.parse(payload.messages.find(message => message.role === 'user').content)
      const result = {
        version: '1.0.0', status: 'ready', styles: 'Fixture Styles from exact authored intent.',
        coverage: lastIntent.nodes.map(node => ({ node_id: node.node_id, status: 'preserved' })),
        interpretations: [], questions: [],
      }
      response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }))
    })
  } else {
    response.writeHead(404); response.end('{}')
  }
})
fixture.listen(3132, '127.0.0.1')

const mode = process.env.TEST_SERVER_MODE === 'production' ? 'start' : 'dev'
const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', mode, '--hostname', '127.0.0.1', '--port', '3131'], {
  stdio: 'inherit', windowsHide: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3132',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-fixture-placeholder',
    // Always override inherited credentials: browser verification cannot spend money.
    OPENAI_API_KEY: 'local-model-fixture-placeholder',
    OPENAI_BASE_URL: 'http://127.0.0.1:3132/v1',
    NEXT_TELEMETRY_DISABLED: '1',
  },
})
next.on('exit', code => { fixture.close(); process.exit(code ?? 1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { next.kill(); fixture.close() })
