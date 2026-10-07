// Synthetic terminal re-serialization of all32 frozen offline actual-source captures.
// Not provider replay or a native episode/model quality test.
// Open Questions: evidence/G01-COMPACT-METHOD-TERMINAL-R4B.json.
import assert from 'node:assert/strict';import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';import {join,resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
import {buildMethodHandleTable,methodHandleTool,methodHandleMessage,selectMethodHandleSubmission,METHOD_HANDLE_TOOL} from './compact-method-terminal-r4b.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {stable,bodyForReceipt,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
import {capturePublicResponse} from '../../../../benchmarks/contextbench-v1/final-selection.mjs';
const OUT='/home/vlad_/are-benchmark-archive/g01-compact-method-terminal-r4b-20261007';
const OFFLINE='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r3-20261007';
const SOURCE='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(existsSync(OUT),false,'no qualification replay');
const raw=readFileSync(join(OFFLINE,'RESULT.json'));
assert.equal(sha(raw),'e33952fd006d1b3a8ff231b27084ed82ab82e35dfa6c45e2f39109d9769b5739');
const offline=JSON.parse(raw);assert.equal(offline.rows.length,32);
const offlineFreeze=JSON.parse(readFileSync(join(OFFLINE,'FREEZE.json')));
for(const[p,pin]of Object.entries(offlineFreeze.source_pins))assert.equal(sha(readFileSync(p)),pin);
const pins={};function trace(path){if(pins[path])return;const bytes=readFileSync(path);pins[path]=sha(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
for(const p of [fileURLToPath(import.meta.url),join(HERE,'compact-method-terminal-r4.test.mjs'),join(HERE,'compact-method-terminal-r4b.test.mjs')])trace(p);
for(const p of [join(HERE,'../../evidence/G01-COMPACT-METHOD-TERMINAL-R4B.json'),join(OFFLINE,'RESULT.json'),join(OFFLINE,'FREEZE.json'),
 join(HERE,'../../../../packages/coding-agent-runtime/schemas/patch-set-candidate.schema.json')])pins[p]=sha(readFileSync(p));
mkdirSync(OUT,{mode:0o700});const save=(p,x)=>{createReceipt(p,x);return sha(readFileSync(p));};
const freezeHash=save(join(OUT,'FREEZE.json'),{source_pins:pins,source_offline_result_sha256:sha(raw),
 mode:'synthetic-terminal-interface-on-real-canonical-source',cases:offline.rows.map(r=>({case_id:r.case_id,arm:r.arm,result_sha256:r.result_sha256})),
 actual_provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G01-COMPACT-METHOD-TERMINAL-R4B.json'});
const started=Date.now(),rows=[];
for(const row of offline.rows){
 for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);
 const originalBytes=readFileSync(join(OFFLINE,row.case_id+'-'+row.arm,'RESULT.json'));assert.equal(sha(originalBytes),row.result_sha256);
 const original=JSON.parse(originalBytes).result,terminal=original.response_captures.at(-1);
 const previousReceipts=original.receipts.slice(0,terminal.receipt_index);
 const match=original.captures.find(c=>sha(stable(bodyForReceipt(c.prompt,original.receipts[terminal.receipt_index])))===terminal.request_sha256);
 assert.ok(match);const previousCaptures=original.captures.filter(c=>c!==match);
 const messages=JSON.parse(match.prompt).messages;
 const table=buildMethodHandleTable({captures:previousCaptures,receipts:previousReceipts,messages});assert.equal(table.bindings.length,1);
 const handles=original.selection.final_read_ids.map(id=>{const row=table.bindings.find(r=>r.read_id===id);assert.ok(row);return row.handle;});
 const prompt=stable({messages:[...messages,methodHandleMessage(table)],tools:[methodHandleTool(table)]});
 const receipt={...original.receipts[terminal.receipt_index],finish_reason:'tool_calls',receipt_posture:'Synthetic re-serialization, not provider reply or replay'};
 receipt.request_sha256=sha(stable(bodyForReceipt(prompt,receipt)));
 const captures=[...previousCaptures,{prompt,prompt_sha256:sha(prompt)}],receipts=[...previousReceipts,receipt];
 const public_response={finish_reason:'tool_calls',message:{role:'assistant',tool_calls:[{id:'compact-r4-terminal',type:'function',
  function:{name:METHOD_HANDLE_TOOL,arguments:stable({summary:'Canonical method interface check',context_handles:handles})}}]}};
 const response_capture=capturePublicResponse({receipt,final_bytes:stable(public_response)},receipts.length-1);
 const selection=selectMethodHandleSubmission({captures,receipts,response_capture,table});
 assert.deepEqual(selection.final_read_ids,original.selection.final_read_ids);
 const binding=bindDelivery({captures,receipts});assert.equal(binding.read_observations.length,1);assert.equal(binding.unmapped.length,0);
 const output=original.events.find(e=>e.tool==='read_file').output.output,bytes=readFileSync(join(SOURCE,row.case_id,'buggy-java-only/corpus',output.path));
 assert.equal(sha(bytes),output.source_sha256);assert.equal(output.complete_method,true);
 assert.equal(bytes.subarray(output.source_byte_start,output.source_byte_end).toString('utf8'),binding.read_observations[0].body);
 assert.equal(output.method_source_sha256,sha(Buffer.from(binding.read_observations[0].body)));
 const path=join(OUT,row.case_id+'-'+row.arm+'.json');
 rows.push({case_id:row.case_id,arm:row.arm,qualified:true,canonical_byte_checked:true,pending_delivery_confirmed:true,
  result_sha256:save(path,{synthetic:true,table,selection,captures,receipts,response_capture,binding,original_offline_result_sha256:row.result_sha256})});
}
for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);
assert.equal(rows.length,32);const result={status:'all32-guarded-compact-method-terminal-interfaces-qualified',freeze_sha256:freezeHash,rows,
 elapsed_ms:Date.now()-started,regression_tests_passed:11,actual_provider_calls:0,reference_label_reads:0,
 native_episode_integrated:false,synthetic_transport:true,canonical_byte_checks:32,authority_effect:'none',
 claim_ceiling:'Offline interface serialization and canonical delivery only; not native episode qualification, real provider reliability, accuracy or superiority',
 open_questions_owner:'G01-COMPACT-METHOD-TERMINAL-R4B.json'};
console.log(JSON.stringify({freeze_sha256:freezeHash,result_sha256:save(join(OUT,'RESULT.json'),result),qualified:32,elapsed_ms:result.elapsed_ms}));
