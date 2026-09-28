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

const fixture = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3131')
  response.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, x-client-info, x-supabase-api-version')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.setHeader('Content-Type', 'application/json')
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return }
  if (request.url?.startsWith('/auth/v1/token')) {
    response.end(JSON.stringify({ access_token: jwt(), refresh_token: 'local-fixture-refresh', token_type: 'bearer', expires_in: 3600, user }))
  } else if (request.url?.startsWith('/auth/v1/user')) {
    response.end(JSON.stringify(user))
  } else if (request.url?.startsWith('/auth/v1/logout')) {
    response.end('{}')
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
    NEXT_TELEMETRY_DISABLED: '1',
  },
})
next.on('exit', code => { fixture.close(); process.exit(code ?? 1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { next.kill(); fixture.close() })
