// Exact compact audit adaptation and frozen all32 reconstruction, no labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R4.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {checkCanonicalMethodObservation,selectEpisodeTerminal} from './audit-native-method-live-r4.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r4-20261007';
test('compact auditor retains exact frozen request/accounting/source validation apart from terminal seam',()=>{
 let source=read('audit-native-method-live-r3.mjs');assert.equal(sha(source),'c8f0c74e46bff8892895fd5c79d5cfe4d9b34ff475ba7ec9b04d2e58f60b0b6b');
 source=source.replaceAll('r3','r4').replaceAll('R3','R4');
 for(const[a,b]of [
  ["import {selectFinalReads,selectTerminalSubmission} from '../../../../benchmarks/contextbench-v1/final-selection.mjs';","import {selectMethodHandleSubmission} from './compact-method-terminal-r4b.mjs';"],
  ["return (response_capture?.public_response?.message?.tool_calls?.length?selectTerminalSubmission:selectFinalReads)({...episode,response_capture});","const presentation=episode.method_handle_presentations.at(-1);\n assert.equal(presentation.request_sha256,response_capture.request_sha256);\n assert.equal(presentation.receipt_index,response_capture.receipt_index);\n return selectMethodHandleSubmission({...episode,response_capture,table:presentation.table});"],
  ['assert.deepEqual(selection.final_read_ids,episode.selection.final_read_ids);','assert.deepEqual(selection.final_read_ids,episode.selection.final_read_ids);\n  assert.equal(selection.handle_table_sha256,episode.selection.handle_table_sha256);']
 ]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 assert.equal(read('audit-native-method-live-r4.mjs'),source);
});
test('all32 compact terminals reconstruct original IDs; presentation/table corruption rejects',()=>{
 const campaign=JSON.parse(readFileSync(root+'/RESULT.json'));
 for(const row of campaign.rows){const bytes=readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json');assert.equal(sha(bytes),row.result_sha256);
  const episode=JSON.parse(bytes).result;assert.deepEqual(selectEpisodeTerminal(episode).final_read_ids,episode.selection.final_read_ids);
  const bad=structuredClone(episode);bad.method_handle_presentations.at(-1).receipt_index++;
  assert.throws(()=>selectEpisodeTerminal(bad));
  const changed=structuredClone(episode);changed.method_handle_presentations.at(-1).table.bindings[0].read_id='0'.repeat(64);
  assert.throws(()=>selectEpisodeTerminal(changed));
 }
});
test('canonical audit still rejects self-consistent partial method bytes',()=>{
 const bytes=Buffer.from('prefix void f() {} suffix'),body=bytes.subarray(7,18);
 const record={path:'A.java',source_sha256:sha(bytes),methods:[{entity_id:'m',span:{complete:true,start_utf8:7,end_utf8:18,start_line:1,end_line:1,source:body.toString()}}]};
 const o={path:'A.java',method_id:'m',source_sha256:sha(bytes),method_source_sha256:sha(body),source_byte_start:7,source_byte_end:18,start_line:1,end_line:1,utf8:body.toString(),byte_count:body.length,complete_method:true};
 checkCanonicalMethodObservation(o,bytes,record);const partial=bytes.subarray(7,17);
 assert.throws(()=>checkCanonicalMethodObservation({...o,source_byte_end:17,utf8:partial.toString(),byte_count:partial.length,method_source_sha256:sha(partial)},bytes,record));
});
