import test from 'node:test';
import assert from 'node:assert/strict';
import {base,probes,assess} from './native-submission-probe.mjs';
import {submissionTool,parseSubmission} from '../../packages/coding-agent-runtime/glm-flash-v1/submission.mjs';
const message=value=>({role:'assistant',tool_calls:[{id:'p1',type:'function',function:{name:'submit_patch_candidate',arguments:JSON.stringify(value)}}]});
const check=m=>parseSubmission(m,'tool_calls',{base,mutation_allowlist:['subject.mjs']});
test('native submissions preserve exact source and use existing strict candidate parser',()=>{
 for(const p of probes()){const m=message(p.expected);assert.equal(check(m).ok,true);assert.equal(assess({status:200,payload:{model:'glm-5.3-flash',choices:[{finish_reason:'tool_calls',message:m}]}},p).passed,true);}
 const value=structuredClone(probes()[0].expected);delete value.schema_version;assert.ok(check(message(value)).reason_codes.includes('patch-set.schema-version-invalid'));
});
test('native submission rejects batches, other tools, malformed arguments and scope drift',()=>{
 const p=probes()[0];const batch=message(p.expected);batch.tool_calls.push(batch.tool_calls[0]);assert.equal(check(batch).ok,false);
 const wrong=message(p.expected);wrong.tool_calls[0].function.name='write-file';assert.equal(check(wrong).ok,false);
 for(const mutate of [v=>v.expected_base_tree_sha256='f'.repeat(64),v=>v.changes[0].path='outside.mjs',v=>v.changes[0].expected_file_sha256='f'.repeat(64),v=>v.changes={},v=>v.authority_effect='apply']){const v=structuredClone(p.expected);mutate(v);assert.equal(check(message(v)).ok,false);}
});
test('submission schema requires protocol constants without assuming strict provider support',()=>{
 const tool=submissionTool(base,['subject.mjs']);assert.equal(tool.function.strict,undefined);assert.ok(tool.function.parameters.required.includes('schema_version'));
 assert.throws(()=>submissionTool(base,['missing']),/submission-scope-invalid/);
 for(const p of probes()){assert.equal(p.body.tool_choice,'auto');assert.equal(p.body.response_format,undefined);assert.equal(p.body.tools.length,1);}
});
test('content corruption fails independently of structural acceptance',()=>{
 const p=probes()[0],v=structuredClone(p.expected);v.changes[0].utf8=v.changes[0].utf8.replace('json','');const m=message(v);assert.equal(check(m).ok,true);assert.equal(assess({status:200,payload:{model:'glm-5.3-flash',choices:[{finish_reason:'tool_calls',message:m}]}},p).passed,false);
});
