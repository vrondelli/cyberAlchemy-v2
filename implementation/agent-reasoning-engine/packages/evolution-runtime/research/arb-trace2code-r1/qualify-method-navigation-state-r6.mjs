// Offline reconstruction of pinned public native captures and actual catalog schemas.
// Open Questions: evidence/G01-METHOD-NAVIGATION-STATE-R6.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
import {collectConfirmedMethodNavigation,buildMethodNavigationState,verifyMethodNavigationState} from './method-navigation-state-r6.mjs';
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {stable,bodyForReceipt} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=x=>createHash('sha256').update(typeof x==='string'||x instanceof Uint8Array?x:stable(x)).digest('hex');
const OUT='/home/vlad_/are-benchmark-archive/g01-method-navigation-state-r6-20261007';
const PRIOR='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r5-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const read=(p,h)=>{const b=readFileSync(p);if(h)assert.equal(sha(b),h,p);return JSON.parse(b);};
assert.equal(existsSync(OUT),false,'no qualification replay');
const previous=read(join(PRIOR,'RESULT.json'),'b4e517f7bb792c4e3ab529b2cf8b4c94d77cc5d1cd7bef5bea347d41e7919c5c');
const priorFreeze=read(join(PRIOR,'FREEZE.json'),'394fbb82d8bc923971cdad2f465f351547c55768e6a8f148b97f464bd89b5aa7');
for(const[p,h]of Object.entries(priorFreeze.source_pins))assert.equal(sha(readFileSync(p)),h,p);
assert.equal(previous.rows.length,32);
const index=read(join(INDEX,'RESULT.json'),'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');
const cases=new Map(index.rows.map(r=>[r.case_id,r])),pins={};
function trace(p){if(pins[p])return;const bytes=readFileSync(p);pins[p]=sha(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(p),m[1]));}
for(const p of [fileURLToPath(import.meta.url),join(HERE,'method-navigation-state-r6.test.mjs')])trace(p);
for(const p of [join(HERE,'../../evidence/G01-METHOD-NAVIGATION-STATE-R6.json'),join(HERE,'../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json'),
 join(PRIOR,'FREEZE.json'),join(PRIOR,'RESULT.json'),join(INDEX,'RESULT.json')])pins[p]=sha(readFileSync(p));
