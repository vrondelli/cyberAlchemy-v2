import {validateRows} from '../latency-comparison-001/register.mjs';
export function validateExport(value,expected){
  const errors=[];
  const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
  if(!expected||!hash(expected.build_id)||!hash(expected.binary_sha256)||!['baseline','treatment'].includes(expected.arm))
    return {ok:false,errors:['invalid-expected-identity'],authority_effect:'none'};
  if(!value||value.schema_version!=='workspace.phase-export/v1'||value.authority_effect!=='none'
    ||JSON.stringify(Object.keys(value).sort())!==JSON.stringify(['schema_version','build_id','arm','receipts','authority_effect'].sort()))errors.push('export-contract');
  if(value?.build_id!==expected.build_id||value?.arm!==expected.arm)errors.push('build-identity-mismatch');
  if(!Array.isArray(value?.receipts)||value.receipts.length!==1)errors.push('one-cold-handshake-required');
  let rows;
  if(Array.isArray(value?.receipts)){
    rows=validateRows(value.receipts.map(r=>JSON.stringify(r)).join('\n'));
    if(!rows.ok)errors.push('invalid-phase-rows');
    if(value.receipts.some(r=>r?.frame_available!==true))errors.push('frame-unavailable');
  }
  return {ok:errors.length===0,errors,expected_identity:expected,receipts:rows?.ok?rows.rows:[],
    claim_ceiling:'Frontend build identity and row validation; binary identity supplied by caller requires independent process verification.',
    host_qualification:'not_evaluable',authority_effect:'none'};
}
export async function collectPhaseEvidence(browser,expected){
  const value=await browser.execute(()=>globalThis.__WLC_PHASE_EVIDENCE__??null);
  return validateExport(value,expected);
}
