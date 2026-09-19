// Offline exploratory codec only; never imported by a runner. Open questions: COMPARISON-PAYLOAD-RESEARCH.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const dir=import.meta.dirname,hash=b=>createHash('sha256').update(b).digest('hex'),bytes=v=>Buffer.byteLength(stable(v));
const sourceKeys=['base_commit','path','source_revision','source_sha256','total_lines'];
function encode(value){
 const packet=structuredClone(value),sources=[],byKey=new Map();
 assert.ok(Array.isArray(packet.output.observations));
 packet.output.observations=packet.output.observations.map(obs=>{
  const source=Object.fromEntries(sourceKeys.map(k=>{assert.ok(Object.hasOwn(obs,k));return [k,obs[k]];})),key=stable(source);
  let source_ref=byKey.get(key);if(source_ref===undefined){source_ref=sources.length;byKey.set(key,source_ref);sources.push(source);}
  const row=Object.fromEntries(Object.entries(obs).filter(([k])=>!sourceKeys.includes(k)));
  assert.ok(!Object.hasOwn(row,'source_ref')&&!Object.hasOwn(row,'derived_retrieval_handle'));
  if(row.retrieval_handle==='observed-read:'+row.read_id){delete row.retrieval_handle;row.derived_retrieval_handle=true;}
  return {source_ref,...row};
 });
 assert.ok(!Object.hasOwn(packet.output,'observation_encoding')&&!Object.hasOwn(packet.output,'sources'));
 packet.output.sources=sources;packet.output.observation_encoding='source-dictionary-v1';return packet;
}
function decode(value){
 const packet=structuredClone(value),sources=packet.output.sources;
 assert.equal(packet.output.observation_encoding,'source-dictionary-v1');
 packet.output.observations=packet.output.observations.map(({source_ref,derived_retrieval_handle,...row})=>{
  assert.ok(sources[source_ref]);if(derived_retrieval_handle)row.retrieval_handle='observed-read:'+row.read_id;
  return {...sources[source_ref],...row};
 });delete packet.output.sources;delete packet.output.observation_encoding;return packet;
}
const evidence=[],cases=[];
for(const slot of ['00','02']){
 const path=join(dir,'comparison-production-live-r1/runs_root',slot,'events.jsonl'),raw=readFileSync(path);evidence.push({path,sha256:hash(raw)});
 for(const [line,text]of raw.toString().trim().split(String.fromCharCode(10)).entries()){
  const event=JSON.parse(text),value=event.output;
  if(event.kind!=='source-tool-result'||!Array.isArray(value?.output?.observations)||value.output.observations.length===0)continue;
  const encoded=encode(value);assert.deepEqual(decode(encoded),value);
  const sample=structuredClone(value);sample.output.observations[0].future_field={preserve:'unknown metadata'};sample.output.observations[0].retrieval_handle='custom-handle';assert.deepEqual(decode(encode(sample)),sample);
  const original_bytes=bytes(value),encoded_bytes=bytes(encoded),observations=value.output.observations;
  const pages=[1,5,10].filter(n=>n<observations.length).map(n=>{
   const page=structuredClone(value);page.output.observations=page.output.observations.slice(0,n);
   const args=JSON.parse(event.call.function.arguments);page.output.next_offset=args.offset+n;
   return {retained_observations:n,bytes:bytes(page),remaining_observations:observations.length-n,claim:'Smaller page omits observations; full retrieval requires additional calls.'};
  });
  cases.push({slot,journal_line:line+1,tool:event.call.function.name,observation_count:observations.length,unique_sources:encoded.output.sources.length,source_text_bytes:observations.reduce((n,o)=>n+Buffer.byteLength(o.utf8),0),original_bytes,encoded_bytes,byte_reduction:1-encoded_bytes/original_bytes,lossless_round_trip:true,pages});
 }
}
assert.ok(cases.length>0);const report={schema:'are.comparison-tool-payload-analysis/v1',evidence,cases,provider_calls:0,model_tokens_measured:false,production_implementation_changed:false,claim_ceiling:'Byte diagnostics on exposed failed-run traces; no tokenizer, fit, quality, causal or savings claim.',open_questions_ref:'COMPARISON-PAYLOAD-RESEARCH.md'};
const out=join(dir,'COMPARISON-TOOL-PAYLOAD-ANALYSIS-R1.json');writeFileSync(out,JSON.stringify(report,null,2)+String.fromCharCode(10),{flag:'wx'});
console.log(JSON.stringify({cases:cases.length,first:cases[0],provider_calls:0}));
