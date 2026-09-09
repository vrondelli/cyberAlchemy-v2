import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {feedbackFor,prepareArm,score} from './experiment.mjs';
import {createCodexAppServerWrapper,loadRepositoryProfile} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const corpus=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url)));
const rubric=JSON.parse(readFileSync(new URL('./rubric.json',import.meta.url)));
test('balanced frozen corpus and strict output scoring',()=>{
 assert.equal(corpus.training.length*2+corpus.evaluation.length*3,24);
 assert.equal(new Set(corpus.evaluation.map(c=>c.arm_order.join(''))).size,6);
 assert.deepEqual(Object.keys(rubric).sort(),corpus.evaluation.map(c=>c.id).sort());
 assert.equal(score('Evidence gap: not measured. extra','completed',rubric['gap-apply']).passed,false);
 assert.equal(score('Meaning: x Example: y','completed',rubric['order-apply']).passed,false);
 assert.equal(score('signal sieve','failed',rubric['term-apply']).passed,false);
 assert.equal(score('Context updated.','completed',rubric['term-scope']).passed,true);
});
test('complete local cycle isolates all 18 fresh-thread treatments with frozen lessons',async()=>{
 const root=resolve(import.meta.dirname,'../../../../../../..');
 const loaded=loadRepositoryProfile(resolve(import.meta.dirname,'../live-compatibility-v2/canary-profile.json'),root);
 assert.equal(loaded.ok,true,JSON.stringify(loaded));
 let supplied={},seq=0;
 const wrapper=createCodexAppServerWrapper({loaded_profile:{...loaded.value,interaction_learning:{...loaded.value.interaction_learning,policy:{mode:'apply-scoped'}}},decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,interaction_input_provider:()=>supplied});
 async function turn(threadId,text,additionalContext,response='Context management explanation.'){
  const id=++seq;
  const result=await wrapper.processClientMessage({id,method:'turn/start',params:{threadId,input:[{type:'text',text}],...(additionalContext?{additionalContext}:{})}});
  assert.equal(result.to_server.length,1,JSON.stringify(result.to_client));
  const wire=result.to_server[0];assert.equal(wire.params.input[0].text,text);
  await wrapper.processServerMessage({id,result:{turn:{id:`turn:${id}`}}});
  await wrapper.processServerMessage({method:'turn/completed',params:{threadId,turn:{id:`turn:${id}`,status:'completed',items:[{type:'agentMessage',text:response}]}}});
  return wire;
 }
 try{
  for(const family of corpus.training){supplied={};await turn(`train:${family.id}`,family.initial);
   const previous=Object.values(wrapper.inspectLearningState({detail:true}).turns).find(t=>t.interaction_ref===`train:${family.id}`);assert.ok(previous.outcome);
   supplied={feedback:feedbackFor(family,previous.request_ref)};await turn(`train:${family.id}`,family.correction,undefined,family.instruction);
  }
  const trained=wrapper.inspectLearningState({detail:true});assert.equal(Object.keys(trained.lessons).length,3);
  const frozen=JSON.stringify(trained.lessons);
  for(const entry of corpus.evaluation)for(const arm of entry.arm_order){
   const prepared=prepareArm(wrapper,arm,entry,corpus.training,`test:${entry.id}:${arm}`);supplied=prepared.input;
   const wire=await turn(`fresh:${entry.id}:${arm}`,entry.request,prepared.additionalContext);
   const view=JSON.parse(wire.params.additionalContext['cyberalchemy.are.interaction-learning'].value);
   assert.equal(view.items.length,arm==='C'&&entry.kind==='applicable'?1:0,`${entry.id}:${arm}`);
   if(arm==='A')for(const f of corpus.training)assert.equal(JSON.stringify(wire).includes(f.instruction),false);
   if(arm==='B'){const summary=wire.params.additionalContext['experiment.memory-summary'].value;
    for(const f of corpus.training){assert.ok(summary.includes(f.instruction));for(const condition of [...f.conditions,...f.exclusions])assert.ok(summary.includes(condition));}}
  }
  assert.equal(seq,24);assert.equal(JSON.stringify(wrapper.inspectLearningState({detail:true}).lessons),frozen);
 }finally{wrapper.close();}
});
