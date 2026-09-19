// Freeze only; no provider requests. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {loadCatalogDonor} from './schema-agreement-final-donor-r1.mjs';
import {verifyCatalogFinalFreeze} from './schema-agreement-final-stage-r1.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),read=p=>JSON.parse(readFileSync(p));
const stage=join(c,'schema-agreement-final-tokenizer-live-r1'),donor_stage=join(c,'ranked-source-production-live-r1');
const predecessor=read(join(donor_stage,'FREEZE.json')).request;
const request={schedule:read(join(c,'SCHEMA-AGREEMENT-SCHEDULE-R1.json')),sources:predecessor.sources,binding:predecessor.binding,credential_path:predecessor.credential_path,donor_stage,donor_review_sha256:fileHash(join(donor_stage,'RESULT-REVIEW.json')),out:join(stage,'output')};
const reviews=['SCHEMA-AGREEMENT-OUTPUT-FINAL-REVIEW-R1.json','SCHEMA-AGREEMENT-REGISTRATION-REVIEW-R2.json','SCHEMA-AGREEMENT-CAMPAIGN-REVIEW-R1.json'].map(n=>join(c,n));
const donors=request.schedule.slots.map(slot=>loadCatalogDonor({stage:donor_stage,review_sha256:request.donor_review_sha256,sequence:slot.sequence,candidate_slot:slot}));
const entries=[process.execPath,request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,...reviews,...reviews.flatMap(p=>read(p).source_bindings.map(b=>resolve(root,b.path))),...donors.flatMap(d=>d.source_bindings.map(b=>b.path)),...['prepare-schema-agreement-final-stage-r1.mjs','run-schema-agreement-final-stage-r1.mjs','schema-agreement-final-stage-r1.mjs','schema-agreement-final-worker-r1.mjs','schema-agreement-final-process-r1.mjs'].map(n=>join(c,n))];
const files=collectCandidateSources(entries);
mkdirSync(stage,{mode:0o700});mkdirSync(request.out,{mode:0o700});
const manifest_path=join(stage,'FREEZE.json');
writeFileSync(manifest_path,JSON.stringify({schema:'are.schema-agreement-final-stage-freeze/v1',files,request,reviews,open_questions_ref:'../RANKED-READ-ACQUISITION-PROTOCOL-R2.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const manifest_sha256=fileHash(manifest_path);verifyCatalogFinalFreeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({manifest_path,manifest_sha256,files:files.length,model_calls:0,provider_calls:0,live_execution_admitted:false}));
