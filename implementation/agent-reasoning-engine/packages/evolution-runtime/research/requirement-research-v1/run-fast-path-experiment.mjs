import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessRequirementOperationFastPath,canonicalizeIntentJson,materializeRequirementSnapshot,REQUIREMENT_PATCH_INSTRUCTION,resolveRequirementOperation} from '../../../request-intent-runtime/index.mjs';
import {digest,sealed,verifyDigest} from '../../../request-intent-runtime/src/canonical.mjs';
import {materializeResearchDag} from '../../src/research-dag.mjs';
import {materializeResearchPlan,replayResearchWork} from '../../src/research-work.mjs';

const directory=dirname(fileURLToPath(import.meta.url));
const root=resolve(directory,'../../../../../../..');
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8'));
const sha=path=>createHash('sha256').update(readFileSync(join(root,path))).digest('hex');
const SOURCE_PATHS=Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/index.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-change.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-patch.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-operation-fast-path.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/test/requirement-operation-fast-path.test.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/fast-path-holdout-001.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/latency-assessment-001.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/plans/requirement-fast-path-v1.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-fast-path-experiment.mjs']);
const planInput=read('../../plans/requirement-fast-path-v1.json');
const registrations=planInput.registration_digests.map(id=>read('../../research-records/'+id+'.json'));
const researchDag=materializeResearchDag({registrations});
const plan=materializeResearchPlan({research_dag:researchDag,registrations,tasks:planInput.tasks});
const holdout=read('fast-path-holdout-001.json');
const latencyAssessment=read('latency-assessment-001.json');

function requireThat(ok,code){if(!ok)throw Error(code);}
function validateHoldout(value){
  requireThat(value?.schema_version==='are.requirement-fast-path-holdout/v1'&&value.dataset_id==='requirement-fast-path-holdout-001'
    &&value.authority_effect==='none'&&value.repetitions===5&&value.timing_iterations===10000,'fast-path.holdout-identity-invalid');
  requireThat(Array.isArray(value.cases)&&value.cases.length===24&&new Set(value.cases.map(c=>c.id)).size===24,'fast-path.holdout-cardinality-invalid');
  for(const c of value.cases)requireThat(Object.keys(c).sort().join(',')==='expected_disposition,expected_operation,expected_requirements,id,request,requirements'
    &&['fast-path','fallback-required'].includes(c.expected_disposition)&&Array.isArray(c.requirements)&&Array.isArray(c.expected_requirements),'fast-path.holdout-case-invalid');
  requireThat(value.cases.filter(c=>c.expected_disposition==='fast-path').length===12,'fast-path.holdout-balance-invalid');
  return true;
}

function schedule(){
  const rows=[];
  for(let repetition=1;repetition<=holdout.repetitions;repetition++){
    const cases=[...holdout.cases].sort((a,b)=>digest(['fast-path',repetition,a.id]).localeCompare(digest(['fast-path',repetition,b.id])));
    for(const c of cases)rows.push({ordinal:rows.length+1,case_id:c.id,repetition});
  }
  return rows;
}

export function buildFastPathManifest(){
  validateHoldout(holdout);
  requireThat(latencyAssessment.revised_hypothesis.record_id==='research-hypothesis:d4df87f3423aeaecb068834259a361d885a9fb9428adca1a00fd243043311ea1','fast-path.hypothesis-drift');
  return sealed('are.requirement-fast-path-manifest/v1',{experiment_id:'requirement-explicit-operation-fast-path-003',plan_digest:plan.plan_digest,
    hypothesis_ref:latencyAssessment.revised_hypothesis.record_id,hypothesis_digest:latencyAssessment.revised_hypothesis.record_digest,
    dataset_ref:'fast-path-holdout-001.json',dataset_digest:digest(holdout),schedule:schedule(),timing_iterations:holdout.timing_iterations,
    gates:{fast_path_precision:1,ambiguous_fast_path_rate:0,minimum_fast_path_coverage:.5,exact_requirement_preservation:1,
      maximum_model_calls_per_request:.5,maximum_eligible_turn_p95_ms:50,fallback_contract_unchanged:true,runtime_integrity:true},
    source_digests:Object.fromEntries(SOURCE_PATHS.map(path=>[path,sha(path)])),environment:{node_version:process.version,platform:process.platform,arch:process.arch},
    scope:'deterministic local eligibility and transport benchmark; controlled fallback stub; no model calls'},'manifest_digest');
}

