import {validateExport} from '../latency-comparison-003/collector.mjs';
import {setTimeout as delay} from 'node:timers/promises';

export function classify(value, expected){
  const identity=validateExport(null,expected);
  if(identity.errors.includes('invalid-expected-identity'))throw Error('invalid-expected-identity');
  if(value===null)return {state:'export-pending'};
  const result=validateExport(value,expected);
  if(!result.ok){
    if(Array.isArray(value?.receipts)&&value.receipts.length===0
      &&result.errors.length===2&&result.errors.includes('one-cold-handshake-required')&&result.errors.includes('invalid-phase-rows'))return {state:'receipt-pending'};
    throw Error('invalid-export:'+JSON.stringify(result.errors));
  }
  return {state:'ready',receipt:result};
}

// One monotonic deadline covers timeout configuration, evaluation and polling.
// Errors are terminal; only explicit pending states can be polled.
export async function collectBounded(request,session,expected,{now=()=>performance.now(),sleep=delay,record=()=>{}}={}){
  classify(null,expected);
  const deadline=now()+10000;
  const remaining=()=>{const ms=Math.floor(deadline-now());if(ms<=1000)throw Error('collection-deadline');return ms;};
  for(;;){
    const ms=remaining(),script=Math.min(5000,ms-1000);
    record({state:'configuring',remaining_ms:ms,script_ms:script});
    await request('/session/'+session+'/timeouts',{script},'POST',ms);
    const settings=await request('/session/'+session+'/timeouts',undefined,'GET',remaining());
    if(settings?.script!==script)throw Error('driver-timeout-mismatch');
    // Fail closed if configuration consumed the driver deadline headroom.
    if(remaining()<=script+250)throw Error('collection-deadline');
    const value=await request('/session/'+session+'/execute/sync',{
      script:'return globalThis.__WLC_PHASE_EVIDENCE__ ?? null',args:[]
    },'POST',remaining());
    remaining();
    const result=classify(value,expected);
    record({state:result.state,remaining_ms:Math.floor(deadline-now())});
    if(result.state==='ready')return result.receipt;
    await sleep(Math.min(200,remaining()));
  }
}
