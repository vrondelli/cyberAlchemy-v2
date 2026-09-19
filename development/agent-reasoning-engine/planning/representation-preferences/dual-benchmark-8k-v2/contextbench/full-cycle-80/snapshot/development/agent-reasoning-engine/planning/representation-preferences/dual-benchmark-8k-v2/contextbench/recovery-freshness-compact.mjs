// Pure receipt-bound paging controller. No providers, disk or gold. Open questions: RECOVERY-FRESHNESS.md.
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt,bindDelivery} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createRecoverySnapshot,buildRecoveryPage,resolveRecoveryRequest} from './recovery-index-compact.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),clone=x=>JSON.parse(stable(x));
const need=(x,code)=>{if(!x)throw Error('recovery-session.'+code);};
const fields=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const uint=x=>Number.isSafeInteger(x)&&x>=0;
export const recoveryTools=[
 {type:'function',function:{name:'list_recovery_page',description:'Stage the exact next archive cursor for the next request. At the final page, null explicitly refreshes the archive.',parameters:{type:'object',additionalProperties:false,required:['cursor'],properties:{cursor:{type:['string','null']}}}}},
 {type:'function',function:{name:'recover_archived_read',description:'Recover the original delivered body for a handle on the current acknowledged archive page.',parameters:{type:'object',additionalProperties:false,required:['handle'],properties:{handle:{type:'string',pattern:'^r(?:0|[1-9][0-9]*)$'}}}}}
];

/** Tool arguments are already-decoded whole objects. Single sequential trajectory.
 * prepare may run repeatedly for non-dispatched renders; acknowledge the actual wire.
 * Staged changes commit in the next prepare, never midway through a tool batch.
 */
export function createFreshRecoverySession({measure_tokens}){
 need(typeof measure_tokens==='function','invalid-measurer');
 let snapshot=null,page=null,acknowledged=false,staged=null,busy=false,ackDigest=null,lastDelivered=null,freshness=null,knownObservations=new Set();
 return {
  async prepare({captures,receipts}){
   need(!busy,'concurrent-operation');busy=true;acknowledged=false;freshness=null;
   try{
    // Validate and clone latest archive on each prepare; a refresh uses this exact version.
    const latest=createRecoverySnapshot({captures,receipts});
    const identities=value=>new Set(bindDelivery(value.archive).read_observations.map(r=>stable([r.path,r.source_sha256,r.start_line,r.end_line,r.body])));
    const available=identities(latest);
    need([...knownObservations].every(k=>available.has(k)),'retained-archive-shrank');
    let nextSnapshot=snapshot,nextPage=page;
    if(!snapshot||staged?.kind==='refresh'||(snapshot.observation_count===0&&latest.observation_count>0)){
     nextSnapshot=latest;nextPage=await buildRecoveryPage({snapshot:nextSnapshot,measure_tokens});
    }else if(staged?.kind==='next')nextPage=await buildRecoveryPage({snapshot,cursor:staged.cursor,measure_tokens});
    snapshot=nextSnapshot;page=nextPage;staged=null;acknowledged=false;ackDigest=null;
    const current=identities(snapshot);
    need([...current].every(k=>available.has(k)),'retained-archive-shrank');
    const added=[...available].filter(k=>!current.has(k)).length;
    freshness={snapshot_observations:current.size,available_observations:available.size,new_observations:added,
     text:stable({recovery_new_observations:added,instruction:added?'Finish the current catalog pages, then call list_recovery_page with cursor:null to load newer evidence.':'The catalog contains all currently archived source observations.'})};
    knownObservations=new Set([...knownObservations,...available]);
    return {...clone(page),freshness:clone(freshness)};
   }finally{busy=false;}
  },
  acknowledge({prompt,receipt}){
   need(!busy,'concurrent-operation');
   need(page?.model?.text&&freshness,'no-prepared-page');
   // Do not let an unsuccessful newer attempt inherit an earlier acknowledgement.
   acknowledged=false;ackDigest=null;
   need(receipt?.kind==='model'&&receipt.dispatched===true&&receipt.status===200&&!receipt.failure_code&&uint(receipt.input_tokens)&&uint(receipt.output_tokens),'unconfirmed-model-receipt');
   const body=bodyForReceipt(prompt,receipt);
   need(hash(stable(body))===receipt.request_sha256,'request-receipt-mismatch');
   need(body.messages.filter(m=>m.role==='user'&&m.content===page.model.text).length===1,'page-not-own-user-message');
   need(body.messages.filter(m=>m.role==='user'&&m.content===freshness.text).length===1,'freshness-not-own-user-message');
   for(const expected of recoveryTools){
    const matching=body.tools.filter(t=>t?.function?.name===expected.function.name);
    need(matching.length===1&&matching[0].type==='function'&&stable(matching[0].function.parameters)===stable(expected.function.parameters),'recovery-tool-schema-mismatch');
   }
   acknowledged=true;ackDigest=receipt.request_sha256;
   // Keep the old immutable delivered snapshot/page alive through preparation and
   // failed attempts; release it only after a new page receives valid acknowledgement.
   const previousSnapshot=lastDelivered?.snapshot.fingerprint??null;
   lastDelivered={snapshot,page,request_sha256:ackDigest};
   return {acknowledged:true,request_sha256:ackDigest,snapshot:snapshot.fingerprint,page_offset:page.private.offset,previous_snapshot:previousSnapshot};
  },
  async execute(name,args){
   need(!busy,'concurrent-operation');need(acknowledged,'page-not-acknowledged');
   if(name==='recover_archived_read')return resolveRecoveryRequest({snapshot,page,request:args});
   need(name==='list_recovery_page','unknown-tool');need(fields(args,['cursor'])&&(args.cursor===null||typeof args.cursor==='string'),'list-argument-schema');
   need(staged===null,'transition-already-staged');
   if(args.cursor===null){need(page.next_cursor===null,'refresh-before-end');staged={kind:'refresh'};}
   else{need(page.next_cursor!==null&&args.cursor===page.next_cursor,'cursor-not-current-next');staged={kind:'next',cursor:args.cursor};}
   return {ok:true,status:'page-transition-staged',transition:staged.kind,current_page_unchanged:true};
  }
 };
}
