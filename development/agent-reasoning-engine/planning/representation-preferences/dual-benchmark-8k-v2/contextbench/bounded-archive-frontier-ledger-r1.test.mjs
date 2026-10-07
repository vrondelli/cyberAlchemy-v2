import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {buildCoverageLedger,renderCoverageLedger} from './bounded-archive-frontier-ledger-r1.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function fixture(specs=[['a\nb\nc\nd\n',1,2],['a\nb\nc\nd\n',2,3]]){
 const snapshots=[],messages=[];for(const [i,[utf8,start,end]] of specs.entries()){
 const source_sha256=hash(utf8);snapshots.push({path:'source.txt',utf8,source_sha256});const id=`read-${i}`;
 messages.push({role:'assistant',content:'',tool_calls:[{id,type:'function',function:{name:'read_file',arguments:JSON.stringify({path:'source.txt',start_line:start,line_count:end-start+1})}}]},{role:'tool',tool_call_id:id,content:JSON.stringify({ok:true,output:{path:'source.txt',start_line:start,end_line:end,utf8:utf8.split('\n').slice(start-1,end).join('\n'),source_sha256}})});
 }
 const prompt=stable({messages,tools:[]}),profile={model:'glm-5.3-flash',output_cap:2048,reasoning_effort:'low'};
 return {snapshots,captures:[{prompt,prompt_sha256:hash(prompt)}],receipts:[{...profile,kind:'model',dispatched:true,status:200,input_tokens:100,output_tokens:10,request_sha256:hash(stable(bodyForReceipt(prompt,profile)))}]};
}
test('overlapping confirmed ranges merge and trailing newline does not invent source lines',()=>{
 const ledger=buildCoverageLedger(fixture());assert.equal(ledger.entries.length,1);assert.deepEqual(ledger.entries[0].seen_ranges,[[1,3]]);assert.deepEqual(ledger.entries[0].unseen_ranges,[[4,4]]);assert.equal(ledger.entries[0].total_lines,4);
});
test('archive-only, tokenizer-only, failed and unknown-usage requests never populate coverage',()=>{
 for(const patch of [{kind:'tokenizer'},{dispatched:false},{status:500},{input_tokens:null}]){const f=fixture();f.receipts[0]={...f.receipts[0],...patch};assert.equal(buildCoverageLedger(f).entries.length,0);}
 const f=fixture();f.receipts=[];assert.equal(buildCoverageLedger(f).entries.length,0);
});
test('replay does not duplicate observed coverage and source versions remain separate',()=>{
 const f=fixture([['a\nb\n',1,1],['x\nb\n',1,1]]);f.receipts.push({...f.receipts[0]});const ledger=buildCoverageLedger(f);assert.equal(ledger.entries.length,2);assert.ok(ledger.entries.every(e=>e.observation_ids.length===1));assert.notEqual(ledger.entries[0].source_sha256,ledger.entries[1].source_sha256);
});
test('missing snapshots, altered source and same-hash wrong visible bytes fail closed',()=>{
 const f=fixture();assert.throws(()=>buildCoverageLedger({...f,snapshots:[]}),/missing-source/);assert.throws(()=>buildCoverageLedger({...f,snapshots:[{...f.snapshots[0],utf8:'wrong'}]}),/source-digest/);
 const g=fixture();const p=JSON.parse(g.captures[0].prompt),o=JSON.parse(p.messages[1].content);o.output.utf8='wrong';p.messages[1].content=JSON.stringify(o);const prompt=stable(p);g.captures=[{prompt,prompt_sha256:hash(prompt)}];g.receipts[0].request_sha256=hash(stable(bodyForReceipt(prompt,g.receipts[0])));assert.throws(()=>buildCoverageLedger(g),/source-bytes/);
});
test('bounded rendering counts omission framing and never truncates an entry',async()=>{
 const ledger=buildCoverageLedger(fixture([['a\nb\n',1,1],['x\nb\n',1,1]])),measure_tokens=async s=>s.length;
 const all=await renderCoverageLedger({ledger,measure_tokens,maximum_tokens:10000});assert.equal(all.omitted_entries,0);
 const small=await renderCoverageLedger({ledger,measure_tokens,maximum_tokens:all.tokens-1});assert.equal(small.included_entries,1);assert.equal(JSON.parse(small.text).omitted_entries,1);assert.ok(small.tokens<=all.tokens-1);
 await assert.rejects(renderCoverageLedger({ledger,measure_tokens,maximum_tokens:1}),/framing-over-budget/);
});
function revisedFixture(revisions){
 const f=fixture(),p=JSON.parse(f.captures[0].prompt);
 for(let i=0;i<revisions.length;i++){
  const call=p.messages[2*i].tool_calls[0],args=JSON.parse(call.function.arguments);args.revision=revisions[i];call.function.arguments=JSON.stringify(args);
  const result=JSON.parse(p.messages[2*i+1].content);Object.assign(result.output,{source_revision:revisions[i],total_lines:4,base_commit:'a'.repeat(40)});p.messages[2*i+1].content=JSON.stringify(result);
 }
 const prompt=stable(p);f.captures=[{prompt,prompt_sha256:hash(prompt)}];f.receipts[0].request_sha256=hash(stable(bodyForReceipt(prompt,f.receipts[0])));return f;
}
test('identical source bytes read as base and current retain distinct confirmed revision labels',()=>{
 const ledger=buildCoverageLedger(revisedFixture(['base','current']));assert.equal(ledger.entries.length,2);assert.deepEqual(ledger.entries.map(e=>e.source_revision).sort(),['base','current']);assert.equal(ledger.entries[0].source_sha256,ledger.entries[1].source_sha256);assert.match(ledger.entries.find(e=>e.source_revision==='current').revision_status,/read time/);
});
test('confirmed metadata cannot invent source extent or disagree with requested revision',()=>{
 for(const patch of [{total_lines:1000},{source_revision:'current'}]){
  const f=revisedFixture(['base','base']),p=JSON.parse(f.captures[0].prompt),output=JSON.parse(p.messages[1].content);Object.assign(output.output,patch);p.messages[1].content=JSON.stringify(output);const prompt=stable(p);f.captures=[{prompt,prompt_sha256:hash(prompt)}];f.receipts[0].request_sha256=hash(stable(bodyForReceipt(prompt,f.receipts[0])));
  assert.throws(()=>buildCoverageLedger(f),/source-extent-mismatch|revision-arguments/);
 }
});
test('compact archived recovery inherits its origin-bound revision without inventing a request argument',()=>{
 const f=revisedFixture(['base','base']),p=JSON.parse(f.captures[0].prompt),call=p.messages[0].tool_calls[0];
 const archive_sha256='b'.repeat(64),observation_index=0;
 call.function.name='recover_archived_read';
 call.function.arguments=JSON.stringify({archive_sha256,observation_index});
 const output=JSON.parse(p.messages[1].content);
 output.archive_origin={archive_sha256,observation_index};
 p.messages[1].content=JSON.stringify(output);
 const prompt=stable(p);f.captures=[{prompt,prompt_sha256:hash(prompt)}];
 f.receipts[0].request_sha256=hash(stable(bodyForReceipt(prompt,f.receipts[0])));
 const ledger=buildCoverageLedger(f);
 assert.equal(ledger.entries.length,1);
 assert.equal(ledger.entries[0].source_revision,'base');
 const full=JSON.parse(prompt),fullCall=full.messages[0].tool_calls[0];
 fullCall.function.arguments=JSON.stringify({archive_sha256,observation_index,path:'source.txt',revision:'current',start_line:1,line_count:2});
 const mismatched=stable(full),bad={...f,captures:[{prompt:mismatched,prompt_sha256:hash(mismatched)}],receipts:[{...f.receipts[0],request_sha256:hash(stable(bodyForReceipt(mismatched,f.receipts[0])))}]};
 assert.throws(()=>buildCoverageLedger(bad),/recovery\.arguments-output-mismatch|unmapped-delivery|revision-arguments/);
});
