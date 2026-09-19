// Candidate-only descendant of comparison-launcher-r3.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Outer generation/evaluation boundary. Open questions: COMPARISON-CAPACITY.md.
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,realpathSync,lstatSync,openSync,closeSync,fstatSync,readSync,constants} from 'node:fs';
import {resolve,join,dirname,relative,sep} from 'node:path';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifyCandidateOnlySchedule as verifyComparisonSchedule} from './candidate-only-schedule.mjs';
import {accountComparisonOutcome} from './candidate-only-accounting.mjs';
import {createComparisonGenerationProcess} from './candidate-only-generation-process.mjs';
import {scoreComparisonCampaign} from './score-candidate-only-campaign.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),need=(v,m)=>{if(!v)throw Error('comparison-launcher.'+m);};
const within=(a,b)=>{const r=relative(a,b);return r===''||(r!=='..'&&!r.startsWith('..'+sep)&&!r.startsWith(sep));};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function reader(){let used=0;return path=>{
 need(realpathSync(path)===resolve(path)&&lstatSync(path).isFile(),'regular-canonical-file');const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{const st=fstatSync(fd);need(st.isFile()&&st.size<=32*1024**2&&used+st.size<=128*1024**2,'read-bound');used+=st.size;const data=Buffer.alloc(st.size);let offset=0;while(offset<data.length){const n=readSync(fd,data,offset,data.length-offset,offset);need(n>0,'short-read');offset+=n;}need(fstatSync(fd).size===st.size,'file-size-drift');return {value:JSON.parse(data),sha256:hash(data)};}finally{closeSync(fd);}
};}
const safeBig=n=>Number.isSafeInteger(n)&&n>=0?BigInt(n):0n;
const maximum=(a,b)=>a>b?a:b;
const numeric=n=>n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):null;
function exactWitness(result){
 let receipts=0n;for(const r of Array.isArray(result?.receipts)?result.receipts:[])if(r?.kind==='model')receipts+=safeBig(r.input_tokens)+safeBig(r.output_tokens);
 const usage=result?.usage;return [receipts,safeBig(usage?.prompt_tokens)+safeBig(usage?.completion_tokens),safeBig(usage?.total_tokens),safeBig(result?.phase_state?.known_tokens)].reduce(maximum,0n);
}
export function recoverComparisonCosts({schedule,outcome_root,runs_root,generation_attempted,local_settled,terminal=null}){
 const read=reader(),rows=schedule.slots.map(slot=>{
  let known=0n;const witnesses=[],errors=[];
  function record(outcome,reference){
   // Identity and file digest checks occur before this function. Corrupt accounting
   // cannot erase safely represented positive components of a bound witness.
   let amount=exactWitness(outcome?.result);
   try{amount=maximum(amount,BigInt(accountComparisonOutcome(outcome).known_token_lower_bound));}
   catch(error){errors.push({...reference,error:String(error.message)});}
   known=maximum(known,amount);witnesses.push({...reference,known_tokens:numeric(amount),known_tokens_exact:amount.toString()});
  }
  if(generation_attempted){
   const candidate=(terminal?.terminal??terminal)?.outcomes?.[slot.sequence];
   if(candidate)try{
    assert.deepEqual(['sequence','slot_id','task_id','arm'].map(k=>candidate[k]),['sequence','slot_id','task_id','arm'].map(k=>slot[k]));
    record(candidate,{kind:'returned-outcome',sha256:hash(stable(candidate))});
   }catch(error){errors.push({kind:'returned-outcome',error:String(error.message)});}
   const raw=terminal?.reconciliation?.rows?.[slot.sequence];
   if(raw)try{
    assert.deepEqual(['slot_id','task_id','arm'].map(k=>raw[k]),['slot_id','task_id','arm'].map(k=>slot[k]));
    const tokens=raw.raw_accounting?.known_token_lower_bound;need(Number.isSafeInteger(tokens)&&tokens>=0,'returned-cost');const amount=BigInt(tokens);known=maximum(known,amount);witnesses.push({kind:'returned-reconciliation',sha256:hash(stable(raw)),known_tokens:tokens,known_tokens_exact:amount.toString()});
   }catch(error){errors.push({kind:'returned-reconciliation',error:String(error.message)});}
  }
  if(generation_attempted&&local_settled){
   for(const [kind,path]of [['outcome',join(outcome_root,'outcomes',String(slot.sequence).padStart(2,'0')+'.json')],['ledger',join(runs_root,String(slot.sequence).padStart(2,'0'),'state/glm-transport-ledger.json')]]){
    if(!existsSync(path))continue;
    try{const saved=read(path);let outcome=saved.value;
     if(kind==='outcome')assert.deepEqual(['sequence','slot_id','task_id','arm'].map(k=>outcome[k]),['sequence','slot_id','task_id','arm'].map(k=>slot[k]));
     else{const {ledger_digest,...body}=outcome;need(hash(stable(body))===ledger_digest,'recovery-ledger-digest');outcome={attempted:true,status:'failed',result:{receipts:body.receipts,index_tokenizer_receipts:[],accounting_requires_reconciliation:true}};}
     record(outcome,{kind,path,sha256:saved.sha256});
    }catch(error){errors.push({kind,path,error:String(error.message)});}
   }
  }
  const conservative=generation_attempted?maximum(96000n,known):0n;
  return {slot_id:slot.slot_id,task_id:slot.task_id,arm:slot.arm,known_token_lower_bound:numeric(known),known_token_lower_bound_exact:known.toString(),conservative_total_tokens:numeric(conservative),conservative_total_tokens_exact:conservative.toString(),accounting_complete:!generation_attempted,witnesses,errors};
 });
 const sum=k=>rows.reduce((n,r)=>n+BigInt(r[k]),0n),known=sum('known_token_lower_bound_exact'),conservative=sum('conservative_total_tokens_exact');
 return {assigned_outcomes:schedule.assigned_outcomes,rows,known_token_lower_bound:numeric(known),known_token_lower_bound_exact:known.toString(),conservative_total_tokens:numeric(conservative),conservative_total_tokens_exact:conservative.toString(),numeric_totals_representable:numeric(known)!==null&&numeric(conservative)!==null,accounting_complete:!generation_attempted,accepted_savings:null,claim:'Failure recovery witnesses are not reconciled campaign accounting; every possibly attempted slot retains its full reservation. Exact decimal totals retain positive safe-number components; unrepresentable numeric totals are null.'};
}
export const MAXIMUM_COMPARISON_MS=150*60*1000;
export async function launchComparison({request,score_root,supervision_root,qualify,signal,deadline_ms=MAXIMUM_COMPARISON_MS},{process_adapter=createComparisonGenerationProcess(),score=scoreComparisonCampaign,host_guard=guardStorage}={}){
 need(typeof qualify==='function','qualification-required');need(Number.isSafeInteger(deadline_ms)&&deadline_ms>0&&deadline_ms<=MAXIMUM_COMPARISON_MS,'deadline');
 const frozen=freeze(structuredClone(request));verifyComparisonSchedule({schedule:frozen.schedule,...frozen.sources});
 const roots=[frozen.outcome_root,frozen.runs_root,frozen.metadata_root,frozen.source_root,score_root,supervision_root].map(p=>{need(typeof p==='string'&&p.length>0,'root');return resolve(p);});
 need(roots.every((a,i)=>roots.every((b,j)=>i===j||(!within(a,b)&&!within(b,a)))),'root-overlap');
 for(const [i,p]of roots.entries()){if(i===3){need(!existsSync(p)&&realpathSync(dirname(p))===dirname(p),'fresh-source-root');continue;}need(realpathSync(p)===p&&lstatSync(p).isDirectory()&&readdirSync(p).length===0,'fresh-root');}
 const supervision=roots[5],scoring=roots[4],guard=createStageOutputGuard({root:supervision}),persistence=createStagePersistence({stage_root:supervision,stage_guard:guard});
 const check=(output=supervision,growth_reservation_bytes=MAXIMUM_STAGE_BYTES)=>{const r=host_guard({binding:frozen.binding,output,growth_reservation_bytes});need(r?.admitted===true,'storage');return true;};
 const controller=new AbortController();let abort_reason=null,timer,terminal=null,settlement=null,attempted=false,qualification=null,scored=null,failure=null;
 const abort=reason=>{abort_reason??=reason;controller.abort();},onAbort=()=>abort('caller-cancelled');signal?.addEventListener('abort',onAbort,{once:true});if(signal?.aborted)onAbort();
 try{
  check();need(!controller.signal.aborted,'cancelled-before-qualification');qualification=await qualify({request:frozen,score_root:scoring,supervision_root:supervision,signal:controller.signal});need(qualification?.admitted===true,'qualification-denied');
  persistence.writeJson(join(supervision,'PLAN.json'),{schema:'are.candidate-only-launch/v1',schedule_sha256:frozen.schedule.schedule_sha256,assigned_outcomes:frozen.schedule.assigned_outcomes,qualification,deadline_ms});
  need(!controller.signal.aborted,'cancelled-before-generation');timer=setTimeout(()=>abort('generation-deadline'),deadline_ms);attempted=true;
  let generationError=null;
  try{terminal=await process_adapter.generate({request:frozen,signal:controller.signal});}catch(error){terminal=error.result??null;generationError=error;}
  finally{clearTimeout(timer);}
  // Settlement must run even when generation returned no terminal or evidence persistence fails.
  try{settlement=await process_adapter.settle({terminal});}catch(error){generationError??=error;}
  if(terminal!==null)persistence.writeJson(join(supervision,'GENERATION-TERMINAL.json'),terminal);
  if(settlement!==null)persistence.writeJson(join(supervision,'PROCESS-SETTLEMENT.json'),settlement);
  if(generationError)throw generationError;
  need(!controller.signal.aborted,'cancelled-before-scoring');
  need(settlement?.local_settled===true&&settlement.process_group_absent===true&&settlement.exit_code===0&&settlement.forced===false,'unsettled-or-forced-process');
  const read=reader(),saved=read(join(frozen.metadata_root,'RESULTS.json')),manifest=read(join(frozen.metadata_root,'EVIDENCE-MANIFEST.json'));
  need(saved.sha256===terminal?.result_file_sha256&&manifest.sha256===terminal.manifest_sha256,'terminal-file-binding');
  const {result_file_sha256,...returned}=terminal;assert.deepEqual(saved.value,returned,'comparison-launcher.saved-generation-result');
  const verify_settlement=async pins=>{
   need(!controller.signal.aborted,'cancelled-during-scoring');assert.deepEqual(pins,{schedule_sha256:frozen.schedule.schedule_sha256,manifest_sha256:manifest.sha256});
   const current=await process_adapter.settle({terminal});assert.deepEqual(current,settlement,'comparison-launcher.settlement-drift');
   const reread=reader();need(reread(join(frozen.metadata_root,'RESULTS.json')).sha256===saved.sha256&&reread(join(frozen.metadata_root,'EVIDENCE-MANIFEST.json')).sha256===manifest.sha256,'generation-evidence-drift');return true;
  };
  scored=await score({outcome_root:frozen.outcome_root,runs_root:frozen.runs_root,source_root:frozen.source_root,score_root:scoring,schedule:frozen.schedule,sources:frozen.sources,manifest:manifest.value,expected_manifest_sha256:manifest.sha256,verify_settlement,admit_score:async({output,growth_reservation_bytes})=>{need(!controller.signal.aborted,'cancelled-during-scoring');return check(output,growth_reservation_bytes);}});
  need(!controller.signal.aborted,'cancelled-after-scoring');
 }catch(error){failure=String(error.message);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
 const recovery=failure?recoverComparisonCosts({schedule:frozen.schedule,outcome_root:frozen.outcome_root,runs_root:frozen.runs_root,generation_attempted:attempted,local_settled:settlement?.local_settled===true,terminal}):null;
 const result={schema:'are.candidate-only-launch-result/v1',status:failure?'incomplete':'scored',failure,abort_reason,assigned_outcomes:frozen.schedule.assigned_outcomes,schedule_sha256:frozen.schedule.schedule_sha256,generation_attempted:attempted,qualification,settlement,recovery,score_summary:failure?null:scored,development_target_passed:!failure&&scored?.development_target_passed===true,benchmark_cleared:false,campaign_goal_achieved:false,authority_effect:'none'};
 try{persistence.writeJson(join(supervision,'RESULTS.json'),result,{final:true});}catch(error){throw Object.assign(Error('comparison-launcher.final-persistence'),{cause:error,result});}return result;
}
