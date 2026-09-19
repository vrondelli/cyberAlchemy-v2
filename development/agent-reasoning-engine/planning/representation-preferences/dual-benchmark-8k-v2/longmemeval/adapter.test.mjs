import test from 'node:test';
import assert from 'node:assert/strict';
import {loadRows,project,retrievalMessages} from '../../dual-benchmark-8k-v1/longmemeval/adapter.mjs';
import {scopeMessages} from './adapter.mjs';
test('scope ablation preserves identical evidence and question, without benchmark labels or evaluator fields',()=>{
 for(const row of loadRows()){
  const base=retrievalMessages(row),candidate=scopeMessages(row);
  assert.deepEqual(candidate.slice(1),base.slice(1));
  const tainted={...row,task_id:'unrelated-task',answer:'NEVER INCLUDE THIS GOLD',question_type:'forbidden',evaluation:{correct_answer:'forbidden'}};
  assert.deepEqual(scopeMessages(tainted),candidate);
  assert.deepEqual(project(tainted),project(row));
 }
});
test('policy does not prescribe any task-specific preference and uses one common system message',()=>{
 const rows=loadRows();const systems=new Set(rows.map(row=>scopeMessages(row)[0].content));
 assert.equal(systems.size,1);
 const a={...rows[0],question:'Recommend a plan',history:[{date:'2026-01-01',messages:[{role:'user',content:'Use a table for project plans.'},{role:'user',content:'I now prefer a DAG.'}]}]};
 const messages=scopeMessages(a);
 assert.ok(messages[1].content.includes('I now prefer a DAG.'));
 assert.ok(!messages[0].content.includes('DAG'));
});
