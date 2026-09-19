// Run-local materialization wrapper. Product adapter/evaluator remain pure.
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../../../../../..');
const moduleRoot=join(root,'projects/domainspec-v2/impl/operational-resilience');
const {normalizeRecoveryEvidence,recoveryDocument}=await import(pathToFileURL(join(moduleRoot,'src/recovery-evidence-adapter.ts')).href);
const {evaluateRecoveryProductTest,recoverySha256,recoveryBindingDigest,recoveryInvalidationDigest,canonicalRecoveryJson}=await import(pathToFileURL(join(moduleRoot,'src/evaluate-recovery-product-test.ts')).href);
const {evaluateVerifiedRecoveryProductTest}=await import(pathToFileURL(join(here,'evaluate.ts')).href);
const {RECOVERY_ROLES,RECOVERY_SCHEMA_VERSION}=await import(pathToFileURL(join(moduleRoot,'contracts/recovery-product-test.ts')).href);
const text=p=>readFileSync(p,'utf8');
const json=p=>JSON.parse(text(p));
const write=(name,data)=>writeFileSync(join(here,name),JSON.stringify(data,null,2)+'\n');
function read(path){const content=text(path);return {reference:{ref:path.startsWith(root+'/')?path.slice(root.length+1):path,version:'1.0.0-candidate.1',sha256:recoverySha256(content)},content};}
const candidate=json(join(here,'CANDIDATE.json'));
const frozen=read(join(here,'source-manifest.json'));
const runtime=read(join(here,'runtime-manifest.json'));
for(const doc of [frozen,runtime]){
 const name=doc.reference.ref.split('/').at(-1);
 if(doc.reference.sha256!==candidate.manifests[name])throw Error('manifest drift: '+name);
 for(const file of JSON.parse(doc.content).files){const path=resolve(root,file.path);if(recoverySha256(readFileSync(path))!==file.sha256)throw Error('source drift: '+file.path);}
}
const prior=join(root,'projects/domainspec-v2/development/completion-dag/v1/evidence');
const input={mode:'fresh',manifest:read(join(root,candidate.original_product_manifest.path)),sourceManifest:read(join(prior,'r07-recovery-v1/source-manifest.json')),scenarioMap:read(join(prior,'r07-recovery-v1/scenario-map.json')),matrix:read(join(prior,'r01-recovery-v1/failure-matrix.json')),results:read(join(here,'RESULTS.json')),producer:recoveryDocument('domainspec.orodi.b06-successor.driver',{mode:'fresh',artifact_sha256:candidate.driver.sha256}),observer:recoveryDocument('domainspec.orodi.b06-successor.observer',{mode:'fresh',artifact_sha256:candidate.observer.sha256})};
const pins=Object.fromEntries(['manifest','sourceManifest','scenarioMap','matrix','results'].map(k=>[k,input[k].reference.sha256]));
Object.assign(pins,{observer:candidate.observer.sha256,driver:candidate.driver.sha256,python:candidate.python.sha256});
if(pins.manifest!==candidate.original_product_manifest.sha256)throw Error('original candidate drift');
const environment=JSON.parse(runtime.content).environment;
const results=JSON.parse(input.results.content);
for(const run of results.runs){
 if(run.observation){
  if(run.provenance.python!==environment.python)throw Error('test interpreter environment mismatch');
  const captures=run.observation.tests.flatMap(t=>[t.before,t.after]).concat(run.observation.formation_observations);
  for(const capture of captures.filter(Boolean))if(capture.observer_environment && (capture.observer_environment.python!==environment.python || capture.observer_environment.sqlite!==environment.sqlite))throw Error('observer environment mismatch');
 }
}
const normalized=normalizeRecoveryEvidence(input,pins);
write('normalization.json',{status:normalized.status,findings:normalized.findings,pins,record_count:normalized.records.length,authority_effect:'none'});
if(normalized.status!=='normalized'){
 write('evaluation.json',{status:'not_evaluable',cause:normalized.findings,denominator:60,authority_effect:'none'});
 process.exitCode=1;
}else{
 const documents=[...normalized.documents,frozen,runtime];
 const manifest=JSON.parse(input.manifest.content);
 const descriptor=(role,value)=>recoveryDocument('domainspec.orodi.b06-successor.'+role,value);
 const roles={
  subject:input.manifest,
  candidate_artifact:read(join(here,'CANDIDATE.json')),
  configuration:descriptor('configuration',candidate.execution_profile),
  fixture:descriptor('fixture',{matrix:input.matrix.reference,scenario_map:input.scenarioMap.reference,scope:'temporary local SQLite fixtures'}),
  environment:descriptor('environment',environment),
  recovery_runtime:descriptor('recovery-runtime',{implementation_files:manifest.implementation_files}),
  coordination_schema:descriptor('coordination-schema',manifest.implementation_files.find(f=>f.path.endsWith('/coordination.sql'))),
  operation_schema:descriptor('operation-schema',manifest.implementation_files.find(f=>f.path.endsWith('/operation.sql'))),
  scenario_contract:normalized.scenarioDocument,
  source_manifest:frozen,
  runtime_manifest:runtime,
  producer:input.producer,
  observer:input.observer,
  adapter:descriptor('adapter',candidate.adapter),
  evaluator:descriptor('evaluator',candidate.evaluator),
  receipt_schema:descriptor('receipt-schema',{contract:candidate.contract,result_version:'domainspec.orodi.recovery-test-result/v1-candidate'}),
  attribute_policy:read(join(root,candidate.observer_policy.path)),
  evaluation_policy:descriptor('evaluation-policy',{policy_id:'domainspec.orodi.recovery-evaluation-policy-candidate',fresh_max_age_seconds:86400,receipt_lifetime_seconds:86400}),
 };
 const references=Object.fromEntries(RECOVERY_ROLES.map(role=>{const d=roles[role];if(!d)throw Error('unbound role '+role);if(!documents.some(x=>canonicalRecoveryJson(x.reference)===canonicalRecoveryJson(d.reference)))documents.push(d);return [role,d.reference];}));
 const evaluated_at=results.recorded_at_utc;
 const binding={schema_version:'domainspec.orodi.recovery-test-binding/v1-candidate',binding_id:candidate.candidate_id,created_at:candidate.frozen_at_utc,expires_at:candidate.expires_at_utc,invalidation_key_digest:recoveryInvalidationDigest(references),references,owners:{'recovery-runtime':'DomainSpec recovery runtime owner',operation:'Operation replay owner','ORODI-profile':'ORODI profile owner','evidence-producer':'B06 successor fault-test driver',observer:'ORODI read-only test observer',evaluator:'ORODI recovery evaluator'},authority_effect:'none'};
 const bundle={schema_version:RECOVERY_SCHEMA_VERSION,binding,claim_mode:normalized.claim_mode,documents,records:normalized.records,authority_effect:'none'};
 const context={binding_digest:recoveryBindingDigest(binding),evaluated_at,provenance:{mode:input.mode,references:Object.fromEntries(['manifest','sourceManifest','scenarioMap','matrix','results','producer','observer'].map(k=>[k,input[k].reference])),pins}};
 write('context.json',context);
 const receipt=evaluateVerifiedRecoveryProductTest(JSON.stringify(bundle),context);
 const repeat=evaluateVerifiedRecoveryProductTest(JSON.stringify(bundle),context);
 if(canonicalRecoveryJson(receipt)!==canonicalRecoveryJson(repeat))throw Error('non-deterministic evaluation');
 write('bundle.json',bundle);write('evaluation.json',receipt);
 console.log(JSON.stringify({normalization:normalized.status,state:receipt.state,denominator:receipt.denominator,states:receipt.assertion_receipts.reduce((a,r)=>(a[r.state]=(a[r.state]??0)+1,a),{}),deterministic:true}));
 process.exitCode=receipt.state==='passed'?0:1;
}
