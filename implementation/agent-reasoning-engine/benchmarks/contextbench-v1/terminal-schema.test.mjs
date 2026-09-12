import test from 'node:test';import assert from 'node:assert/strict';
import {diagnoseFinalSelection} from './terminal-schema.mjs';
test('all shape and reference defects are reported together',()=>{
 const id='a'.repeat(64),d=diagnoseFinalSelection(JSON.stringify({summary:3,extra:true,context_read_ids:[id,id,4]}),[]);
 assert.equal(d.ok,false);assert.ok(d.issues.some(i=>i.instance_path==='/summary'));
 assert.ok(d.issues.some(i=>i.instance_path==='/extra'));
 assert.ok(d.issues.some(i=>i.instance_path==='/context_read_ids/2'));
 assert.ok(d.issues.some(i=>i.code==='final-selection.duplicate-read-id'));
 assert.ok(d.issues.some(i=>i.code==='final-selection.undelivered-read-id'));
});
test('duplicate JSON keys and fenced/prose envelopes are rejected rather than silently extracted',()=>{
 assert.equal(diagnoseFinalSelection('{"summary":"a","summary":"b","context_read_ids":[]}',[]).ok,false);
 assert.equal(diagnoseFinalSelection('Explanation\n```json\n{"summary":"a","context_read_ids":[]}\n```',[]).ok,false);
});
test('valid known IDs and explicit empty selection remain valid',()=>{
 const id='a'.repeat(64);assert.equal(diagnoseFinalSelection(JSON.stringify({summary:'done',context_read_ids:[id]}),[id]).ok,true);
 assert.equal(diagnoseFinalSelection('{"summary":"unable","context_read_ids":[]}',[]).ok,true);
});
