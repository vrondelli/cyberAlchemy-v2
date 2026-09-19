// Candidate supervisor. Open questions and launch prerequisites: RECOVERY-LAUNCHER.md.
import {readFileSync,readdirSync,realpathSync,lstatSync} from 'node:fs';
import {resolve,relative,sep,join} from 'node:path';
import {createHash} from 'node:crypto';
import {runRecoveryCampaign} from './recovery-campaign.mjs';
import {scoreRecoveryCampaign} from './score-recovery-campaign.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,m)=>{if(!x)throw Error('recovery-launcher.'+m);};
const within=(a,b)=>{const r=relative(a,b);return r===''||r!=='..'&&!r.startsWith('..'+sep)&&!r.startsWith(sep);};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
export const MAXIMUM_GENERATION_MS=150*60*1000;
/**
 * qualify is mandatory: independently reviewed source freeze/storage/source admission.
 * settle is mandatory: independently reviewed local transport evidence, not remote cancellation.
 * These dependencies are deliberately not replaced by permissive defaults.
 */
export async function launchRecovery({config,generation_root,source_root,score_root,supervision_root,binding,
 qualify,settle,signal,deadline_ms=MAXIMUM_GENERATION_MS,generate=runRecoveryCampaign,
 score=scoreRecoveryCampaign,host_guard=guardStorage}={}){
 need(typeof qualify==='function'&&typeof settle==='function','qualification-and-settlement-required');
 need(Number.isSafeInteger(deadline_ms)&&deadline_ms>0&&deadline_ms<=MAXIMUM_GENERATION_MS,'deadline');
 // Isolate caller mutation; the same immutable config reaches qualification, generation and scoring.
 const frozen=freeze(structuredClone(config)),roots=[generation_root,source_root,score_root,supervision_root].map(resolvePath);
 function resolvePath(p){need(typeof p==='string'&&p.length>0,'root');const r=resolve(p);need(realpathSync(r)===r&&lstatSync(r).isDirectory(),'canonical-root');let c=sep;for(const part of r.split(sep).filter(Boolean)){c=join(c,part);need(!lstatSync(c).isSymbolicLink(),'root-symlink');}need(readdirSync(r).length===0,'fresh-root');return r;}
 for(let i=0;i<roots.length;i++)for(let j=i+1;j<roots.length;j++)need(!within(roots[i],roots[j])&&!within(roots[j],roots[i]),'disjoint-roots');
 const [generation,sources,scoring,supervision]=roots,guard=createStageOutputGuard({root:supervision});
 const persistence=createStagePersistence({stage_root:supervision,stage_guard:guard});
 const check=()=>{const receipt=host_guard({binding,output:supervision,growth_reservation_bytes:Math.max(0,MAXIMUM_STAGE_BYTES-guard.snapshot().bytes)});need(receipt?.admitted===true,'storage');return receipt;};
 check();
 const controller=new AbortController();let timer,abort_reason=null,terminal=null,settlement=null,qualification=null;
 const abort=reason=>{abort_reason??=reason;controller.abort();};
 const onAbort=()=>abort('caller-cancelled');signal?.addEventListener('abort',onAbort,{once:true});if(signal?.aborted)onAbort();
 const report={schema:'are.recovery-launcher/v1',assigned_task_ids:frozen.tasks.map(t=>t.id),assigned_arms:frozen.tasks.length*2,benchmark_cleared:false,campaign_goal_achieved:false,authority_effect:'none'};
 let failure=null,scored=null,terminal_saved=false,generation_attempted=false;
 try{
  need(!controller.signal.aborted,'cancelled-before-qualification');
  qualification=await qualify({config:frozen,generation_root:generation,source_root:sources,score_root:scoring,supervision_root:supervision,binding,signal:controller.signal});
  need(qualification?.admitted===true,'qualification-denied');
  check();persistence.writeJson(join(supervision,'PLAN.json'),{...report,config:frozen,qualification,deadline_ms,supervision_maximum_bytes:MAXIMUM_STAGE_BYTES});
  need(!controller.signal.aborted,'cancelled-before-generation');
  timer=setTimeout(()=>abort('generation-deadline'),deadline_ms);
  const generationFailures=[];generation_attempted=true;
  try{terminal=await generate({config:frozen,evidence_root:generation,source_root:sources,binding,signal:controller.signal,host_guard});}
  catch(error){terminal=error.result??null;generationFailures.push(String(error.message));}
  finally{clearTimeout(timer);}
  try{
   if(terminal){persistence.writeJson(join(supervision,'GENERATION-TERMINAL.json'),terminal);terminal_saved=true;}
  }catch(error){generationFailures.push(String(error.message));}
  // Cleanup is independent of terminal presence, worker claims and persistence success.
  try{
   settlement=await settle({config:frozen,generation_root:generation,terminal,signal:controller.signal});
   need(settlement?.local_settled===true,'transport-not-settled');
   persistence.writeJson(join(supervision,'TRANSPORT-SETTLEMENT.json'),settlement);
  }catch(error){generationFailures.push(String(error.message));}
  if(generationFailures.length)throw Error(generationFailures.join('; '));
  need(terminal?.workers_settled===true,'workers-not-settled');
  need(!controller.signal.aborted,'cancelled-before-scoring');
  need(terminal.status==='sealed','generation-incomplete');
  check();
  const terminalBytes=readFileSync(join(supervision,'GENERATION-TERMINAL.json'));
  // Score the saved terminal, not an unrecorded in-memory substitute.
  const terminal_sha256=hash(terminalBytes);
  scored=await score({config:frozen,generation_root:generation,source_root:sources,directory:scoring,terminal:JSON.parse(terminalBytes),binding,host_guard});
  need(hash(readFileSync(join(supervision,'GENERATION-TERMINAL.json')))===terminal_sha256,'terminal-drift');
  need(!controller.signal.aborted,'cancelled-during-scoring');
  report.terminal_sha256=terminal_sha256;
 }catch(error){failure=String(error.message);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
 const result={...report,status:failure?'incomplete':'scored',failure,abort_reason,qualification,
  terminal_saved,generation_attempted,workers_settled:terminal?.workers_settled===true,settlement,
  known_usage:terminal?.usage??null,unknown_usage_calls:terminal?.unknown_usage_calls??null,
  conservative_total_tokens:terminal?.conservative_total_tokens??(generation_attempted&&Number.isSafeInteger(frozen.total_tokens_per_arm)?frozen.total_tokens_per_arm*frozen.tasks.length*2:null),
  accounting_complete:terminal!==null&&terminal.unknown_usage_calls===0,
  score_summary:failure?null:scored,development_target_passed:!failure&&scored?.development_target_passed===true};
 // Final reserve remains available even after capacity or ordinary-write failure.
 try{persistence.writeJson(join(supervision,'RESULTS.json'),result,{final:true});}
 catch(error){throw Object.assign(Error('recovery-launcher.final-persistence: '+error.message),{cause:error,result});}
 return result;
}
