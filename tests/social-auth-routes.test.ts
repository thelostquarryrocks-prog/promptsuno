// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { POST } from '../src/app/auth/social/route'
import { GET } from '../src/app/auth/callback/route'
const {available,oauth,exchange,set,get,client}=vi.hoisted(()=>({available:vi.fn(),oauth:vi.fn(),exchange:vi.fn(),set:vi.fn(),get:vi.fn(),client:vi.fn()}))
vi.mock('../src/lib/social-auth',async importOriginal=>({...await importOriginal<typeof import('../src/lib/social-auth')>(),socialAvailability:available}))
vi.mock('../src/lib/supabase/server',()=>({createClient:client}))
vi.mock('next/headers',()=>({cookies:async()=>({set,get})}))
const flow='00000000-0000-4000-8000-000000000001'
const input={provider:'google',intent:'signin',flow}
const request=(body:unknown=input,headers:Record<string,string>={})=>new Request('https://app.invalid/auth/social',{method:'POST',headers:{origin:'https://app.invalid','content-type':'application/json',...headers},body:JSON.stringify(body)})
beforeEach(()=>{
  vi.clearAllMocks();vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://fixture.supabase.co')
  available.mockResolvedValue({google:true,facebook:true,signupEnabled:false})
  oauth.mockResolvedValue({data:{url:'https://fixture.supabase.co/auth/v1/authorize?provider=google'},error:null})
  exchange.mockResolvedValue({error:null});get.mockReturnValue({value:flow})
  client.mockResolvedValue({auth:{signInWithOAuth:oauth,exchangeCodeForSession:exchange}})
})
it.each(['google','facebook'])('starts %s PKCE with a fixed callback and HTTP-only short-lived correlation',async provider=>{
  const result=await POST(request({...input,provider}))
  expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toBe('private, no-store')
  expect(oauth).toHaveBeenCalledWith({provider,options:{redirectTo:'https://app.invalid/auth/callback',skipBrowserRedirect:true,scopes:provider==='google'?'openid email profile':'email'}})
  expect(set).toHaveBeenCalledWith('promptsuno-oauth-flow',flow,{httpOnly:true,sameSite:'lax',secure:true,path:'/auth',maxAge:600})
})
it.each<Record<string,string>>([{origin:'https://attacker.invalid'},{origin:'null'},{'sec-fetch-site':'cross-site'}])('rejects hostile initiation %j',async headers=>{
  expect((await POST(request(input,headers))).status).toBe(403);expect(oauth).not.toHaveBeenCalled()
})
it.each([{...input,provider:'github'},{...input,flow:'private song'},{...input,intent:'link'},null,{...input,extra:'x'.repeat(1024)}])('rejects invalid or oversized initiation',async body=>{
  expect((await POST(request(body))).status).toBe(400);expect(oauth).not.toHaveBeenCalled()
})
it('blocks closed signup and disabled providers before touching OAuth',async()=>{
  expect((await POST(request({...input,intent:'signup'}))).status).toBe(503)
  available.mockResolvedValue({google:false,facebook:false,signupEnabled:false})
  expect((await POST(request())).status).toBe(503);expect(oauth).not.toHaveBeenCalled()
})
it('rejects unexpected auth destinations and hides provider errors',async()=>{
  oauth.mockResolvedValue({data:{url:'https://attacker.invalid/auth/v1/authorize'},error:null})
  expect((await POST(request())).status).toBe(503);expect(set).not.toHaveBeenCalled()
  oauth.mockRejectedValue(new Error('sensitive-provider-message'))
  expect(await (await POST(request())).text()).not.toContain('sensitive-provider-message')
})
it('uses the browser Host when Next supplies an internal route hostname',async()=>{
  const result=await POST(new Request('http://localhost:3131/auth/social',{method:'POST',headers:{host:'127.0.0.1:3131',origin:'http://127.0.0.1:3131','content-type':'application/json','x-forwarded-host':'attacker.invalid'},body:JSON.stringify(input)}))
  expect(result.status).toBe(200)
  expect(oauth.mock.calls[0][0].options.redirectTo).toBe('http://127.0.0.1:3131/auth/callback')
})
it('ignores next and forwarded-host, clears flow cookie and sends private callback redirect',async()=>{
  const result=await GET(new Request('https://app.invalid/auth/callback?code=once&next=https://attacker.invalid',{headers:{'x-forwarded-host':'attacker.invalid'}}))
  expect(exchange).toHaveBeenCalledExactlyOnceWith('once')
  expect(result.headers.get('location')).toBe(`https://app.invalid/auth/complete?flow=${flow}`)
  expect(result.headers.get('cache-control')).toBe('private, no-store');expect(result.headers.get('referrer-policy')).toBe('no-referrer')
  expect(set).toHaveBeenCalledWith('promptsuno-oauth-flow','',expect.objectContaining({maxAge:0,path:'/auth',httpOnly:true}))
})
it.each(['access_denied','provider-secret'])('handles cancellation/error without exchanging a code or reflecting details',async error=>{
  const result=await GET(new Request(`https://app.invalid/auth/callback?error=${error}&error_description=private`))
  expect(result.headers.get('location')).toBe(`https://app.invalid/login?auth_error=${error==='access_denied'?'cancelled':'failed'}`)
  expect(exchange).not.toHaveBeenCalled()
})
it('fails expired/reused codes locally and never accepts an invalid handoff',async()=>{
  exchange.mockResolvedValueOnce({error:{message:'used'}})
  expect((await GET(new Request('https://app.invalid/auth/callback?code=used'))).headers.get('location')).toBe('https://app.invalid/login?auth_error=expired')
  get.mockReturnValue({value:'untrusted'})
  expect((await GET(new Request('https://app.invalid/auth/callback?code=valid'))).headers.get('location')).toBe('https://app.invalid/workspace')
})
