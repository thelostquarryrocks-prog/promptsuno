// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { socialAvailability } from '../src/lib/social-auth'
const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal('fetch',fetchMock); fetchMock.mockReset()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://fixture.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-fixture')
  vi.stubEnv('SOCIAL_AUTH_GOOGLE_ENABLED','true'); vi.stubEnv('SOCIAL_AUTH_FACEBOOK_ENABLED','true'); vi.stubEnv('AUTH_SIGNUP_ENABLED','false')
})
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
const disabled={google:false,facebook:false,signupEnabled:false}
it('requires explicit server flags',async()=>{
  vi.stubEnv('SOCIAL_AUTH_GOOGLE_ENABLED','');vi.stubEnv('SOCIAL_AUTH_FACEBOOK_ENABLED','')
  expect(await socialAvailability()).toEqual(disabled);expect(fetchMock).not.toHaveBeenCalled()
})
it('checks actual public settings without provider secrets or caching',async()=>{
  fetchMock.mockResolvedValue({ok:true,json:async()=>({disable_signup:true,external:{google:true,facebook:false}})})
  expect(await socialAvailability()).toEqual({...disabled,google:true})
  expect(fetchMock).toHaveBeenCalledWith(new URL('https://fixture.supabase.co/auth/v1/settings'),expect.objectContaining({cache:'no-store',redirect:'error',headers:{apikey:'public-fixture'}}))
})
it.each([{disable_signup:false,external:{google:true,facebook:true}}, {},null])('fails closed on signup drift or missing settings: %j',async settings=>{
  fetchMock.mockResolvedValue({ok:true,json:async()=>settings});expect(await socialAvailability()).toEqual(disabled)
})
it('allows signup UI only when separately enabled and matching Supabase',async()=>{
  vi.stubEnv('AUTH_SIGNUP_ENABLED','true')
  fetchMock.mockResolvedValue({ok:true,json:async()=>({disable_signup:false,external:{google:true,facebook:true}})})
  expect(await socialAvailability()).toEqual({google:true,facebook:true,signupEnabled:true})
})
it.each(['network','http','json'])('provider settings %s failure stays disabled',async failure=>{
  if(failure==='network')fetchMock.mockRejectedValue(new Error('offline'))
  else fetchMock.mockResolvedValue({ok:failure!=='http',json:async()=>{throw new Error('bad JSON')}})
  expect(await socialAvailability()).toEqual(disabled)
})
