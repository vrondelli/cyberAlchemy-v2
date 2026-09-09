// Explicitly authored visible-evidence adapters; no hidden oracle imports.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
export function publicCheckPlan(episode,casesPath) {
 const path=resolve(casesPath),bytes=readFileSync(path),doc=JSON.parse(bytes);
 const evidence=(selector,value)=>({path,selector,value_sha256:hash(JSON.stringify(value))});
 const checks=[],add=(id,export_name,args,expected,selector,value)=>checks.push({id,export_name,args,expected,evidence:[evidence(selector,value)]});
 if(['retention-long-window','retention-tool-pairs'].includes(episode)) {
  for(const [i,e] of doc.examples.slice(0,8).entries()) {
   const history=[{messages:[{role:e.assistant_role,tool_calls:e.assistant_call_ids.map(id=>({id,type:'function',function:{name:'read_file',arguments:'{}'}}))},...e.tool_result_ids.map((id,n)=>({role:e.tool_result_roles[n],tool_call_id:id,content:e.tool_result_contents[n]}))]}];
   add(`pair-${i}`,'projectObservations',[history,'c'.repeat(64),1],e.should_accept?{ok:true,value:history}:{ok:false,error:'retention-tool-pair-invalid'},`/examples/${i}`,e);
  }
  // Authored boundary interpretation of "array of at most twelve", not a hidden-oracle input.
  add('empty-history','projectObservations',[[],'c'.repeat(64),1],{ok:true,value:[]},'/requirements/0',doc.requirements[0]);
 } else if(episode==='archive-slice-bounds') {
  const e=doc.examples[0];
  add('end-boundary','sliceInspection',[e.text,e.offset,e.max_chars],{ok:true,value:{offset_unit:'utf16-code-units',offset:e.offset,next_offset:e.offset+e.expected_utf8.length,total_chars:e.text.length,eof:e.offset+e.expected_utf8.length===e.text.length,utf8:e.expected_utf8}},'/examples/0',e);
  add('start-boundary','sliceInspection',[e.text,3,2],{ok:false,error:'inspection-range-splits-unicode'},'/examples/0/explanation',e.explanation);
  add('no-progress','sliceInspection',['😀',0,1],{ok:false,error:'inspection-range-splits-unicode'},'/requirements/2',doc.requirements[2]);
 } else if(episode==='exact-json-scoring') {
  for(const [i,e] of doc.examples.slice(0,8).entries())add(`json-${i}`,'scoreResponse',[{expected:e.expected_object},e.candidate_json],{ok:true,value:{passed:e.should_pass,reason:e.should_pass?'exact_json_match':'answer_mismatch'}},`/examples/${i}`,e);
 } else throw new Error('public-check-episode-unsupported');
 return {schema_version:'are.public-case-plan/v1',authority_effect:'none',sources:[{path,sha256:hash(bytes)}],checks,open_questions_ref:'PUBLIC-VALIDATION.md#open-questions'};
}
