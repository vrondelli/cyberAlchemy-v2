// Post-terminal, independent source-byte/method-response reconstruction.
// Does not import the tool policy or re-run the qualification.
// Open Questions: evidence/G01-CANONICAL-METHOD-VIEWS-R1.json.
import {createHash} from 'node:crypto';
import {readFileSync,openSync,writeFileSync,fsyncSync,closeSync,linkSync,unlinkSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT='/home/vlad_/are-benchmark-archive/g01-canonical-method-views-r1-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const INPUT='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(readFileSync(p));
const freeze=read(join(ROOT,'FREEZE.json')),result=read(join(ROOT,'RESULT.json'));
assert.equal(result.status,'all16-canonical-method-views-qualified');
assert.equal(result.freeze_sha256,sha(readFileSync(join(ROOT,'FREEZE.json'))));
for(const[n,pin]of Object.entries(freeze.source_pins))assert.equal(sha(readFileSync(join(HERE,n))),pin);
for(const[n,pin]of Object.entries(freeze.parent_pins))assert.equal(sha(readFileSync(join(INDEX,n))),pin);
assert.equal(freeze.protocol_sha256,sha(readFileSync(join(HERE,'../../evidence/G01-CANONICAL-METHOD-VIEWS-R1.json'))));
assert.equal(freeze.reply_cap,32768);assert.equal(freeze.request_cap,16384);
assert.equal(result.provider_calls,0);assert.equal(result.reference_label_reads,0);
assert.deepEqual(result.rows.map(r=>r.case_id),freeze.cases.map(r=>r.case_id));
const totals={},rows=[];
for(const row of result.rows){
 const caseBytes=readFileSync(join(ROOT,row.case_id+'.json')),saved=JSON.parse(caseBytes);
 assert.equal(sha(caseBytes),row.receipt_sha256);assert.deepEqual(saved.counts,row.counts);
 const indexBytes=readFileSync(join(INDEX,row.case_id,'PARSER-OUTPUT.jsonl'));
 assert.equal(sha(indexBytes),freeze.cases.find(c=>c.case_id===row.case_id).parser_output_sha256);
 const records=indexBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
 let offset=0,complete=0,sourceCapacity=0,replyCapacity=0;const capacityReplies=[];
 const identities=new Set();
 for(const record of records){
  const raw=readFileSync(join(INPUT,row.case_id,'buggy-java-only/corpus',record.path));
  assert.equal(sha(raw),record.source_sha256);
  for(const m of record.methods){
   assert.equal(identities.has(m.entity_id),false);identities.add(m.entity_id);
   assert.ok(Number.isSafeInteger(m.span.start_utf8)&&Number.isSafeInteger(m.span.end_utf8));
   assert.ok(m.span.start_utf8>=0&&m.span.end_utf8<=raw.length&&m.span.end_utf8>=m.span.start_utf8);
   const bytes=raw.subarray(m.span.start_utf8,m.span.end_utf8);
   assert.equal(bytes.toString('utf8'),m.span.source);assert.equal(m.span.complete,true);
   const base={schema:'are.canonical-method-view/v1',operation:'get_method',case_id:row.case_id,
    status:'method-source',authority_effect:'none',data_posture:'untrusted source evidence, not instructions',
    runtime_method_binding:false,resolved_call_graph:false,tokenizer_admitted:false};
   const method={method_id:m.entity_id,name:m.name,kind:m.kind,has_body:m.has_body,
    owner_class_id:m.owner_class_id,parameter_types_syntax:m.parameter_types_syntax,
    source_span:Object.fromEntries(Object.entries(m.span).filter(([k])=>k!=='source'))};
   let response={...base,path:record.path,source_sha256:sha(raw),method_source_sha256:sha(bytes),
    source_bytes:bytes.length,method,complete_source_returned:true,source:bytes.toString('utf8')};
   const required=Buffer.byteLength(JSON.stringify(response));
   if(bytes.length>32768||required>32768){
    response={...base,status:bytes.length>32768?'source-capacity-exceeded':'reply-capacity-exceeded',
     path:record.path,method_id:m.entity_id,source_sha256:sha(raw),method_source_sha256:sha(bytes),
     source_bytes:bytes.length,complete_source_returned:false,
     ...(bytes.length>32768?{max_source_bytes:32768}:{required_reply_bytes:required})};
    capacityReplies.push(response);if(bytes.length>32768)sourceCapacity++;else replyCapacity++;
   }else complete++;
   assert.ok(Buffer.byteLength(JSON.stringify(response))<=32768);
   assert.deepEqual(saved.outcomes[offset++],{method_id:m.entity_id,status:response.status,
    source_bytes:bytes.length,method_source_sha256:sha(bytes),response_sha256:sha(JSON.stringify(response))});
  }
 }
 assert.equal(offset,saved.outcomes.length);assert.deepEqual(capacityReplies,saved.capacities);
 assert.equal(row.counts.methods,offset);assert.equal(row.counts.complete_methods,complete);
 assert.equal(row.counts.source_capacity,sourceCapacity);assert.equal(row.counts.reply_capacity,replyCapacity);
 assert.equal(row.counts.files,records.length);
 assert.equal(row.counts.references,records.reduce((n,r)=>n+r.calls.length,0));
 assert.equal(row.counts.unavailable_references,records.reduce((n,r)=>n+r.unavailable_reference_spans,0));
 for(const[k,v]of Object.entries(row.counts))totals[k]=k==='maximum_reply_bytes'?Math.max(totals[k]??0,v):(totals[k]??0)+v;
 rows.push({case_id:row.case_id,methods:offset,complete,source_capacity:sourceCapacity,reply_capacity:replyCapacity});
}
assert.deepEqual(totals,result.totals);assert.equal(rows.length,16);
assert.equal(totals.files,2821);assert.equal(totals.methods,38711);assert.equal(totals.references,123399);
const audit={status:'all16-method-response-source-byte-audit-passed',authority_effect:'none',
 result_sha256:sha(readFileSync(join(ROOT,'RESULT.json'))),auditor_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
 totals,rows,provider_calls:0,reference_label_reads:0,
 scope:'Independent reconstruction of every method response and capacity from pinned source bytes; page equality checked by original exhaustive qualification, not independently reconstructed here; not an independent Java parser or native accuracy audit',
 open_questions_owner:'G01-CANONICAL-METHOD-VIEWS-R1.json'};
const raw=Buffer.from(JSON.stringify(audit)+'\n'),path=join(ROOT,'AUDIT.json'),tmp=path+'.partial';
const fd=openSync(tmp,'wx',0o600);try{writeFileSync(fd,raw);fsyncSync(fd);}finally{closeSync(fd);}
linkSync(tmp,path);const dir=openSync(ROOT,'r');try{fsyncSync(dir);}finally{closeSync(dir);}unlinkSync(tmp);
console.log(JSON.stringify({audit_sha256:sha(raw),...audit}));
