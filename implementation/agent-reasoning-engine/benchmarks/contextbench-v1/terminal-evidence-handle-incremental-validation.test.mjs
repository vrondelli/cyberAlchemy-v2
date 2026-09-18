import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseIncrementalEvidenceDisclosure} from './terminal-evidence-handle-incremental-validation.mjs';

const readId='a'.repeat(64);
const bindings=[{handle:'h0',read_id:readId}];
const commonMessages=[
  {role:'system',content:'Select delivered evidence only.'},
  {role:'assistant',content:`Held candidate already referenced ${readId}.`}
];
const controlReview=[
  {role:'user',content:'The first terminal candidate was held without acceptance for review.'},
  {role:'user',content:'Finalize now within the remaining original token/call budget.'},
  {role:'user',content:'Model calls remaining including this one: 1.'}
];
const stateMessage={role:'user',content:'TERMINAL EVIDENCE HANDLES\nh0 src/a.py:1-2'};
const controlPrompt=()=>({model:'glm-5.3-flash',messages:[...structuredClone(commonMessages),...structuredClone(controlReview)],tools:[{function:{name:'submit_context_selection',parameters:{type:'object'}}}]});
const treatmentPrompt=()=>({model:'glm-5.3-flash',messages:[...structuredClone(commonMessages),structuredClone(stateMessage)],tools:[{function:{name:'submit_context_handles',parameters:{type:'object',properties:{context_handles:{type:'array',items:{enum:['h0']}}}}}}]});

test('incremental disclosure permits exactly paired inherited identifiers',()=>{
  const result=diagnoseIncrementalEvidenceDisclosure({controlPrompt:controlPrompt(),treatmentPrompt:treatmentPrompt(),bindings});
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(result.measurements.treatment_added_full_read_id_occurrences,0);
  assert.equal(result.measurements.inherited_full_read_id_occurrences,1);
  assert.equal(result.measurements.inherited_full_read_id_occurrences_paired,true);
  assert.equal(result.measurements.common_prompt_byte_equivalent,true);
});

test('incremental disclosure rejects a full identifier in treatment state',()=>{
  const treatment=treatmentPrompt();
  treatment.messages.at(-1).content+=`\nprivate ${readId}`;
  const result=diagnoseIncrementalEvidenceDisclosure({controlPrompt:controlPrompt(),treatmentPrompt:treatment,bindings});
  assert.equal(result.ok,false);
  assert.ok(result.issues.some(row=>row.code==='terminal-handles-incremental.treatment-added-id-disclosed'));
  assert.equal(result.measurements.treatment_added_state_full_read_id_occurrences,1);
});

test('incremental disclosure rejects a full identifier in treatment tool schema',()=>{
  const treatment=treatmentPrompt();
  treatment.tools[0].function.parameters.description=`Never expose ${readId}`;
  const result=diagnoseIncrementalEvidenceDisclosure({controlPrompt:controlPrompt(),treatmentPrompt:treatment,bindings});
  assert.equal(result.ok,false);
  assert.ok(result.issues.some(row=>row.code==='terminal-handles-incremental.treatment-added-id-disclosed'));
  assert.equal(result.measurements.treatment_added_schema_full_read_id_occurrences,1);
});

test('incremental disclosure rejects treatment-only common identifier content',()=>{
  const treatment=treatmentPrompt();
  treatment.messages.splice(1,0,{role:'assistant',content:`Treatment-only inherited-looking ${readId}`});
  const result=diagnoseIncrementalEvidenceDisclosure({controlPrompt:controlPrompt(),treatmentPrompt:treatment,bindings});
  assert.equal(result.ok,false);
  assert.ok(result.issues.some(row=>row.code==='terminal-handles-incremental.unregistered-prompt-drift'));
  assert.ok(result.issues.some(row=>row.code==='terminal-handles-incremental.inherited-id-count-drift'));
  assert.equal(result.measurements.inherited_full_read_id_occurrences_paired,false);
});
