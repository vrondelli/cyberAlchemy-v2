import test from 'node:test';
import assert from 'node:assert/strict';
import {expected,probes,assess} from './schema-probe.mjs';
const response=value=>({status:200,payload:{model:'glm-5.3-flash',choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]}});
test('probe rejects accepted but ignored schema, missing fields, and altered source strings',()=>{
 assert.equal(assess(response(expected)).passed,true);
 for(const value of [{unexpected:true},{...expected,schema_version:undefined},{...expected,utf8:expected.utf8.replace('json','')},{...expected,extra:1}])assert.equal(assess(response(value)).passed,false);
});
test('probe distinguishes HTTP rejection and incomplete output from enforcement',()=>{
 assert.equal(assess({status:400}).reason,'http-rejected');const r=response(expected);r.payload.choices[0].finish_reason='length';assert.equal(assess(r).passed,false);
});
test('fixed probes isolate format selection and keep enforcement target out of conflicting prompt',()=>{
 const p=probes();assert.equal(p.length,3);assert.deepEqual(p[0].body.messages,p[1].body.messages);
 assert.equal(p[0].body.response_format,undefined);assert.equal(p[1].body.response_format.type,'json_object');
 assert.ok(!p[2].body.messages[0].content.includes(expected.schema_version));assert.deepEqual(p[2].body.response_format.json_schema.schema.required,Object.keys(expected));
 assert.ok(p.every(x=>x.body.max_tokens===2048&&x.body.model==='glm-5.3-flash'));
});
