// Candidate-only source freeze; no provider calls. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,join} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {REQUIRED_ENTRIES,SOURCE_INDEX_PYTHON,GROWTH_BYTES,verifyComparisonProductionFreeze} from './ranked-read-production-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),read=p=>JSON.parse(readFileSync(p)),stage=join(c,'ranked-read-production-live-r1');
const previous=read(join(c,'measured-terminal-catalog-production-live-r1/FREEZE.json')),request=structuredClone(previous.request);
request.schedule=read(join(c,'RANKED-READ-ACQUISITION-SCHEDULE-R1.json'));
for(const k of ['outcome_root','runs_root','metadata_root','source_root'])request[k]=join(stage,k);
const evidence={research:join(c,'RANKED-READ-ACQUISITION-RESEARCH-R2.json'),integration_review:join(c,'RANKED-READ-ACQUISITION-PRODUCTION-REVIEW-R1.json'),protocol:join(c,'RANKED-READ-ACQUISITION-PROTOCOL-R2.md')};
const qualifications={};
for(const kind of ['initial','output','final']){
 const base=join(c,'ranked-read-'+kind+'-tokenizer-live-r1');
 const path=join(base,'supervision/RESULTS.json');qualifications[kind+'_qualification']={path,sha256:fileHash(path)};
 evidence[kind+'_qualification_review']=join(base,kind.toUpperCase()+'-TOKENIZER-RESULT-REVIEW-R1.json');
}
const config=read(request.sources.config_path);
const entries=[process.execPath,SOURCE_INDEX_PYTHON,...REQUIRED_ENTRIES.map(n=>join(c,n)),join(c,'prepare-ranked-read-production-r1.mjs'),...Object.values(evidence),...Object.values(qualifications).map(q=>q.path),request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,config.scorer,config.source_manifest,...request.schedule.slots.map(s=>s.task_path)];
for(const [key,path]of Object.entries(evidence))if(key!=='protocol')for(const b of read(path).source_bindings??[])entries.push(resolve(root,b.path));
for(const b of previous.files)if(b.path.endsWith('.py'))entries.push(b.path);
const files=collectCandidateSources(entries);
guardStorage({binding:request.binding,output:stage,growth_reservation_bytes:GROWTH_BYTES});
mkdirSync(stage,{mode:0o700});const manifest_path=join(stage,'FREEZE.json');
writeFileSync(manifest_path,JSON.stringify({schema:'are.candidate-only-production-freeze/v1',files,request,evidence,...qualifications,score_root:join(stage,'score'),supervision_root:join(stage,'supervision'),generation_deadline_ms:9000000,combined_growth_bytes:GROWTH_BYTES,open_questions_ref:'../RANKED-READ-ACQUISITION-PROTOCOL-R2.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const manifest_sha256=fileHash(manifest_path);verifyComparisonProductionFreeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({manifest_path,manifest_sha256,files:files.length,provider_calls:0,model_calls:0,live_execution_admitted:false}));
