// Candidate-only launch stage. Open questions: CANDIDATE-ONLY-LIVE.md.
// Bounded non-model stages. Open questions: COMPARISON-PRODUCTION-R2.md.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
const WORKER=fileURLToPath(new URL('./candidate-only-production-stage-worker.mjs',import.meta.url));
export async function runComparisonProductionStage({operation,args,signal},{worker=WORKER,kill_grace_ms=1000,deadline_ms=operation==='qualify'?120000:3600000}={}){
 if(!['qualify','score'].includes(operation)||!(signal instanceof AbortSignal)||signal.aborted)throw Error('comparison-stage.operation-or-signal');
 if(!Number.isSafeInteger(deadline_ms)||deadline_ms<1||deadline_ms>(operation==='qualify'?120000:3600000))throw Error('comparison-stage.deadline');
 const child=createGenerationProcess({worker,kill_grace_ms}),abort=new AbortController(),cancel=()=>abort.abort();
 let expired=false,terminal=null,failure=null,settlement=null;
 signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
 const timer=setTimeout(()=>{expired=true;abort.abort();},deadline_ms);
 try{
  try{terminal=await child.generate({config:{operation,args},signal:abort.signal});}catch(e){terminal=e.result??null;failure=e;}
  try{settlement=await child.settle({terminal});}catch(e){failure??=e;}
  if(expired||signal.aborted||!settlement?.local_settled||!settlement.process_group_absent||settlement.forced||settlement.exit_code!==0)failure??=Error('comparison-stage.deadline-cancel-or-settlement');
  if(failure){const error=new Error('comparison-stage.failed',{cause:failure});error.result={operation,terminal,settlement,deadline_exceeded:expired,error:String(failure.message)};throw error;}
  return {value:terminal,settlement};
 }finally{clearTimeout(timer);signal.removeEventListener('abort',cancel);}
}
