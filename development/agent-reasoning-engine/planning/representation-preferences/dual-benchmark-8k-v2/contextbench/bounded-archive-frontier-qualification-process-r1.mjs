// Additive archive launch composition. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
// Candidate-only launch stage. Open questions: CANDIDATE-ONLY-LIVE.md.
// Bounded tokenizer-only stage. Open questions: COMPARISON-QUALIFICATION-PROCESS.md.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
const WORKER=fileURLToPath(new URL('./bounded-archive-frontier-qualification-worker-r1.mjs',import.meta.url));
export async function runComparisonQualification({request,signal,deadline_ms=600000},{worker=WORKER,kill_grace_ms=150000}={}){
 if(!(signal instanceof AbortSignal)||signal.aborted)throw Error('comparison-qualification.active-signal');
 if(!Number.isSafeInteger(deadline_ms)||deadline_ms<1||deadline_ms>600000)throw Error('comparison-qualification.deadline');
 const child=createGenerationProcess({worker,kill_grace_ms}),controller=new AbortController();
 let expired=false,terminal=null,failure=null,settlement=null;
 const cancel=()=>controller.abort();
 signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
 const timer=setTimeout(()=>{expired=true;controller.abort();},deadline_ms);
 try{
  try{terminal=await child.generate({config:request,signal:controller.signal});}
  catch(e){terminal=e.result??null;failure=e;}
  try{settlement=await child.settle({terminal});}catch(e){failure??=e;}
  if(expired||signal.aborted||!settlement?.local_settled||!settlement.process_group_absent||settlement.forced||settlement.exit_code!==0)failure??=Error(expired?'comparison-qualification.deadline-exceeded':'comparison-qualification.unsettled-or-cancelled');
  if(terminal?.schema!=='are.candidate-only-request-qualification/v1'||terminal.qualified!==true||terminal.model_calls!==0||terminal.rows?.length!==request.schedule.assigned_outcomes||terminal.rows.some(r=>r.qualified!==true))failure??=Error('comparison-qualification.incomplete-terminal');
  if(failure){const error=new Error('comparison-qualification.failed',{cause:failure});error.result={qualified:false,status:'incomplete',measurement_report:terminal,process_settlement:settlement,deadline_exceeded:expired,error:String(failure.message)};throw error;}
  return {qualified:true,measurement_report:terminal,process_settlement:settlement,deadline_exceeded:false};
 }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
