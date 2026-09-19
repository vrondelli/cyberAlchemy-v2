// Additive archive launch composition. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
// Additive independent-investigation launch binding; historical candidate unchanged.
// Prospective exact freeze; no provider requests. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,join} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {REQUIRED_ENTRIES,SOURCE_INDEX_PYTHON,GROWTH_BYTES,verifyComparisonProductionFreeze} from './measured-terminal-catalog-production-r1.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'measured-terminal-catalog-production-live-r1'),read=p=>JSON.parse(readFileSync(p));
const previous=read(join(c,'compact-comparison-production-live-r1/FREEZE.json')),request=structuredClone(previous.request);
request.schedule=read(join(c,'MEASURED-TERMINAL-CATALOG-SCHEDULE-R1.json'));
for(const k of ['outcome_root','runs_root','metadata_root','source_root'])request[k]=join(stage,k);
const evidence={research:join(c,'MEASURED-TERMINAL-CATALOG-RESEARCH-R1.json'),integration_review:join(c,'MEASURED-TERMINAL-CATALOG-INTEGRATION-REVIEW-R1.json'),integration_tests:join(c,'MEASURED-TERMINAL-CATALOG-INTEGRATION-EVIDENCE-R1.json'),protocol:join(c,'MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md'),postrun_review:join(c,'receipt-budget-production-live-r2/POSTRUN-REVIEW.json')};
evidence.final_qualification_review=join(c,'measured-catalog-final-tokenizer-live-r1/FINAL-QUALIFICATION-RESULT-REVIEW-R1.json');
const final_qualification={path:join(c,'measured-catalog-final-tokenizer-live-r1/supervision/RESULTS.json'),sha256:'f175ef36402fbffd731a5d5d88abce7ac6ace6a3e9c49a25206fb9e656eb3247'};
evidence.launch_tests=join(c,'MEASURED-TERMINAL-CATALOG-LAUNCH-EVIDENCE-R1.json');
const config=read(request.sources.config_path),review=read(evidence.integration_review),research=read(evidence.research);
const entries=[final_qualification.path,...read(evidence.final_qualification_review).source_bindings.map(b=>resolve(root,b.path)),SOURCE_INDEX_PYTHON,...REQUIRED_ENTRIES.map(p=>join(c,p)),join(c,'prepare-measured-terminal-catalog-production-r1.mjs'),...Object.values(evidence),...read(evidence.launch_tests).source_bindings.filter(b=>!b.path.endsWith('/prepare-measured-terminal-catalog-production-r1.mjs')).map(b=>b.path),...read(evidence.integration_tests).source_bindings.map(b=>b.path),...review.source_bindings.map(b=>resolve(root,b.path)),...research.source_bindings.map(b=>resolve(root,b.path)),request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,config.scorer,config.source_manifest,...request.schedule.slots.map(s=>s.task_path),process.execPath];
// Preserve the upstream Python evaluator and its previously identified local dependencies.
for(const b of previous.files)if(b.path.endsWith('.py'))entries.push(b.path);
const files=collectCandidateSources(entries);
mkdirSync(stage,{mode:0o700});const path=join(stage,'FREEZE.json');
writeFileSync(path,JSON.stringify({schema:'are.candidate-only-production-freeze/v1',files,request,evidence,final_qualification,score_root:join(stage,'score'),supervision_root:join(stage,'supervision'),generation_deadline_ms:9000000,combined_growth_bytes:GROWTH_BYTES,open_questions_ref:'../MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const sha256=fileHash(path);verifyComparisonProductionFreeze({manifest_path:path,manifest_sha256:sha256});console.log(JSON.stringify({manifest_path:path,manifest_sha256:sha256,files:files.length,model_calls:0,live_execution_admitted:false}));
