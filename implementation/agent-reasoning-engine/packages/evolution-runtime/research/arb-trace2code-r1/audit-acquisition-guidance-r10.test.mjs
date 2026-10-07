// Saved offline full32 policy captures and strict negatives; no providers/labels.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {checkAcquisitionGuidanceRequestR10 as check} from './audit-acquisition-guidance-r10.mjs';
import {CONTRACT_BEFORE,CONTRACT_AFTER} from './native-method-contract-r10.mjs';
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r10-20261007',sha=b=>createHash('sha256').update(b).digest('hex');
const raw=readFileSync(root+'/RESULT.json');assert.equal(sha(raw),'ae9dde038d72bf011e24f6c518df90474b6c9911ef7e7ad451735edcbfee95ca');
const rows=JSON.parse(raw).rows,problem='Offline explicit-native integration: inspect runtime status and one canonical catalog declaration, then select its delivered complete source read. Not a fault-quality prediction.';
test('actual r10 auditor checks common task and exact unchanged treatment guidance across all32 offline cells',()=>{
 assert.equal(rows.length,32);let captures=0;for(const row of rows){const raw=readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json');assert.equal(sha(raw),row.result_sha256);const episode=JSON.parse(raw).result;for(const capture of episode.captures){const input=JSON.parse(capture.prompt);assert.equal(check(input,row.arm,problem),row.arm==='index');captures++;}}
 assert.ok(captures>=160);
});
test('old contract, changed objective, wrong arm, duplicate/missing/altered guidance still reject',()=>{
 const row=rows.find(r=>r.arm==='index'),saved=JSON.parse(readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json')),input=JSON.parse(saved.result.captures[0].prompt);
 assert.throws(()=>check(input,'baseline',problem));assert.throws(()=>check(input,'index',problem+' changed'));
 const old=structuredClone(input);old.messages[1].content=old.messages[1].content.replace(CONTRACT_AFTER,CONTRACT_BEFORE);assert.throws(()=>check(old,'index',problem));
 const missing=structuredClone(input);missing.messages[0].content=missing.messages[0].content.split('ARE EVIDENCE-GROUNDED ACQUISITION POLICY:')[0];assert.throws(()=>check(missing,'index',problem));
 const duplicate=structuredClone(input);duplicate.messages.push({role:'user',content:'ARE EVIDENCE-GROUNDED ACQUISITION POLICY:'});assert.throws(()=>check(duplicate,'index',problem));
 const altered=structuredClone(input);altered.messages[0].content+=' changed';assert.throws(()=>check(altered,'index',problem));
});
