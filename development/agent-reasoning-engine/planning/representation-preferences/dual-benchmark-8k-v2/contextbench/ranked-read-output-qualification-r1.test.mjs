import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import http from 'node:http';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {fixture as rankedFixture} from './ranked-read-test-fixture-r1.mjs';
import {createRankedReadEvidenceRecord} from './ranked-read-evidence-r1.mjs';
async function rankedFinalFixture(){
 const f=await rankedFixture(),e=f.ranked_evidence.get(f.call.id),repoRoot=mkdtempSync(join(tmpdir(),'ranked-final-evidence-'));
 writeFileSync(join(repoRoot,'source.txt'),e.sources.get('source.txt'));
 return {evidence:e,repoRoot,captures:f.captures,receipts:f.receipts,snapshots:[{path:'source.txt',source_sha256:e.expected.files.get('source.txt'),utf8:e.sources.get('source.txt')}],records:[createRankedReadEvidenceRecord(e)],ranked_context:e,clean:()=>rmSync(repoRoot,{recursive:true,force:true})};
}
import {qualifyRankedOutputRequest} from './ranked-read-output-qualification-r1.mjs';
import {rankedReadTool} from './ranked-read-acquisition-tool-r2.mjs';
for(const scenario of [
 {name:'ordinary',tokens:100},
 {name:'native 7998 accepted',tokens:5438},
 {name:'native 7999 rejected',tokens:5439,reject:true},
 {name:'all source deferred',tokens:100,defer:true},
 {name:'model receipt in index family rejected',tokens:100,inject:true,reject:true},
])test('scripted ranked output qualification: '+scenario.name,async()=>{
 const {tokens}=scenario;
 const f=await rankedFinalFixture(),out=mkdtempSync(join(tmpdir(),'ranked-output-qual-'));let models=0,tokenizers=0;
 const server=http.createServer(async(req,res)=>{for await(const part of req){}res.setHeader('content-type','application/json');if(req.url==='/tokenizer'){tokenizers++;res.end(JSON.stringify({usage:{prompt_tokens:scenario.defer&&tokenizers===1?5439:tokens}}));}else{models++;res.statusCode=500;res.end('{}');}});
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const endpoint='http://127.0.0.1:'+server.address().port;
  const guard=createStageOutputGuard({root:out}),persistence=createStagePersistence({stage_root:out,stage_guard:guard}),signal=new AbortController().signal;
  const client=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'contextbench-budget-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:30000,signal,persistence,before_dispatch:async()=>true});
  const task={instance_id:'fixture',problem_statement:'Investigate fixture'},cell={instance_id:'fixture',cell_id:'fixture-output',comparison_arm:'ranked-read-acquisition',context_limit:8000,limits:{output_cap:2048,total_tokens:96000,maximum_calls:96},provider_profile:{token_margin:512,reasoning_effort:'low'}};
  const args={task,cell,initial_wire:{messages:[{role:'system',content:'Acquire source.'},{role:'user',content:task.problem_statement}],tools:[rankedReadTool]},evidence:f.evidence,repoRoot:f.repoRoot,out,persistence,signal,create_client:async()=>({...client,index_receipts:scenario.inject?[{kind:'model',dispatched:true}]:[]}),before_measure:async()=>true};
  if(scenario.reject)await assert.rejects(qualifyRankedOutputRequest(args),e=>{assert.equal(e.result.qualified,false);assert.equal(e.result.model_calls,scenario.inject?1:0);return true;});
  else{const r=await qualifyRankedOutputRequest(args);assert.equal(r.qualified,true);assert.equal(r.source_output_visible,!scenario.defer);assert.equal(r.returned_windows,scenario.defer?0:1);assert.equal(r.projected_tokens,tokens+2560);assert.equal(r.model_calls,0);assert.equal(r.live_generation_admitted,false);}
  assert.equal(models,0);assert.ok(tokenizers>=1&&tokenizers<=4);assert.equal(guard.snapshot().pending_writes,0);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));f.clean();rmSync(out,{recursive:true,force:true});}
});
