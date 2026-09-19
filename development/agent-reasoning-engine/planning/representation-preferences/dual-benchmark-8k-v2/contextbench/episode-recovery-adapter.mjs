// Live episode projection contract. Open questions: LIVE-RECOVERY-INTEGRATION.md.
import {createFreshRecoverySession,recoveryTools as expandedTools} from './recovery-freshness-compact.mjs';
import {createFreshDemandRecovery,demandRecoveryTools} from './demand-recovery-compact.mjs';
import {legacyRecoveryIntro} from './recovery-wire-compact.mjs';
export const recoveryTools=[...expandedTools,...demandRecoveryTools()];
export function createEpisodeRecovery({mode,measure_tokens}){
 if(!['eager','demand'].includes(mode))throw Error('episode-recovery.invalid-mode');
 const session=mode==='eager'?createFreshRecoverySession({measure_tokens}):createFreshDemandRecovery({measure_tokens});
 return {
  async prepare(archive){
   if(mode==='demand'){
    const projection=await session.prepare(archive);
    return {...projection.page,mode:projection.mode,tools:projection.tools,messages:projection.messages};
   }
   const page=await session.prepare(archive);
   if(!page.model?.text)return page;
   return {...page,mode:'expanded',tools:structuredClone(expandedTools),messages:[{role:'user',content:legacyRecoveryIntro},{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]};
  },
  acknowledge:input=>session.acknowledge(input),
  execute:(name,args)=>session.execute(name,args)
 };
}
