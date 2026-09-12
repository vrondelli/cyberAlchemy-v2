// Stop future episodes on diagnostic infrastructure failure.
// Open questions: PRESSURE-RESULT.md.
import {runProbe as pairedProbe} from './controls-probe.mjs';
export function enforceProbe(run,args){
 try {
  const result=run(args);
  if(!result.cleanup_verified||result.status==='execution_error')throw Error(result.error??'diagnostic execution or cleanup failure');
  return result;
 }catch(cause){const e=new Error('Public diagnostic infrastructure failed; episode must stop',{cause});e.code='public-diagnostic-infrastructure-failure';throw e;}
}
export const runProbe=args=>enforceProbe(pairedProbe,args);
export function handleProbeError(error){if(error.code==='public-diagnostic-infrastructure-failure')throw error;return {ok:false,error:String(error.message).slice(0,1200)};}
