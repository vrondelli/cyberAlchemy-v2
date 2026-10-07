// No provider or gold. Open Questions: G01-NATIVE-METHOD-LIVE-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {providerAdmitted,generationAdmitted,nativeFilePrediction} from './native-method-live-policy-r1.mjs';
const good={dispatched:true,status:200,prompt_tokens:100,completion_tokens:20,public_response:{finish_reason:'stop',message:{role:'assistant',content:'{}'}}};
test('strict confirmed dispatch/known usage admission',()=>{
 assert.ok(providerAdmitted(good));assert.ok(generationAdmitted(good,100));
 for(const patch of [{dispatch_uncertain:true},{dispatched:null},{status:403},{prompt_tokens:null},{failure_code:'rejected'}])assert.equal(providerAdmitted({...good,...patch}),false);
 for(const patch of [{prompt_tokens:101},{completion_tokens:null},{completion_tokens:513},
  {public_response:{finish_reason:'length',message:{role:'assistant'}}}])assert.equal(generationAdmitted({...good,...patch},100),false);
 assert.equal(generationAdmitted({...good,prompt_tokens:8000},8000),false);
});
test('all32 offline native selections reconstruct exactly, synthetic evidence remains synthetic',()=>{
 const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r1-20261007';
 const cohort=JSON.parse(readFileSync(root+'/RESULT.json'));
 for(const row of cohort.rows){const saved=JSON.parse(readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json'));
  assert.equal(saved.scripted_transport,true);const prediction=nativeFilePrediction(saved.result);
  assert.equal(prediction.valid,true);assert.equal(prediction.ranked_files.length,1);
  assert.deepEqual(prediction.final_read_ids,row.delivered_read_ids);
 }
});
test('missing, over-budget and modified native selections never become valid',()=>{
 assert.equal(nativeFilePrediction(null).valid,false);
 const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r1-20261007/Defects4J-Cli-5-baseline/RESULT.json';
 const r=JSON.parse(readFileSync(root)).result;
 assert.equal(nativeFilePrediction({...r,functionality_valid:false}).valid,false);
 assert.equal(nativeFilePrediction({...r,selection:{...r.selection,final_read_ids:['invented']}}).valid,false);
});
