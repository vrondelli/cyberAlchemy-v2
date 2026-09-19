import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {H72,EXPANDED,buildTerminalEvidence,buildTerminalEvidenceFromCaptures,projectDeliveredEvidence,diagnoseTerminalEvidence,selectTerminalEvidenceSubmission,exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {attachObservationHandles,bindDelivery,bodyForReceipt,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {terminalHandleTool,diagnoseTerminalHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handles-v1.mjs';
import {capturePublicResponse} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const measured=async text=>Math.ceil(Buffer.byteLength(text)/4); // Fixture only; not a scientific tokenizer.
function fixture(rows){
  const repoRoot=mkdtempSync(join(tmpdir(),'terminal-evidence-v2-')),messages=[],snapshots=[];
  for(const[rowIndex,row]of rows.entries()){
    const path=join(repoRoot,row.path);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,row.base);
    const source=row.current??row.base,start=row.start??1,end=row.end??source.trimEnd().split('\n').length,body=source.split('\n').slice(start-1,end).join('\n');
    snapshots.push({path:row.path,source_sha256:hash(source),utf8:source});
    const call={id:'read-'+rowIndex,type:'function',function:{name:'read_file',arguments:stable({path:row.path,start_line:start,line_count:end-start+1,revision:row.current?'current':'base'})}};
    const output=attachObservationHandles(call,{ok:true,output:{path:row.path,start_line:start,end_line:end,utf8:body,source_sha256:hash(source),source_revision:row.current?'current':'base'}});
    messages.push({role:'assistant',content:'',tool_calls:[call]},{role:'tool',tool_call_id:call.id,content:stable(output)});
  }
  const prompt=stable({messages,tools:[]}),receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:2048,finish_reason:'tool_calls',input_tokens:100,output_tokens:20};
  receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
  const captures=[{prompt,prompt_sha256:hash(prompt)}],receipts=[receipt],reads=bindDelivery({captures,receipts}).read_observations;
  return {repoRoot,snapshots,captures,receipts,reads,clean:()=>rmSync(repoRoot,{recursive:true,force:true})};
}
const four=()=>fixture(['alpha','beta','gamma','delta'].map(n=>({path:n+'.js',base:'function '+n+'() {}\n'})));
async function build(f,options={}){return buildTerminalEvidence({...f,measure_tokens:measured,...options});}
function terminal(f,packet,handles=packet.private.bindings.map(b=>b.handle)){
  // Simulate recycling: the terminal wire includes no old source or full IDs.
  const prompt=stable({messages:[{role:'system',content:'Select source context.'},{role:'user',content:packet.model.text}],tools:[packet.model.tool]});
  const receipt={kind:'model',dispatched:true,status:200,model:'glm-5.3-flash',reasoning_effort:'low',output_cap:2048,finish_reason:'tool_calls',input_tokens:120,output_tokens:30};
  receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
  const message={role:'assistant',content:'',tool_calls:[{id:'terminal-1',type:'function',function:{name:packet.model.tool.function.name,arguments:stable({summary:'Chosen delivered source.',context_handles:handles})}}]};
  const response_capture=capturePublicResponse({final_bytes:stable({message,finish_reason:'tool_calls'}),receipt},f.receipts.length);
  return {packet,captures:[...f.captures,{prompt,prompt_sha256:hash(prompt)}],receipts:[...f.receipts,receipt],response_capture,snapshots:f.snapshots,repoRoot:f.repoRoot};
}

test('default uses exact H72 tool schema, private IDs and deterministic handles with explicit omissions',async()=>{
  const f=four();try{
    const packet=await build(f),again=await build(f,{reads:[...f.reads].reverse()});
    assert.equal(packet.version,H72);assert.equal(packet.status,'ready');assert.equal(packet.private.bindings.length,3);assert.equal(packet.fit.omitted_eligible,1);
    assert.deepEqual(packet.model.tool,terminalHandleTool(packet.private.bindings));assert.deepEqual(packet,again);
    for(const read of f.reads)assert.equal(stable(packet.model).includes(read.id),false);
    await assert.rejects(build(f,{version:H72,max_handles:4}),/invalid-policy/);
  }finally{f.clean();}
});

test('expanded schema preserves fourth valid source through receipt-bound acceptance and native export',async()=>{
  const f=four();try{
    const packet=await build(f,{version:EXPANDED,max_handles:4}),input=terminal(f,packet);
    assert.equal(packet.private.bindings.length,4);assert.equal(packet.fit.omitted_eligible,0);
    assert.equal(diagnoseTerminalHandles(stable({summary:'x',context_handles:['h3']}),packet.private.bindings).ok,false,'legacy native H72 cannot accept this expanded binding');
    const selected=selectTerminalEvidenceSubmission(input);assert.equal(selected.final_read_ids.length,4);
    const exported=exportTerminalEvidenceSelection({...input,source_snapshots:f.snapshots,task:{instance_id:'fixture',repo_url:'https://example.invalid/source.git',base_commit:'a'.repeat(40)}},f.repoRoot);
    assert.deepEqual(exported.prediction.traj_data.pred_files,['alpha.js','beta.js','delta.js','gamma.js']);
    for(const read of f.reads)assert.ok(selected.final_read_ids.includes(read.id));
  }finally{f.clean();}
});

test('whole edited reads are excluded; unchanged shifted reads preserve original IDs and exact base spans',async()=>{
  const f=fixture([{path:'edit.js',base:'alpha\nbeta\ngamma\n',current:'alpha\nCHANGED\ngamma\n',start:1,end:3},{path:'shift.js',base:'alpha\nbeta\ngamma\n',current:'INSERTED\nalpha\nbeta\ngamma\n',start:2,end:3}]);
  try{
    const p=projectDeliveredEvidence(f);assert.equal(p.excluded.length,1);assert.equal(p.excluded[0].reason,'changed-source-lines');assert.deepEqual(p.excluded[0].unmapped_current_lines,[2]);
    assert.equal(p.eligible.length,1);assert.equal(p.eligible[0].read_id,f.reads[1].id);assert.deepEqual(p.eligible[0].base_spans,[{start_line:1,end_line:2}]);
    const packet=await build(f);assert.match(packet.model.text,/shift\.js@base:1-2/);assert.equal(packet.private.bindings[0].start_line,2);
    assert.deepEqual(selectTerminalEvidenceSubmission(terminal(f,packet)).final_read_ids,[f.reads[1].id]);
  }finally{f.clean();}
});

test('full confirmed archive restores valid handles after visible-history recycling',async()=>{
  const f=four();try{
    const packet=await buildTerminalEvidenceFromCaptures({...f,measure_tokens:measured}),input=terminal(f,packet,['h1']);
    const last=JSON.parse(input.captures.at(-1).prompt);assert.equal(last.messages.some(m=>m.role==='tool'),false);
    const selected=selectTerminalEvidenceSubmission(input);assert.deepEqual(selected.final_read_ids,[packet.private.bindings[1].read_id]);
    const tokenizedOnly=await buildTerminalEvidenceFromCaptures({...f,receipts:[],measure_tokens:measured});assert.equal(tokenizedOnly.status,'no-eligible-evidence');assert.equal(tokenizedOnly.model,null);
  }finally{f.clean();}
});

test('identity and source-integrity failures are not silently treated as ineligible evidence',async()=>{
  const f=four();try{
    await assert.rejects(build(f,{reads:[{...f.reads[0],id:'f'.repeat(64)}]}),/read-identity-mismatch/);
    await assert.rejects(build(f,{reads:[{...f.reads[0],confirmed_receipts:[]}]}),/unconfirmed-read/);
    const bad={...f.reads[0],body:'different bytes'};bad.id=hash(stable({tool_call_id:bad.tool_call_id,path:bad.path,start_line:bad.start_line,end_line:bad.end_line,body:bad.body,source_sha256:bad.source_sha256}));
    await assert.rejects(build(f,{reads:[bad]}),/source-map.body-mismatch/);
  }finally{f.clean();}
});

test('both schema versions reject malformed envelopes, duplicates, unknown handles, extra fields and missing summary',async()=>{
  const f=four();try{
    for(const version of [H72,EXPANDED]){
      const packet=await build(f,{version});
      for(const raw of ['```json\n{}\n```',stable({summary:3,context_handles:['h0','h0','h99'],extra:true}),stable({context_handles:['h0']}),stable({summary:'x',context_handles:['h99']}),stable({summary:'x',context_handles:'h0'})])assert.equal(diagnoseTerminalEvidence(raw,packet).ok,false);
      assert.equal(diagnoseTerminalEvidence(stable({summary:'No useful source.',context_handles:[]}),packet).ok,true,'schema validity is not nonempty completion');
    }
  }finally{f.clean();}
});

test('packet mutation, cross-page handle reuse, and changed base after construction fail closed',async()=>{
  const f=four();try{
    const packet=await build(f,{version:EXPANDED,max_handles:2}),input=terminal(f,packet);
    const changed=structuredClone(packet);changed.private.bindings[0].read_id=f.reads[3].id;
    assert.throws(()=>selectTerminalEvidenceSubmission({...input,packet:changed}),/presentation-integrity/);
    const page2=await build(f,{version:EXPANDED,max_handles:2,offset:2});assert.throws(()=>selectTerminalEvidenceSubmission({...input,packet:page2}),/presentation-not-in-terminal-request/);
    writeFileSync(join(f.repoRoot,packet.private.bindings[0].path),'mutated base\n');assert.throws(()=>selectTerminalEvidenceSubmission(input),/private-source-projection-drift/);
  }finally{f.clean();}
});

test('state budget failure and empty candidates retain explicit archive counts, never fabricate a selectable handle',async()=>{
  const f=four();try{
    const packet=await build(f,{version:EXPANDED,max_state_tokens:1,measure_tokens:async()=>99});
    assert.equal(packet.status,'budget-or-page-empty');assert.equal(packet.model,null);assert.equal(packet.private.eligible_read_ids.length,4);assert.equal(packet.fit.omitted_eligible,4);
    assert.equal(packet.private.bindings.length,0);assert.equal(packet.fit.next_offset,0);
    await assert.rejects(build(f,{measure_tokens:async()=>NaN}),/invalid-tokenizer-result/);
  }finally{f.clean();}
});
