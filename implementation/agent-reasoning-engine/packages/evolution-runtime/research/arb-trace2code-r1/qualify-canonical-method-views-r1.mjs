// Exhaustive private source qualification. No provider or reference-label access.
// Open Questions: evidence/G01-CANONICAL-METHOD-VIEWS-R1.json.
import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,openSync,writeFileSync,fsyncSync,closeSync,linkSync,unlinkSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createFrozenCanonicalMethodViews} from './canonical-method-views-r1.mjs';
import {REPLY_CAP,REQUEST_CAP} from './canonical-method-view-policy-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const INPUT='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007';
const OUT='/home/vlad_/are-benchmark-archive/g01-canonical-method-views-r1-20261007';
const EVIDENCE=join(HERE,'../../evidence/G01-CANONICAL-METHOD-VIEWS-R1.json');
const sha=b=>createHash('sha256').update(b).digest('hex');
function receipt(path,value){
 const raw=Buffer.from(JSON.stringify(value)+'\n'),tmp=path+'.partial';
 const fd=openSync(tmp,'wx',0o600);
 try{writeFileSync(fd,raw);fsyncSync(fd);}finally{closeSync(fd);}
 linkSync(tmp,path);const dir=openSync(dirname(path),'r');
 try{fsyncSync(dir);}finally{closeSync(dir);}unlinkSync(tmp);return sha(raw);
}
const span=s=>Object.fromEntries(Object.entries(s).filter(([k])=>k!=='source'));
const method=m=>({method_id:m.entity_id,name:m.name,kind:m.kind,has_body:m.has_body,
 owner_class_id:m.owner_class_id,parameter_types_syntax:m.parameter_types_syntax,source_span:span(m.span)});
