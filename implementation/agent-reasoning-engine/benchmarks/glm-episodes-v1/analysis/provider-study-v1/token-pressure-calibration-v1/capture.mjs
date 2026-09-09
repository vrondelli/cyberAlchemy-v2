// Local scripted transport only. Open questions: README.md.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createGlmClient,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {runGlmAgent as baselineAgent} from '../source-instruction-v1/candidate-agent.mjs';
import {runGlmAgent as admissionAgent} from '../admission-before-masking-v1/candidate-agent.mjs';
import {createAdapter} from '../source-instruction-v1/adapter.mjs';
import {captureAdapter} from '../source-instruction-v1/prompt-capture.mjs';
import {completionBudget} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs';
import {createReadOnlyToolRuntime} from '../../../../../packages/coding-agent-runtime/read-only-tools.mjs';
import {snapshotTree} from '../../../../../packages/coding-agent-runtime/verifier.mjs';
export const sha=x=>createHash('sha256').update(x).digest('hex');
const source='export function routeCode() { return "UNKNOWN"; }\n';
const request='Inspect all allowlisted documents in order. Implement routeCode using the highest numbered revision of the route code. Later revisions supersede earlier ones. Preserve unrelated behavior.';
const control=body=>body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
export function visibleFacts(body){return [...JSON.stringify(body.messages).matchAll(/Revision (\d+): (route|region) = ([A-Z_0-9]+)\./g)].map(m=>({revision:Number(m[1]),key:m[2],value:m[3]}));}
export function answerFromContext(body){const facts=visibleFacts(body),latest=key=>facts.filter(f=>f.key===key).sort((a,b)=>b.revision-a.revision)[0]?.value??'UNKNOWN';return latest('route')+'/'+latest('region');}
export async function runProbe(soft,pressure,revised,neutralCount=3,arm='baseline',strategy='latest'){
 const task=JSON.parse(readFileSync(new URL(`../multifact-pressure-v1/prepared/fixtures/w${soft}-r1-${neutralCount===0?'visible':'delayed'}/task.json`,import.meta.url))); revised=task.expected; const request=task.request;
 const directory=mkdtempSync(join(tmpdir(),'are-fact65-')),root=join(directory,'fixture');mkdirSync(root);
 const fixtures=Object.fromEntries(task.paths.map(path=>[path,readFileSync(new URL(`../multifact-pressure-v1/prepared/fixtures/${task.id}/${path}`,import.meta.url),'utf8')]));
 const source=fixtures['subject.mjs'];
 for(const [path,bytes] of Object.entries(fixtures))writeFileSync(join(root,path),bytes);
 const paths=Object.keys(fixtures),base=snapshotTree(root),captures=[];let ordinal=0,serverError,answer;
 const server=createServer(async(req,res)=>{try{
  const chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks).toString('utf8'),body=JSON.parse(raw),tokenizer=req.url==='/tokenizer';
  assert.ok(tokenizer||req.url==='/chat/completions');captures.push({kind:tokenizer?'tokenizer':'model',raw,sha256:sha(raw),generation:control(body)?.generation});let response;
  if(tokenizer)response={usage:{prompt_tokens:pressure&&ordinal>=6&&control(body)?.generation===0?soft-1000:100}};
  else{
   if(control(body)?.generation>0){response={model:MODEL,choices:[{message:{role:'assistant',content:'Calibration capture complete.'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:10}};res.setHeader('content-type','application/json');res.end(JSON.stringify(response));return;}
   ordinal++;const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));let call;
   if(action){const hint=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);call={id:'read'+ordinal,type:'function',function:{name:hint.name,arguments:JSON.stringify(hint.arguments)}};}
   else if(body.tools?.some(t=>t.function.name==='submit_patch_candidate')){
    const canRecover=body.tools.some(t=>t.function.name==='read-inspection-evidence'),facts=visibleFacts(body),highest=Math.max(0,...facts.map(f=>f.revision));
    const failedRecovery=body.messages.some(m=>{try{const o=JSON.parse(m.content);return m.role==='tool'&&o.ok===false;}catch{return false;}});
    if(failedRecovery){response={model:MODEL,choices:[{message:{role:'assistant',content:'Required archived evidence could not be recovered; no supported repair can be submitted.'},finish_reason:'stop'}],usage:{prompt_tokens:100,completion_tokens:20}};res.setHeader('content-type','application/json');res.end(JSON.stringify(response));return;}
    if(highest<2&&canRecover){
     const ref=control(body).archive_sources.find(x=>x.path===task.revision_path).call_id;
     call={id:'recover'+ordinal,type:'function',function:{name:'read-inspection-evidence',arguments:JSON.stringify({call_id:ref})}};
    }else{answer=answerFromContext(body);call={id:'submit'+ordinal,type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'subject.mjs',expected_file_sha256:base.files['subject.mjs'],utf8:source.replace('"UNKNOWN"',JSON.stringify(answer))}],authority_effect:'none'})}};}}
   else throw Error('no scripted action');
   response={model:MODEL,choices:[{message:{role:'assistant',tool_calls:[call]},finish_reason:'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:20}};
  }
  res.setHeader('content-type','application/json');res.end(JSON.stringify(response));
 }catch(e){serverError=e.message;res.statusCode=500;res.end('{}');}});
 try{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`,budget=completionBudget('example-fields-v20',soft);
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',token_margin:512,maximum_requests:budget.maximum_requests,request_budget:budget.request_budget,final_timeout_ms:60000,native_submission:true});
  const candidatePath=arm==='baseline'?'../source-instruction-v1/candidate-agent.mjs':'../admission-before-masking-v1/candidate-agent.mjs';const recorder=captureAdapter(createAdapter('scope-clarified',sha(readFileSync(new URL(candidatePath,import.meta.url)))));const runGlmAgent=arm==='baseline'?baselineAgent:admissionAgent;
  const result=await runGlmAgent({study_adapter:recorder.adapter,run_id:`fact-${soft}-${pressure}-${revised}`,request,fixture_root:root,client,retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},observation_allowlist:paths,mutation_allowlist:['subject.mjs'],verification_command:[],tool_runtime:createReadOnlyToolRuntime({repository_root:root,observation_allowlist:paths}),tool_policy:{allow:['read-file','read-inspection-evidence']},context_recycling:{directory:join(directory,'state'),context_limit:16384,recycle_at:soft,safety_margin:1000,state:{objective:request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic-versioned-fixture']}}});
  assert.equal(serverError,undefined);const selected=recorder.selected(result,{model:MODEL}),models=captures.filter(c=>c.kind==='model');assert.equal(selected.length,models.length);
  for(let i=0;i<selected.length;i++)assert.equal(selected[i].model_request_sha256,models[i].sha256);
  assert.equal(result.receipts.length,captures.length);for(let i=0;i<captures.length;i++){assert.equal(result.receipts[i].kind,captures[i].kind);assert.equal(result.receipts[i].request_sha256,captures[i].sha256);assert.equal(result.receipts[i].status,200);}
  assert.equal(snapshotTree(root).tree_sha256,base.tree_sha256);
  const final=JSON.parse(selected.at(-1).prompt),final_generation=selected.at(-1).generation;
  const delivered=selected.filter(s=>answerFromContext(JSON.parse(s.prompt))===revised);
  const metrics={soft_limit:soft,pressure,revised,neutralCount,arm,strategy,reason_codes:result.reason_codes??[],status:result.status,recycles:result.recycling.recycles,final_generation,revision_delivered_before_recycle:delivered.some(s=>s.generation<final_generation),revision_ever_delivered:delivered.length>0,final_revision_visible:answerFromContext(final)===revised,final_tools:final.tools.map(t=>t.function.name),generic_gate_passed:result.completion_gate?.passed??false,answer,semantic_pass:answer===revised,models:models.length,tokenizers:captures.length-models.length};
  metrics.structural_gap=metrics.revision_delivered_before_recycle&&metrics.recycles>0&&metrics.generic_gate_passed&&!metrics.final_revision_visible&&metrics.final_tools.length===1&&metrics.final_tools[0]==='submit_patch_candidate';
  return {task,metrics,request,fixtures,base,selected,captures,receipts:result.receipts,completion_gate:result.completion_gate,agent_result:result,authority_effect:'none',open_questions_ref:'../README.md'};
 }finally{server.closeAllConnections();if(server.listening)await new Promise(done=>server.close(done));rmSync(directory,{recursive:true,force:true});}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const out=resolve(process.argv[2]);mkdirSync(out);const groups=[];
 for(const soft of [8000,10000,12000]){
  const r=await runProbe(soft,true,null,3,'admission');assert.equal(r.metrics.models,7);assert.equal(r.metrics.recycles,1);
  const tokens=r.captures.filter(c=>c.kind==='tokenizer');assert.equal(tokens.length,8);
  const full=tokens[6],fallback=tokens[7];assert.equal(full.generation,0);assert.equal(fallback.generation,1);
  const facts=body=>r.task.facts.map(f=>body.messages.some(m=>{try{const o=JSON.parse(m.content);return m.role==='tool'&&o.ok===true&&o.output?.path===f.path&&o.output.sha256===f.sha256&&o.output.utf8===f.utf8;}catch{return false;}}));
  assert.ok(facts(JSON.parse(full.raw)).every(Boolean));assert.ok(facts(JSON.parse(fallback.raw)).every(x=>!x));
  writeFileSync(join(out,soft+'.json'),JSON.stringify(r,null,2)+'\n',{flag:'wx'});
  groups.push({soft,source:soft+'.json',prefix:tokens.slice(0,6).map(c=>JSON.parse(c.raw)),full:JSON.parse(full.raw),fallback:JSON.parse(fallback.raw)});
 }
 writeFileSync(join(out,'templates.json'),JSON.stringify({groups,provider_calls:0,claim_ceiling:'Synthetic trigger only generates exact engine fallback templates; real token measurements required.',open_questions_ref:'../README.md'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({groups:groups.length,provider_calls:0}));
}
