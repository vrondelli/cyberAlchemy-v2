// Exact audit adaptation, complete-declaration corruption and terminal reconstruction.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R3.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {checkCanonicalMethodObservation,selectEpisodeTerminal} from './audit-native-method-live-r3.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=x=>createHash('sha256').update(x).digest('hex');
test('r3 audit preserves accounting/receipt validation and adds only declared terminal/canonical seams',()=>{
 let source=read('audit-native-method-live-r2.mjs');assert.equal(sha(source),'859abe2044ea053af9c48aae25aeb6632ca14fa9f08b483c3a3514250aa72679');
 source=source.replaceAll('G01-NATIVE-METHOD-LIVE-R2.json','G01-NATIVE-METHOD-LIVE-R3.json')
  .replace('g01-native-method-live-r2-20261007','g01-native-method-live-r3-20261007').replace("'g01-native-method-r2-'+n","'g01-native-method-r3-'+n");
 for(const[a,b]of [["import {selectFinalReads}","import {selectFinalReads,selectTerminalSubmission}"],["const SOURCE=","const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';\nconst SOURCE="],["export function audit(){","export function checkCanonicalMethodObservation(output,bytes,record){\n checkCanonicalObservation(output,bytes);\n assert.equal(output.path,record.path);assert.equal(output.source_sha256,record.source_sha256);\n const method=record.methods.find(m=>m.entity_id===output.method_id);assert.ok(method);\n assert.equal(method.span.complete,true);assert.equal(output.source_byte_start,method.span.start_utf8);\n assert.equal(output.source_byte_end,method.span.end_utf8);assert.equal(output.start_line,method.span.start_line);\n assert.equal(output.end_line,method.span.end_line);assert.equal(output.utf8,method.span.source);\n}\nexport function selectEpisodeTerminal(episode){\n const response_capture=episode.response_captures.at(-1);\n return (response_capture?.public_response?.message?.tool_calls?.length?selectTerminalSubmission:selectFinalReads)({...episode,response_capture});\n}\nexport function audit(){"],["const sequences=[],totals={baseline:0,index:0};","const index=read(join(INDEX,'RESULT.json'),'4476e7072b6117bc7c7c8bae481f85e1496e8c7b535dfcd520ef46b3b2443f56');\n const canonicalCases=new Map(index.rows.map(r=>[r.case_id,r])),catalogs=new Map();\n const catalog=caseId=>{\n  if(!catalogs.has(caseId)){const bytes=readFileSync(join(INDEX,caseId,'PARSER-OUTPUT.jsonl'));\n   assert.equal(sha(bytes),canonicalCases.get(caseId).parser_output_sha256);\n   catalogs.set(caseId,new Map(bytes.toString('utf8').trimEnd().split('\\n').map(JSON.parse).map(r=>[r.path,r])));}\n  return catalogs.get(caseId);\n };\n const sequences=[],totals={baseline:0,index:0};"],["const selection=selectFinalReads({...episode,response_capture:episode.response_captures.at(-1)});","const selection=selectEpisodeTerminal(episode);"],["checkCanonicalObservation(output,readFileSync(path));checked=true;","checkCanonicalMethodObservation(output,readFileSync(path),catalog(row.case_id).get(output.path));checked=true;"],["limitation:'Separate receipt/source audit reuses frozen native final-selection/delivery primitives; not an independent semantic correctness oracle.'","limitation:'Canonical index extents and complete bytes verified for confirmed reads in valid episodes only. Reuses native terminal/delivery primitives; not an independent semantic correctness oracle.'"]]){assert.equal(source.split(a).length,2,a);source=source.replace(a,()=>b);}
 assert.equal(read('audit-native-method-live-r3.mjs'),source);
});
test('canonical method audit rejects self-consistent partial bytes and invented method coordinates',()=>{
 const bytes=Buffer.from('prefix void f() {} suffix'),body=bytes.subarray(7,18);
 const record={path:'A.java',source_sha256:sha(bytes),methods:[{entity_id:'m',span:{complete:true,start_utf8:7,end_utf8:18,start_line:1,end_line:1,source:body.toString()}}]};
 const o={path:'A.java',method_id:'m',source_sha256:sha(bytes),method_source_sha256:sha(body),source_byte_start:7,source_byte_end:18,
  start_line:1,end_line:1,utf8:body.toString(),byte_count:body.length,complete_method:true};
 checkCanonicalMethodObservation(o,bytes,record);
 const partial=bytes.subarray(7,17);
 assert.throws(()=>checkCanonicalMethodObservation({...o,source_byte_end:17,utf8:partial.toString(),byte_count:partial.length,method_source_sha256:sha(partial)},bytes,record));
 assert.throws(()=>checkCanonicalMethodObservation({...o,method_id:'invented'},bytes,record));
});
test('auditor reconstructs both prospectively allowed terminal forms from frozen offline captures',()=>{
 for(const root of ['g01-native-method-episode-r2-20261007','g01-native-method-episode-r3-20261007']){
  const saved=JSON.parse(readFileSync('/home/vlad_/are-benchmark-archive/'+root+'/Defects4J-Cli-5-baseline/RESULT.json'));
  assert.deepEqual(selectEpisodeTerminal(saved.result).final_read_ids,saved.result.selection.final_read_ids);
 }
});
