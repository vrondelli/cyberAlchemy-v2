import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {EventEmitter} from 'node:events';
import {createInterface} from 'node:readline';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createCanaryTransport,scoreOutput,prompts} from './harness-v3.mjs';
import {createAppServerRpcClient,createCodexAppServerWrapper,loadRepositoryProfile,protocolBindingCheck} from '../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
const root=resolve(import.meta.dirname,'../../../../../../..');
const loaded=loadRepositoryProfile(resolve(import.meta.dirname,'canary-profile.json'),root);
test('separate profile binds observed 0.153.1 without admitting a different binary',()=>{
 assert.equal(loaded.ok,true,JSON.stringify(loaded.reason_codes));assert.equal(protocolBindingCheck(loaded.value.protocol_binding,'codex-cli 0.153.1').ok,true);
 assert.equal(protocolBindingCheck(loaded.value.protocol_binding,'codex-cli 0.153.0-alpha.5').ok,false);
 const old=JSON.parse(readFileSync(resolve(root,'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json')));
 assert.equal(old.protocol_binding.observed_codex_version,'codex-cli 0.153.0-alpha.5');
});
test('literal scoring rejects missing output and failed turns, honors explicit reversal',()=>{
 assert.equal(prompts.length,5);assert.equal(scoreOutput(0,'jargon','completed').passed,true);assert.equal(scoreOutput(1,'jargon','completed').passed,false);
 assert.equal(scoreOutput(3,'jargon','completed').passed,true);assert.equal(scoreOutput(4,'plain','failed').passed,false);assert.equal(scoreOutput(4,'','completed').passed,false);
});
test('proxy preserves exact forwarded bytes, observes real-wrapper completions and captures applicable lesson',async()=>{
 const input=new PassThrough(),output=new PassThrough(),failure=new EventEmitter();let closed=0,supplied={},dispatched=[];
 const raw={input,output,failure,ready:Promise.resolve(),close:async()=>{closed++;input.destroy();output.destroy();}};
 const wrapper=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,interaction_input_provider:()=>supplied});
 const proxy=createCanaryTransport(raw,wrapper,{onDispatch:m=>dispatched.push(JSON.stringify(m))});
 const lines=createInterface({input});let sequence=0,received=[];
 lines.on('line',line=>{const m=JSON.parse(line);if(m.method==='initialize')output.write(JSON.stringify({id:m.id,result:{}})+'\n');
  if(m.method==='turn/start'){received.push(line);sequence++;const id=`turn:${sequence}`;output.write(JSON.stringify({id:m.id,result:{turn:{id}}})+'\n');output.write(JSON.stringify({method:'turn/completed',params:{threadId:'test',turn:{id,status:'completed',items:[{type:'agentMessage',text:sequence===1?'jargon':'plain'}]}}})+'\n');}});
 const client=createAppServerRpcClient({transport:proxy,request_timeout_ms:1000,completion_timeout_ms:1000});
 try{
  await client.initialize({clientInfo:{name:'test',version:'1'},capabilities:{experimentalApi:true}});
  await client.runTurn({threadId:'test',input:[{type:'text',text:prompts[0]}]});
  const prior=Object.values(wrapper.inspectLearningState({detail:true}).turns)[0];assert.ok(prior.outcome);
  supplied={feedback:{episode_ref:prior.request_ref,quote:'Avoid jargon',instruction:'Avoid jargon in explanations.',target:'response',posture:'explicit',retention_scope:'current-interaction',correction_kind:'new-preference',expected_checks:[{check_id:'plain',kind:'excludes',value:'jargon'}]}};
  await client.runTurn({threadId:'test',input:[{type:'text',text:prompts[1]}]});
  assert.deepEqual(received,dispatched);assert.equal(wrapper.inspectLearningState({detail:true}).applications.at(-1).disposition,'supported');
 }finally{await client.close();await proxy.close();lines.close();}
 assert.equal(closed,1);
});
test('every revised scenario request routes in all four variants without upstream model calls',async()=>{
 for(const variant of ['V0','V1','V2','V3']){
  const w=createCodexAppServerWrapper({loaded_profile:{...loaded.value,interaction_learning:{...loaded.value.interaction_learning,enabled:variant!=='V0',policy:{mode:variant==='V1'?'observe':'apply-scoped'}}},decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot});
  try{for(let i=0;i<prompts.length;i++){
   const result=await w.processClientMessage({id:i+1,method:'turn/start',params:{threadId:'test',input:[{type:'text',text:prompts[i]}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false}}});
   assert.equal(result.to_server.length,1,JSON.stringify(result.to_client));
   await w.processServerMessage({id:i+1,result:{turn:{id:`turn:${i}`}}});
   await w.processServerMessage({method:'turn/completed',params:{threadId:'test',turn:{id:`turn:${i}`,status:'completed',items:[{type:'agentMessage',text:i===0||i===3?'jargon':'plain'}]}}});
  }}finally{w.close();}
 }
});
