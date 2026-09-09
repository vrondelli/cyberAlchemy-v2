import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTrace, digest} from './contract-verifier.mjs';
const contract = JSON.parse(readFileSync(new URL('./CONTRACT.json', import.meta.url)));
const scoped = value => ({...contract.binding, ...value});
function fixture() {
  const text = 'Explain context management.';
  const feedback = 'From now on include examples in explanations.';
  return [
    scoped({id:'r1', type:'request', request_id:'q1', origin:'user', text, request_digest:digest(text)}),
    scoped({id:'p1', type:'projection', request_id:'q1', request_digest:digest(text), context_bytes:0, lesson_ids:[]}),
    scoped({id:'d1', type:'dispatch', request_id:'q1', request_digest:digest(text)}),
    scoped({id:'o1', type:'outcome', request_id:'q1', status:'completed'}),
    scoped({id:'r2', type:'request', request_id:'q2', origin:'user', text:feedback, request_digest:digest(feedback)}),
    scoped({id:'lesson1', type:'change', kind:'lesson', source_request_id:'q2', source_role:'user', quote:feedback, posture:'explicit', episode_id:'q1', retention_scope:'current-thread'}),
    scoped({id:'c1', type:'checkpoint', change_id:'lesson1', durable:true}),
    scoped({id:'control1', type:'change', kind:'control', action:'set-mode', mode:'apply-scoped', source_request_id:'q2', source_role:'user', quote:feedback}),
    scoped({id:'c2', type:'checkpoint', change_id:'control1', durable:true}),
    scoped({id:'p2', type:'projection', request_id:'q2', request_digest:digest(feedback), context_bytes:500, lesson_ids:['lesson1']}),
    scoped({id:'d2', type:'dispatch', request_id:'q2', request_digest:digest(feedback)}),
    scoped({id:'o2', type:'outcome', request_id:'q2', status:'completed'}),
    scoped({id:'proposal1', type:'capability-proposal', episode_id:'q2', authority_effect:'none', implementation_changed:false}),
  ];
}
test('explicit correction, checkpoint, application and non-effectful capability proposal', () => {
  assert.equal(verifyTrace(contract, fixture()).dispatches, 2);
});
const cases = [
  ['cross-thread', t => {t[5].thread_id='different';}, /scope-mismatch/],
  ['cross-participant', t => {t[5].participant_ref='other';}, /scope-mismatch/],
  ['tool feedback', t => {t[5].source_role='tool';}, /unattributed-feedback/],
  ['quoted feedback', t => {t[5].quoted=true;}, /unattributed-feedback/],
  ['inferred preference', t => {t[5].posture='inferred';}, /not-confirmed/],
  ['invented history', t => {t[5].episode_id='pre-cutover';}, /episode-not-observed/],
  ['scope expansion', t => {t[5].retention_scope='all-products';}, /scope-exceeded/],
  ['lost checkpoint', t => {t.splice(6,1);}, /uncheckpointed-lesson/],
  ['changed request', t => {t[10].request_digest='changed';}, /dispatch-request-changed/],
  ['duplicate dispatch', t => {t.splice(11,0,{...t[10],id:'duplicate'});}, /duplicate-dispatch/],
  ['context overflow', t => {t[9].context_bytes=8193;}, /context-overflow/],
  ['one-time override', t => {t[4].override_ids=['lesson1'];}, /override-ignored/],
  ['silent implementation', t => {t[12].implementation_changed=true;}, /capability-authority-exceeded/],
  ['unknown delivery retried', t => {t[11].status='delivery-unknown';t.push({...t[10],id:'retry'});}, /duplicate-dispatch/],
  ['paused reuse', t => {t[7].mode='off';}, /reuse-disabled/],
  ['disabled lesson', t => {t.splice(9,0,scoped({id:'disable',type:'change',kind:'control',action:'disable-reuse',lesson_id:'lesson1',source_request_id:'q2',source_role:'user',quote:'examples'}),scoped({id:'disable-checkpoint',type:'checkpoint',change_id:'disable',durable:true}));}, /disabled-lesson-applied/],
];
for (const [name, mutate, expected] of cases) test(name, () => {
  const trace=fixture();mutate(trace);assert.throws(() => verifyTrace(contract,trace),expected);
});
