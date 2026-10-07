// Offline captured actual-source scripted requests; no providers or labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R7.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {checkAcquisitionGuidanceRequestR7 as check} from './audit-acquisition-guidance-r7.mjs';
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r7-20261007';
const task='Offline explicit-native integration: inspect runtime status and one canonical catalog declaration, then select its delivered complete source read. Not a fault-quality prediction.';
test('all32 saved native episodes bind exact policy and task in every capture',()=>{
 const r=JSON.parse(readFileSync(root+'/RESULT.json'));
 for(const row of r.rows){const episode=JSON.parse(readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json')).result;
  for(const capture of episode.captures)assert.equal(check(JSON.parse(capture.prompt),row.arm,task),row.arm==='index');
 }
});
test('wrong arm, duplicate, missing, changed guidance and altered task reject',()=>{
 const e=JSON.parse(readFileSync(root+'/Defects4J-Cli-5-index/RESULT.json')).result;
 const p=JSON.parse(e.captures[0].prompt);assert.equal(check(p,'index',task),true);assert.throws(()=>check(p,'baseline',task));
 for(const mutate of [x=>{x.messages[0].content+=' changed';},x=>{x.messages[0].content=x.messages[0].content.split('\nARE EVIDENCE-GROUNDED')[0];},x=>{x.messages.push({role:'user',content:'ARE EVIDENCE-GROUNDED ACQUISITION POLICY:'});},x=>{x.messages[1].content+=' changed';}]){
  const b=structuredClone(p);mutate(b);assert.throws(()=>check(b,'index',task));
 }
});
