import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {admitToolBatch} from './aggregate-tool-admission.mjs';
import {decodeToolPayload} from './tool-payload-codec.mjs';
import {stable,bindDelivery,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const obs=(start=1,count=8)=>({path:'a.py',start_line:start,end_line:start+count-1,total_lines:100,utf8:Array.from({length:count},(_,i)=>'match '+(start+i)+' '+('x'.repeat(100))).join('\n'),source_sha256:'a'.repeat(64),source_revision:'base',base_commit:'b'.repeat(40)});
const call=(id,name,args)=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});
const read=id=>call(id,'read_file',{path:'a.py',start_line:1,line_count:8,revision:'base'});
function fixture(calls=[read('a'),read('b')],results=calls.map(()=>({ok:true,output:obs()}))){
 const archives=[];
 return {archives,options:{messages:[{role:'system',content:'Fixture'},{role:'user',content:'Inspect source'}],tools:[],assistant:{role:'assistant',tool_calls:calls},results,archive:async v=>archives.push(v),measure:async p=>Buffer.byteLength(p)+200,limit:8000}};
}
test('whole batch is measured and reduced, with all original bytes archived',async()=>{
 const f=fixture(),original=structuredClone(f.options.results);f.options.limit=2200;
 const r=await admitToolBatch(f.options);assert.equal(r.status,'admitted');assert.ok(r.attempts.length>1);assert.ok(r.envelope_tokens<=2200);assert.equal(f.archives.length,2);assert.deepEqual(f.options.results,original);assert.ok(r.outputs.some(o=>o.deferred));assert.equal(r.delivery,'unconfirmed');
 for(const a of f.archives)assert.equal(a.sha256,sha(stable(a.result)));
});
test('read prefixes map to exact whole lines and only delivered bytes enter receipt binding',async()=>{
 const f=fixture([read('a')]);f.options.limit=1700;const r=await admitToolBatch(f.options);assert.equal(r.status,'admitted');const out=r.outputs[0];assert.equal(out.ok,true);assert.ok(out.deferred);assert.equal(out.output.utf8,f.options.results[0].output.utf8.split('\n').slice(0,out.output.end_line).join('\n'));assert.equal(out.deferred.resume.arguments.start_line,out.output.end_line+1);
 const profile={model:'fixture',output_cap:100,reasoning_effort:'low'},receipt={...profile,kind:'model',dispatched:true,status:200,input_tokens:100,output_tokens:5,request_sha256:sha(stable(bodyForReceipt(r.prompt,profile)))};
 const binding=bindDelivery({captures:[{prompt:r.prompt,prompt_sha256:r.prompt_sha256}],receipts:[receipt]});assert.equal(binding.unmapped.length,0);assert.equal(binding.read_observations.length,1);assert.equal(binding.read_observations[0].body,out.output.utf8);assert.equal(binding.read_observations[0].id,out.output.read_id);
});
test('search and list pagination continue from the first omitted item',async()=>{
 const calls=[call('s','search',{query:'match',path_prefix:'',offset:10,limit:8,revision:'base'}),call('l','list_files',{query:'',offset:5,limit:8})];
 const results=[{ok:true,output:{observations:Array.from({length:8},(_,i)=>obs(i+1,1)),total:50,next_offset:18,skipped:[]}},{ok:true,output:{paths:Array.from({length:8},(_,i)=>'long-path-'+i+'x'.repeat(100)),total:50,next_offset:13}}];
 const f=fixture(calls,results);f.options.limit=2200;const r=await admitToolBatch(f.options);assert.equal(r.status,'admitted');
 for(const [i,o] of r.outputs.entries())if(o.deferred){const count=o.ok?(i===0?o.output.observations.length:o.output.paths.length):0;assert.equal(o.deferred.resume.arguments.offset,(i===0?10:5)+count);if(o.ok)assert.equal(o.output.next_offset,o.deferred.resume.arguments.offset);}
 for(const m of JSON.parse(r.prompt).messages.filter(m=>m.role==='tool'&&m.tool_call_id==='s'))assert.deepEqual(decodeToolPayload({tool:'search',payload:JSON.parse(m.content)}),r.outputs[0]);
});
test('irreducible envelope and oversized mutation result are denied without hiding effects',async()=>{
 const c=call('e','apply_edits',{edits:[{path:'a.py',source_sha256:'a'.repeat(64),old_text:'a',new_text:'b'}]});const f=fixture([c],[{ok:true,output:{changed_paths:['a.py'],details:'x'.repeat(9000)}}]);const r=await admitToolBatch(f.options);assert.equal(r.status,'denied');assert.equal(r.attempts.length,1);assert.equal(f.archives[0].result.output.changed_paths[0],'a.py');
});
test('archive and measurement errors propagate; invalid measurements never admit',async()=>{
 const a=fixture();a.options.archive=async()=>{throw Error('disk failure');};let measured=false;a.options.measure=async()=>{measured=true;return 1;};await assert.rejects(admitToolBatch(a.options),/disk failure/);assert.equal(measured,false);
 for(const value of [NaN,-1,1.5,undefined]){const f=fixture();f.options.measure=async()=>value;await assert.rejects(admitToolBatch(f.options),/measurement/);}
 const f=fixture();f.options.measure=async()=>{throw Error('tokenizer failure');};await assert.rejects(admitToolBatch(f.options),/tokenizer failure/);
});
test('nonmonotonic measurements are rechecked and deferred reads carry no evidence',async()=>{
 const f=fixture([read('a')]);let n=0;f.options.measure=async()=>++n<5?9000:100;const r=await admitToolBatch(f.options);assert.equal(r.status,'admitted');assert.equal(n,5);assert.equal(r.outputs[0].ok,false);assert.equal(r.outputs[0].deferred.resume.arguments.start_line,1);assert.equal(r.outputs[0].output,undefined);
});
test('oversized search serialization is reduced before tokenization, without dropping the archive',async()=>{
 const c=call('s','search',{query:'match',path_prefix:'',offset:0,limit:30,revision:'base'});
 const observations=Array.from({length:30},(_,i)=>({...obs(i+1,1),utf8:'match '+('x'.repeat(20000))}));
 const f=fixture([c],[{ok:true,output:{observations,total:30,next_offset:null,skipped:[]}}]);f.options.measure=async p=>Math.ceil(Buffer.byteLength(p)/4)+200;
 const r=await admitToolBatch(f.options);assert.equal(r.status,'admitted');assert.equal(r.attempts[0].reason,'request-byte-bound');assert.equal(f.archives[0].result.output.observations.length,30);assert.ok(r.outputs[0].deferred);assert.ok(r.envelope_tokens<=8000);
});
