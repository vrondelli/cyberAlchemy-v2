// Opt-in G02 hypothesis: carry a bounded, receipt-derived visited-path memo.
// Original page, freshness and recovery tool contracts remain unchanged.
import {bindDelivery,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createFreshRecoverySession,recoveryTools as expandedTools} from './recovery-freshness-compact.mjs';
import {createFreshDemandRecovery,demandRecoveryTools} from './demand-recovery-compact.mjs';
import {legacyRecoveryIntro} from './recovery-wire-compact.mjs';

export const recoveryTools=[...expandedTools,...demandRecoveryTools()];

export function repeatedReadMemo({captures,receipts}){
 const bound=bindDelivery({captures,receipts});
 if(bound.unmapped.length)throw Error('recovery-memo.unmapped-delivery');
 const paths=new Map();
 for(const read of bound.read_observations)paths.set(read.path,(paths.get(read.path)??0)+1);
 const repeated=[...paths].filter(([,count])=>count>=2).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6);
 if(!repeated.length)return null;
 return stable({schema:'are.recovery-visited-memo/v1',previously_delivered_paths:repeated.map(([path,count])=>({path,deliveries:count})),
  instruction:'These paths have already been delivered, possibly across compaction. Recover again only if the original body is needed. If a task subproblem remains unsupported, search or read a different relevant source path. This list is not proof of relevance or completeness.'});
}

export function createEpisodeRecovery({mode,measure_tokens}){
 if(!['eager','demand'].includes(mode))throw Error('episode-recovery.invalid-mode');
 const session=mode==='eager'?createFreshRecoverySession({measure_tokens}):createFreshDemandRecovery({measure_tokens});
 return {
  async prepare(archive){
   if(mode==='demand'){
    const projection=await session.prepare(archive);
    const memo=projection.mode==='expanded'?repeatedReadMemo(archive):null;
    return {...projection.page,mode:projection.mode,tools:projection.tools,
     messages:memo?[...projection.messages,{role:'user',content:memo}]:projection.messages};
   }
   const page=await session.prepare(archive);
   if(!page.model?.text)return page;
   const memo=repeatedReadMemo(archive);
   return {...page,mode:'expanded',tools:structuredClone(expandedTools),messages:[
    {role:'user',content:legacyRecoveryIntro},{role:'user',content:page.model.text},
    {role:'user',content:page.freshness.text},...(memo?[{role:'user',content:memo}]:[])]};
  },
  acknowledge:input=>session.acknowledge(input),
  execute:(name,args)=>session.execute(name,args)
 };
}
