import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkHistory,ingestionMessages} from './chunks.mjs';
const row={task_id:'t',question:'hidden question',answer:'hidden gold',history:[{date:'2024-01-01',messages:[{role:'user',content:'alpha '.repeat(30)},{role:'assistant',content:'beta '.repeat(30)}]}]};
test('partition preserves chronological source exactly and refuses truncation',()=>{
 const r=chunkHistory(row,300);assert.equal(r.chunks.length,2);assert.equal(r.unit_count,2);
 assert.deepEqual(r.chunks.flat().map(u=>u.content),row.history[0].messages.map(m=>m.content));
 assert.throws(()=>chunkHistory(row,10),/whole turn/);
});
test('ingestion hides query and gold and gives both arms the same source words',()=>{
 const r=chunkHistory(row);const a=ingestionMessages(r.chunks[0],'control'),b=ingestionMessages(r.chunks[0],'treatment');
 for(const prompt of [a,b])assert.equal(JSON.stringify(prompt).includes('hidden'),false);
 const ah=JSON.parse(a.at(-1).content).history_chunk,bh=JSON.parse(b.at(-1).content).history_chunk;
 assert.deepEqual(ah,bh.map(({source_id,...u})=>u));assert.equal(bh[0].source_id,'s0-m0');
});
