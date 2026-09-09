import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {join,dirname} from 'node:path';import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {createGlmClient,MODEL} from './transport.mjs';
import {openContextRecycling} from '../context-recycling.mjs';
import {runSharedCorrection} from './shared-correction.mjs';import {hash} from './transport.mjs';
function setup(t,passes=[true]) {
 const root=mkdtempSync(join(tmpdir(),'are-shared-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const base={tree_sha256:hash('base'),files:{'src/subject.mjs':hash('original')}};
 const candidate={schema_version:'are.patch-set-candidate/v1',authority_effect:'none',expected_base_tree_sha256:base.tree_sha256,changes:[{operation:'replace-file',path:'src/subject.mjs',expected_file_sha256:base.files['src/subject.mjs'],utf8:'export const x=1;'}]};
 let validations=0,calls=0,ready=0;
 const options={candidate,base,plan:{checks:[]},directory:join(root,'run'),check_readiness:async()=>{ready++;return {schema_version:'are.execution-readiness/v1',ready:true};},request_once:async()=>{calls++;return reply(candidate);},validation_backend:{id:'bound-test',validate:({subject,plan})=>{const ok=passes[validations++];return {subject_sha256:hash(readFileSync(subject,'utf8')),plan_sha256:hash(JSON.stringify(plan)),ok,results:[{id:'case',passed:ok,reason:ok?'matched':'output-mismatch'}]};}}};
 return {options,counts:()=>({validations,calls,ready})};
}
const reply=c=>({message:{role:'assistant',tool_calls:[{id:'one',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(c)}}]},finish_reason:'tool_calls'});
function missing(x){const c=structuredClone(x.options.candidate);delete c.authority_effect;delete x.options.candidate;x.options.rejected_text=JSON.stringify(c);}
test('valid passing input uses no correction',async t=>{const x=setup(t);const r=await runSharedCorrection(x.options);assert.equal(r.status,'UNCHANGED');assert.deepEqual(x.counts(),{validations:1,calls:0,ready:0});});
test('schema-only correction is bracketed by public checks and uses exactly one request',async t=>{const x=setup(t,[true,true]);missing(x);const r=await runSharedCorrection(x.options);assert.equal(r.status,'REPAIRED');assert.equal(r.correction_kind,'format');assert.equal(r.model_attempts,1);assert.deepEqual(x.counts(),{validations:2,calls:1,ready:1});await assert.rejects(runSharedCorrection(x.options),/EEXIST/);});
test('combined defects remain rejected when the one correction fails public checks',async t=>{const x=setup(t,[false,false]);missing(x);const r=await runSharedCorrection(x.options);assert.equal(r.status,'REJECTED');assert.equal(r.correction_kind,'schema-and-semantic');assert.deepEqual(x.counts(),{validations:2,calls:1,ready:1});});
test('valid input can use allowance for semantic correction',async t=>{const x=setup(t,[false,true]);const r=await runSharedCorrection(x.options);assert.equal(r.status,'REPAIRED');assert.equal(r.correction_kind,'semantic');assert.deepEqual(x.counts(),{validations:2,calls:1,ready:1});});
test('semantic malformed reply cannot trigger format retry',async t=>{const x=setup(t,[false]);const c=structuredClone(x.options.candidate);delete c.authority_effect;let calls=0;x.options.request_once=async()=>{calls++;return reply(c);};const r=await runSharedCorrection(x.options);assert.equal(r.status,'BLOCK');assert.equal(calls,1);assert.equal(r.format,null);});
test('ineligible rejected text makes no call or validation',async t=>{const x=setup(t);missing(x);x.options.rejected_text='not JSON';const r=await runSharedCorrection(x.options);assert.equal(r.status,'BLOCK');assert.deepEqual(x.counts(),{validations:0,calls:0,ready:0});});
test('format transport failure retains unknown usage and consumes dispatch',async t=>{const x=setup(t);missing(x);let calls=0;x.options.request_once=async()=>{calls++;throw Error('private');};const r=await runSharedCorrection(x.options);assert.equal(r.model_attempts,null);assert.equal(r.correction_dispatches,1);assert.equal(calls,1);assert.ok(!JSON.stringify(r).includes('private'));});

test('all schema and public defects arrive before the single correction request',async t=>{
 const x=setup(t,[false,true]);const corrected=structuredClone(x.options.candidate);corrected.changes[0].utf8='export const x=2;';missing(x);
 const raw=JSON.parse(x.options.rejected_text);delete raw.schema_version;raw.extra=true;x.options.rejected_text=JSON.stringify(raw);
 let calls=0;x.options.request_once=async prompt=>{calls++;assert.equal(x.counts().validations,1);const body=JSON.parse(JSON.parse(prompt).messages[1].content);
  assert.deepEqual(body.failed_checks,['case']);assert.equal(body.schema_diagnostics.issues.length,3);assert.equal(body.rejected_proposal.changes[0].utf8,'export const x=1;');return reply(corrected);};
 const r=await runSharedCorrection(x.options);assert.equal(r.status,'REPAIRED');assert.equal(r.correction_kind,'schema-and-semantic');assert.equal(calls,1);assert.equal(r.correction_dispatches,1);assert.equal(r.candidate.changes[0].utf8,'export const x=2;');
});
test('schema-only repair cannot change passing source or promote its local envelope',async t=>{
 const x=setup(t,[true]);const changed=structuredClone(x.options.candidate);changed.changes[0].utf8='export const x=2;';missing(x);x.options.request_once=async()=>reply(changed);
 const r=await runSharedCorrection(x.options);assert.equal(r.status,'BLOCK');assert.deepEqual(r.reason_codes,['format.source-changed']);assert.equal(r.candidate,undefined);assert.equal(x.counts().validations,1);
});
test('public execution failure stops schema correction before a model request',async t=>{
 const x=setup(t);missing(x);x.options.validation_backend.validate=({subject,plan})=>({subject_sha256:hash(readFileSync(subject,'utf8')),plan_sha256:hash(JSON.stringify(plan)),ok:false,results:[{id:'case',passed:false,reason:'child-timeout'}]});
 const r=await runSharedCorrection(x.options);assert.equal(r.status,'BLOCK');assert.equal(r.correction_dispatches,0);assert.equal(r.candidate,undefined);
});

for(const kind of ['schema','semantic','combined'])test(`one ${kind} correction retains two physical attempts after a transient fault`,async t=>{
 const x=setup(t,kind==='schema'?[true,true]:[false,true]),corrected=structuredClone(x.options.candidate);
 if(kind!=='schema')corrected.changes[0].utf8='export const x=2;';
 if(kind!=='semantic')missing(x);
 let modelCalls=0,logicalCalls=0,physical=[];
 const server=createServer(async(req,res)=>{
  const chunks=[];for await(const c of req)chunks.push(c);const body=JSON.parse(Buffer.concat(chunks));
  if(req.url.endsWith('/tokenizer')){res.setHeader('content-type','application/json');res.end(JSON.stringify({usage:{prompt_tokens:100}}));return;}
  modelCalls++;if(modelCalls===1){res.destroy();return;}
  assert.equal(body.tools[0].function.name,'submit_patch_candidate');
  res.setHeader('content-type','application/json');res.end(JSON.stringify({model:MODEL,choices:[reply(corrected)],usage:{prompt_tokens:100,completion_tokens:50}}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
 const origin=`http://127.0.0.1:${server.address().port}`;
 x.options.maximum_model_retries=1;
 x.options.request_once=async prompt=>{
  logicalCalls++;
  const client=createGlmClient({chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',maximum_requests:1,maximum_model_retries:1,native_submission:true,timeout_ms:100,model_timeout_ms:500,final_timeout_ms:500,token_margin:512});
  const directory=join(dirname(x.options.directory),'transport'),scope={request:'one correction',test:kind,client:client.identity};
  const state={objective:'one correction',constraints:[],completed:[],pending:['one correction'],facts:[],lessons:[],evidence_refs:['test']};
  const session=openContextRecycling({options:{directory,context_limit:10000,recycle_at:7744,safety_margin:1024,state},transport:client.transport,scope,fixture_root:process.cwd()});
  try{client.bindRunLedger({directory,binding:hash(scope)});const r=await session.generate({history:[],render:()=>prompt,run_id:kind});session.completeStep([],true);return {...JSON.parse(r.final_bytes),transport_accounting:{model_attempts:client.receipts.filter(r=>r.kind==='model').length,tokenizer_attempts:client.receipts.filter(r=>r.kind==='tokenizer').length}};}
  finally{physical=client.receipts;session.close();}
 };
 const r=await runSharedCorrection(x.options);
 assert.equal(r.status,'REPAIRED',JSON.stringify(r));assert.equal(logicalCalls,1);assert.equal(modelCalls,2);assert.equal(r.correction_dispatches,1);assert.equal(r.model_attempts,2);
 if(kind!=='semantic')assert.equal(r.format.model_attempts,2);
 const m=physical.filter(r=>r.kind==='model');assert.equal(m[0].request_sha256,m[1].request_sha256);assert.deepEqual(m.map(r=>r.attempt_index),[0,1]);
});
