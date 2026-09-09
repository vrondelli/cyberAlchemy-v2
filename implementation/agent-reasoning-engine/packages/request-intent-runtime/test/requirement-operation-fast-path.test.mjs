import assert from 'node:assert/strict';
import test from 'node:test';
import {assessRequirementOperationFastPath,materializeRequirementSnapshot,REQUIREMENT_DELTA_INSTRUCTION,resolveRequirementOperation,
  assessRequirementOperationFastPathExpanded,resolveRequirementOperationExpanded,resolveRequirementOperationFromDelta,
  resolveRequirementOperationFromReconciledDelta,verifyRequirementOperationFastPath,verifyRequirementOperationFastPathExpanded} from '../index.mjs';

const snapshot=materializeRequirementSnapshot({consumer_ref:'c',scope_ref:'s',objective_id:'o',objective_state_digest:'a'.repeat(64),
  requirements:['citations','table'],source_refs:['fixture']});
const input=request=>({snapshot,request,request_ref:`request:${request}`});

test('closed explicit forms resolve locally with exact set accounting',async()=>{
  const cases=[
    ['Add examples to the requirements.','add',['citations','examples','table']],
    ['Remove table from the requirements.','remove',['citations']],
    ['Keep citations as a requirement.','maintain',['citations','table']],
    ['Add table to the requirements.','add',['citations','table']],
    ['Remove examples from the requirements.','remove',['citations','table']],
  ];
  for(const [request,operation,expected] of cases){
    const assessed=assessRequirementOperationFastPath(input(request));
    assert.equal(assessed.ok,true);assert.equal(verifyRequirementOperationFastPath(assessed.value),true);
    assert.equal(assessed.value.disposition,'fast-path');assert.equal(assessed.value.operation,operation);
    assert.deepEqual(assessed.value.change.resulting_requirements,expected);
    let calls=0;const resolved=await resolveRequirementOperation(input(request),()=>{calls++;});
    assert.equal(resolved.value.disposition,'fast-path');assert.equal(resolved.value.model_calls,0);assert.equal(calls,0);
  }
});

test('ambiguous, conditional, negated, compound, and noncanonical forms require fallback',()=>{
  for(const request of ['Could you add examples?','Add examples or diagrams to the requirements.','Add examples if useful to the requirements.',
    'Do not add examples to the requirements.','Remove table and citations from the requirements.','add examples to the requirements.',
    'Keep examples as a requirement.']){
    const assessed=assessRequirementOperationFastPath(input(request));assert.equal(assessed.ok,true);
    assert.equal(assessed.value.disposition,'fallback-required');assert.equal(assessed.value.model_call_eligible,true);
  }
});

test('fallback is called exactly once with the existing compact contract',async()=>{
  let calls=0,observed;
  const resolved=await resolveRequirementOperation(input('Could you remove table?'),contract=>{
    calls++;observed=contract;return {transition:'refine',added:[],removed:['table']};
  });
  assert.equal(calls,1);assert.equal(resolved.ok,true);assert.equal(resolved.value.disposition,'model-fallback');
  assert.equal(resolved.value.model_calls,1);assert.match(observed.instruction,/Return only JSON/);
  assert.equal(observed.snapshot,snapshot);assert.deepEqual(resolved.value.change.resulting_requirements,['citations']);
});

test('missing fallback, malformed inputs, and fallback patches fail closed',async()=>{
  assert.equal((await resolveRequirementOperation(input('Could you add examples?'))).ok,false);
  assert.equal((await resolveRequirementOperation(input('Could you add examples?'),()=>({transition:'refine',added:['citations'],removed:[]}))).ok,false);
  for(const value of [undefined,null,{},[]])assert.equal(assessRequirementOperationFastPath(value).ok,false);
});

test('delta fallback makes the host the sole transition owner',async()=>{
  let observed,calls=0;
  const resolved=await resolveRequirementOperationFromDelta(input('Could you remove table?'),contract=>{
    calls++;observed=contract;return {posture:'applicable',added:[],removed:['table']};
  });
  assert.equal(resolved.ok,true);assert.equal(calls,1);assert.equal(observed.instruction,REQUIREMENT_DELTA_INSTRUCTION);
  assert.equal(resolved.value.schema_version,'are.requirement-operation-resolution/v2');
  assert.equal(resolved.value.transition_owner,'deterministic-host');assert.equal(resolved.value.change.transition,'refine');
  assert.deepEqual(resolved.value.change.resulting_requirements,['citations']);
});

