// Offline byte attribution; no providers, gold, or text disclosure. Open questions: INPUT-ATTRIBUTION.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const root=resolve(import.meta.dirname,'../../../../../..'),v1=resolve(import.meta.dirname,'../../dual-benchmark-8k-v1');
const read=p=>JSON.parse(readFileSync(p)),hash=s=>createHash('sha256').update(s).digest('hex'),bytes=x=>Buffer.byteLength(typeof x==='string'?x:stable(x));
const bind=p=>({path:relative(root,p),sha256:hash(readFileSync(p))});
const source=resolve(v1,'AMENDED-RESULTS.json'),prior=read(source).benchmarks.contextbench,rows=[];
const names=['system','user','assistant','tool','other','tools_schema','serialization_framing'];
for(const row of prior.rows)for(const arm of ['control','treatment']){
 const lane=row.stage===2?'amended-live/stage2':row.task_id==='contextbench-4'?'amended-live/first-exposure-cb4':'live/stage1';
 const path=resolve(v1,lane,'pairs',row.task_id,'run',arm,'result.json'),r=read(path),model=r.receipts.filter(x=>x.kind==='model'&&x.dispatched);
 const category=Object.fromEntries(names.map(n=>[n,0])),repeated=Object.fromEntries(names.map(n=>[n,0])),seen=new Set(),seenSources=new Set(),profiles=new Map();
 let matched=0,promptBytes=0,wireBytes=0,sourceBytes=0,repeatedSourceBytes=0,sourceAppearances=0,reasoningFieldBytes=0;
 const missing=[];
 for(const [call,receipt]of model.entries()){
  const profile=stable([receipt.model,receipt.output_cap,receipt.reasoning_effort]);
  if(!profiles.has(profile)){const map=new Map();for(const c of r.captures??[]){const wire=stable(bodyForReceipt(c.prompt,receipt));map.set(hash(wire),{prompt:c.prompt,wire});}profiles.set(profile,map);}
  const capture=profiles.get(profile).get(receipt.request_sha256);
  if(!capture){missing.push({model_call:call,finish_reason:receipt.finish_reason??null,status:receipt.status??null});continue;}
  matched++;const parsed=JSON.parse(capture.prompt),n=bytes(capture.prompt);promptBytes+=n;wireBytes+=bytes(capture.wire);
  let assigned=0;const thisSeen=new Set(),thisSources=new Set();
  const add=(kind,value)=>{const size=bytes(value),key=kind+':'+hash(stable(value));category[kind]+=size;assigned+=size;if(seen.has(key))repeated[kind]+=size;thisSeen.add(key);};
  add('tools_schema',parsed.tools??[]);
  for(const message of parsed.messages){
   const kind=['system','user','assistant','tool'].includes(message.role)?message.role:'other';add(kind,message);
   if(kind==='assistant')for(const key of ['reasoning_content','reasoning'])if(Object.hasOwn(message,key))reasoningFieldBytes+=bytes(message[key]);
   if(kind==='tool'){
    let out;try{out=JSON.parse(message.content)?.output;}catch{continue;}
    const sources=[...(typeof out?.utf8==='string'?[out.utf8]:[]),...(out?.observations??[]).filter(o=>typeof o.utf8==='string').map(o=>o.utf8)];
    for(const body of sources){const digest=hash(body),size=bytes(body);sourceBytes+=size;sourceAppearances++;if(seenSources.has(digest))repeatedSourceBytes+=size;thisSources.add(digest);}
   }
  }
  category.serialization_framing+=n-assigned;assert.ok(n>=assigned);
  for(const key of thisSeen)seen.add(key);for(const key of thisSources)seenSources.add(key);
 }
 assert.equal(Object.values(category).reduce((a,b)=>a+b,0),promptBytes);
 rows.push({stage:row.stage,task_id:row.task_id,arm,source:bind(path),status:r.status,model_calls:model.length,matched_requests:matched,missing_capture_calls:missing,prompt_bytes:promptBytes,wire_bytes:wireBytes,category_bytes:category,repeated_across_earlier_requests_bytes:repeated,source_body_utf8_bytes:sourceBytes,repeated_source_body_utf8_bytes:repeatedSourceBytes,source_body_appearances:sourceAppearances,distinct_source_body_hashes:seenSources.size,assistant_explicit_reasoning_field_bytes:reasoningFieldBytes,context_recycles:r.recycling?.recycles??null});
}
const totals={};for(const arm of ['control','treatment']){
 const selected=rows.filter(r=>r.arm===arm),total={};
 for(const key of ['model_calls','matched_requests','prompt_bytes','wire_bytes','source_body_utf8_bytes','repeated_source_body_utf8_bytes','source_body_appearances','assistant_explicit_reasoning_field_bytes'])total[key]=selected.reduce((s,r)=>s+r[key],0);
 for(const key of ['category_bytes','repeated_across_earlier_requests_bytes'])total[key]=Object.fromEntries(names.map(n=>[n,selected.reduce((s,r)=>s+r[key][n],0)]));
 total.category_share=Object.fromEntries(names.map(n=>[n,total.category_bytes[n]/total.prompt_bytes]));
 total.repeated_message_and_schema_bytes=Object.values(total.repeated_across_earlier_requests_bytes).reduce((a,b)=>a+b,0);
 total.repeated_message_and_schema_share=total.repeated_message_and_schema_bytes/total.prompt_bytes;
 total.source_body_utf8_share=total.source_body_utf8_bytes/total.prompt_bytes;
 totals[arm]=total;
}
const result={schema_version:'dual8k.contextbench-input-attribution/v1',unit:'UTF-8 bytes; NOT tokens',source:bind(source),analyzer:bind(new URL(import.meta.url).pathname),rows,totals,
 methodology:['Only actual dispatched receipt request hashes are matched using native bodyForReceipt; tokenizer-only candidates are excluded.','Role and schema partitions use stable JSON bytes; serialization framing is the residual, giving exact prompt-byte reconciliation. Wire adds model/provider parameters.','A repeated item is byte-identical to an item in an earlier matched request of the same arm; same-request duplicates alone do not qualify. Repetition resets per trajectory.','Source body UTF-8 bytes are a non-additive submeasure of tool messages; JSON escaping is excluded and source text is never emitted.','Repeated assistant measures exact whole assistant messages, including their tool-call argument serialization. Explicit reasoning field counts disclose sizes only.'],
 limitations:['Unmatched dispatched requests are excluded from byte attribution, not assumed empty.','Exact repetition misses partially overlapping source ranges and edited messages; no semantic deduplication estimate.','Transport JSON bytes do not equal model input tokens; byte shares imply no token-reduction or safe-deletion claim.','Repeated evidence may be necessary after recycling; removing it can increase rediscovery, output tokens, calls or errors.'],
 provider_calls:0,gold_access:false,authority_effect:'none',open_questions_ref:'INPUT-ATTRIBUTION.md'};
writeFileSync(resolve(import.meta.dirname,'INPUT-ATTRIBUTION.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({totals,missing:rows.filter(r=>r.missing_capture_calls.length).map(r=>({task:r.task_id,arm:r.arm,stage:r.stage,calls:r.missing_capture_calls}))}));
