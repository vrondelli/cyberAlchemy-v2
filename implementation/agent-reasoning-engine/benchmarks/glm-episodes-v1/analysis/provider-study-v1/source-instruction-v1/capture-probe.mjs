// Synthetic loopback evidence only. Open questions: README.md#open-questions.
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createGlmClient,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
import {runGlmAgent} from './candidate-agent.mjs';
import {createAdapter} from './adapter.mjs';
import {captureAdapter} from './prompt-capture.mjs';
import {completionBudget} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/completion.mjs';
import {createReadOnlyToolRuntime} from '../../../../../packages/coding-agent-runtime/read-only-tools.mjs';
import {snapshotTree} from '../../../../../packages/coding-agent-runtime/verifier.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const source='export const sentinel = "SOURCE_V1_55";\n',fact='FACT_55: empty history is valid.';
const need=(x,m)=>{if(!x)throw Error(m);};
const objects=body=>body.messages.map(m=>{try{return JSON.parse(m.content);}catch{return null;}}).filter(Boolean);
const control=body=>body.messages[0].content.split('\n').map(s=>{try{return JSON.parse(s);}catch{return {};}}).find(o=>'next_required_read' in o);
export function inspectFinal(body,base){
 const errors=[],tool=body.tools?.find(t=>t.function?.name==='submit_patch_candidate'),p=tool?.function?.parameters;
 if(!p?.required?.includes('schema_version')||!p?.required?.includes('authority_effect'))errors.push('required-fields');
 if(p?.properties?.schema_version?.enum?.[0]!=='are.patch-set-candidate/v1'||p?.properties?.authority_effect?.enum?.[0]!=='none')errors.push('constant-values');
 if(p?.properties?.expected_base_tree_sha256?.enum?.[0]!==base.tree_sha256||p?.properties?.changes?.items?.properties?.expected_file_sha256?.enum?.[0]!==base.files['a.mjs'])errors.push('scope-hashes');
 const pin=objects(body).find(o=>o.schema_version==='are.glm-inspected-mutation-sources/v1');
 if(!pin?.sources?.some(s=>s.path==='a.mjs'&&s.utf8===source&&s.sha256===base.files['a.mjs']))errors.push('source-pin');
 if(!objects(body).some(o=>o.fields?.some(f=>f.values?.some(v=>v.value===fact))))errors.push('example-fact');
 if(!body.messages[0].content.includes('Final output must be one submit_patch_candidate native call when offered.'))errors.push('native-instruction');
 return errors;
}
export async function runWindow(soft,forceRecycle){
 const directory=mkdtempSync(join(tmpdir(),'are-capture55-')),root=join(directory,'fixture');mkdirSync(root);
 writeFileSync(join(root,'a.mjs'),source);writeFileSync(join(root,'b.json'),JSON.stringify({requirements:['Preserve source sentinel.'],examples:[{explanation:fact}]}));
 const paths=['a.mjs','b.json'],base=snapshotTree(root),captures=[];let ordinal=0,serverError;
 const server=createServer(async(req,res)=>{try{
  const chunks=[];for await(const c of req)chunks.push(c);const raw=Buffer.concat(chunks).toString('utf8'),body=JSON.parse(raw),tokenizer=req.url==='/tokenizer';
  need(tokenizer||req.url==='/chat/completions','unexpected endpoint');captures.push({kind:tokenizer?'tokenizer':'model',raw,sha256:sha(raw),generation:control(body)?.generation});
  let response;
  if(tokenizer)response={usage:{prompt_tokens:forceRecycle&&control(body)?.generation===0&&body.messages.some(m=>m.role==='tool')?soft-1000:100}};
  else{
   ordinal++;const action=body.messages.find(m=>m.role==='user'&&m.content?.startsWith('Next required read: '));let call;
   if(action){const hint=JSON.parse(action.content.slice('Next required read: '.length).split('. Request')[0]);call={id:'read'+ordinal,type:'function',function:{name:hint.name,arguments:JSON.stringify(hint.arguments)}};}
   else if(body.tools?.some(t=>t.function.name==='submit_patch_candidate'))call={id:'submit'+ordinal,type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify({schema_version:'are.patch-set-candidate/v1',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:source+'// synthetic proposal only\n'}],authority_effect:'none'})}};
   else throw Error('no scripted action');
   response={model:MODEL,choices:[{message:{role:'assistant',tool_calls:[call]},finish_reason:'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:20}};
  }
  res.setHeader('content-type','application/json');res.end(JSON.stringify(response));
 }catch(e){serverError=e.message;res.statusCode=500;res.end('{}');}});
 try{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const origin=`http://127.0.0.1:${server.address().port}`,budget=completionBudget('example-fields-v20',soft);
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',token_margin:512,maximum_requests:budget.maximum_requests,request_budget:budget.request_budget,final_timeout_ms:60000,native_submission:true});
  const recorder=captureAdapter(createAdapter('scope-clarified',sha(readFileSync(new URL('candidate-agent.mjs',import.meta.url)))));
  const result=await runGlmAgent({study_adapter:recorder.adapter,run_id:`capture-${soft}-${forceRecycle}`,request:'Inspect both files and propose preserving the source sentinel and empty-history fact.',fixture_root:root,client,
   retention_policy:'recent-observations-v2',delivery_policy:'bounded-reads-v1',completion_policy:'example-fields-v20',source_policy:'inspected-mutation-v1',
   completion_requirements:{required_reads:paths,distinct_turns:true,archive_after_recycle:true},observation_allowlist:paths,mutation_allowlist:['a.mjs'],verification_command:[],
   tool_runtime:createReadOnlyToolRuntime({repository_root:root,observation_allowlist:paths}),tool_policy:{allow:['read-file','read-inspection-evidence']},
   context_recycling:{directory:join(directory,'state'),context_limit:16384,recycle_at:soft,safety_margin:1000,state:{objective:'Inspect both files and propose preserving the source sentinel and empty-history fact.',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['synthetic-fixture']}}});
  const selected=recorder.selected(result,{model:MODEL});need(selected.length===result.recycling.dispatches.length,'selected capture coverage');
  for(const c of selected){const physical=captures.filter(c=>c.kind==='model')[c.sequence-1];need(c.model_request_sha256===physical.sha256,'physical capture mismatch');}
  need(!serverError,serverError);need(result.status==='AWAITING_APPROVAL',JSON.stringify(result.reason_codes));
  need(result.completion_gate.passed,'completion gate');need(forceRecycle?result.recycling.recycles>0:result.recycling.recycles===0,'recycle condition');
  need(result.receipts.length===captures.length,'receipt count');
  for(let i=0;i<captures.length;i++)need(captures[i].kind===result.receipts[i].kind&&captures[i].sha256===result.receipts[i].request_sha256,'wire receipt mismatch '+i);
  const final=JSON.parse(captures.filter(c=>c.kind==='model').at(-1).raw),errors=inspectFinal(final,base);need(!errors.length,errors.join(','));
  const noField=structuredClone(final);noField.tools.find(t=>t.function.name==='submit_patch_candidate').function.parameters.required=noField.tools.find(t=>t.function.name==='submit_patch_candidate').function.parameters.required.filter(k=>k!=='schema_version');
  const stale=structuredClone(final);for(const m of stale.messages){try{const o=JSON.parse(m.content);if(o.schema_version==='are.glm-inspected-mutation-sources/v1'){o.sources[0].utf8='STALE';m.content=JSON.stringify(o);}}catch{}}
  const noFact=structuredClone(final);noFact.messages=noFact.messages.filter(m=>{try{return !JSON.parse(m.content).fields;}catch{return true;}});
  const wrongScope=structuredClone(final);wrongScope.tools.find(t=>t.function.name==='submit_patch_candidate').function.parameters.properties.expected_base_tree_sha256.enum=['f'.repeat(64)];
  const negative_controls={missing_example_fact:inspectFinal(noFact,base).includes('example-fact'),wrong_scope_hash:inspectFinal(wrongScope,base).includes('scope-hashes'),dropped_required_field:inspectFinal(noField,base).includes('required-fields'),stale_source:inspectFinal(stale,base).includes('source-pin'),altered_body_hash:sha(JSON.stringify(noField))!==captures.filter(c=>c.kind==='model').at(-1).sha256};
  need(Object.values(negative_controls).every(Boolean),'negative control failed');
  need(snapshotTree(root).tree_sha256===base.tree_sha256,'fixture changed');
  return {soft_limit:soft,forced_recycle:forceRecycle,recycles:result.recycling.recycles,status:result.status,completion_gate:result.completion_gate,base,checks_passed:true,negative_controls,selected,captures,receipts:result.receipts,claim_ceiling:'Synthetic transport construction and controlled recycling, not GLM quality or actual token calibration.'};
 }finally{server.closeAllConnections();if(server.listening)await new Promise(done=>server.close(done));rmSync(directory,{recursive:true,force:true});}
}
async function main(){
 need(process.argv.length===3,'provide new output directory');const out=resolve(process.argv[2]);mkdirSync(out);
 const runs=[];for(const soft of [8000,10000,12000])for(const recycle of [false,true]){const run=await runWindow(soft,recycle);writeFileSync(join(out,`${soft}-${recycle?'recycled':'baseline'}.json`),JSON.stringify(run,null,2)+'\n');runs.push({soft_limit:soft,recycled:recycle,model_calls:run.captures.filter(x=>x.kind==='model').length,tokenizer_calls:run.captures.filter(x=>x.kind==='tokenizer').length,recycles:run.recycles,checks_passed:run.checks_passed,negative_controls:run.negative_controls});}
 const engine=new URL('../../../../../',import.meta.url),input_hashes=[];
 const walk=dir=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory()&&!['evidence','node_modules'].includes(e.name))walk(p);else if(e.isFile()&&/\.(mjs|json)$/.test(p))input_hashes.push({path:relative(engine.pathname,p),sha256:sha(readFileSync(p))});}};
 walk(new URL('packages/coding-agent-runtime/',engine).pathname);input_hashes.push({path:relative(engine.pathname,new URL('capture-probe.mjs',import.meta.url).pathname),sha256:sha(readFileSync(new URL('capture-probe.mjs',import.meta.url)))});
 const result={schema_version:'are.glm-capture-probe/v1',runs,input_hashes,authority_effect:'none',open_questions_ref:'../README.md#open-questions'};
 writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(runs));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
