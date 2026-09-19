// Candidate-only treatment adapters. Open questions: README.md#open-questions.
import {parseBoundedJSON,diagnosePatch} from '../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {submissionTool} from '../../../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs';
export const arms=['baseline','metadata-card','host-envelope','neutral-card','boundary-card'];
export const cards={
 'metadata-card':{id:'glm-required-envelope-v1',applies_when:'Final native patch submission with full output contract',instruction:'Include every required field in the submitted arguments. Set schema_version to are.patch-set-candidate/v1 and authority_effect to none. Copy the supplied base and file hashes exactly. Include the complete replacement source.',validator_expectations:['Canonical full-schema validation','Exact scope/hash preservation'],provenance:'ZTH correction-card structure; GLM analysis H2',status:'untested'},
 'neutral-card':{id:'glm-neutral-review-v1',applies_when:'Final native patch submission',instruction:'Review the task and the inspected material before returning the proposal. Keep the answer focused on the requested change. Use the supplied output structure and provide the complete replacement source. Do not report tests as executed.',validator_expectations:['Canonical full-schema validation','Semantic checks unchanged'],provenance:'Authored active control for H3',status:'untested'},
 'boundary-card':{id:'glm-boundary-review-v1',applies_when:'Final submission for archive or retention fixtures',instructions:{archive:'Apply the inspected boundary rules explicitly: validate ranges, reject a start inside a surrogate pair, move an interior end backward, reject nonempty reads with no progress, and allow the empty slice at EOF. Preserve UTF-16 offsets.',retention:'Apply the inspected history rules explicitly: allow empty history, validate every exchange before masking, require nonempty unique call IDs, require positional result matches and tool roles, and preserve recent content and old-content recovery metadata.'},validator_expectations:['Canonical full-schema validation','Hidden boundary and ordinary-case checks'],provenance:'ZTH correction-card structure; GLM analysis H3',status:'untested'}
};
export function decorateRequest(body,{arm,family}){
 if(!arms.includes(arm)||!['archive','retention'].includes(family))throw Error('unknown arm or family');
 const out=structuredClone(body),tool=out.tools?.find(t=>t.function?.name==='submit_patch_candidate');
 if(!tool)return out; // Reading turns unchanged; only final submission gets a treatment.
 if(arm==='host-envelope'){
  for(const key of ['schema_version','authority_effect']){delete tool.function.parameters.properties[key];tool.function.parameters.required=tool.function.parameters.required.filter(k=>k!==key);}
  out.messages.push({role:'user',content:'For this submission, send only the fields in the offered tool schema. The host adds the fixed schema_version and authority_effect envelope. Preserve the supplied hashes, change scope and complete source.'});
 }else if(cards[arm])out.messages.push({role:'user',content:cards[arm].instruction??cards[arm].instructions[family]});
 return out;
}
export function normalizeSubmission(text,{arm,base,paths}){
 if(!arms.includes(arm))throw Error('unknown arm');submissionTool(base,paths); // Validate trusted scope before adding any constants.
 const parsed=parseBoundedJSON(text);if(!parsed.ok)return {ok:false,stage:'parse',diagnostics:parsed};
 const raw=parsed.value;
 if(arm==='host-envelope'&&(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.hasOwn(raw,'schema_version')||Object.hasOwn(raw,'authority_effect')))return {ok:false,stage:'envelope-input'};
 const value=arm==='host-envelope'?{...raw,schema_version:'are.patch-set-candidate/v1',authority_effect:'none'}:raw;
 const diagnostic=diagnosePatch(value);if(!diagnostic.ok)return {ok:false,stage:'schema',diagnostics:diagnostic};
 if(value.expected_base_tree_sha256!==base.tree_sha256||value.changes.some(c=>!paths.includes(c.path)||c.expected_file_sha256!==base.files[c.path]))return {ok:false,stage:'scope'};
 return {ok:true,value,raw_full_contract_valid:diagnosePatch(raw).ok,model_envelope_field_fidelity:arm==='host-envelope'?null:true,authority_effect:'none'};
}
