// Local verification only: simulate Supabase so the real middleware/login flow runs.
// This file does not alter application authentication or configure any real account.
import http from 'node:http'
import { spawn } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'

let user = {
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
let assistanceMode = 'normal'
let assistanceCalls = 0
let spendUsed = 0
let spendLimit = 10000
let oauthMode = 'normal'
const oauthCodes = new Map()
const pendingAssistance = new Set()

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
    response.end(JSON.stringify({ modelCalls, lastIntent, quotaUsed, assistanceCalls, spendUsed, pendingAssistance: pendingAssistance.size }))
  } else if (request.url?.startsWith('/__fixture/spend') && request.method === 'POST') {
    spendUsed=0; spendLimit=Number(new URL(request.url,'http://127.0.0.1:3132').searchParams.get('limit')??10000)
    response.end('{}')
  } else if (request.url?.startsWith('/__fixture/oauth') && request.method === 'POST') {
    oauthMode=new URL(request.url,'http://127.0.0.1:3132').searchParams.get('mode')??'normal'
    response.end('{}')
  } else if (request.url === '/auth/v1/settings') {
    response.end(JSON.stringify({disable_signup:oauthMode!=='signup-drift',external:{google:oauthMode!=='disabled',facebook:oauthMode!=='disabled'}}))
  } else if (request.url?.startsWith('/auth/v1/authorize')) {
    const params=new URL(request.url,'http://127.0.0.1:3132').searchParams
    const target=new URL(params.get('redirect_to'))
    if(target.origin!=='http://127.0.0.1:3131'||target.pathname!=='/auth/callback'){response.writeHead(400);response.end('{}');return}
    if(oauthMode==='cancel')target.searchParams.set('error','access_denied')
    else {
      const code=randomUUID();oauthCodes.set(code,params.get('code_challenge'));target.searchParams.set('code',code)
    }
    response.writeHead(302,{Location:target.href});response.end()
  } else if (request.url?.startsWith('/__fixture/assistance') && request.method === 'POST') {
    assistanceMode = new URL(request.url, 'http://127.0.0.1:3132').searchParams.get('mode') ?? 'normal'
    if (assistanceMode === 'release' || assistanceMode === 'normal') {
      for (const finish of pendingAssistance) finish()
      pendingAssistance.clear()
      assistanceMode = 'normal'
    }
    response.end('{}')
  } else if (request.url?.startsWith('/__fixture/account') && request.method === 'POST') {
    const second = new URL(request.url, 'http://127.0.0.1:3132').searchParams.get('second') === '1'
    user = { ...user, id: second ? '00000000-0000-4000-8000-000000000002' : '00000000-0000-4000-8000-000000000001' }
    issuedTokens.clear(); sessionActive = false
    response.end('{}')
  } else if (request.url?.startsWith('/__fixture/quota') && request.method === 'POST') {
    const settings = new URL(request.url, 'http://127.0.0.1:3132')
    quotaUsed = 0
    quotaLimit = Number(settings.searchParams.get('limit') ?? 10000)
    quotaMode = settings.searchParams.get('mode') ?? 'normal'
    response.end('{}')
  } else if (request.url === '/rest/v1/rpc/reserve_ai_attempt' && request.method === 'POST') {
    const token = request.headers.authorization?.replace(/^Bearer /, '')
    if (!sessionActive || !issuedTokens.has(token)) {
      response.writeHead(401); response.end('{}'); return
    }
    if (['store-error', 'missing-policy'].includes(quotaMode)) {
      response.writeHead(503); response.end(JSON.stringify({ code: '55000', message: 'Fixture quota unavailable' })); return
    }
    // HTTP fixture, NOT a proof of database concurrency or grants.
    if(spendUsed>=spendLimit){response.end(JSON.stringify({contract_version:1,allowed:false,reason:'paused'}));return}
    const allowed = quotaUsed < quotaLimit
    if (allowed) { quotaUsed += 1; spendUsed += 1 }
    response.end(JSON.stringify({ contract_version: 1, allowed, reason: 'quota', retry_after_seconds: allowed ? 0 : 60,
      model: 'gpt-5.6-luna', input_token_reservation: 131072, output_token_cap: 2048, reserved_microusd: 100 }))
  } else if (request.url === '/__fixture/revoke' && request.method === 'POST') {
    sessionActive = false
    response.end('{}')
  } else if (request.url?.startsWith('/auth/v1/token')) {
    if (request.url.includes('grant_type=refresh_token')) {
      response.writeHead(400)
      response.end(JSON.stringify({ code: 'refresh_token_not_found', message: 'Invalid fixture refresh token' }))
      return
    }
    let body=''
    request.on('data',chunk=>{body+=chunk})
    request.on('end',()=>{
      if(request.url.includes('grant_type=pkce')){
        const input=JSON.parse(body);const challenge=oauthCodes.get(input.auth_code);oauthCodes.delete(input.auth_code)
        if(!challenge||createHash('sha256').update(input.code_verifier??'').digest('base64url')!==challenge){response.writeHead(400);response.end(JSON.stringify({message:'Invalid fixture PKCE exchange'}));return}
      }
      const token = jwt()
      issuedTokens.add(token)
      sessionActive = true
      response.end(JSON.stringify({ access_token: token, refresh_token: 'local-fixture-refresh', token_type: 'bearer', expires_in: 3600, user }))
    })
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
      if (payload.response_format?.json_schema?.name === 'workspace_assistance') {
        assistanceCalls += 1
        if (assistanceMode === 'error') {
          response.writeHead(500); response.end(JSON.stringify({ error: { message: 'Synthetic assistance failure' } })); return
        }
        const input = lastIntent
        const section = input.sections.find(section => section.id === input.targetId)
        const result = {
          observations: [input.action === 'doctor' ? `You reported: ${input.reportedProblem}` : 'This request targets one lyric section.'],
          hypotheses: input.action === 'doctor' ? ['A clearer instrument role might be worth testing.'] : [],
          proposals: [{ target: input.action === 'lyrics' ? 'lyricsSection' : 'relationshipNotes',
            targetId: input.action === 'lyrics' ? input.targetId : null,
            before: input.action === 'lyrics' ? section.text : input.relationship_notes,
            after: input.action === 'lyrics' ? section.text.replace('Old ending', 'New ending') : `${input.relationship_notes}\nCello answers the vocal.`,
            rationale: 'Synthetic fixture experiment; no real model was called.' }],
        }
        const content = assistanceMode === 'malformed' ? '{bad json' : JSON.stringify(result)
        const finish = () => { pendingAssistance.delete(finish); if (!response.destroyed) response.end(JSON.stringify({ choices: [{ message: { content } }] })) }
        if (assistanceMode === 'hold' || assistanceMode === 'timeout') {
          pendingAssistance.add(finish)
          response.on('close', () => pendingAssistance.delete(finish))
        } else finish()
        return
      }
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
    WORKSPACE_ASSIST_ENABLED: 'true',
    AI_SPEND_ENABLED: 'true',
    SOCIAL_AUTH_GOOGLE_ENABLED: 'true',
    SOCIAL_AUTH_FACEBOOK_ENABLED: 'true',
    AUTH_SIGNUP_ENABLED: 'false',
    NEXT_TELEMETRY_DISABLED: '1',
  },
})
next.on('exit', code => { fixture.close(); process.exit(code ?? 1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { next.kill(); fixture.close() })