test('delta fallback rejects provider transitions and unsupported deltas',async()=>{
  assert.equal((await resolveRequirementOperationFromDelta(input('Could you remove table?'),()=>
    ({posture:'applicable',added:[],removed:['table'],transition:'continue'}))).ok,false);
  assert.equal((await resolveRequirementOperationFromDelta(input('Could you remove table?'),()=>
    ({posture:'unsupported',added:[],removed:[]}))).ok,false);
  let calls=0;const direct=await resolveRequirementOperationFromDelta(input('Add examples to the requirements.'),()=>{calls++;});
  assert.equal(direct.ok,true);assert.equal(direct.value.transition_owner,'deterministic-host');assert.equal(calls,0);
});

test('reconciled delta fallback restores exact request spelling',async()=>{
  const resolved=await resolveRequirementOperationFromReconciledDelta(input('Could you add examples?'),()=>
    ({posture:'applicable',added:['Examples'],removed:[]}));
  assert.equal(resolved.ok,true);assert.equal(resolved.value.schema_version,'are.requirement-operation-resolution/v3');
  assert.equal(resolved.value.label_owner,'exact-request-span');assert.equal(resolved.value.transition_owner,'deterministic-host');
  assert.equal(resolved.value.change.transition,'refine');assert.deepEqual(resolved.value.change.resulting_requirements,['citations','examples','table']);
  assert.match(resolved.value.label_reconciliation_digest,/^[a-f0-9]{64}$/);
});

test('reconciled delta fallback blocks invented and ambiguous added labels',async()=>{
  assert.equal((await resolveRequirementOperationFromReconciledDelta(input('Could you add examples?'),()=>
    ({posture:'applicable',added:['diagrams'],removed:[]}))).ok,false);
  assert.deepEqual((await resolveRequirementOperationFromReconciledDelta(input('Examples differ from examples.'),()=>
    ({posture:'applicable',added:['EXAMPLES'],removed:[]}))).reason_codes,['requirements.added-label-source-span-ambiguous']);
});

test('expanded grammar admits only the frozen polite, question, lowercase, and punctuation forms',async()=>{
  const cases=[
    ['Please add examples to the requirements.','polite.add','add'],['Please remove table from the requirements.','polite.remove','remove'],
    ['Can you add examples to the requirements?','question.add','add'],['Can you remove table from the requirements?','question.remove','remove'],
    ['add examples to the requirements.','lower.add','add'],['remove table from the requirements.','lower.remove','remove'],
    ['Add examples to the requirements','no-period.add','add'],['Remove table from the requirements','no-period.remove','remove']];
  for(const [request,formId,operation] of cases){const assessed=assessRequirementOperationFastPathExpanded(input(request));
    assert.equal(assessed.ok,true);assert.equal(verifyRequirementOperationFastPathExpanded(assessed.value),true);
    assert.equal(assessed.value.disposition,'fast-path');assert.equal(assessed.value.form_id,formId);assert.equal(assessed.value.operation,operation);
    let calls=0;const resolved=await resolveRequirementOperationExpanded(input(request),()=>{calls++;});
    assert.equal(resolved.ok,true);assert.equal(resolved.value.schema_version,'are.requirement-operation-resolution/v4');assert.equal(resolved.value.model_calls,0);assert.equal(calls,0);}
});

test('expanded grammar keeps near misses on the fallback',()=>{
  for(const request of ['Please do not add examples to the requirements.','Can you add examples or diagrams to the requirements?',
    'Can you add examples if useful to the requirements?','Could you add examples to the requirements?','Can you please add examples to the requirements?',
    'please add examples to the requirements.','Please add audit  trail to the requirements.','Can you add only examples to the requirements?']){
    const assessed=assessRequirementOperationFastPathExpanded(input(request));assert.equal(assessed.ok,true);
    assert.equal(verifyRequirementOperationFastPathExpanded(assessed.value),true);assert.equal(assessed.value.disposition,'fallback-required');}
});
