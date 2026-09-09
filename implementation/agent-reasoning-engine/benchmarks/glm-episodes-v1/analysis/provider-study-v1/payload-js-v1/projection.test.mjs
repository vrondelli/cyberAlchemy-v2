import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
import {projectMessage,projectPrompt,VIEW} from './projection.mjs';import {createPayloadAdapter} from './adapter.mjs';import {createPressureAdapter} from '../measured-pressure-episode-v1/adapter.mjs';import {stable,hash,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root)));
const make=(output={path:'note.md',utf8:'完整 🔬',nested:{extra:[false,null,3]}})=>{const body=stable(output);return {arguments:{path:'note.md',offset:0},authority_effect:'none',effect_calls:0,ok:true,output,output_bytes:Buffer.byteLength(body),output_sha256:hash(body),schema_version:'are.coding-agent-tool-result/v1',tool_name:'read-file'};};
const message=v=>({role:'tool',tool_call_id:'call-1',extra:'outer',content:stable(v)});
test('all H22 renders match independent Python projection exactly',()=>{
 const script=`import sys,json,pathlib\nsys.path.insert(0,'../payload-view-v1')\nfrom projection import project_prompt\nrows=[]\nfor p in sorted(pathlib.Path('../measured-pressure-episode-v1/live').glob('*/rendered.json')):\n for r in json.loads(p.read_text()):\n  projected,receipts=project_prompt(r['prompt']); rows.append({'original':r['prompt'],'projected':projected})\nprint(json.dumps(rows))`;
 const r=spawnSync('python3',['-c',script],{cwd:root,encoding:'utf8',maxBuffer:16000000});assert.equal(r.status,0,r.stderr);
 const rows=JSON.parse(r.stdout);assert.equal(rows.length,135);let projected=0;
 for(const row of rows){const a=projectPrompt(row.original);assert.equal(a.prompt,row.projected);projected+=a.receipts.filter(r=>r.projected).length;}
 assert.equal(projected,264);
 writeFileSync(new URL('parity-report.json',root),JSON.stringify({prompts:rows.length,projected_messages:projected,python_reference_sha256:hash(readFileSync(new URL('../payload-view-v1/projection.py',root))),provider_calls:0,open_questions_ref:'README.md'},null,2)+'\n');
});
test('all six frozen token comparisons reproduce measured projected request bytes',()=>{
 const {rows}=read('../payload-token-v1/prepared.json');let pairs=0;
 for(const a of rows.filter(r=>r.arm==='original')){const b=rows.find(r=>r.window===a.window&&r.condition===a.condition&&r.arm==='projected');assert.equal(projectPrompt(a.raw).prompt,b.raw);assert.equal(hash(b.raw),b.sha256);pairs++;}assert.equal(pairs,6);
});
test('whole-schema diagnostics and conservative unsupported input',()=>{
 const value={...make(),ok:false,effect_calls:'0',tool_name:3,unknown:1};delete value.arguments;
 const m=message(value),r=projectMessage(m);assert.equal(r.message,m);assert.ok(r.receipt.issues.length>=5);
 for(const patch of [{schema_version:'are.glm-file-page/v1'},{output_sha256:'0'.repeat(64)},{output_bytes:1},{effect_calls:true}]){const m=message({...make(),...patch});assert.equal(projectMessage(m).message,m);}
 for(const content of ['{"a":1,"a":2}','{','{"n":NaN}','x'.repeat(1048577)]){const m={role:'tool',content};assert.equal(projectMessage(m).message,m);}
});
test('complete unknown nested payloads, unicode, large bodies and idempotence',()=>{
 for(const output of [{path:'note.md',utf8:'完整 🔬',nested:{unfamiliar:[1,false,null]}},{utf8:'large source evidence\n'.repeat(15000)}]){
  const m=message(make(output)),before=structuredClone(m),r=projectMessage(m);assert.ok(r.receipt.projected);assert.deepEqual(m,before);
  const value=JSON.parse(r.message.content);assert.equal(value.schema_version,VIEW);assert.deepEqual(value.output,output);assert.deepEqual(value.arguments,JSON.parse(m.content).arguments);assert.equal(r.message.tool_call_id,m.tool_call_id);assert.equal(projectMessage(r.message).message,r.message);
  if(output.utf8.length>300000)assert.ok(r.receipt.removed_bytes<150);
 }
});
test('adapter decorates and records the same projected body for measurement and dispatch',()=>{
 const {rows}=read('../payload-token-v1/prepared.json'),input=rows[0].raw;
 for(const blocks of [0,64,109,154]){
  const base=createPressureAdapter('a'.repeat(64),blocks),candidate=createPayloadAdapter('a'.repeat(64),blocks),expected=projectPrompt(base.decorate(input)).prompt,actual=candidate.decorate(input);
  assert.equal(actual,expected);assert.equal(candidate.renders[0].prompt,actual);assert.equal(candidate.renders[0].tokenizer_request_sha256,hash(stable({model:MODEL,...JSON.parse(actual)})));
  assert.equal(candidate.projectionReceipts.length,1);const response={role:'assistant',content:'unchanged'};assert.equal(candidate.normalize(response),response);
 }
});
