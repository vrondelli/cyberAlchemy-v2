import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessRequirementOperationFastPathExpanded,canonicalizeIntentJson,materializeRequirementSnapshot,verifyRequirementOperationFastPathExpanded} from '../../../request-intent-runtime/index.mjs';
import {digest,sealed,verifyDigest} from '../../../request-intent-runtime/src/canonical.mjs';

const directory=dirname(fileURLToPath(import.meta.url)),repositoryRoot=resolve(directory,'../../../../../../..');
const read=name=>JSON.parse(readFileSync(join(directory,name),'utf8')),sha=path=>createHash('sha256').update(readFileSync(join(repositoryRoot,path))).digest('hex');
const plan=read('../../plans/requirement-independent-language-benchmark-v1.json'),holdout=read('independent-expanded-grammar-holdout-001.json');
const SOURCE_PATHS=Object.freeze([
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/index.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-change.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-patch.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/requirement-operation-fast-path.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/plans/requirement-independent-language-benchmark-v1.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/independent-expanded-grammar-holdout-001.json',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/run-independent-language-benchmark-001.mjs',
  'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/research/requirement-research-v1/independent-language-benchmark-001.test.mjs']);

export function verifyIndependentHoldout001(value){
  if(value?.schema_version!=='are.requirement-independent-language-holdout/v1'||value.dataset_id!=='requirement-independent-language-holdout-001'
    ||value.authorship_posture!=='independent-helper-blind-to-implementation-and-prior-holdouts'||value.authority_effect!=='none'||!Array.isArray(value.cases)||value.cases.length!==32)return false;
  const ids=new Set(),requests=new Set();let simple=0,model=0;
  for(const item of value.cases){if(!item||typeof item.id!=='string'||typeof item.request!=='string'||ids.has(item.id)||requests.has(item.request)
      ||!Array.isArray(item.requirements)||!item.requirements.every(value=>typeof value==='string')||!Array.isArray(item.expected_requirements)||!item.expected_requirements.every(value=>typeof value==='string')
      ||!['deterministic-simple','model-required'].includes(item.expected_eligibility)||!(item.expected_operation===null||['add','remove','maintain'].includes(item.expected_operation))||typeof item.reason!=='string')return false;
    ids.add(item.id);requests.add(item.request);if(item.expected_eligibility==='deterministic-simple'){simple++;if(item.expected_operation===null)return false;}
    else{model++;if(item.expected_operation!==null||canonicalizeIntentJson(item.requirements)!==canonicalizeIntentJson(item.expected_requirements))return false;}}
  return simple===16&&model===16;
}
function snapshotFor(item){return materializeRequirementSnapshot({consumer_ref:'independent-language-benchmark-001',scope_ref:`case:${item.id}`,objective_id:`objective:${item.id}`,
  objective_state_digest:digest({case_id:item.id,requirements:item.requirements}),requirements:item.requirements,source_refs:[`holdout:${holdout.dataset_id}`]});}

export function buildIndependentLanguageManifest001(){if(!verifyIndependentHoldout001(holdout))throw Error('independent-language-benchmark.holdout-invalid');
  return sealed('are.requirement-independent-language-manifest/v1',{experiment_id:'requirement-independent-language-benchmark-001',subject_manifest_digest:plan.subject_manifest_digest,
    plan_ref:'../../plans/requirement-independent-language-benchmark-v1.json',plan_digest:digest(plan),dataset_ref:'independent-expanded-grammar-holdout-001.json',dataset_digest:digest(holdout),
    schedule:holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id})),source_digests:Object.fromEntries(SOURCE_PATHS.map(path=>[path,sha(path)])),
    gates:plan.prospective_gates},'manifest_digest');}
