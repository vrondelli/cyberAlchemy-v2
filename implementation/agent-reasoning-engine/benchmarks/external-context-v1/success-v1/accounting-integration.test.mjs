import test from 'node:test';import assert from 'node:assert/strict';
import {createServer} from 'node:http';import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';
import {reasoningEvidence,retainedReasoning} from '../accounting-v1/accounting.mjs';import {createGlmClient} from './transport.mjs';
import {openContextRecycling} from '../../../packages/coding-agent-runtime/context-recycling.mjs';
const message={role:'assistant',content:'done',reasoning_content:'retained reasoning'};
const receipt={kind:'model',status:200,output_tokens:710,reasoning_tokens:700};receipt.retained_reasoning=reasoningEvidence(message,receipt);
test('exact request membership, duplicate occurrences and removed reasoning',()=>{
 assert.equal(retainedReasoning([message,message],[receipt]).tokens,1400);assert.equal(retainedReasoning([],[receipt]).tokens,0);
 assert.equal(retainedReasoning([{role:'assistant',content:'done'}],[receipt]).tokens,0);
 assert.throws(()=>retainedReasoning([{...message,content:'modified'}],[receipt]),/unbound/);
 assert.throws(()=>retainedReasoning([message],[]),/unbound/);
});
test('usage fallback, zero counts and invalid evidence fail closed',()=>{
 assert.equal(reasoningEvidence(message,{output_tokens:710,reasoning_tokens:null}).token_reservation,710);
 assert.equal(reasoningEvidence(message,{output_tokens:10,reasoning_tokens:0}).token_reservation,0);
 assert.throws(()=>reasoningEvidence(message,{output_tokens:10,reasoning_tokens:11}),/invalid/);
 assert.throws(()=>retainedReasoning([message],[{...receipt,retained_reasoning:{...receipt.retained_reasoning,token_reservation:1}}]),/invalid/);
 assert.throws(()=>retainedReasoning([{role:'assistant',reasoning_content:5}],[]),/invalid/);
});
for(const threshold of [12000,3000])test(`loopback transport with restored ledger and threshold ${threshold}`,async()=>{
 const requests=[];const server=createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);requests.push({url:req.url,body});res.setHeader('content-type','application/json');
 if(req.url.endsWith('/tokenizer'))res.end(JSON.stringify({usage:{prompt_tokens:100}}));
 else{const retained=body.messages.filter(m=>m.role==='assistant'&&m.reasoning_content).length*700;res.end(JSON.stringify({model:'glm-5.3-flash',choices:[{message,finish_reason:'stop'}],usage:{prompt_tokens:100+retained,completion_tokens:710,completion_tokens_details:{reasoning_tokens:700}}}));}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;
 const dir=mkdtempSync(tmpdir()+'/accounting95-');mkdirSync(dir+'/fixture');let recycler;
 const config={chat_endpoint:`http://127.0.0.1:${port}/chat/completions`,tokenizer_endpoint:`http://127.0.0.1:${port}/tokenizer`,token_margin:512};
 const scope={request:'test'},options={directory:dir+'/state',context_limit:16384,recycle_at:threshold,safety_margin:1000,state:{objective:'test',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['test']}};
 const open=client=>openContextRecycling({transport:client.transport,fixture_root:dir+'/fixture',scope,options});const render=visible=>JSON.stringify({messages:[{role:'user',content:'test'},...visible],tools:[]});
 try{
 let client=createGlmClient(config);recycler=open(client);client.bindRunLedger({directory:dir+'/state',binding:'a'.repeat(64)});
 const first=await recycler.generate({history:[],render,run_id:'test'});const history=[JSON.parse(first.final_bytes).message];recycler.completeStep(history,false);recycler.close();
 client=createGlmClient(config);recycler=open(client);client.bindRunLedger({directory:dir+'/state',binding:'a'.repeat(64),require_existing:true});
 const second=await recycler.generate({history,render,run_id:'test'});assert.ok(second.final_bytes);recycler.completeStep(history,true);
 const measurements=client.receipts.filter(r=>r.kind==='tokenizer');assert.equal(measurements[1].retained_reasoning_reservation,700);
 if(threshold===3000){assert.equal(recycler.snapshot().recycles,1);assert.equal(measurements.at(-1).retained_reasoning_reservation,0);}
 else{assert.equal(recycler.snapshot().recycles,0);const last=client.receipts.at(-1);assert.equal(last.input_tokens,800);assert.equal(last.reserved_input_tokens,1312);}
 assert.equal(requests.filter(r=>r.url.endsWith('/chat/completions')).length,2);
 }finally{recycler?.close();rmSync(dir,{recursive:true,force:true});await new Promise(resolve=>server.close(resolve));}
});
