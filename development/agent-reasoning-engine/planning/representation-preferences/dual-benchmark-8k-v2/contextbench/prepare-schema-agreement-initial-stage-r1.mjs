// Freeze only, no provider requests. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {verifyRankedInitialFreeze,INITIAL_GROWTH_BYTES} from './schema-agreement-initial-stage-r1.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),read=p=>JSON.parse(readFileSync(p));
const stage=join(c,'schema-agreement-initial-tokenizer-live-r1');
const predecessor=read(join(c,'ranked-read-final-tokenizer-live-r1/FREEZE.json')).request;
const request={schedule:read(join(c,'SCHEMA-AGREEMENT-SCHEDULE-R1.json')),sources:predecessor.sources,binding:predecessor.binding,credential_path:predecessor.credential_path,
 outcome_root:join(stage,'outcome_root'),runs_root:join(stage,'runs_root'),metadata_root:join(stage,'metadata_root'),source_root:join(stage,'source_root')};
const reviews=['SCHEMA-AGREEMENT-INITIAL-QUALIFICATION-REVIEW-R1.json','SCHEMA-AGREEMENT-CAMPAIGN-REVIEW-R1.json','SCHEMA-AGREEMENT-REGISTRATION-REVIEW-R2.json'].map(n=>join(c,n));
const entries=[process.execPath,realpathSync('/usr/bin/python3'),request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,
 ...request.schedule.slots.map(s=>s.task_path),...reviews,...reviews.flatMap(p=>read(p).source_bindings.map(b=>resolve(root,b.path))),
 ...['prepare-schema-agreement-initial-stage-r1.mjs','run-schema-agreement-initial-stage-r1.mjs','schema-agreement-initial-stage-r1.mjs','schema-agreement-qualification-worker-r1.mjs','schema-agreement-qualification-process-r1.mjs','ranked_source_supervisor_r1.py','ranked_source_worker_r2.py','ranked_source_hints_r3.py'].map(n=>join(c,n))];
const files=collectCandidateSources(entries);
if(guardStorage({binding:request.binding,output:stage,growth_reservation_bytes:INITIAL_GROWTH_BYTES}).admitted!==true)throw Error('schema-initial.storage-denied');
mkdirSync(stage,{mode:0o700});
for(const p of [request.outcome_root,request.runs_root,request.metadata_root])mkdirSync(p,{mode:0o700});
const manifest_path=join(stage,'FREEZE.json');
writeFileSync(manifest_path,JSON.stringify({schema:'are.schema-agreement-initial-freeze/v1',files,request,reviews,open_questions_ref:'../RANKED-READ-ACQUISITION-PROTOCOL-R2.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const manifest_sha256=fileHash(manifest_path);verifyRankedInitialFreeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({manifest_path,manifest_sha256,files:files.length,provider_calls:0,model_calls:0,live_execution_admitted:false}));