function run(){
 assert.equal(existsSync(OUT),false,'existing campaign must not be replayed');
 const handler=createFrozenCanonicalMethodViews();
 const parent=JSON.parse(readFileSync(join(INDEX,'RESULT.json')));
 const sourceNames=['canonical-method-views-r1.mjs','canonical-method-view-policy-r1.mjs',
  'canonical-method-view-policy-r1.test.mjs','qualify-canonical-method-views-r1.mjs'];
 const freeze={schema:'are.canonical-method-view-qualification-freeze/v1',authority_effect:'none',
  source_pins:Object.fromEntries(sourceNames.map(n=>[n,sha(readFileSync(join(HERE,n)))])),
  protocol_sha256:sha(readFileSync(EVIDENCE)),
  parent_pins:Object.fromEntries(['FREEZE.json','RESULT.json','AUDIT.json','SOURCE-MANIFEST.json'].map(n=>[n,sha(readFileSync(join(INDEX,n)))])),
  cases:parent.rows.map(r=>({case_id:r.case_id,parser_output_sha256:r.parser_output_sha256})),
  request_cap:REQUEST_CAP,reply_cap:REPLY_CAP,provider_calls:0,reference_label_reads:0,
  open_questions_owner:'G01-CANONICAL-METHOD-VIEWS-R1.json'};
 mkdirSync(OUT,{mode:0o700});const freezeHash=receipt(join(OUT,'FREEZE.json'),freeze);
 const start=Date.now(),rows=[];
 for(const row of parent.rows){
  const caseStart=Date.now(),caseId=row.case_id,bytes=readFileSync(join(INDEX,caseId,'PARSER-OUTPUT.jsonl'));
  assert.equal(sha(bytes),row.parser_output_sha256);
  const records=bytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
  const transcript=createHash('sha256'),outcomes=[],capacities=[];
  const counts={files:records.length,methods:0,references:0,unavailable_references:0,
   requests:0,pages:0,complete_methods:0,source_capacity:0,reply_capacity:0,maximum_reply_bytes:0};
  function call(request){
   const response=handler(request),encoded=JSON.stringify(response),size=Buffer.byteLength(encoded);
   assert.ok(size<=REPLY_CAP);assert.ok(Buffer.byteLength(JSON.stringify(request))<=REQUEST_CAP);
   assert.equal(response.case_id,caseId);assert.equal(response.operation,request.operation);
   assert.equal(response.runtime_method_binding,false);assert.equal(response.resolved_call_graph,false);
   assert.equal(response.tokenizer_admitted,false);assert.equal(response.authority_effect,'none');
   transcript.update(JSON.stringify(request)+'\n'+encoded+'\n');counts.requests++;
   counts.maximum_reply_bytes=Math.max(counts.maximum_reply_bytes,size);return response;
  }
  function pages(request,expected){
   let offset=0;
   do{
    const response=call({...request,offset,limit:50});counts.pages++;
    assert.equal(response.status,'page','metadata capacity/unexpected page status');
    assert.equal(response.total,expected.length);assert.equal(response.offset,offset);
    assert.deepEqual(response.items,expected.slice(offset,offset+response.items.length));
    offset+=response.items.length;
    assert.equal(response.next_offset,offset<expected.length?offset:null);
    if(response.next_offset===null)break;
    assert.ok(response.items.length>0,'pagination must progress');
   }while(true);
   assert.equal(offset,expected.length);
  }
  pages({operation:'list_files',case_id:caseId},records.map(r=>({path:r.path,
   source_sha256:r.source_sha256,methods:r.methods.length,references:r.calls.length,
   unavailable_references:r.unavailable_reference_spans})));
  for(const record of records){
   pages({operation:'list_methods',case_id:caseId,path:record.path},record.methods.map(method));
   pages({operation:'list_references',case_id:caseId,path:record.path},record.calls.map((c,i)=>({
    reference_ordinal:i+1,kind:c.kind,target_syntax:c.target_syntax,argument_count:c.argument_count,
    enclosing_method_id:c.enclosing_method_id,inside_lambda:c.inside_lambda,
    resolution:c.resolution,source_span:span(c.span)})));
   counts.references+=record.calls.length;counts.unavailable_references+=record.unavailable_reference_spans;
   const raw=readFileSync(join(INPUT,caseId,'buggy-java-only/corpus',record.path));
   assert.equal(sha(raw),record.source_sha256);
   for(const m of record.methods){
    counts.methods++;assert.equal(m.span.complete,true);
    const slice=raw.subarray(m.span.start_utf8,m.span.end_utf8);
    assert.equal(slice.toString('utf8'),m.span.source);
    const response=call({operation:'get_method',case_id:caseId,method_id:m.entity_id,max_source_bytes:REPLY_CAP});
    assert.equal(response.source_sha256,sha(raw));assert.equal(response.method_source_sha256,sha(slice));
    assert.equal(response.source_bytes,slice.length);assert.equal(response.path,record.path);
    if(response.status==='method-source'){
     assert.equal(response.complete_source_returned,true);assert.equal(response.source,slice.toString('utf8'));
     assert.deepEqual(response.method,method(m));counts.complete_methods++;
    }else{
     assert.equal(response.complete_source_returned,false);assert.equal(Object.hasOwn(response,'source'),false);
     assert.equal(response.method_id,m.entity_id);
     if(response.status==='source-capacity-exceeded'){
      assert.ok(slice.length>REPLY_CAP);counts.source_capacity++;
     }else{
      assert.equal(response.status,'reply-capacity-exceeded');
      assert.ok(slice.length<=REPLY_CAP&&response.required_reply_bytes>REPLY_CAP);counts.reply_capacity++;
     }
     capacities.push(response);
    }
    outcomes.push({method_id:m.entity_id,status:response.status,source_bytes:slice.length,
     method_source_sha256:sha(slice),response_sha256:sha(JSON.stringify(response))});
   }
  }
  assert.equal(counts.files,row.expected_sources);assert.equal(counts.methods,row.totals.methods);
  assert.equal(counts.references,row.totals.calls);
  assert.equal(counts.unavailable_references,row.totals.unavailable_reference_spans);
  assert.equal(counts.complete_methods+counts.source_capacity+counts.reply_capacity,counts.methods);
  const caseResult={case_id:caseId,qualified:true,counts,capacities,outcomes,
   transcript_sha256:transcript.digest('hex'),elapsed_ms:Date.now()-caseStart};
  const caseHash=receipt(join(OUT,caseId+'.json'),caseResult);
  rows.push({case_id:caseId,counts,qualified:true,receipt_sha256:caseHash,elapsed_ms:caseResult.elapsed_ms});
  console.log(JSON.stringify({case_id:caseId,counts,elapsed_ms:caseResult.elapsed_ms}));
 }
 const totals={};for(const row of rows)for(const[k,v]of Object.entries(row.counts))
  totals[k]=k==='maximum_reply_bytes'?Math.max(totals[k]??0,v):(totals[k]??0)+v;
 assert.equal(totals.files,2821);assert.equal(totals.methods,38711);assert.equal(totals.references,123399);
 for(const[n,pin]of Object.entries(freeze.source_pins))assert.equal(sha(readFileSync(join(HERE,n))),pin);
 assert.equal(sha(readFileSync(EVIDENCE)),freeze.protocol_sha256);
 for(const[n,pin]of Object.entries(freeze.parent_pins))assert.equal(sha(readFileSync(join(INDEX,n))),pin);
 const result={status:'all16-canonical-method-views-qualified',authority_effect:'none',freeze_sha256:freezeHash,
  cases:16,qualified_cases:16,totals,rows,elapsed_ms:Date.now()-start,
  provider_calls:0,reference_label_reads:0,runtime_method_binding:false,resolved_call_graph:false,
  tokenizer_admitted:false,claim_ceiling:'Source retrieval only; no accuracy or superiority',
  open_questions_owner:'G01-CANONICAL-METHOD-VIEWS-R1.json'};
 const resultHash=receipt(join(OUT,'RESULT.json'),result);console.log(JSON.stringify({result_sha256:resultHash,...result}));
}
try{run();}catch(error){console.error(error);process.exitCode=2;}
