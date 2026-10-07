// Synthetic only; no archive labels, providers or audit publication.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R1.json.
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {checkSavedExchange,checkCanonicalObservation} from './audit-native-method-live-r1.mjs';
import {providerBody} from '../g02-product-r4/wsl-vps-provider-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const input={operation:'generate',request_id:'synthetic-1',messages:[{role:'user',content:'synthetic'}],tools:[],output_cap:512};
 const request_sha256=sha(providerBody(input));
 const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:input.operation,
  request_sha256,dispatched:true,status:200,prompt_tokens:100,completion_tokens:20,automatic_retries:0,redirects_followed:0};
 const receipt={request_sha256,dispatched:true,dispatch_uncertain:false,status:200,input_tokens:100,output_tokens:20,
  failure_code:null,output_cap:512,automatic_retries:0,kind:'model'};
 return [{input,request_sha256},reply,receipt];
}
test('saved model exchange reconstructs exact request and usage; tampering rejects',()=>{
 const f=fixture();assert.equal(checkSavedExchange(...f),120);
 const drift=structuredClone(f);drift[0].input.messages[0].content='changed';assert.throws(()=>checkSavedExchange(...drift));
 const cost=structuredClone(f);cost[2].output_tokens=19;assert.throws(()=>checkSavedExchange(...cost));
});
test('uncertain transport stays uncertain and never invents token cost',()=>{
 const f=fixture();Object.assign(f[1],{dispatched:null,dispatch_uncertain:true,status:null,prompt_tokens:null,completion_tokens:null,failure_code:'timeout'});
 Object.assign(f[2],{dispatched:false,dispatch_uncertain:true,status:null,input_tokens:null,output_tokens:null,failure_code:'timeout'});
 assert.equal(checkSavedExchange(...f),0);
});
test('canonical complete byte slices require both hashes, exact extent and complete status',()=>{
 const bytes=Buffer.from('prefix\nvoid f() {}\nsuffix'),body=bytes.subarray(7,18);
 const o={source_sha256:sha(bytes),complete_method:true,source_byte_start:7,source_byte_end:18,
  utf8:body.toString(),byte_count:body.length,method_source_sha256:sha(body)};
 checkCanonicalObservation(o,bytes);
 assert.throws(()=>checkCanonicalObservation({...o,source_byte_end:19},bytes));
 assert.throws(()=>checkCanonicalObservation({...o,complete_method:false},bytes));
 assert.throws(()=>checkCanonicalObservation(o,Buffer.from('changed source')));
});
