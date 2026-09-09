// Exact-byte delivery controls. Open questions: README.md#open-questions.
import test from 'node:test';import assert from 'node:assert/strict';
import {pageObservation,projectPagedFiles} from './prepared/paging.mjs';
import {pageObservation as original} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/paging.mjs';
import {hash,stable} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const observation=text=>({ok:true,output:{path:'README.md',utf8:text,sha256:hash(text)}});
test('ASCII page behavior is unchanged',()=>{const o=observation('x'.repeat(9000));for(const offset of [0,4000,8000])assert.deepEqual(pageObservation(o,{path:'README.md',offset},4000),original(o,{path:'README.md',offset},4000));});
for(const text of ['界'.repeat(4000),'😀'.repeat(3000)])test('dense text is byte bounded with exact gap-free confirmed assembly: '+text.codePointAt(0),()=>{
 const o=observation(text),history=[],confirmed=new Set();let offset=0;
 while(offset<text.length){const args={path:'README.md',offset},p=pageObservation(o,args,4000),id='r'+history.length;assert.ok(Buffer.byteLength(p.output.utf8)<=4000);assert.ok(p.output.next_offset>offset);assert.equal(p.output.utf8.includes('\uFFFD'),false);assert.equal(/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(p.output.utf8),false);
 history.push({calls:[{name:'read-file',id,arguments:args}],observations:[p],messages:[{role:'assistant',tool_calls:[{id,type:'function',function:{name:'read-file',arguments:stable(args)}}]},{role:'tool',tool_call_id:id,content:stable(p)}]});confirmed.add(id);offset=p.output.next_offset;
 }
 assert.equal(history.map(e=>e.observations[0].output.utf8).join(''),text);
 assert.equal(projectPagedFiles(history,{'README.md':hash(text)},confirmed,4000)[0].full_file_delivered,true);confirmed.delete('r'+(history.length-1));assert.equal(projectPagedFiles(history,{'README.md':hash(text)},confirmed,4000)[0].full_file_delivered,false);
});
