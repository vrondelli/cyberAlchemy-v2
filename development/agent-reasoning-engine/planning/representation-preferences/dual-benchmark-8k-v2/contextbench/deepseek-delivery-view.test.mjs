import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';
import {visibleToolObservations,pruneNativeText,PRUNE_MARKER} from './deepseek-delivery-view.mjs';
import {observationItems,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const root=new URL('./deepseek-checkpoint-69/evidence/runs/1-dsh/',import.meta.url);
const records=dir=>readdirSync(new URL(dir,root)).filter(n=>/^\d{6}\.json$/.test(n)).sort().map(n=>JSON.parse(readFileSync(new URL(dir+'/'+n,root))));
function fixture(){const req=records('transport').find(e=>e.kind==='request'&&e.attempt===10),body=JSON.parse(req.request_bytes),message=body.messages.find(m=>m.role==='tool'&&m.content.includes(PRUNE_MARKER)),record=records('tools').find(e=>e.kind==='tool-result'&&e.call.id===message.tool_call_id);return {call:record.call,output:record.output,content:message.content};}
test('actual native-pruned GLM request credits only complete retained observations',()=>{
 const f=fixture();assert.equal(pruneNativeText(stable(f.output)),f.content);
 const result=visibleToolObservations(f),all=observationItems(f.call,f.output);
 assert.equal(result.pruned,true);assert.ok(result.observations.length>0);assert.ok(result.observations.length<all.length);
 for(const {o} of result.observations)assert.ok(f.content.includes(stable(o)));
 const missing=all.filter(x=>!result.observations.some(y=>y.o.read_id===x.o.read_id));assert.ok(missing.some(x=>!f.content.includes(x.o.read_id)));
});
test('a fabricated pruning marker or retained-text edit cannot attest delivery',()=>{
 const f=fixture();assert.throws(()=>visibleToolObservations({...f,content:f.content.replace(PRUNE_MARKER,'\n[omitted]\n')}),/tool-output-mismatch/);
 assert.throws(()=>visibleToolObservations({...f,content:f.content.replace('ZSTD','FAKE')}),/tool-output-mismatch/);
});
test('pruning uses Unicode code points at both boundaries',()=>{
 const input='😀'.repeat(9000),output=pruneNativeText(input);assert.equal(output,'😀'.repeat(4096)+PRUNE_MARKER+'😀'.repeat(1024));
 assert.equal(pruneNativeText('😀'.repeat(8192)),'😀'.repeat(8192));
});
