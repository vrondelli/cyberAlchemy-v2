// Exact phase-aware audit successor and all32 offline reconstruction; no labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R5.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {checkCanonicalMethodObservation,selectEpisodeTerminal} from './audit-native-method-live-r5.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r5-20261007';
test('r5 audit changes only campaign identity, selection helper and strict phase binding',()=>{
 let source=read('audit-native-method-live-r4.mjs');assert.equal(sha(source),'bc2197843212d6a546db45ee32e51f02923b0ca7f7420c5dc4ce6fd3e870c1ab');
 source=source.replaceAll('r4','r5').replaceAll('R4','R5').replaceAll('g02-product-r5','g02-product-r4');
 for(const[a,b]of [["'./compact-method-terminal-r5b.mjs'","'./method-selection-terminal-r5.mjs'"],["return selectMethodHandleSubmission({...episode,response_capture,table:presentation.table});","assert.equal(typeof presentation.finalizing,'boolean');\n return selectMethodHandleSubmission({...episode,response_capture,table:presentation.table,finalizing:presentation.finalizing});"]]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 assert.equal(read('audit-native-method-live-r5.mjs'),source);
});
test('all32 acquisition-first terminals reconstruct original IDs; presentation/table corruption rejects',()=>{
 const campaign=JSON.parse(readFileSync(root+'/RESULT.json'));
 for(const row of campaign.rows){const bytes=readFileSync(root+'/'+row.case_id+'-'+row.arm+'/RESULT.json');assert.equal(sha(bytes),row.result_sha256);
  const episode=JSON.parse(bytes).result;assert.deepEqual(selectEpisodeTerminal(episode).final_read_ids,episode.selection.final_read_ids);
  const bad=structuredClone(episode);bad.method_handle_presentations.at(-1).receipt_index++;
  assert.throws(()=>selectEpisodeTerminal(bad));
  const changed=structuredClone(episode);changed.method_handle_presentations.at(-1).table.bindings[0].read_id='0'.repeat(64);
  assert.throws(()=>selectEpisodeTerminal(changed));
  const phase=structuredClone(episode);phase.method_handle_presentations.at(-1).finalizing=!phase.method_handle_presentations.at(-1).finalizing;assert.throws(()=>selectEpisodeTerminal(phase));
  const missing=structuredClone(episode);delete missing.method_handle_presentations.at(-1).finalizing;assert.throws(()=>selectEpisodeTerminal(missing));
 }
});
test('canonical audit still rejects self-consistent partial method bytes',()=>{
 const bytes=Buffer.from('prefix void f() {} suffix'),body=bytes.subarray(7,18);
 const record={path:'A.java',source_sha256:sha(bytes),methods:[{entity_id:'m',span:{complete:true,start_utf8:7,end_utf8:18,start_line:1,end_line:1,source:body.toString()}}]};
 const o={path:'A.java',method_id:'m',source_sha256:sha(bytes),method_source_sha256:sha(body),source_byte_start:7,source_byte_end:18,start_line:1,end_line:1,utf8:body.toString(),byte_count:body.length,complete_method:true};
 checkCanonicalMethodObservation(o,bytes,record);const partial=bytes.subarray(7,17);
 assert.throws(()=>checkCanonicalMethodObservation({...o,source_byte_end:17,utf8:partial.toString(),byte_count:partial.length,method_source_sha256:sha(partial)},bytes,record));
});
