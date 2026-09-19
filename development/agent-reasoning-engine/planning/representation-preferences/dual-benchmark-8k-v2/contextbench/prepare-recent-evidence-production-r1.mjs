// Exact candidate-only source freeze; no provider requests.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {
  REQUIRED_ENTRIES,
  SOURCE_INDEX_PYTHON,
  GROWTH_BYTES,
  verifyComparisonProductionFreeze,
} from './recent-evidence-production-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';

const contextbench=import.meta.dirname;
const root=resolve(contextbench,'../../../../../..');
const read=path=>JSON.parse(readFileSync(path));
const stage=join(contextbench,'recent-evidence-production-live-r1');

// Reuse only the stable request transport and provider binding. The candidate,
// schedule, and every output root are replaced below.
const previous=read(join(contextbench,'schema-agreement-production-live-r1/FREEZE.json'));
const request=structuredClone(previous.request);
request.schedule=read(join(contextbench,'RECENT-EVIDENCE-LEDGER-SCHEDULE-R1.json'));
for(const key of ['outcome_root','runs_root','metadata_root','source_root'])
  request[key]=join(stage,key);

const evidence={
  research:join(contextbench,'RECENT-EVIDENCE-LEDGER-RESEARCH-R1.json'),
  prospective_overlay:join(contextbench,'RECENT-EVIDENCE-LEDGER-PROSPECTIVE-OVERLAY-R1.json'),
  registration_review:join(contextbench,'RECENT-EVIDENCE-LEDGER-REGISTRATION-REVIEW-R1.json'),
  integration_review:join(contextbench,'RECENT-EVIDENCE-PRODUCTION-REVIEW-R1.json'),
  protocol:join(contextbench,'RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md'),
  initial_qualification_review:join(contextbench,'recent-evidence-initial-tokenizer-live-r1/RESULT-REVIEW-R1.json'),
  populated_qualification_review:join(contextbench,'recent-evidence-populated-tokenizer-live-r3/RESULT-REVIEW-R3.json'),
  final_qualification_review:join(contextbench,'recent-evidence-final-tokenizer-live-r1/RESULT-REVIEW-R1.json'),
};
const qualification=kind=>{
  const path=join(contextbench,`recent-evidence-${kind}-tokenizer-live-${kind==='populated'?'r3':'r1'}/supervision/RESULTS.json`);
  return {path,sha256:fileHash(path)};
};
const initial_qualification=qualification('initial');
const populated_qualification=qualification('populated');
const final_qualification=qualification('final');
const config=read(request.sources.config_path);

const entries=[
  process.execPath,
  SOURCE_INDEX_PYTHON,
  ...REQUIRED_ENTRIES.map(name=>join(contextbench,name)),
  join(contextbench,'prepare-recent-evidence-production-r1.mjs'),
  ...Object.values(evidence),
  initial_qualification.path,
  populated_qualification.path,
  final_qualification.path,
  request.sources.config_path,
  request.sources.cohort_path,
  request.credential_path,
  request.binding.provenance.path,
  config.scorer,
  config.source_manifest,
  ...request.schedule.slots.map(slot=>slot.task_path),
];
for(const [key,path] of Object.entries(evidence))
  for(const binding of key==='protocol'?[]:(read(path).source_bindings??[]))
    entries.push(resolve(root,binding.path));
// Preserve the Python evaluator's dependency closure already admitted by the
// immediately preceding production freeze.
for(const binding of previous.files)
  if(binding.path.endsWith('.py'))entries.push(binding.path);

const storage=guardStorage({
  binding:request.binding,
  output:stage,
  growth_reservation_bytes:GROWTH_BYTES,
});
if(storage.admitted!==true)throw Error('recent-evidence-production.storage-denied');

const files=collectCandidateSources(entries);
mkdirSync(stage,{mode:0o700});
const manifest_path=join(stage,'FREEZE.json');
writeFileSync(manifest_path,JSON.stringify({
  schema:'are.candidate-only-production-freeze/v1',
  files,
  request,
  evidence,
  initial_qualification,
  populated_qualification,
  final_qualification,
  score_root:join(stage,'score'),
  supervision_root:join(stage,'supervision'),
  generation_deadline_ms:9000000,
  combined_growth_bytes:GROWTH_BYTES,
  open_questions_ref:'../RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md',
},null,2)+'\n',{flag:'wx',mode:0o600});

const manifest_sha256=fileHash(manifest_path);
verifyComparisonProductionFreeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({
  manifest_path,
  manifest_sha256,
  files:files.length,
  storage,
  provider_calls:0,
  model_calls:0,
  live_execution_admitted:false,
}));
