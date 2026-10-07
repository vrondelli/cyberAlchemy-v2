// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {providerBody,validateReply} from './wsl-vps-provider-r1.mjs';
import {hash} from './vps-json-provider-r1.mjs';
const input={operation:'generate',request_id:'fixture-1',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:input.operation,
  request_sha256:hash(providerBody(input)),dispatched:true,automatic_retries:0,redirects_followed:0};
test('provider body preserves native common transport fields',()=>{
  const body=JSON.parse(providerBody(input));assert.equal(body.model,'glm-5.3-flash');assert.equal(body.max_tokens,512);
  assert.deepEqual(body.messages,input.messages);assert.equal(body.thinking.clear_thinking,false);
  assert.equal(JSON.parse(providerBody({...input,operation:'tokenize'})).thinking,undefined);
});
test('reply binds operation, caller identity and exact provider bytes',()=>{
  assert.equal(validateReply(reply,input),reply);
  for(const change of [{request_id:'other'},{operation:'tokenize'},{request_sha256:'a'.repeat(64)},
    {dispatched:false},{automatic_retries:1},{redirects_followed:1}])assert.throws(()=>validateReply({...reply,...change},input));
});