function snapshotFor(c,repetition){return materializeRequirementSnapshot({consumer_ref:'benchmark:fast-path',scope_ref:'requirement-fast-path-holdout-001',
  objective_id:`objective:${c.id}`,objective_state_digest:digest(['objective-state',c.id,repetition]),requirements:c.requirements,
  source_refs:[`holdout:${holdout.dataset_id}:${c.id}`]});}
function fallbackPatch(c){
  const added=c.expected_requirements.filter(value=>!c.requirements.includes(value));
  const removed=c.requirements.filter(value=>!c.expected_requirements.includes(value));
  return {transition:added.length||removed.length?'refine':'continue',added,removed};
}
const percentile=(values,q)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*q)-1];

export async function runFastPathExperiment(){
  const manifest=buildFastPathManifest(),rows=[];
  for(const row of manifest.schedule){
    const c=holdout.cases.find(candidate=>candidate.id===row.case_id),snapshot=snapshotFor(c,row.repetition),input={snapshot,request:c.request,request_ref:`fast-path:${row.ordinal}`};
    const assessed=assessRequirementOperationFastPath(input);let observedContract=null,calls=0;
    const resolved=await resolveRequirementOperation(input,contract=>{calls++;observedContract=contract;return fallbackPatch(c);});
    const resulting=resolved.ok?resolved.value.change.resulting_requirements:null;
    const disposition=resolved.ok?resolved.value.disposition:null;
    const expectedResolution=c.expected_disposition==='fast-path'?'fast-path':'model-fallback';
    const contractUnchanged=c.expected_disposition==='fast-path'?observedContract===null:
      observedContract?.snapshot===snapshot&&observedContract.request===c.request&&observedContract.request_ref===input.request_ref&&observedContract.instruction===REQUIREMENT_PATCH_INSTRUCTION;
    const passed=assessed.ok&&assessed.value.disposition===c.expected_disposition&&assessed.value.operation===c.expected_operation
      &&resolved.ok&&disposition===expectedResolution&&calls===(c.expected_disposition==='fast-path'?0:1)
      &&canonicalizeIntentJson(resulting)===canonicalizeIntentJson(c.expected_requirements)&&contractUnchanged;
    rows.push({ordinal:row.ordinal,case_id:c.id,repetition:row.repetition,expected_disposition:c.expected_disposition,
      observed_disposition:assessed.ok?assessed.value.disposition:null,expected_operation:c.expected_operation,
      observed_operation:assessed.ok?assessed.value.operation:null,resolution_disposition:disposition,model_calls:calls,
      requirements_matched:canonicalizeIntentJson(resulting)===canonicalizeIntentJson(c.expected_requirements),fallback_contract_unchanged:contractUnchanged,
      runtime_integrity:assessed.ok&&resolved.ok,passed,fast_path_digest:assessed.ok?assessed.value.fast_path_digest:null,
      resolution_digest:resolved.ok?resolved.value.resolution_digest:null});
  }
  const eligibleCases=holdout.cases.filter(c=>c.expected_disposition==='fast-path'),samples=[];let checksum=0;
  for(let index=0;index<manifest.timing_iterations;index++){
    const c=eligibleCases[index%eligibleCases.length],input={snapshot:snapshotFor(c,1),request:c.request,request_ref:`timing:${index%eligibleCases.length}`};
    const start=performance.now(),result=assessRequirementOperationFastPath(input),elapsed=performance.now()-start;
    if(!result.ok||result.value.disposition!=='fast-path')throw Error('fast-path.timing-integrity-failed');
    samples.push(Number(elapsed.toFixed(6)));checksum+=result.value.change.resulting_requirements.length+1;
  }
  const fastRows=rows.filter(row=>row.expected_disposition==='fast-path'),fallbackRows=rows.filter(row=>row.expected_disposition==='fallback-required');
  const summary={total:rows.length,passed:rows.filter(row=>row.passed).length,fast_path_rows:fastRows.length,fallback_rows:fallbackRows.length,
    fast_path_precision:fastRows.filter(row=>row.passed).length/fastRows.length,ambiguous_fast_path_rate:fallbackRows.filter(row=>row.observed_disposition==='fast-path').length/fallbackRows.length,
    fast_path_coverage:fastRows.length/rows.length,exact_requirement_preservation:rows.filter(row=>row.requirements_matched).length/rows.length,
    model_calls_per_request:rows.reduce((sum,row)=>sum+row.model_calls,0)/rows.length,fallback_contract_unchanged:rows.every(row=>row.fallback_contract_unchanged),
    runtime_integrity:rows.every(row=>row.runtime_integrity)};
  const timing={iterations:samples.length,p50_ms:percentile(samples,.5),p95_ms:percentile(samples,.95),max_ms:Math.max(...samples),observation_checksum:checksum,samples_digest:digest(samples)};
  const gates={fast_path_precision:summary.fast_path_precision===manifest.gates.fast_path_precision,
    ambiguous_fast_path_rate:summary.ambiguous_fast_path_rate===manifest.gates.ambiguous_fast_path_rate,
    fast_path_coverage:summary.fast_path_coverage>=manifest.gates.minimum_fast_path_coverage,
    exact_requirement_preservation:summary.exact_requirement_preservation===manifest.gates.exact_requirement_preservation,
    model_calls:summary.model_calls_per_request<=manifest.gates.maximum_model_calls_per_request,
    eligible_latency:timing.p95_ms<=manifest.gates.maximum_eligible_turn_p95_ms,
    fallback_contract:summary.fallback_contract_unchanged===manifest.gates.fallback_contract_unchanged,
    runtime_integrity:summary.runtime_integrity===manifest.gates.runtime_integrity};
  return sealed('are.requirement-fast-path-result/v1',{experiment_id:manifest.experiment_id,manifest_digest:digest(manifest),rows,summary,timing,gates,
    disposition:Object.values(gates).every(Boolean)?'candidate-supported':'revise-hypothesis',
    limitations:['Fallback uses a deterministic controlled stub and does not measure model quality or latency.','The holdout was authored with this implementation cycle and is not independent validation.','The latency threshold is current-host local evidence only.']},'result_digest');
}

