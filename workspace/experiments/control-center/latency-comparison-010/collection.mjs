import {validateExport} from '../latency-comparison-003/collector.mjs';
import {setTimeout as delay} from 'node:timers/promises';

export function classify(value,expected){
  if(!expected||!['baseline','uninstrumented'].includes(expected.arm)||![expected.build_id,expected.binary_sha256].every(s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s)))throw Error('expected-identity');
  if(!value||typeof value.hasPhaseExport!=='boolean'||typeof value.hasTauri!=='boolean')throw Error('snapshot-contract');
  if(expected.arm==='uninstrumented'&&value.hasPhaseExport)throw Error('unexpected-phase-export');
  if(expected.arm==='baseline'){
    if(!value.hasPhaseExport)return {state:'export-pending'};
    const phase=validateExport(value.phase,expected);
    if(!phase.ok&&value.phase?.receipts?.length===0&&phase.errors.length===2&&phase.errors.includes('one-cold-handshake-required')&&phase.errors.includes('invalid-phase-rows'))return {state:'phase-pending'};
    if(!phase.ok)throw Error('invalid-baseline-export:'+JSON.stringify(phase.errors));
  }
  if(value.samples!==null&&!Array.isArray(value.samples))throw Error('samples-contract');
  const rows=(value.samples??[]).filter(r=>r?.name==='workspace.tauri.chat-cold-ipc-handshake');
  if(rows.length>1)throw Error('duplicate-cold-handshake');
  if(rows.some(r=>!Number.isFinite(r.durationMs)||r.durationMs<0||!Number.isFinite(r.recordedAtUnixMs)||r.recordedAtUnixMs<=0))throw Error('invalid-handshake');
  if(!value.hasTauri||rows.length===0)return {state:'aggregate-pending'};
  return {state:'ready',receipt:{schema_version:'workspace.control-aggregate/v1',sample:rows[0],phase_export_absent:!value.hasPhaseExport,expected_identity:expected,authority_effect:'none',performance_inference:'not_evaluable'}};
}

// One monotonic deadline covers timeout configuration, evaluation and polling.
// Errors are terminal; only explicit pending states can be polled.
export async function collectBounded(request,session,expected,{now=()=>performance.now(),sleep=delay,record=()=>{}}={}){
  
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
      script:'return {hasPhaseExport: typeof globalThis.__WLC_PHASE_EVIDENCE__ !== "undefined",hasTauri: typeof globalThis.__TAURI__?.core?.invoke === "function",phase: globalThis.__WLC_PHASE_EVIDENCE__ ?? null,samples: globalThis.__CA2_PERFORMANCE_SAMPLES__ ?? null}',args:[]
    },'POST',remaining());
    remaining();
    const result=classify(value,expected);
    record({state:result.state,remaining_ms:Math.floor(deadline-now())});
    if(result.state==='ready')return result.receipt;
    await sleep(Math.min(200,remaining()));
  }
}
