// Explicit post-submission stage. Open questions: ../../../benchmarks/glm-episodes-v1/PUBLIC-FEEDBACK.md
import {mkdirSync,writeFileSync,readFileSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {join} from 'node:path';
import {validatePublicCases} from '../public-case-validation.mjs';
import {parsePatchSetCandidate} from '../patch-set-runtime.mjs';
import {submissionTool,parseSubmission} from './submission.mjs';
import {hash,stable,need} from './transport.mjs';
function save(root,name,value) {
 const fd=openSync(join(root,name),'wx',0o600);
 try {writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
}
export async function runPublicRepairFeedback({candidate,base,plan,directory,request_once}) {
 candidate=structuredClone(candidate);base=structuredClone(base);plan=structuredClone(plan);
 const parsed=parsePatchSetCandidate(stable(candidate));
 need(parsed.ok&&candidate.expected_base_tree_sha256===base.tree_sha256&&candidate.changes.length===1,'feedback-candidate-invalid');
 const change=candidate.changes[0];need(change.path==='src/subject.mjs'&&change.expected_file_sha256===base.files[change.path],'feedback-scope-invalid');
 need(typeof request_once==='function','feedback-transport-required');
 // A fresh exclusive directory makes replay an explicit new run, never resume.
 mkdirSync(directory,{mode:0o700});
 save(directory,'manifest.json',{policy:'public-feedback-v1',candidate_sha256:hash(candidate),base,plan,maximum_model_attempts:1,automatic_retries:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
 const beforePath=join(directory,'before.mjs');writeFileSync(beforePath,change.utf8,{flag:'wx',mode:0o600});
 const before=validatePublicCases({subject:beforePath,plan,child_timeout_ms:5000,batch_timeout_ms:120000});save(directory,'before.json',before);
 if(before.ok) {const result={status:'UNCHANGED',candidate,before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;}
 // Process failures cannot be presented to the model as semantic counterexamples.
 if(before.results.some(r=>!r.passed&&r.reason!=='output-mismatch')) {
  const result={status:'BLOCK',reason_codes:['feedback.validation-execution-failed'],before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;
 }
 const prompt=stable({messages:[{role:'system',content:'Repair the submitted source using the provided public checks. Preserve the export and all unrelated behavior. These are public test inputs and expected results, not hidden benchmark tests. Submit exactly one complete replacement using submit_patch_candidate. Do not call other tools. This is one corrective proposal; no changes are applied.'},{role:'user',content:stable({candidate,public_checks:plan.checks,failed_checks:before.results.filter(r=>!r.passed).map(r=>r.id)})}],tools:[submissionTool(base,['src/subject.mjs'])]});
 need(Buffer.byteLength(prompt)<=65536,'feedback-prompt-budget');
 save(directory,'started.json',{prompt_sha256:hash(prompt),started_at:new Date().toISOString(),maximum_model_attempts:1,authority_effect:'none'});
 let reply;
 try {reply=await request_once(prompt);}catch {
  const result={status:'BLOCK',reason_codes:['feedback.request-failed'],before,model_attempts:null,attempt_accounting:'consult-transport-ledger',authority_effect:'none'};save(directory,'result.json',result);return result;
 }
 const submission=parseSubmission(reply.message,reply.finish_reason,{base,mutation_allowlist:['src/subject.mjs']});
 if(!submission.ok) {const result={status:'BLOCK',reason_codes:submission.reason_codes,before,model_attempts:1,authority_effect:'none'};save(directory,'result.json',result);return result;}
 const revised=submission.value;
 need(revised.changes.length===1,'feedback-revision-scope');
 const afterPath=join(directory,'after.mjs');writeFileSync(afterPath,revised.changes[0].utf8,{flag:'wx',mode:0o600});
 need(hash(readFileSync(beforePath,'utf8'))===before.subject_sha256,'feedback-source-drift');
 const after=validatePublicCases({subject:afterPath,plan,child_timeout_ms:5000,batch_timeout_ms:120000});
 const result={status:after.ok?'REPAIRED':'REJECTED',candidate:revised,before,after,model_attempts:1,call_id:submission.call_id,authority_effect:'none'};
 save(directory,'result.json',result);return result;
}
