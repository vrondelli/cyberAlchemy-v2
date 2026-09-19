import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createCredentialPost,checkCredentialTimeout} from './run-recovery-tokenizer.mjs';
import {createTokenizerMeasurer,runCounterfactual} from './recovery-tokenizer.mjs';
import {legacyRecoveryIntro} from './recovery-wire.mjs';import {recoveryTools} from './recovery-freshness.mjs';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),request={messages:[{role:'user',content:'fixture'}],tools:[]};
const fakeRegistry={consume:async({consumer})=>consumer(Buffer.from('fixture'))};
test('abort during dispatch journal completion rolls back the proven pre-HTTP intent',async()=>{
 const c=new AbortController();let http=0;const records=[];
 const m=createTokenizerMeasurer({signal:c.signal,before_dispatch:async()=>{},record:async r=>{records.push(r);if(r.dispatched)c.abort();},post:createCredentialPost({registry:fakeRegistry,reference:{},signal:c.signal,post:async()=>{http++;return {status:200,payload:{usage:{prompt_tokens:7}}};}})});
 await assert.rejects(m.measure(request),/aborted-before-http/);assert.equal(http,0);assert.equal(m.receipts[0].dispatched,false);assert.equal(m.receipts[0].proven_pre_http_abort,true);assert.equal(records.at(-1).dispatched,false);
});
test('secret failure and cancellation during lookup produce no late HTTP or dispatch marker',async()=>{
 for(const mode of ['failure','abort']){
  const c=new AbortController();let http=0,guards=0;
  const registry={consume:async({consumer})=>{await new Promise(r=>setTimeout(r,5));if(mode==='failure')throw Error('secret unavailable');c.abort();return consumer(Buffer.from('fixture'));}};
  const m=createTokenizerMeasurer({signal:c.signal,before_dispatch:async()=>{guards++;},record:async()=>{},post:createCredentialPost({registry,reference:{},signal:c.signal,post:async()=>{http++;return {status:200,payload:{usage:{prompt_tokens:7}}};}})});
  await assert.rejects(m.measure(request));assert.equal(http,0);assert.equal(guards,0);assert.equal(m.receipts[0].dispatched,false);
 }
 assert.throws(()=>checkCredentialTimeout({timeout_ms:30001}),/30s/);checkCredentialTimeout({});checkCredentialTimeout({timeout_ms:30000});
});
test('fresh storage admission and dispatch journal failure prevent HTTP after secret success',async()=>{
 for(const mode of ['guard','journal']){
  const c=new AbortController();let http=0,consumed=false;
  const registry={consume:async({consumer})=>{consumed=true;return consumer(Buffer.from('fixture'));}};
  const m=createTokenizerMeasurer({signal:c.signal,before_dispatch:async()=>{assert.ok(consumed);if(mode==='guard')throw Error('quota');},record:async r=>{if(mode==='journal'&&r.dispatched)throw Error('journal quota');},post:createCredentialPost({registry,reference:{},signal:c.signal,post:async()=>{http++;return {status:200,payload:{usage:{prompt_tokens:7}}};}})});
  await assert.rejects(m.measure(request));assert.equal(http,0);assert.equal(m.receipts[0].dispatched,false);
 }
});
function cohort(){
 const sources={},outcomes=[25,24,24,24].map((count,i)=>{
  const task_id='task'+i,result={captures:[],receipts:[],recovery_presentations:[]};sources[task_id]=result;
  for(let j=0;j<count;j++){
   const prompt=stable({messages:[{role:'user',content:task_id+':'+j},{role:'user',content:legacyRecoveryIntro},{role:'user',content:stable({snapshot:'s',offset:0,entries:[]})}],tools:recoveryTools});
   const receipt={kind:'model',dispatched:true,status:200,model:'fixture',output_cap:512,reasoning_effort:'low',input_tokens:10,output_tokens:2};receipt.request_sha256=hash(stable(bodyForReceipt(prompt,receipt)));
   result.captures.push({prompt,prompt_sha256:hash(prompt)});result.receipts.push(receipt);result.recovery_presentations.push({request_sha256:receipt.request_sha256,delivery:{snapshot:'s',page_offset:0}});
  }
  return {task_id,requests:result.recovery_presentations};
 });return {sources,outcomes};
}
test('known tokens survive final receipt or row quota failure; all97 slots retained and two workers settle',async()=>{
 for(const failure of ['receipt','row']){
  const {sources,outcomes}=cohort(),controller=new AbortController();let active=0,posts=0,failed=false;
  const m=createTokenizerMeasurer({signal:controller.signal,before_dispatch:async()=>{},record:async r=>{if(failure==='receipt'&&r.status===200&&!failed){failed=true;throw Error('receipt quota');}},post:createCredentialPost({registry:fakeRegistry,reference:{},signal:controller.signal,post:async()=>{posts++;active++;try{await new Promise(r=>setTimeout(r,3));return {status:200,payload:{usage:{prompt_tokens:7}}};}finally{active--;}}})});
  const r=await runCounterfactual({outcomes,load_source:async id=>sources[id],measure:m.measure,write_row:async row=>{if(failure==='row'&&row.variants.eager&&!failed){failed=true;throw Error('row quota');}},signal:controller.signal,abort:()=>controller.abort()});
  assert.equal(r.status,'failed');assert.equal(r.classification,'inconclusive');assert.equal(r.rows.length,97);assert.equal(active,0);assert.ok(posts>0);assert.ok(m.receipts.some(r=>r.tokens===7));assert.equal(m.receipts.filter(r=>r.status===200).length,posts);
 }
});
