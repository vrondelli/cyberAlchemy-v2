import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReceipt,MODEL} from './provider.mjs';
const good=()=>({response_model:MODEL,output:'answer',finish_reason:'stop',usage:{prompt_tokens:20,completion_tokens:5,total_tokens:25}});
test('provider rejects wrong identity, malformed usage, excess context and incomplete output',()=>{
 validateReceipt(good(),'model');
 for(const patch of [{response_model:'other'},{finish_reason:'length'},{output:''},{usage:{prompt_tokens:20,completion_tokens:5,total_tokens:24}},{usage:{prompt_tokens:7169,completion_tokens:1,total_tokens:7170}},{usage:{prompt_tokens:20,completion_tokens:1025,total_tokens:1045}}])assert.throws(()=>validateReceipt({...good(),...patch},'model'));
});
test('cached and reasoning details are subsets of input and output, not extra tokens',()=>{
 const r=good();r.usage.prompt_tokens_details={cached_tokens:20};r.usage.completion_tokens_details={reasoning_tokens:5};validateReceipt(r,'model');
 r.usage.prompt_tokens_details.cached_tokens=21;assert.throws(()=>validateReceipt(r,'model'),/details/);
 r.usage.prompt_tokens_details.cached_tokens=0;r.usage.completion_tokens_details.reasoning_tokens=6;assert.throws(()=>validateReceipt(r,'model'),/details/);
});
