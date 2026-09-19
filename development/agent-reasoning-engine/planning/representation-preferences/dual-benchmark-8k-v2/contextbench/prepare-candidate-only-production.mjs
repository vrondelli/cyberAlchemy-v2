// Prospective exact freeze; no provider requests. Open questions: CANDIDATE-ONLY-LIVE.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,join} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {REQUIRED_ENTRIES,GROWTH_BYTES,verifyComparisonProductionFreeze} from './candidate-only-production.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'candidate-only-production-live-r1'),read=p=>JSON.parse(readFileSync(p));
const previous=read(join(c,'compact-comparison-production-live-r1/FREEZE.json')),request=structuredClone(previous.request);
request.schedule=read(join(c,'CANDIDATE-ONLY-SCHEDULE-R1.json'));
for(const k of ['outcome_root','runs_root','metadata_root','source_root'])request[k]=join(stage,k);
const evidence={research:join(c,'CANDIDATE-ONLY-RESEARCH-R1.json'),integration_review:join(c,'CANDIDATE-ONLY-INTEGRATION-REVIEW-R1.json'),integration_tests:join(c,'CANDIDATE-ONLY-INTEGRATION-EVIDENCE-R1.json'),protocol:join(c,'CANDIDATE-ONLY-LIVE.md')};
const config=read(request.sources.config_path),review=read(evidence.integration_review),research=read(evidence.research);
const entries=[...REQUIRED_ENTRIES.map(p=>join(c,p)),join(c,'prepare-candidate-only-production.mjs'),...Object.values(evidence),...review.source_bindings.map(b=>resolve(root,b.path)),...research.source_bindings.map(b=>resolve(root,b.path)),request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,config.scorer,config.source_manifest,...request.schedule.slots.map(s=>s.task_path),process.execPath];
// Preserve the upstream Python evaluator and its previously identified local dependencies.
for(const b of previous.files)if(b.path.endsWith('.py'))entries.push(b.path);
const files=collectCandidateSources(entries);
mkdirSync(stage,{mode:0o700});const path=join(stage,'FREEZE.json');
writeFileSync(path,JSON.stringify({schema:'are.candidate-only-production-freeze/v1',files,request,evidence,score_root:join(stage,'score'),supervision_root:join(stage,'supervision'),generation_deadline_ms:9000000,combined_growth_bytes:GROWTH_BYTES,open_questions_ref:'../CANDIDATE-ONLY-LIVE.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const sha256=fileHash(path);verifyComparisonProductionFreeze({manifest_path:path,manifest_sha256:sha256});console.log(JSON.stringify({manifest_path:path,manifest_sha256:sha256,files:files.length,model_calls:0,live_execution_admitted:false}));
