import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {buildTaskStateProjection,verifyTaskStateProjection} from './task-state.mjs';
import {bodyForReceipt,stable} from './delivery.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const task={problem_statement:'Fix the specified behavior and preserve evidence.'};
function delivery(){
  const source={path:'src/a.js',start_line:1,end_line:2,source_sha256:'b'.repeat(64),utf8:'one\ntwo',byte_count:7};
  const call={id:'c1',type:'function',function:{name:'read_file',arguments:stable({path:'src/a.js',start_line:1,line_count:2})}};
  const messages=[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:'c1',content:stable({ok:true,output:source})}],prompt=stable({messages,tools:[]});
  const receipt={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,finish_reason:'stop',input_tokens:2,output_tokens:1};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
  return{captures:[{step:1,generation:0,prompt,prompt_sha256:hash(prompt)}],receipts:[receipt]};
}
function deliveries(rows){
  const captures=[],receipts=[];
  for(const [index,row] of rows.entries()){
    const call={id:`c${index}`,type:'function',function:{name:'read_file',arguments:stable({path:row.path,start_line:row.start_line})}};
    const source={path:row.path,start_line:row.start_line,end_line:row.start_line,source_sha256:hash(row.utf8),utf8:row.utf8,byte_count:Buffer.byteLength(row.utf8)};
    const messages=[{role:'assistant',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable({ok:true,output:source})}],prompt=stable({messages,tools:[]});
    const receipt={kind:'model',model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low',dispatched:true,status:200,finish_reason:'stop',input_tokens:2,output_tokens:1};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
    captures.push({step:index,generation:0,prompt,prompt_sha256:hash(prompt)});receipts.push(receipt);
  }
  return{captures,receipts};
}
const events=[{step:1,tool:'read_file',output:{ok:true,output:{observations:[{id:'a'.repeat(64)}]}}},{step:2,tool:'apply_edits',output:{ok:true,output:{changed_paths:['src/a.js','src/a.js'],base_commit:'base'}}},{step:3,tool:'get_patch',output:{ok:true,output:{patch:'diff --git a/src/a.js'}}},{step:4,tool:'search',output:{ok:false,error:'invalid pattern'}}];

test('is absent before an actual recycle generation',async()=>assert.equal(await buildTaskStateProjection({task,...delivery(),events,generation:0}),null));
test('projects only bounded objective identity, delivered handles, and tool outcomes',async()=>{const x=await buildTaskStateProjection({task,...delivery(),events,generation:1,max_bytes:4096});assert.equal(x.objective.sha256,hash(task.problem_statement));assert.match(x.evidence[0].read_id,/^[a-f0-9]{64}$/);assert.equal(x.outcomes.find(y=>y.tool==='apply_edits').changed_paths.length,1);assert.ok(!x.text.includes('one\ntwo'));assert.ok(!x.text.includes(task.problem_statement));});
test('evidence-only mode keeps exact recovery handles and omits exploratory outcome chronology',async()=>{const input={task,...delivery(),events,generation:1,max_bytes:4096,include_outcomes:false};const x=await buildTaskStateProjection(input);assert.equal(x.projection_mode,'evidence-only');assert.equal(x.evidence.length,1);assert.deepEqual(x.outcomes,[]);assert.match(x.limitations.join(' '),/host ledger.*omitted/i);assert.equal((await verifyTaskStateProjection(x,input)).ok,true);});
test('is deterministic and independently rebuildable',async()=>{const input={task,...delivery(),events,generation:2};const a=await buildTaskStateProjection(input),b=await buildTaskStateProjection(input);assert.deepEqual(a,b);assert.equal((await verifyTaskStateProjection(a,input)).ok,true);a.outcomes[0].outcome='invented';assert.equal((await verifyTaskStateProjection(a,input)).ok,false);});
test('retains failures and superseding later facts without claiming correctness',async()=>{const x=await buildTaskStateProjection({task,...delivery(),events,generation:1});assert.equal(x.outcomes.at(-1).outcome,'rejected');assert.match(x.limitations.join(' '),/no inferred intent.*correctness/i);});
test('fits newest facts under byte and measured token caps',async()=>{let calls=0;const input={task,...delivery(),events:[...events,...events,...events],generation:3,max_bytes:700,max_tokens:200,measure_tokens:async text=>{calls++;return Math.ceil(text.length/4)}};const x=await buildTaskStateProjection(input);assert.ok(Buffer.byteLength(stable({...x,text:undefined,measured_tokens:undefined}))>0);assert.ok(x.measured_tokens<=200);assert.ok(x.fit.evicted_evidence+x.fit.evicted_outcomes>0);assert.ok(calls<=4);assert.equal(x.fit.tokenizer_calls,calls);await assert.rejects(()=>buildTaskStateProjection({...input,max_tokens:1}),/token-cap-too-small/);});
test('token fitting makes at most four measurements and retains the newest facts',async()=>{let calls=0;const many=Array.from({length:20},(_,step)=>({step,tool:'search',output:{ok:true,output:{total:step,observations:[{path:`src/${step}.js`}]}}}));const x=await buildTaskStateProjection({task,...delivery(),events:many,generation:4,max_outcomes:12,max_evidence:8,max_bytes:4096,max_tokens:650,measure_tokens:async text=>{calls++;return Math.ceil(text.length/3)}});assert.ok(x.measured_tokens<=650);assert.ok(calls<=4);assert.equal(x.outcomes.at(-1).step,19);assert.ok(x.truncation.evicted_outcomes>0);});
test('rejects malformed events instead of projecting caller prose',async()=>{const x=await buildTaskStateProjection({task,...delivery(),events:[{step:'later',tool:'note',output:{ok:true,output:{claim:'solved'}}}],generation:1});assert.deepEqual(x.outcomes,[]);});
test('path-balanced state keeps newest paths and newest distinct receipt-bound handles in chronological order',async()=>{
  const bound=deliveries([
    {path:'a.js',start_line:1,utf8:'a1'},{path:'b.js',start_line:1,utf8:'b1'},{path:'c.js',start_line:1,utf8:'c1'},
    {path:'d.js',start_line:1,utf8:'d1'},{path:'a.js',start_line:2,utf8:'a2'},{path:'e.js',start_line:1,utf8:'e1'},
    {path:'b.js',start_line:2,utf8:'b2'},{path:'e.js',start_line:2,utf8:'e2'}]);
  const input={task,...bound,events:[],generation:2,max_evidence:8,max_paths:4,max_handles_per_path:2};
  const x=await buildTaskStateProjection(input),paths=x.evidence.map(item=>item.path);
  assert.deepEqual(paths,['a.js','b.js','d.js','a.js','e.js','b.js','e.js']);
  assert.equal(new Set(paths).size,4);for(const path of new Set(paths))assert.ok(paths.filter(value=>value===path).length<=2);
  assert.equal(x.evidence_policy.posture,'observed-not-relevant');
  assert.equal(x.truncation.evicted_evidence,1);
  assert.equal((await verifyTaskStateProjection(x,input)).ok,true);
});
test('path balancing requires both positive bounds and leaves legacy selection unchanged when absent',async()=>{
  const input={task,...delivery(),events,generation:1};
  assert.equal((await buildTaskStateProjection(input)).evidence_policy,undefined);
  await assert.rejects(()=>buildTaskStateProjection({...input,max_paths:4}),/invalid-path-balance-policy/);
  await assert.rejects(()=>buildTaskStateProjection({...input,max_paths:0,max_handles_per_path:2}),/invalid-path-balance-policy/);
});
