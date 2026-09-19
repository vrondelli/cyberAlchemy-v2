// Freeze only; no provider requests. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync,mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {collectCandidateSources,fileHash} from './candidate-only-source-freeze.mjs';
import {loadRankedOutputDonor} from './ranked-read-output-donor-r1.mjs';
import {verifyRankedOutputFreeze} from './ranked-read-output-stage-r1.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),read=p=>JSON.parse(readFileSync(p));
const stage=join(c,'ranked-read-output-tokenizer-live-r1'),donor_stage=join(c,'ranked-read-initial-tokenizer-live-r1');
const predecessor=read(join(donor_stage,'FREEZE.json')).request;
const request={schedule:read(join(c,'RANKED-READ-ACQUISITION-SCHEDULE-R1.json')),sources:predecessor.sources,binding:predecessor.binding,credential_path:predecessor.credential_path,donor_stage,donor_review_sha256:fileHash(join(donor_stage,'INITIAL-TOKENIZER-RESULT-REVIEW-R1.json')),out:join(stage,'output')};
const reviews=['RANKED-READ-ACQUISITION-OUTPUT-QUALIFICATION-REVIEW-R1.json','RANKED-READ-ACQUISITION-REPRESENTATIVE-SOURCE-REVIEW-R1.json','RANKED-READ-ACQUISITION-OUTPUT-CAMPAIGN-REVIEW-R1.json'].map(n=>join(c,n));
const donors=request.schedule.slots.map(slot=>loadRankedOutputDonor({stage:donor_stage,review_sha256:request.donor_review_sha256,sequence:slot.sequence,candidate_slot:slot}));
const entries=[realpathSync('/usr/bin/python3'),...['ranked_source_supervisor_r1.py','ranked_source_worker_r2.py','ranked_source_hints_r3.py'].map(n=>join(c,n)),process.execPath,request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,...reviews,...reviews.flatMap(p=>read(p).source_bindings.map(b=>resolve(root,b.path))),...donors.flatMap(d=>d.source_bindings.map(b=>b.path)),...['prepare-ranked-read-output-stage-r1.mjs','run-ranked-read-output-stage-r1.mjs','ranked-read-output-stage-r1.mjs','ranked-read-output-worker-r1.mjs','ranked-read-output-process-r1.mjs'].map(n=>join(c,n))];
const files=collectCandidateSources(entries);
mkdirSync(stage,{mode:0o700});mkdirSync(request.out,{mode:0o700});
const manifest_path=join(stage,'FREEZE.json');
writeFileSync(manifest_path,JSON.stringify({schema:'are.ranked-read-output-stage-freeze/v1',files,request,reviews,open_questions_ref:'../RANKED-READ-ACQUISITION-PROTOCOL-R2.md'},null,2)+'\n',{flag:'wx',mode:0o600});
const manifest_sha256=fileHash(manifest_path);verifyRankedOutputFreeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({manifest_path,manifest_sha256,files:files.length,model_calls:0,provider_calls:0,live_execution_admitted:false}));
