// Synthetic loopback integration only. Open questions: README.md#open-questions.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {compileCandidate} from './candidate.mjs';
import {createStudyAdapter} from './adapter.mjs';
import {arms,cards} from '../controlled-study-v1/treatments.mjs';
import {createGlmClient,MODEL} from '../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {runGlmAgent as originalAgent} from '../../../../packages/coding-agent-runtime/glm-flash-v1/agent.mjs';
import {completionBudget} from '../../../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs';
import {createReadOnlyToolRuntime} from '../../../../packages/coding-agent-runtime/read-only-tools.mjs';
import {snapshotTree} from '../../../../packages/coding-agent-runtime/verifier.mjs';
import {validatePublicCases} from '../../../../packages/coding-agent-runtime/public-case-validation.mjs';
const prepared=new URL('../controlled-study-v1/prepared/',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex'),need=(x,m)=>{if(!x)throw Error(m);};
const read=p=>readFileSync(new URL(p,prepared),'utf8');
const control=b=>b.messages[0].content.split('\n').map(x=>{try{return JSON.parse(x);}catch{return {};}}).find(x=>'generation' in x);
const material=b=>({messages:b.messages,tools:b.tools});
export function baselineMaterial(value,key=''){
 if(typeof value==='string'){if(key==='content'&&value.startsWith('{')){try{return baselineMaterial(JSON.parse(value));}catch{}}return value;}
 if(Array.isArray(value))return value.map(baselineMaterial);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>{if(k==='history_ref'){need(typeof v==='string'&&/^[a-f0-9]{64}$/.test(v),'invalid history ref');return [k,'<run-bound-history-ref>'];}return [k,baselineMaterial(v,k)];}));
 return value;
}
export function verifyPreparation(){const m=JSON.parse(read('manifest.json'));for(const s of m.files)need(sha(readFileSync(new URL(s.path,prepared)))===s.sha256,'fixture drift '+s.path);return m;}
export async function runTrial({runAgent,compiled,fixture,arm,soft=8000,recycle=false,badEnvelope=false,forceFailure=false}){
 verifyPreparation();const parent=mkdtempSync(join(tmpdir(),'are-study57-')),root=join(parent,'fixture');mkdirSync(root);
 const task=JSON.parse(read(`fixtures/${fixture}/task.json`));
 for(const p of task.observation_allowlist)writeFileSync(join(root,p),read(`fixtures/${fixture}/${p}`));
 const base=snapshotTree(root),reference=read(`fixtures/${fixture}/reference.mjs`),oracle=JSON.parse(read(`fixtures/${fixture}/oracle.json`));
 const adapter=createStudyAdapter({arm,family:task.family,candidate_sha256:compiled.candidate_sha256});
 const runtime=createReadOnlyToolRuntime({repository_root:root,observation_allowlist:task.observation_allowlist});
 const hidden_denials=[];for(const path of ['oracle.json','reference.mjs','task.json','../oracle.json'])hidden_denials.push({path,ok:(await runtime.invoke('read-file',{path})).ok});
 need(hidden_denials.every(d=>d.ok===false),'hidden file exposed');
 const captures=[],replies=[];let n=0,error=null;
 const server=createServer(async(req,res)=>{try{
  const chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks).toString(),body=JSON.parse(raw),tokenizer=req.url==='/tokenizer';
  captures.push({kind:tokenizer?'tokenizer':'model',raw,sha256:sha(raw)});
  res.setHeader('content-type','application/json');
  if(forceFailure&&!tokenizer){res.statusCode=503;res.end('{}');return;}
  let response;
  if(tokenizer)response={usage:{prompt_tokens:recycle&&control(body)?.generation===0&&body.messages.some(m=>m.role==='tool')?soft-1000:100}};
  else{
   n++;const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));let call;
   if(action){const hint=JSON.parse(action.content.slice(20).split('. Request')[0]);call={id:'read'+n,type:'function',function:{name:hint.name,arguments:JSON.stringify(hint.arguments)}};}
   else{
    need(body.tools.length===1&&body.tools[0].function.name==='submit_patch_candidate','unexpected final tool');
    const value={expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'subject.mjs',expected_file_sha256:base.files['subject.mjs'],utf8:reference}]};
    if(arm!=='host-envelope'||badEnvelope)Object.assign(value,{schema_version:'are.patch-set-candidate/v1',authority_effect:'none'});
    call={id:'submission'+n,type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(value)}};
   }
   response={model:MODEL,choices:[{message:{role:'assistant',tool_calls:[call]},finish_reason:'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:20}};replies.push(response);
  }
  res.setHeader('content-type','application/json');res.end(JSON.stringify(response));
 }catch(e){error=e.message;res.statusCode=500;res.end('{}');}});
 try{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`,budget=completionBudget('example-fields-v20',soft);
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',maximum_requests:budget.maximum_requests,request_budget:budget.request_budget,token_margin:512,final_timeout_ms:60000,native_submission:true,model_timeout_ms:60000,maximum_model_retries:0});
  const request='Restore the contract in subject.mjs; inspect all allowlisted files, preserve unrelated behavior and propose only.';
  const result=await runAgent({run_id:'study57',request,fixture_root:root,client,study_adapter:adapter,
   retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',
   completion_requirements:{required_reads:task.observation_allowlist,distinct_turns:true,archive_after_recycle:true},observation_allowlist:task.observation_allowlist,mutation_allowlist:task.mutation_allowlist,verification_command:[],tool_runtime:runtime,tool_policy:{allow:['read-file','read-inspection-evidence']},
   context_recycling:{directory:join(parent,'state'),context_limit:16384,recycle_at:soft,safety_margin:1000,state:{objective:request,constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['study-fixture']}}});
  need(!error,error);need(captures.length===result.receipts.length,'physical receipt count');
  for(let i=0;i<captures.length;i++)need(captures[i].kind===result.receipts[i].kind&&captures[i].sha256===result.receipts[i].request_sha256,'receipt mismatch');
  const measured=new Set();for(const c of captures){const b=JSON.parse(c.raw),key=sha(JSON.stringify(material(b)));if(c.kind==='tokenizer')measured.add(key);else need(measured.has(key),'unmeasured decorated dispatch');}
  const models=captures.filter(c=>c.kind==='model');need(models.length<=budget.maximum_requests&&captures.length-models.length<=budget.maximum_tokenizer_requests,'cap exceeded');
  if(forceFailure){need(result.status==='BLOCK'&&models.length===1,'failed call retried or accepted');return {fixture,arm,soft,recycle,status:result.status,transport_failure_retained:true,model_calls:models.length,captures,receipts:result.receipts,checks_passed:true};}
  const rawFinal=replies.at(-1).choices[0].message.tool_calls[0].function.arguments;
  need(result.final_response_evidence.text_sha256===sha(rawFinal),'raw proposal overwritten');
  if(badEnvelope){need(result.status==='BLOCK'&&adapter.evidence.at(-1)?.ok===false,'forbidden host envelope accepted');return {fixture,arm,soft,recycle,status:result.status,forbidden_envelope_rejected:true,captures,receipts:result.receipts,checks_passed:true};}
  need(result.status==='AWAITING_APPROVAL',JSON.stringify(result.reason_codes));need(result.completion_gate.passed,'completion gate');need((result.recycling.recycles>0)===recycle,'recycle condition');
  const final=JSON.parse(models.at(-1).raw),required=final.tools[0].function.parameters.required;
  need(required.includes('schema_version')===(arm!=='host-envelope'),'arm schema mismatch');
  if(arm==='host-envelope')need(adapter.evidence.length===1&&adapter.evidence[0].ok,'host normalization missing');else need(adapter.evidence.length===0,'normalization leaked to full arm');
  if(cards[arm])need(final.messages.at(-1).content===(cards[arm].instruction??cards[arm].instructions[task.family]),'card mismatch');
  const validationRoot=join(parent,'validation');mkdirSync(validationRoot);const subject=join(validationRoot,'subject.mjs'),oraclePath=join(validationRoot,'oracle.json');
  writeFileSync(subject,result.candidate.changes[0].utf8);writeFileSync(oraclePath,JSON.stringify(oracle));
  const plan={schema_version:'are.public-case-plan/v1',sources:[{path:oraclePath,sha256:sha(readFileSync(oraclePath))}],checks:oracle.map((c,i)=>({...c,evidence:[{path:oraclePath,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
  const validation=validatePublicCases({subject,plan});need(validation.ok,'hidden semantic check failed');need(snapshotTree(root).tree_sha256===base.tree_sha256,'fixture changed');
  // Code under evaluation must not read an adjacent oracle even though the validator can.
  writeFileSync(subject,"import {readFileSync} from 'node:fs'; export function probe(){return readFileSync(new URL('./oracle.json',import.meta.url),'utf8');}");
  const deniedPlan={...plan,checks:[{id:'oracle-denial',export_name:'probe',args:[],expected:{ok:false,error:'Access to this API has been restricted. Use --allow-fs-read to manage permissions.'},evidence:plan.checks[0].evidence}]};
  const denied=validatePublicCases({subject,plan:deniedPlan});need(denied.ok,'oracle read not denied as expected');
  return {fixture,arm,soft,recycle,status:result.status,recycles:result.recycling.recycles,model_calls:models.length,tokenizer_calls:captures.length-models.length,hidden_denials,hidden_passed:validation.passed,oracle_read_denied:true,raw_final_sha256:sha(rawFinal),normalization:adapter.evidence,captures,receipts:result.receipts,checks_passed:true};
 }finally{server.closeAllConnections();if(server.listening)await new Promise(done=>server.close(done));rmSync(parent,{recursive:true,force:true});}
}
export async function main(output){
 mkdirSync(output);const compiled=compileCandidate(join(output,'candidate-agent.mjs')),candidate=await import(pathToFileURL(join(output,'candidate-agent.mjs')));
 const tests=[];for(const fixture of ['archive-start-v1','archive-end-v1','retention-empty-v1','retention-order-v1'])for(const arm of arms){
  const row=await runTrial({runAgent:candidate.runGlmAgent,compiled,fixture,arm,recycle:true});const file=`${fixture}-${arm}.json`;writeFileSync(join(output,file),JSON.stringify(row,null,2)+'\n');tests.push({file,fixture,arm,passed:row.checks_passed,hidden_passed:row.hidden_passed});
 }
 for(const soft of [10000,12000])for(const arm of arms){const row=await runTrial({runAgent:candidate.runGlmAgent,compiled,fixture:'archive-start-v1',arm,soft,recycle:true});const file=`window-${soft}-${arm}.json`;writeFileSync(join(output,file),JSON.stringify(row,null,2)+'\n');tests.push({file,soft,arm,passed:row.checks_passed});}
 for(const mode of ['badEnvelope','forceFailure']){const row=await runTrial({runAgent:candidate.runGlmAgent,compiled,fixture:'archive-start-v1',arm:'host-envelope',[mode]:true});const file=mode+'.json';writeFileSync(join(output,file),JSON.stringify(row,null,2)+'\n');tests.push({file,passed:row.checks_passed});}
 // Original and candidate baseline use identical fixture content and deterministic model script.
 const a=await runTrial({runAgent:originalAgent,compiled,fixture:'archive-start-v1',arm:'baseline'}),b=await runTrial({runAgent:candidate.runGlmAgent,compiled,fixture:'archive-start-v1',arm:'baseline'});
 need(isDeepStrictEqual(a.captures.map(c=>baselineMaterial(JSON.parse(c.raw))),b.captures.map(c=>baselineMaterial(JSON.parse(c.raw)))),'baseline payload drift beyond history refs');
 writeFileSync(join(output,'baseline-original.json'),JSON.stringify(a,null,2)+'\n');writeFileSync(join(output,'baseline-candidate.json'),JSON.stringify(b,null,2)+'\n');
 const result={schema_version:'are.glm-study-runner-integration/v1',compiled,tests,baseline_payload_equivalent:true,baseline_comparison_exclusions:['run-bound history_ref values only'],provider_calls:0,authority_effect:'none',open_questions_ref:'../README.md#open-questions'};writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');const engine=new URL('../../../../',import.meta.url),sources=[];
 const collect=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()&&!['evidence','node_modules'].includes(e.name))collect(p);else if(e.isFile()&&/\.(mjs|json)$/.test(p))sources.push({path:relative(engine.pathname,p),sha256:sha(readFileSync(p))});}};collect(new URL('packages/coding-agent-runtime/',engine).pathname);
 for(const p of ['runner.mjs','adapter.mjs','candidate.mjs','../controlled-study-v1/treatments.mjs','../controlled-study-v1/prepared/manifest.json']){const u=new URL(p,import.meta.url);sources.push({path:relative(engine.pathname,u.pathname),sha256:sha(readFileSync(u))});}
 const artifacts=readdirSync(output).map(path=>({path,sha256:sha(readFileSync(join(output,path)))}));writeFileSync(join(output,'manifest.json'),JSON.stringify({sources,artifacts,authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');
 console.log(JSON.stringify({tests:tests.length,baseline_payload_equivalent:true,baseline_comparison_exclusions:['run-bound history_ref values only']}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){need(process.argv.length===3,'provide new directory');await main(resolve(process.argv[2]));}
