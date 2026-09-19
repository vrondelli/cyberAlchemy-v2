// Candidate controller; no provider, filesystem or gold access.
// Open questions and integration gates: RECOVERY-FRESHNESS.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createFreshRecoverySession,recoveryTools} from './recovery-freshness.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const clone=x=>JSON.parse(stable(x));
const need=(x,m)=>{if(!x)throw Error('demand-recovery.'+m);};
const OPEN='open_recovery';
const entry={type:'function',function:{name:OPEN,description:'Open the catalog of previously delivered source reads, including evidence no longer in context.',parameters:{type:'object',properties:{},required:[],additionalProperties:false}}};
export const recoveryEntryText='Archived source evidence is available through open_recovery. Open it to browse and restore earlier delivered reads.';
export const demandRecoveryTools=()=>[clone(entry)];

/** Opening is staged until prepare, never changes a pending batch's tools.
 * Expanded mode persists through compaction; archive retention belongs to caller.
 * A new session cannot substitute for this one during a live trajectory.
 */
export function createFreshDemandRecovery({measure_tokens}){
 const legacy=createFreshRecoverySession({measure_tokens});
 let expanded=false,staged=false,busy=false,prepared=null,acknowledged=false;
 return {
  async prepare(archive){
   need(!busy,'concurrent-operation');busy=true;acknowledged=false;prepared=null;
   try{
    if(expanded||staged){
     const page=await legacy.prepare(archive);
     expanded=true;staged=false;
     prepared={mode:'expanded',page,tools:clone(recoveryTools),messages:[{role:'user',content:page.model.text},{role:'user',content:page.freshness.text}]};
    }else prepared={mode:'entry',page:{model:{text:recoveryEntryText}},tools:demandRecoveryTools(),messages:[{role:'user',content:recoveryEntryText}]};
    return clone(prepared);
   }finally{busy=false;}
  },
  acknowledge({prompt,receipt}){
   need(!busy,'concurrent-operation');acknowledged=false;need(prepared,'not-prepared');
   if(expanded){const result=legacy.acknowledge({prompt,receipt});acknowledged=true;return {...result,mode:'expanded'};}
   need(receipt?.kind==='model'&&receipt.dispatched===true&&receipt.status===200&&!receipt.failure_code&&[receipt.input_tokens,receipt.output_tokens].every(x=>Number.isSafeInteger(x)&&x>=0),'unconfirmed-receipt');
   const body=bodyForReceipt(prompt,receipt);
   need(hash(stable(body))===receipt.request_sha256,'request-mismatch');
   need(body.messages.filter(m=>m.role==='user'&&m.content===recoveryEntryText).length===1,'entry-not-own-message');
   const matches=body.tools.filter(t=>t?.function?.name===OPEN);
   need(matches.length===1&&matches[0].type==='function'&&stable(matches[0].function.parameters)===stable(entry.function.parameters),'entry-schema-mismatch');
   need(!body.tools.some(t=>recoveryTools.some(r=>r.function.name===t?.function?.name)),'premature-expanded-tools');
   acknowledged=true;return {acknowledged:true,mode:'entry',request_sha256:receipt.request_sha256};
  },
  async execute(name,args){
   need(!busy,'concurrent-operation');need(acknowledged,'not-acknowledged');
   if(expanded)return legacy.execute(name,args);
   need(name===OPEN,'tool-not-exposed');
   need(args&&typeof args==='object'&&!Array.isArray(args)&&Object.keys(args).length===0,'open-arguments');
   need(!staged,'already-staged');staged=true;
   return {ok:true,status:'recovery-opening-staged',instruction:'The next request exposes the catalog and recovery tools.'};
  }
 };
}
