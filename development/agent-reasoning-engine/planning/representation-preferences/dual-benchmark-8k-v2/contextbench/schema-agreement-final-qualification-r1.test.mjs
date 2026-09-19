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



import http from 'node:http';
import {qualifyCatalogFinalRequest} from './schema-agreement-final-qualification-r1.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {fixture as rankedFixture} from './ranked-read-test-fixture-r1.mjs';
import {createRankedReadEvidenceRecord} from './ranked-read-evidence-r1.mjs';
async function rankedFinalFixture(){
 const f=await rankedFixture(),e=f.ranked_evidence.get(f.call.id),repoRoot=mkdtempSync(join(tmpdir(),'ranked-final-evidence-'));
 writeFileSync(join(repoRoot,'source.txt'),e.sources.get('source.txt'));
 return {repoRoot,captures:f.captures,receipts:f.receipts,snapshots:[{path:'source.txt',source_sha256:e.expected.files.get('source.txt'),utf8:e.sources.get('source.txt')}],records:[createRankedReadEvidenceRecord(e)],ranked_context:e,clean:()=>rmSync(repoRoot,{recursive:true,force:true})};
}
for(const [tokens,injected,ranked] of [[5438,null,false],[5439,null,false],[5438,'model',false],[5439,'model',false],[5438,'tokenizer',false],[5438,null,true]])test('actual final envelope '+(tokens+512+2048)+' injected='+injected+' ranked='+ranked+' uses native strict limit and cached measurement',async()=>{
 const f=ranked?await rankedFinalFixture():fixture(Array.from({length:96},(_,i)=>({path:'f'+i+'.js',base:'x\n'})));
 const storageRoot=mkdtempSync(join(tmpdir(),'catalog-envelope-store-'));
 let tokenizerCalls=0,modelCalls=0,driver;const payloads=[];
 const server=http.createServer(async(req,res)=>{
  let body='';for await(const b of req)body+=b;
  if(req.url==='/tokenizer'){tokenizerCalls++;payloads.push(JSON.parse(body));res.setHeader('content-type','application/json');res.end(JSON.stringify({usage:{prompt_tokens:tokens}}));}
  else{modelCalls++;res.statusCode=500;res.end('{}');}
 });
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const endpoint='http://127.0.0.1:'+server.address().port;
  const guard=createStageOutputGuard({root:storageRoot}),persistence=createStagePersistence({stage_root:storageRoot,stage_guard:guard});
  const signal=new AbortController().signal;
  const client=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'contextbench-budget-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:30000,signal,persistence,before_dispatch:async()=>true});
  const task={instance_id:'fixture',problem_statement:'Investigate fixture'};
  const cell={instance_id:'fixture',cell_id:'fixture-final',comparison_arm:'schema-agreement',context_limit:8000,limits:{output_cap:2048,total_tokens:96000,maximum_calls:96},provider_profile:{token_margin:512,reasoning_effort:'low'}};

  const args={task,cell,branch_inputs:{branches:[{branch_id:'q1',receipt_indices:[0],captures:f.captures,ranked_evidence_records:f.records??[]}],receipts:f.receipts,ranked_context:f.ranked_context},snapshots:f.snapshots,repoRoot:f.repoRoot,out:storageRoot,persistence,signal,create_client:async()=>({...client,index_receipts:injected?[{kind:injected,dispatched:true,status:200,automatic_retries:0,input_tokens:1,output_tokens:1}]:[]}),measure_index_tokens:async text=>measured(text),before_measure:async()=>true};
  if(injected){
   await assert.rejects(qualifyCatalogFinalRequest(args),error=>{
    assert.equal(error.result.qualified,false);assert.equal(error.result.model_calls,injected==='model'?1:0);
    assert.equal(error.result.index_receipts[0].kind,injected);
    assert.match(error.message,tokens===5439?/fresh-context-too-large/:injected==='model'?/tokenizer-only/:/receipt-family-kind/);return true;
   });
  }else if(tokens===5438){
   const report=await qualifyCatalogFinalRequest(args);
   assert.equal(report.qualified,true);assert.equal(report.projected_tokens,7998);assert.equal(report.packet.fit.rendered_handles,ranked?1:96);assert.equal(report.model_calls,0);
   assert.equal(report.index_measurements,1);
  }else await assert.rejects(qualifyCatalogFinalRequest(args),error=>{
   assert.match(error.message,/fresh-context-too-large/);assert.equal(error.result.qualified,false);assert.equal(error.result.model_calls,0);assert.equal(error.result.receipts.length,1);return true;
  });
  assert.equal(modelCalls,0);assert.equal(tokenizerCalls,1,'identical re-render must reuse actual tokenizer receipt');
  assert.equal(client.receipts.filter(r=>r.kind==='model').length,0);
  assert.equal(client.receipts.filter(r=>r.kind==='tokenizer').length,1);
  assert.ok(JSON.stringify(payloads[0]).includes(ranked?'h0':'h95'));
  assert.ok(JSON.stringify(payloads[0]).includes('submit_context_handles_v3'));
 }finally{
  if(driver)await driver.close();
  server.closeAllConnections();await new Promise(r=>server.close(r));f.clean();rmSync(storageRoot,{recursive:true,force:true});
 }
});
