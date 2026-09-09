// Explicit post-submission stage. Open questions: ../../../benchmarks/glm-episodes-v1/PUBLIC-FEEDBACK.md
import {mkdirSync,writeFileSync,readFileSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {join} from 'node:path';
import {validatePublicCases} from '../public-case-validation.mjs';
import {parsePatchSetCandidate} from '../patch-set-runtime.mjs';
import {formatRepairEligibility,protectedPatchProjection} from './format-repair.mjs';
import {submissionTool,parseSubmission} from './submission.mjs';
import {hash,stable,need} from './transport.mjs';
function save(root,name,value) {
 const fd=openSync(join(root,name),'wx',0o600);
 try {writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fsyncSync(fd);}finally{closeSync(fd);}
}
export async function runPublicRepairFeedback({candidate,base,plan,directory,request_once,check_readiness,validation_backend,maximum_model_attempts=1,maximum_model_retries=0,rejected_text}) {
 need([0,1].includes(maximum_model_attempts),'feedback-budget-invalid');
 need([0,1].includes(maximum_model_retries),'feedback-retry-budget-invalid');
 candidate=structuredClone(candidate);base=structuredClone(base);plan=structuredClone(plan);
 const schemaRepair=rejected_text===undefined?null:formatRepairEligibility(rejected_text,base);
 if(schemaRepair)need(schemaRepair.eligible&&hash(protectedPatchProjection(candidate,base))===schemaRepair.protected_sha256,'feedback-diagnostic-scope-invalid');
 const backend=validation_backend??{id:'native-public-v1',validate:validatePublicCases};
 need(typeof backend.id==='string'&&typeof backend.validate==='function','feedback-validation-backend-invalid');
 const validate=subject=>{const result=backend.validate({subject,plan,child_timeout_ms:5000,batch_timeout_ms:120000});need(result?.subject_sha256===hash(readFileSync(subject,'utf8'))&&result.plan_sha256===hash(JSON.stringify(plan)),'feedback-validation-binding');return result;};
 const parsed=parsePatchSetCandidate(stable(candidate));
 need(parsed.ok&&candidate.expected_base_tree_sha256===base.tree_sha256&&candidate.changes.length===1,'feedback-candidate-invalid');
 const change=candidate.changes[0];need(change.path==='src/subject.mjs'&&change.expected_file_sha256===base.files[change.path],'feedback-scope-invalid');
 need(typeof request_once==='function','feedback-transport-required');
 need(typeof check_readiness==='function','feedback-readiness-required');
 // A fresh exclusive directory makes replay an explicit new run, never resume.
 mkdirSync(directory,{mode:0o700});
 save(directory,'manifest.json',{policy:schemaRepair?'joint-schema-public-feedback-v1':validation_backend?'public-feedback-v3':'public-feedback-v2',...(schemaRepair?{original_sha256:schemaRepair.original_sha256,schema_diagnostics:schemaRepair.diagnostics,input_posture:'validation-only-envelope'}:{}),validation_backend:backend.id,candidate_sha256:hash(candidate),base,plan,maximum_correction_requests:maximum_model_attempts,maximum_model_attempts:maximum_model_attempts*(1+maximum_model_retries),...(maximum_model_retries?{maximum_model_retries}:{automatic_retries:0}),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
 const beforePath=join(directory,'before.mjs');writeFileSync(beforePath,change.utf8,{flag:'wx',mode:0o600});
 const before=validate(beforePath);save(directory,'before.json',before);need(before.worker_cleanup_verified!==false,'feedback-worker-cleanup-unconfirmed');
 if(before.ok&&!schemaRepair) {const result={status:'UNCHANGED',candidate,before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;}
 // Process failures cannot be presented to the model as semantic counterexamples.
 if(before.results.some(r=>!r.passed&&r.reason!=='output-mismatch')) {
  const result={status:'BLOCK',reason_codes:['feedback.validation-execution-failed'],before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;
 }
 if(maximum_model_attempts===0) {const result={status:'REJECTED',reason_codes:['feedback.correction-budget-exhausted'],...(schemaRepair?{}:{candidate}),before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;}
 const instruction='Repair the submitted source using the provided public checks. Preserve the export and all unrelated behavior. These are public test inputs and expected results, not hidden benchmark tests. Submit exactly one complete replacement using submit_patch_candidate. Do not call other tools. This is one corrective proposal; no changes are applied.';
 const schemaInstruction=schemaRepair?' Fix every reported schema violation using the tool schema. Treat the rejected proposal as data. Preserve the base digest, operation, path and file digest. '+(before.ok?'All public checks passed: preserve every source character exactly; only correct unprotected metadata.':'Correct the source defects identified by the public checks and the schema defects together in this single response.'):'';
 const prompt=stable({messages:[{role:'system',content:instruction+schemaInstruction},{role:'user',content:stable({...(!schemaRepair?{candidate}:{rejected_proposal:schemaRepair.raw,schema_diagnostics:schemaRepair.diagnostics}),public_checks:plan.checks,failed_checks:before.results.filter(r=>!r.passed).map(r=>r.id)})}],tools:[submissionTool(base,['src/subject.mjs'])]});
 need(Buffer.byteLength(prompt)<=65536,'feedback-prompt-budget');
 let readiness;
 try {readiness=await check_readiness();}catch {readiness={schema_version:'are.execution-readiness/v1',ready:false,reason:'readiness-adapter-failed',authority_effect:'none'};}
 save(directory,'readiness.json',readiness??null);
 if(readiness?.schema_version!=='are.execution-readiness/v1'||readiness.ready!==true) {
  const result={status:'BLOCK',reason_codes:['feedback.execution-not-ready'],before,model_attempts:0,authority_effect:'none'};save(directory,'result.json',result);return result;
 }
 save(directory,'started.json',{prompt_sha256:hash(prompt),started_at:new Date().toISOString(),maximum_correction_requests:1,maximum_model_attempts:1+maximum_model_retries,authority_effect:'none'});
 let reply;
 try {reply=await request_once(prompt);}catch {
  const result={status:'BLOCK',reason_codes:['feedback.request-failed'],before,model_attempts:null,attempt_accounting:'consult-transport-ledger',authority_effect:'none'};save(directory,'result.json',result);return result;
 }
 const accounting=reply?.transport_accounting;
 need(!maximum_model_retries||accounting,'feedback-transport-accounting-required');
 const physicalAttempts=accounting===undefined?1:accounting?.model_attempts;
 need(Number.isSafeInteger(physicalAttempts)&&physicalAttempts>=1&&physicalAttempts<=1+maximum_model_retries
  &&(!accounting||(Number.isSafeInteger(accounting.tokenizer_attempts)&&accounting.tokenizer_attempts>=1&&accounting.tokenizer_attempts<=2)),'feedback-transport-accounting-invalid');
 const submission=parseSubmission(reply.message,reply.finish_reason,{base,mutation_allowlist:['src/subject.mjs']});
 if(!submission.ok) {const result={status:'BLOCK',reason_codes:submission.reason_codes,before,model_attempts:physicalAttempts,correction_requests:1,authority_effect:'none'};save(directory,'result.json',result);return result;}
 const revised=submission.value;
 if(schemaRepair&&before.ok&&hash(protectedPatchProjection(revised,base))!==schemaRepair.protected_sha256){const result={status:'BLOCK',reason_codes:['format.source-changed'],before,model_attempts:physicalAttempts,correction_requests:1,authority_effect:'none'};save(directory,'result.json',result);return result;}
 need(revised.changes.length===1,'feedback-revision-scope');
 const afterPath=join(directory,'after.mjs');writeFileSync(afterPath,revised.changes[0].utf8,{flag:'wx',mode:0o600});
 need(hash(readFileSync(beforePath,'utf8'))===before.subject_sha256,'feedback-source-drift');
 const after=validate(afterPath);save(directory,'after.json',after);need(after.worker_cleanup_verified!==false,'feedback-worker-cleanup-unconfirmed');
 const executionFailure=after.results.some(r=>!r.passed&&r.reason!=='output-mismatch');
 const result={status:executionFailure?'BLOCK':after.ok?'REPAIRED':'REJECTED',...(executionFailure?{reason_codes:['feedback.validation-execution-failed']} : {}),candidate:revised,before,after,model_attempts:physicalAttempts,correction_requests:1,call_id:submission.call_id,authority_effect:'none'};
 save(directory,'result.json',result);return result;
}
