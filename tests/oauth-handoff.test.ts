import { afterEach,beforeEach,expect,it,vi } from 'vitest'
import {startOAuthHandoff,consumeOAuthHandoff} from '../src/lib/oauth-handoff'
const flow='00000000-0000-4000-8000-000000000001'
beforeEach(()=>sessionStorage.clear())
afterEach(()=>vi.restoreAllMocks())
it('consumes only the matching same-tab flow once',()=>{
  startOAuthHandoff(flow);expect(consumeOAuthHandoff(flow)).toBe(true);expect(consumeOAuthHandoff(flow)).toBe(false)
  startOAuthHandoff(flow);expect(consumeOAuthHandoff('00000000-0000-4000-8000-000000000002')).toBe(false)
  expect(consumeOAuthHandoff(flow)).toBe(false)
})
it('expires handoff and never accepts future or corrupt records',()=>{
  const now=Date.now();vi.spyOn(Date,'now').mockReturnValue(now)
  startOAuthHandoff(flow);vi.mocked(Date.now).mockReturnValue(now+600001);expect(consumeOAuthHandoff(flow)).toBe(false)
  startOAuthHandoff(flow);vi.mocked(Date.now).mockReturnValue(now);expect(consumeOAuthHandoff(flow)).toBe(false)
  sessionStorage.setItem('promptsuno:oauth-handoff:v1','{');expect(consumeOAuthHandoff(flow)).toBe(false)
})
it('storage failure prevents starter adoption',()=>{
  vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw new Error('denied')})
  expect(consumeOAuthHandoff(flow)).toBe(false)
})
