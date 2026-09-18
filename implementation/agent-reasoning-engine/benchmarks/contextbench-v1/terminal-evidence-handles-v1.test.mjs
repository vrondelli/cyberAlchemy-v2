import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseTerminalHandles,terminalHandleSchema,terminalHandleTool} from './terminal-evidence-handles-v1.mjs';

const bindings=[
  {handle:'h0',read_id:'a'.repeat(64),path:'a.py',start_line:1,end_line:2},
  {handle:'h1',read_id:'b'.repeat(64),path:'b.py',start_line:3,end_line:3}
];

test('handle schema and resolution retain exact private read IDs',()=>{
  const schema=terminalHandleSchema(bindings),tool=terminalHandleTool(bindings);
  assert.deepEqual(schema.properties.context_handles.items.enum,['h0','h1']);
  assert.equal(tool.function.name,'submit_context_handles');
  const result=diagnoseTerminalHandles(JSON.stringify({summary:'selected',context_handles:['h1','h0']}),bindings);
  assert.equal(result.ok,true);
  assert.deepEqual(result.value.context_read_ids,['b'.repeat(64),'a'.repeat(64)]);
});

test('handle diagnostics report all schema, duplicate, and unknown defects',()=>{
  const result=diagnoseTerminalHandles(JSON.stringify({summary:4,context_handles:['h0','h0','h9'],extra:true}),bindings);
  assert.equal(result.ok,false);
  const codes=result.issues.map(row=>row.code);
  assert.ok(codes.includes('terminal-handles.duplicate-handle'));
  assert.ok(codes.includes('terminal-handles.unknown-handle'));
  assert.ok(result.issues.length>=4,JSON.stringify(result));
});
