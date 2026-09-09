import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyTrace, digest} from './contract-verifier.mjs';
const contract=JSON.parse(readFileSync(new URL('./CONTRACT.json',import.meta.url)));
const scope=e=>({...contract.binding,...e});
const request=(id,text)=>scope({id,type:'request',request_id:id,origin:'user',text,request_digest:digest(text)});
const projection=(id,text,lessons=[])=>scope({id:'p'+id,type:'projection',request_id:id,request_digest:digest(text),context_bytes:100,lesson_ids:lessons});
const dispatch=(id,text)=>scope({id:'d'+id,type:'dispatch',request_id:id,request_digest:digest(text)});
const checkpoint=id=>scope({id:'c'+id,type:'checkpoint',change_id:id,durable:true});
const control=(id,source,quote,mode)=>scope({id,type:'change',kind:'control',action:'set-mode',mode,source_request_id:source,source_role:'user',quote});
function base(){
 return [request('q1','Explain context.'),projection('q1','Explain context.'),dispatch('q1','Explain context.'),scope({id:'o1',type:'outcome',request_id:'q1',status:'completed'}),request('q2','Remember: include examples. Enable scoped application.'),scope({id:'lesson',type:'change',kind:'lesson',source_request_id:'q2',source_role:'user',quote:'include examples',posture:'explicit',episode_id:'q1',retention_scope:'current-thread'}),checkpoint('lesson'),control('enable','q2','Enable scoped application.','apply-scoped'),checkpoint('enable'),projection('q2','Remember: include examples. Enable scoped application.',['lesson'])];
}
const cases=[
 ['valid learning trace',()=>[...base(),dispatch('q2','Remember: include examples. Enable scoped application.')],true],
 ['disable after projection before dispatch',()=>[...base(),request('q3','Turn learning off.'),control('off','q3','Turn learning off.','off'),checkpoint('off'),dispatch('q2','Remember: include examples. Enable scoped application.')],false],
 ['disable lesson after projection before dispatch',()=>[...base(),request('q3','Stop using that lesson.'),scope({id:'disable',type:'change',kind:'control',action:'disable-reuse',lesson_id:'lesson',source_request_id:'q3',source_role:'user',quote:'Stop using that lesson.'}),checkpoint('disable'),dispatch('q2','Remember: include examples. Enable scoped application.')],false],
 ['cross-session event',()=>{const t=base();t[5].session_id='another-session';return t;},false],
 ['cross-workspace event',()=>{const t=base();t[5].cwd='/other-workspace';return t;},false],
 ['missing request identity',()=>[request(undefined,'Explain context.'),projection(undefined,'Explain context.'),dispatch(undefined,'Explain context.')].map((e,i)=>({...e,id:'event'+i})),false],
 ['retroactive feedback attached to later outcome',()=>{const t=base();const feedback=t.splice(4,1)[0];t.unshift(feedback);return t;},false],
];
for (const [name, build, expectedAccepted] of cases) test(name, () => {
  if (expectedAccepted) assert.equal(verifyTrace(contract, build()).status, 'PASS');
  else assert.throws(() => verifyTrace(contract, build()));
});
for (const id of ['', '   ', null, 0]) test(`reject malformed request ID ${JSON.stringify(id)}`, () => {
  assert.throws(() => verifyTrace(contract, [request(id, 'Explain context.')].map(e=>({...e,id:'valid-event'}))), /invalid-request-identity/);
});
test('rebuild empty projection after disabling learning permits dispatch', () => {
  const text='Remember: include examples. Enable scoped application.';
  const t=[...base(),request('q3','Turn learning off.'),control('off','q3','Turn learning off.','off'),checkpoint('off'),{...projection('q2',text),id:'rebuilt'},dispatch('q2',text)];
  assert.equal(verifyTrace(contract,t).dispatches,2);
});
test('rebuild empty projection after disabling lesson permits dispatch', () => {
  const text='Remember: include examples. Enable scoped application.';
  const t=cases[2][1]();t.splice(-1,0,{...projection('q2',text),id:'rebuilt'});
  assert.equal(verifyTrace(contract,t).dispatches,2);
});
test('uncheckpointed disable cannot be bypassed at dispatch', () => {
  const t=cases[1][1]().filter(e=>e.id!=='coff');
  assert.throws(()=>verifyTrace(contract,t),/checkpoint-missing/);
});
test('feedback before completion is rejected even if outcome precedes lesson creation', () => {
  const t=base();const feedback=t.splice(4,1)[0];t.splice(3,0,feedback);
  assert.throws(()=>verifyTrace(contract,t),/feedback-precedes-outcome/);
});
