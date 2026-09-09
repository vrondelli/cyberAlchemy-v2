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
const cases = [{"id": "ascii", "export_name": "sliceInspection", "args": ["abcdef", 1, 3], "expected": {"ok": true, "value": {"offset_unit": "utf16-code-units", "offset": 1, "next_offset": 4, "total_chars": 6, "eof": false, "utf8": "bcd"}}}, {"id": "end-boundary", "export_name": "sliceInspection", "args": ["A😀B", 0, 2], "expected": {"ok": true, "value": {"offset_unit": "utf16-code-units", "offset": 0, "next_offset": 1, "total_chars": 4, "eof": false, "utf8": "A"}}}, {"id": "start-boundary", "export_name": "sliceInspection", "args": ["A😀B", 2, 1], "expected": {"ok": false, "error": "inspection-range-splits-unicode"}}, {"id": "no-progress", "export_name": "sliceInspection", "args": ["😀", 0, 1], "expected": {"ok": false, "error": "inspection-range-splits-unicode"}}, {"id": "whole-pair", "export_name": "sliceInspection", "args": ["😀", 0, 2], "expected": {"ok": true, "value": {"offset_unit": "utf16-code-units", "offset": 0, "next_offset": 2, "total_chars": 2, "eof": true, "utf8": "😀"}}}, {"id": "eof", "export_name": "sliceInspection", "args": ["abc", 3, 5], "expected": {"ok": true, "value": {"offset_unit": "utf16-code-units", "offset": 3, "next_offset": 3, "total_chars": 3, "eof": true, "utf8": ""}}}, {"id": "outside", "export_name": "sliceInspection", "args": ["abc", 4, 1], "expected": {"ok": false, "error": "inspection-range-invalid"}}, {"id": "zero-width", "export_name": "sliceInspection", "args": ["abc", 0, 0], "expected": {"ok": false, "error": "inspection-range-invalid"}}];
for (const c of cases) test(c.id,()=>{
 const output=execFileSync(process.execPath,['--permission',`--allow-fs-read=${subject}`,'--input-type=module','-e',driver,pathToFileURL(subject).href],{env:{},input:JSON.stringify({export_name:c.export_name,args:c.args}),encoding:'utf8',timeout:2000,maxBuffer:65536,stdio:['pipe','pipe','pipe']});
 assert.deepEqual(JSON.parse(output),c.expected);
});
