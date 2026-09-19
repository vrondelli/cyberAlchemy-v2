import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {H72,EXPANDED,buildTerminalEvidence,buildTerminalEvidenceFromCaptures,projectDeliveredEvidence,diagnoseTerminalEvidence,selectTerminalEvidenceSubmission,exportTerminalEvidenceSelection} from './measured-terminal-catalog-packet-r1.mjs';
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


test('96 confirmed observations survive full receipt-bound native export',async()=>{
 const f=fixture(Array.from({length:96},(_,i)=>({path:'f'+i+'.js',base:'const value = '+i+';\n'})));
 try{
  const packet=await build(f,{version:EXPANDED});assert.equal(packet.private.bindings.length,96);assert.equal(packet.fit.omitted_eligible,0);
  const input=terminal(f,packet),selected=selectTerminalEvidenceSubmission(input);assert.equal(selected.final_read_ids.length,96);
  const exported=exportTerminalEvidenceSelection({...input,source_snapshots:f.snapshots,task:{instance_id:'fixture',repo_url:'https://example.invalid/source.git',base_commit:'a'.repeat(40)}},f.repoRoot);
  assert.equal(exported.prediction.traj_data.pred_files.length,96);
  assert.equal(diagnoseTerminalEvidence(stable({summary:'x',context_handles:['h95','h95']}),packet).ok,false);
  assert.equal(diagnoseTerminalEvidence(stable({summary:'x',context_handles:['h96']}),packet).ok,false);
  const forged=structuredClone(packet);forged.private.bindings[0].read_id='f'.repeat(64);
  assert.throws(()=>diagnoseTerminalEvidence(stable({summary:'x',context_handles:['h0']}),forged),/presentation-integrity/);
 }finally{f.clean();}
});
test('fixed prefix probes handle nonmonotonic measurements without assuming optimal fit',async()=>{
 const f=fixture(Array.from({length:128},(_,i)=>({path:'f'+i+'.js',base:'x\n'})));
 try{
  const sizes=[];const packet=await build(f,{version:EXPANDED,measure_tokens:async text=>{
   const n=Number(text.match(/Showing (\d+)/)[1]);sizes.push(n);return n===64?100:3000;
  }});
  assert.deepEqual(sizes,[128,96,64]);assert.equal(packet.fit.rendered_handles,64);assert.equal(packet.fit.omitted_eligible,64);
 }finally{f.clean();}
});
test('all text probes oversized stops after eleven and returns no ready packet',async()=>{
 const f=fixture(Array.from({length:128},(_,i)=>({path:'f'+i+'.js',base:'x\n'})));
 try{
  let calls=0;const packet=await build(f,{version:EXPANDED,measure_tokens:async()=>{calls++;return 3000;}});
  assert.equal(calls,11);assert.equal(packet.status,'budget-or-page-empty');assert.equal(packet.model,null);assert.equal(packet.fit.omitted_eligible,128);
 }finally{f.clean();}
});
test('caller cannot expand the frozen handle, text-token or byte bounds',async()=>{
 const f=four();try{
  for(const options of [{max_handles:129},{max_state_tokens:2049},{max_state_bytes:8193}])
   await assert.rejects(build(f,{version:EXPANDED,...options}),/invalid-policy/);
 }finally{f.clean();}
});
