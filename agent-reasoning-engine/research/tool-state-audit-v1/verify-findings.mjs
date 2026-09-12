// Non-effectful independent checks of selected audit findings. Open questions: PLAN.md.
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateCalls} from '../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/tools.mjs';
import {patchToolSchema,validatePatchShape,diagnosePatch} from '../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/patch-schema.mjs';
import {parseSubmission} from '../../../implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/submission.mjs';
const checks=[];
let error;try{validateCalls([{id:'audit-invalid-read',type:'function',function:{name:'read-file',arguments:'{}'}}],['read-file'],new Set(),[]);}catch(e){error=e;}
assert.equal(error.message,'glm.tool-arguments-invalid');
checks.push({id:'typed-native-argument-rejection',verified:true,observed:error.message,claim_ceiling:'Pure validator rejection verified. Outer agent catch inspection shows terminal BLOCK with this typed reason, not generic runtime-failed; no live model behavior tested.'});
const base={tree_sha256:'a'.repeat(64),files:{'one.js':'b'.repeat(64),'two.js':'c'.repeat(64)}};
const candidate={schema_version:'are.patch-set-candidate/v1',authority_effect:'none',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'one.js',expected_file_sha256:base.files['two.js'],utf8:'export const a=1;'}]};
assert(validatePatchShape(candidate,patchToolSchema(base,Object.keys(base.files))).ok);
const parsed=parseSubmission({role:'assistant',tool_calls:[{id:'audit-cross-pair',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(candidate)}}]},'tool_calls',{base,mutation_allowlist:Object.keys(base.files)});
assert(!parsed.ok&&parsed.reason_codes.includes('submission.scope-drift'));
checks.push({id:'path-hash-schema-binding-gap',verified:true,advertised_shape_accepts:true,local_submission_rejects:parsed.reason_codes,claim_ceiling:'Communication/binding gap; no unsafe patch acceptance. Provider support for a more precise schema remains to be tested.'});
const invalid={...candidate,expected_base_tree_sha256:'bad',changes:[{operation:'delete',path:'',expected_file_sha256:'bad'}],extra:true};
const diagnostic=diagnosePatch(JSON.stringify(invalid));assert(!diagnostic.ok&&!diagnostic.truncated&&diagnostic.issues.length>=5);
checks.push({id:'shared-patch-diagnostics-already-multifield',verified:true,issues:diagnostic.issues.map(x=>({path:x.instance_path,code:x.code})),claim_ceiling:'Reuse the existing bounded whole-shape diagnostics; extend integration coverage rather than claim a validator is absent.'});
const files=['implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/tools.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/agent.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/patch-schema.mjs','implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/submission.mjs'];
const report={status:'passed',checks,source_bindings:files.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')})),model_calls:0,tokenizer_calls:0,authority_effect:'none',open_questions_ref:'PLAN.md'};
writeFileSync(new URL('parent-verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
