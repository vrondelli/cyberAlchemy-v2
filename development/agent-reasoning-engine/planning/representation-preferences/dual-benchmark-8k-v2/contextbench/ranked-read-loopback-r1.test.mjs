// Real production transport/storage, local HTTP provider only.
// Open questions: RANKED-READ-PROJECTION-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
import {runComparisonArm} from './ranked-read-arm-r1.mjs';
import {reconstructRankedReadPrediction} from './ranked-read-prediction-r1.mjs';
import {createGlmClient} from './packet-diversity-v1/transport-admission-v5.mjs';
import {createIndexTokenizer} from './packet-diversity-v1/live-client-admission-v5.mjs';
import {createStageOutputGuard} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function run(t,{unknown=false,mixed=false}={}){
 const root=mkdtempSync(join(tmpdir(),'ranked-loopback-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const cache=join(root,'cache'),evidence_root=join(root,'evidence');mkdirSync(cache);mkdirSync(evidence_root);
 const git=(...a)=>execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...a],{cwd:cache,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q');writeFileSync(join(cache,'a.py'),'needle = 1\n');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture');git('remote','add','origin','https://example.invalid/repo.git');const base_commit=git('rev-parse','HEAD');
 const task={instance_id:'fixture-0',original_inst_id:'fixture-0',repo:'fixture',repo_url:'https://example.invalid/repo.git',language:'python',base_commit,problem_statement:'Inspect needle behavior.',source:'fixture'};
 const task_path=join(root,'task.json');writeFileSync(task_path,stable(task));
 const template=JSON.parse(readFileSync(new URL('./discovery-v1/live-config.json',import.meta.url))).tasks[0].cell_template;
 const config={model:'glm-5.3-flash',context_limit:8000,total_tokens_per_arm:96000,credential_path:'unused',python:'unused',scorer:'unused',upstream:'unused',source_manifest:'unused',scoring_cache:'unused',tasks:[{id:'task0',instance_id:task.instance_id,task_path,task_sha256:hash(readFileSync(task_path)),repository_cache:cache,base_commit,cell_template:{...structuredClone(template),instance_id:task.instance_id}}]};
 let calls=0;const requests=[];
 const server=http.createServer(async(req,res)=>{
  let body='';for await(const b of req)body+=b;res.setHeader('content-type','application/json');
  if(req.url==='/tokenizer'){res.end(JSON.stringify({usage:{prompt_tokens:Math.ceil(Buffer.byteLength(body)/4)}}));return;}
  const wire=JSON.parse(body);requests.push(wire);const n=calls++;
  if(unknown){req.socket.destroy();return;}
  const final=wire.tools.find(t=>t.function.name==='submit_context_handles_v3');
  const [name,args]=final?[final.function.name,{summary:'Fixture evidence only',context_handles:final.function.parameters.properties.context_handles.items.enum}]:n===0?['search',{mode:'ranked',query:'needle',revision:'base',path_prefix:'',offset:0,limit:5}]:['finish_issue_attempt',{}];
  const tool_calls=[{id:'call-'+n,type:'function',function:{name,arguments:stable(args)}}];if(mixed&&n===0)tool_calls.push({id:'literal-'+n,type:'function',function:{name:'search',arguments:stable({...args,mode:'literal'})}});
  res.end(JSON.stringify({model:'glm-5.3-flash',choices:[{message:{role:'assistant',content:null,tool_calls},finish_reason:'tool_calls'}],usage:{prompt_tokens:Math.ceil(Buffer.byteLength(stable({model:wire.model,messages:wire.messages,tools:wire.tools}))/4),completion_tokens:20}}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const endpoint='http://127.0.0.1:'+server.address().port;
 const signal=new AbortController().signal,guard=createStageOutputGuard({root:evidence_root}),persistence=createStagePersistence({stage_root:evidence_root,stage_guard:guard});
 const create_client=({cell,record_event})=>{
  const native=createGlmClient({chat_endpoint:endpoint+'/chat/completions',tokenizer_endpoint:endpoint+'/tokenizer',maximum_requests:96,maximum_output_tokens:2048,maximum_model_retries:0,maximum_tokenizer_transport_attempts:1,request_budget:'contextbench-budget-v1',maximum_request_bytes:262144,token_margin:512,reasoning_effort:'low',model_timeout_ms:30000,signal,persistence,before_dispatch:async()=>true});
  const index=createIndexTokenizer({registry:{consume:async({consumer})=>consumer(Buffer.from('fixture'))},reference:{},maximum_calls:512,signal,record:r=>record_event({kind:'index-tokenizer',receipt:r}),post:async()=>({status:200,payload:{usage:{prompt_tokens:100}},bytes:10})});
  return {...native,index_receipts:index.receipts,measure_index:index.measure};
 };
 const out=join(evidence_root,'run'),source_out=join(root,'source');let result,error;
 try{result=await runComparisonArm({config,task_id:'task0',arm:'ranked-read-acquisition',create_client,signal,out,source_out,evidence_root,persistence,admit_source:async()=>true,measure_index_tokens:(text,client)=>client.measure_index(text)});}catch(e){error=e;result=e.result;}
 if(!existsSync(join(out,'result.json')))throw error??Error('missing result');
 const saved=JSON.parse(readFileSync(join(out,'result.json'))),events=readFileSync(join(out,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse),snapshots=readdirSync(join(out,'snapshots')).map(n=>JSON.parse(readFileSync(join(out,'snapshots',n)))),source_index=JSON.parse(readFileSync(join(out,'source-index.json')));
 return {result,error,saved,events,requests,calls,guard:guard.snapshot(),reconstruct:()=>reconstructRankedReadPrediction({arm:'ranked-read-acquisition',result:saved,events,snapshots,source_index,task,repoRoot:join(source_out,'base')})};
}
test('actual transport persists ranked evidence and reconstructs native export',async t=>{
 const f=await run(t);assert.equal(f.result.status,'final_context_selected',f.error?.message??f.result.error);assert.equal(f.calls,3);assert.equal(f.reconstruct().reconstructed,true);assert.deepEqual(f.saved.native_export.prediction.traj_data.pred_files,['a.py']);
 const models=f.saved.receipts.filter(r=>r.kind==='model'&&r.dispatched);assert.equal(models.length,3);assert.ok(models.every(r=>r.status===200&&r.reserved_input_tokens+r.output_cap<7999));assert.equal(f.guard.pending_writes,0);assert.equal(f.guard.poisoned,false);assert.ok(f.events.some(e=>e.kind==='ranked-read-evidence'));assert.ok(f.requests[0].tools.find(t=>t.function.name==='search').function.parameters.properties.mode);
});
test('unknown HTTP outcome retains accounting and never retries',async t=>{
 const f=await run(t,{unknown:true});assert.equal(f.calls,1);assert.notEqual(f.saved.status,'final_context_selected');assert.equal(f.saved.native_export,null);assert.ok(f.saved.phase_state.unknown_calls>0);assert.ok(f.saved.phase_state.conservative_total_tokens>f.saved.phase_state.known_tokens);assert.ok(f.saved.receipts.some(r=>r.kind==='model'&&r.dispatched&&r.status!==200));assert.equal(f.guard.pending_writes,0);
});

test('mixed ranked and literal tool batch keeps separate confirmed identities',async t=>{
 const f=await run(t,{mixed:true});assert.equal(f.saved.status,'final_context_selected',f.saved.error);assert.equal(f.reconstruct().reconstructed,true);const joined=f.events.find(e=>e.kind==='terminal-packet').joined;assert.equal(joined.read_observations.length,2);assert.equal(joined.branch_bindings[0].receipt_confirmed_ranked_read_ids.length,1);assert.equal(f.calls,3);
});
