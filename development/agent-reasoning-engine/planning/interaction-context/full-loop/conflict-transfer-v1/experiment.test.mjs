import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {feedbackFor,prepareArm,score} from './experiment.mjs';
import {createCodexAppServerWrapper,loadRepositoryProfile} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const corpus=JSON.parse(readFileSync(new URL('./cases.json',import.meta.url)));
const rubric=JSON.parse(readFileSync(new URL('./rubric.json',import.meta.url)));
test('balanced frozen corpus and strict output scoring',()=>{
 assert.equal(corpus.training.length*2+1+corpus.evaluation.length*2*corpus.repetitions,41);
 assert.deepEqual(Object.keys(rubric).sort(),corpus.evaluation.map(c=>c.id).sort());
 assert.equal(score('amber mesh and signal sieve','completed',rubric['revision-apply']).passed,false);
 assert.equal(score('Current instruction wins. extra','completed',rubric['conflict-exact']).passed,false);
 assert.equal(score('Cache note: provisional.','completed',rubric['stale-invalid']).passed,false);
 assert.equal(score('anything','failed',rubric['stale-invalid']).passed,false);
});
test('complete 41-turn rehearsal checks revisions, stale sources and explicit overrides',async()=>{
 const root=resolve(import.meta.dirname,'../../../../../../..');
 const loaded=loadRepositoryProfile(resolve(import.meta.dirname,'../live-compatibility-v2/canary-profile.json'),root);
 assert.equal(loaded.ok,true,JSON.stringify(loaded));
 let supplied={},seq=0,history=[];
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
   const priorLesson=Object.values(wrapper.inspectLearningState({detail:true}).lessons).find(l=>l.preference.instruction===family.instruction);history.push(priorLesson);
   if(family.revision){
    const source=Object.values(wrapper.inspectLearningState({detail:true}).turns).find(t=>t.rpc_id===seq);assert.ok(source.outcome);
    supplied={feedback:feedbackFor({...family,...family.revision},source.request_ref,priorLesson)};await turn(`train:${family.id}`,family.revision.request,undefined,family.revision.instruction);
    const revised=wrapper.inspectLearningState({detail:true}).lessons[priorLesson.lesson_id];assert.equal(revised.revision,2);assert.equal(revised.predecessor_digest,priorLesson.record_digest);history.push(revised);
   }
  }
  const trained=wrapper.inspectLearningState({detail:true});assert.equal(Object.keys(trained.lessons).length,2);
  const frozen=JSON.stringify(trained.lessons);
  for(let repetition=0;repetition<3;repetition++)for(const entry of corpus.evaluation)for(const arm of ['B','C']){
   const prepared=prepareArm(wrapper,arm,entry,corpus.training,`test:${repetition}:${entry.id}:${arm}`,history);supplied=prepared.input;
   const wire=await turn(`fresh:${repetition}:${entry.id}:${arm}`,entry.request,prepared.additionalContext);
   const view=JSON.parse(wire.params.additionalContext['cyberalchemy.are.interaction-learning'].value);
   assert.equal(view.items.length,arm==='C'?entry.expected_selected:0,`${entry.id}:${arm}`);
   if(arm==='C'&&entry.invalidate)assert.ok(view.assessments.some(a=>a.disposition==='unsupported'));
   if(arm==='C'&&entry.override)assert.ok(view.assessments.some(a=>a.disposition==='overridden'));
   if(arm==='B'){const summary=wire.params.additionalContext['experiment.memory-summary'].value;
    for(const lesson of history)assert.ok(summary.includes(lesson.preference.instruction));
    assert.ok(summary.includes('status superseded'));
    if(entry.invalidate)assert.ok(summary.includes('invalidated for this request'));
    if(entry.override)assert.ok(summary.includes('overridden for this request'));
   }
  }
  assert.equal(seq,41);assert.equal(JSON.stringify(wrapper.inspectLearningState({detail:true}).lessons),frozen);
 }finally{wrapper.close();}
});
