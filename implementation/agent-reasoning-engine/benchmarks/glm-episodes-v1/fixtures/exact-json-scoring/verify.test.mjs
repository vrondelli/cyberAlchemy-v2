import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
const subject=fileURLToPath(new URL('./src/subject.mjs',import.meta.url));
const driver = `import {readFileSync} from 'node:fs';
const input=JSON.parse(readFileSync(0,'utf8')), before=JSON.stringify(input.args);
let result;
try {const candidate=await import(process.argv[1]);const value=candidate[input.export_name](...input.args);result={ok:true,value};}
catch(error){result={ok:false,error:error.message};}
if(JSON.stringify(input.args)!==before)result={ok:false,error:'candidate-mutated-input'};
process.stdout.write(JSON.stringify(result));`;
const cases = [{"id":"nested-object-order","export_name":"scoreResponse","args":[{"expected":{"a":{"x":1,"y":2},"b":[1,2]}},"{\"b\":[1,2],\"a\":{\"y\":2,\"x\":1}}"],"expected":{"ok":true,"value":{"passed":true,"reason":"exact_json_match"}}},{"id":"nested-value-mismatch","export_name":"scoreResponse","args":[{"expected":{"a":{"x":1}}},"{\"a\":{\"x\":2}}"],"expected":{"ok":true,"value":{"passed":false,"reason":"answer_mismatch"}}},{"id":"extra-field","export_name":"scoreResponse","args":[{"expected":{"a":1}},"{\"a\":1,\"b\":2}"],"expected":{"ok":true,"value":{"passed":false,"reason":"answer_mismatch"}}},{"id":"array-order","export_name":"scoreResponse","args":[{"expected":[1,2]},"[2,1]"],"expected":{"ok":true,"value":{"passed":false,"reason":"answer_mismatch"}}},{"id":"non-string","export_name":"scoreResponse","args":[{"expected":{"a":1}},{"a":1}],"expected":{"ok":true,"value":{"passed":false,"reason":"response_not_text"}}},{"id":"malformed-json","export_name":"scoreResponse","args":[{"expected":{}},"```json\n{}\n```"],"expected":{"ok":true,"value":{"passed":false,"reason":"invalid_json"}}},{"id":"null","export_name":"scoreResponse","args":[{"expected":null},"null"],"expected":{"ok":true,"value":{"passed":true,"reason":"exact_json_match"}}},{"id":"nested-type","export_name":"scoreResponse","args":[{"expected":{"x":1}},"{\"x\":\"1\"}"],"expected":{"ok":true,"value":{"passed":false,"reason":"answer_mismatch"}}}];
for (const c of cases) test(c.id,()=>{
 const output=execFileSync(process.execPath,['--permission',`--allow-fs-read=${subject}`,'--input-type=module','-e',driver,pathToFileURL(subject).href],{env:{},input:JSON.stringify({export_name:c.export_name,args:c.args}),encoding:'utf8',timeout:2000,maxBuffer:65536,stdio:['pipe','pipe','pipe']});
 assert.deepEqual(JSON.parse(output),c.expected);
});