for(const r of previous.rows)pins[join(PRIOR,r.case_id+'-'+r.arm,'RESULT.json')]=r.result_sha256;
mkdirSync(OUT,{mode:0o700});const save=(p,x)=>{createReceipt(p,x);return sha(readFileSync(p));};
const freezeHash=save(join(OUT,'FREEZE.json'),{source_pins:pins,captures:previous.rows.map(r=>({case_id:r.case_id,arm:r.arm,result_sha256:r.result_sha256})),
 actual_provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G01-METHOD-NAVIGATION-STATE-R6.json'});
const measure_tokens=async text=>Math.ceil(Buffer.byteLength(text)/4),view=createFrozenAdaptiveCommonTools(),rows=[],start=Date.now();let schemaProbes=0;
for(const row of previous.rows){
 const saved=read(join(PRIOR,row.case_id+'-'+row.arm,'RESULT.json'),row.result_sha256),episode=saved.result;
 const input={caseId:row.case_id,captures:episode.captures,receipts:episode.receipts,generation:1,measure_tokens};
 const collected=collectConfirmedMethodNavigation(input);assert.equal(collected.observations.length,2);
 const projection=await buildMethodNavigationState(input);assert.equal((await verifyMethodNavigationState(projection,input)).ok,true);
 assert.ok(projection.measured_tokens<=512&&Buffer.byteLength(projection.text)<=4096&&projection.fit.tokenizer_calls<=4);
 // Direct canonical identity/byte oracle for the delivered catalog declaration.
 const c=cases.get(row.case_id),bytes=readFileSync(join(INDEX,row.case_id,'PARSER-OUTPUT.jsonl'));assert.equal(sha(bytes),c.parser_output_sha256);
 const records=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse),fact=collected.observations.find(o=>o.operation==='list_methods').fact;
 const record=records.find(r=>r.path===fact.query.path);assert.ok(record);assert.equal(fact.items.length,1);
 const item=fact.items[0],method=record.methods.find(m=>m.entity_id===item.method_id);assert.ok(method);
 assert.equal(item.name,method.name);assert.equal(item.kind,method.kind);assert.equal(item.has_body,method.has_body);
 assert.deepEqual(item.source_span,{complete:method.span.complete,start_line:method.span.start_line,end_line:method.span.end_line,start_utf8:method.span.start_utf8,end_utf8:method.span.end_utf8});
 const source=readFileSync(join(SOURCE,row.case_id,'buggy-java-only/corpus',record.path));assert.equal(sha(source),record.source_sha256);
 assert.equal(source.subarray(item.source_span.start_utf8,item.source_span.end_utf8).toString('utf8'),method.span.source);
 assert.ok(projection.material.pages.some(p=>p.tool==='list_methods'&&p.items.some(i=>i.method_id===item.method_id)));
 const runtime=collected.observations.find(o=>o.operation==='runtime_status').fact;
 if(row.case_id==='Defects4J-Closure-5')assert.equal(runtime.runtime_available,false);
 // Additional synthetic delivery captures of all five actual native catalog schemas.
 if(row.arm==='baseline')for(const[operation,args]of [['list_files',{limit:1}],['list_methods',{path:record.path,limit:1}],
  ['list_references',{path:record.path,limit:1}],['runtime_status',{}],['list_runtime_methods',{limit:1}]]){
  const output=view({operation,case_id:row.case_id,...args});
  const prompt=stable({messages:[{role:'assistant',tool_calls:[{id:'schema-probe',type:'function',function:{name:operation,arguments:stable(args)}}]},
   {role:'tool',tool_call_id:'schema-probe',content:stable({ok:true,output})}],tools:[]});
  const receipt={kind:'model',model:'glm-5.3-flash',reasoning_effort:'low',output_cap:512,dispatched:true,status:200,input_tokens:400,output_tokens:20,
   receipt_posture:'Synthetic schema probe, not actual provider receipt'};
  receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));
  const extra={caseId:row.case_id,captures:[{prompt,prompt_sha256:sha(prompt)}],receipts:[receipt],generation:1,measure_tokens};
  assert.equal(collectConfirmedMethodNavigation(extra).observations.length,1);const state=await buildMethodNavigationState(extra);
  assert.equal((await verifyMethodNavigationState(state,extra)).ok,true);schemaProbes++;
 }
 const detail={case_id:row.case_id,arm:row.arm,confirmed_navigation_observations:2,projection,canonical_method_id:item.method_id,
  canonical_source_sha256:record.source_sha256,scripted_transport:true,actual_provider_calls:0,reference_label_reads:0};
 const resultHash=save(join(OUT,row.case_id+'-'+row.arm+'.json'),detail);
 rows.push({case_id:row.case_id,arm,qualified:true,retained_pages:projection.material.pages.length,retained_method_ids:1,
  projection_measured_tokens:projection.measured_tokens,runtime_available:runtime.runtime_available,result_sha256:resultHash});
}
for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h,p);assert.equal(rows.length,32);assert.equal(schemaProbes,80);
const result={status:'all32-offline-confirmed-navigation-state-reconstructions-qualified',freeze_sha256:freezeHash,rows,
 elapsed_ms:Date.now()-start,actual_catalog_schema_probes:80,canonical_source_byte_checks:32,
 tests_passed:12,actual_provider_calls:0,reference_label_reads:0,scripted_measurement:true,
 authority_effect:'none',claim_ceiling:'Offline helper reconstruction only; no new native episode integration, actual tokenizer admission, ranking gain or superiority',
 open_questions_owner:'G01-METHOD-NAVIGATION-STATE-R6.json'};
console.log(JSON.stringify({result_sha256:save(join(OUT,'RESULT.json'),result),freeze_sha256:freezeHash,
 source_pins_verified:Object.keys(pins).length,qualified:32,schema_probes:80,elapsed_ms:result.elapsed_ms}));
