// Synthetic inputs only; no model, VPS, repository source or reference labels.
// Open Questions: evidence/G02-QUERY-EXPANSION-SCREEN-R1.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from './vps-json-provider-r1.mjs';
import {providerBody} from './wsl-vps-provider-r1.mjs';
import {createQueryExpansionRequest,parseQueryExpansionReply,projectExpandedLeads} from './query-expansion-source-r1.mjs';
const input=createQueryExpansionRequest({request_id:'synthetic-expansion',problem_statement:'Preserve decimal precision.'});
const reply=(content='{"queries":["decimal formatting precision"]}')=>({
 schema_version:'are.private-vps-provider-reply/v1',operation:'generate',request_id:input.request_id,
 request_sha256:hash(providerBody(input)),dispatched:true,automatic_retries:0,redirects_followed:0,
 status:200,failure_code:null,prompt_tokens:100,completion_tokens:20,
 public_response:{message:{role:'assistant',content}}});
const source=path=>{const utf8=Array.from({length:40},(_,i)=>'line '+(i+1)).join('\n');return{path,utf8,source_sha256:hash(utf8)};};
test('planner preserves issue bytes and fixes output budget, with no tool or label inputs',()=>{
 const text='  Issue\nwith original whitespace.\n';
 const r=createQueryExpansionRequest({request_id:'synthetic-2',problem_statement:text});
 assert.equal(r.messages[1].content,text);assert.equal(r.output_cap,512);assert.deepEqual(r.tools,[]);
 assert.throws(()=>createQueryExpansionRequest({request_id:'x',problem_statement:'x',gold:[]}));
 assert.throws(()=>createQueryExpansionRequest({request_id:'x',problem_statement:'x'.repeat(24577)}));
});
test('only bound successful public JSON with known usage is admitted',()=>{
 assert.deepEqual(parseQueryExpansionReply(reply(),input).queries,['decimal formatting precision']);
 assert.equal(parseQueryExpansionReply(reply(),input).known_model_tokens,120);
 for(const extra of [{request_id:'wrong'},{request_sha256:'bad'},{dispatch_uncertain:true,dispatched:null},
  {status:503},{prompt_tokens:null},{completion_tokens:null}])assert.throws(()=>parseQueryExpansionReply({...reply(),...extra},input));
});
test('rejects fenced JSON, extra fields, duplicate and oversized queries without repair',()=>{
 for(const text of ['```json\n{"queries":["x"]}\n```','{"queries":["x"],"evidence":[]}',
  '{"queries":[]}','{"queries":["x","X"]}',JSON.stringify({queries:['x'.repeat(161)]}),
  JSON.stringify({queries:['a','b','c','d']})])assert.throws(()=>parseQueryExpansionReply(reply(text),input));
});
test('bounded source projection verifies digests and preserves exact intervals',()=>{
 const r=projectExpandedLeads({queries:['one','two'],queryRanker:q=>({hints:[{path:q+'.py',start_line:8,end_line:20}]}),resolveSource:source});
 assert.equal(r.leads.length,2);assert.equal(r.leads[0].start_line,8);assert.equal(r.leads[0].end_line,24);
 assert.equal(r.leads[0].source_sha256,source('one.py').source_sha256);assert.equal(r.authority_effect,'none');
});
test('unsafe paths never reach resolver; incorrect source and bounds are rejected',()=>{
 let calls=0;const r=projectExpandedLeads({queries:['one'],queryRanker:()=>({hints:[
  {path:'../secret',start_line:1,end_line:2},{path:'bad.py',start_line:1,end_line:2},
  {path:'outside.py',start_line:1,end_line:80}]}),resolveSource:p=>{calls++;return p==='bad.py'?{...source(p),source_sha256:'bad'}:source(p);}});
 assert.equal(calls,2);assert.equal(r.leads.length,0);assert.deepEqual(r.rejections.map(x=>x.reason),
  ['invalid-source-hint','source-not-verified','source-range-outside-base']);
});
test('deduplicates intervals, admits at most one lead per query and shifts safely at EOF',()=>{
 const r=projectExpandedLeads({queries:['one','two'],queryRanker:()=>({hints:[
  {path:'same.py',start_line:35,end_line:40},{path:'next.py',start_line:1,end_line:9}]}),resolveSource:source});
 assert.equal(r.leads.length,2);assert.deepEqual(r.leads.map(x=>x.path),['same.py','next.py']);
 assert.equal(r.leads[0].start_line,24);assert.equal(r.leads[0].end_line,40);
 assert.equal(r.rejections[0].reason,'duplicate-source-interval');
});
test('rejects oversized ranker pools and projection settings',()=>{
 assert.throws(()=>projectExpandedLeads({queries:['x'],queryRanker:()=>({hints:Array(9).fill({})}),resolveSource:source}));
 assert.throws(()=>projectExpandedLeads({queries:['x'],queryRanker:()=>({hints:[]}),resolveSource:source,width:18}));
});
test('retains partial-index evidence instead of implying a complete repository search',()=>{
 const r=projectExpandedLeads({queries:['x'],queryRanker:()=>({hints:[],indexed_files:2,
  indexed_bytes:800,omitted_files:5,partial_index:true}),resolveSource:source});
 assert.deepEqual(r.ranker_queries,[{query_index:0,indexed_files:2,indexed_bytes:800,omitted_files:5,partial_index:true}]);
});