export function verifyFastPathResult(result,manifest=buildFastPathManifest()){
  try{
    if(result?.schema_version!=='are.requirement-fast-path-result/v1'||!verifyDigest(result,'result_digest')||result.manifest_digest!==digest(manifest)||result.rows.length!==manifest.schedule.length)return false;
    if(canonicalizeIntentJson(result.rows.map(({ordinal,case_id,repetition})=>({ordinal,case_id,repetition})))!==canonicalizeIntentJson(manifest.schedule))return false;
    const gates={fast_path_precision:result.summary.fast_path_precision===manifest.gates.fast_path_precision,
      ambiguous_fast_path_rate:result.summary.ambiguous_fast_path_rate===manifest.gates.ambiguous_fast_path_rate,
      fast_path_coverage:result.summary.fast_path_coverage>=manifest.gates.minimum_fast_path_coverage,
      exact_requirement_preservation:result.summary.exact_requirement_preservation===manifest.gates.exact_requirement_preservation,
      model_calls:result.summary.model_calls_per_request<=manifest.gates.maximum_model_calls_per_request,
      eligible_latency:result.timing.p95_ms<=manifest.gates.maximum_eligible_turn_p95_ms,
      fallback_contract:result.summary.fallback_contract_unchanged===manifest.gates.fallback_contract_unchanged,
      runtime_integrity:result.summary.runtime_integrity===manifest.gates.runtime_integrity};
    return canonicalizeIntentJson(gates)===canonicalizeIntentJson(result.gates)&&result.rows.every(row=>row.passed)&&result.timing.iterations===manifest.timing_iterations;
  }catch{return false;}
}

export {plan,registrations,validateHoldout};

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--manifest'))console.log(JSON.stringify(buildFastPathManifest(),null,2));
  else console.log(JSON.stringify(await runFastPathExperiment(),null,2));
}