export function verifyIndependentLanguageManifest001(value,currentSources=true){try{return value?.schema_version==='are.requirement-independent-language-manifest/v1'&&verifyDigest(value,'manifest_digest')
  &&value.subject_manifest_digest===plan.subject_manifest_digest&&value.plan_digest===digest(plan)&&value.dataset_digest===digest(holdout)&&value.schedule.length===32
  &&canonicalizeIntentJson(value.schedule)===canonicalizeIntentJson(holdout.cases.map((item,index)=>({ordinal:index+1,case_id:item.id})))
  &&Object.keys(value.source_digests).length===SOURCE_PATHS.length&&!Object.keys(value.source_digests).some(path=>!SOURCE_PATHS.includes(path))
  &&(!currentSources||!Object.entries(value.source_digests).some(([path,expected])=>sha(path)!==expected));}catch{return false;}}

export function runIndependentLanguageBenchmark001(manifest=buildIndependentLanguageManifest001()){
  if(!verifyIndependentLanguageManifest001(manifest))throw Error('independent-language-benchmark.manifest-invalid');
  const observations=manifest.schedule.map(entry=>{const item=holdout.cases.find(candidate=>candidate.id===entry.case_id),snapshot=snapshotFor(item);
    const result=assessRequirementOperationFastPathExpanded({snapshot,request:item.request,request_ref:`independent-001:${item.id}`}),record=result.ok?result.value:null;
    const admitted=result.ok&&verifyRequirementOperationFastPathExpanded(record)&&record.disposition==='fast-path',exact=admitted&&record.operation===item.expected_operation
      &&canonicalizeIntentJson(record.change.resulting_requirements)===canonicalizeIntentJson(item.expected_requirements);
    return {case_id:item.id,expected_eligibility:item.expected_eligibility,expected_operation:item.expected_operation,observed_disposition:record?.disposition??null,
      observed_operation:record?.operation??null,form_id:record?.form_id??null,exact_result:exact,reason_codes:result.ok?record.reason_codes:result.reason_codes};});
  const simple=observations.filter(row=>row.expected_eligibility==='deterministic-simple'),model=observations.filter(row=>row.expected_eligibility==='model-required'),admitted=simple.filter(row=>row.observed_disposition==='fast-path');
  const summary={total:observations.length,simple_total:simple.length,model_required_total:model.length,simple_recall:admitted.length/simple.length,
    model_required_false_admission_rate:model.filter(row=>row.observed_disposition==='fast-path').length/model.length,admitted_exact_result_rate:admitted.length?admitted.filter(row=>row.exact_result).length/admitted.length:0,
    admitted_simple_cases:admitted.length,model_calls:0};
  const gates={simple_recall:summary.simple_recall>=manifest.gates.minimum_simple_recall,
    model_required_false_admission_rate:summary.model_required_false_admission_rate<=manifest.gates.maximum_model_required_false_admission_rate,
    admitted_exact_result_rate:summary.admitted_exact_result_rate>=manifest.gates.minimum_admitted_exact_result_rate};
  const missedForms=simple.filter(row=>row.observed_disposition!=='fast-path').map(row=>row.case_id);
  return sealed('are.requirement-independent-language-result/v1',{experiment_id:manifest.experiment_id,manifest_digest:manifest.manifest_digest,observations,summary,gates,
    missed_simple_case_ids:missedForms,disposition:Object.values(gates).every(Boolean)?'candidate-supported':'improvement-opportunity',
    limitations:['The dataset was independently authored by one native helper, not an independent organization or representative user sample.','No model fallbacks were executed; this benchmark measures deterministic routing coverage and exclusion only.']},'result_digest');
}
export function verifyIndependentLanguageResult001(value,manifest=buildIndependentLanguageManifest001()){try{return value?.schema_version==='are.requirement-independent-language-result/v1'&&verifyDigest(value,'result_digest')
  &&value.manifest_digest===manifest.manifest_digest&&canonicalizeIntentJson(value)===canonicalizeIntentJson(runIndependentLanguageBenchmark001(manifest));}catch{return false;}}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const manifest=buildIndependentLanguageManifest001();
  if(process.argv.includes('--manifest'))console.log(JSON.stringify(manifest,null,2));else if(process.argv.includes('--run'))console.log(JSON.stringify(runIndependentLanguageBenchmark001(manifest),null,2));
  else throw Error('Use --manifest or --run.');}
