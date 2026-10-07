// Full16 runtime pagination and canonical source-identity qualification.
// Open Questions: evidence/G01-ADAPTIVE-COMMON-TOOLS-R1.json.
import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,existsSync} from 'node:fs';import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const RUNTIME='/home/vlad_/are-benchmark-archive/g01-compiled-method-coordinate-r1b-20261007';
const INDEX='/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007';
const OUT='/home/vlad_/are-benchmark-archive/g01-adaptive-common-tools-r1-20261007';
const read=p=>JSON.parse(readFileSync(p));
const protocol=join(HERE,'../../evidence/G01-ADAPTIVE-COMMON-TOOLS-R1.json');
assert.equal(existsSync(OUT),false,'no existing qualification replay');
const run=createFrozenAdaptiveCommonTools(),runtime=read(join(RUNTIME,'RESULT.json')),source=read(join(INDEX,'RESULT.json'));
const paths=['adaptive-common-tools-r1.mjs','adaptive-runtime-view-policy-r1.mjs','adaptive-runtime-view-policy-r1.test.mjs',
 'qualify-adaptive-common-tools-r1.mjs','atomic-campaign-receipt-r1.mjs',
 'canonical-method-views-r1.mjs','canonical-method-view-policy-r1.mjs'].map(n=>join(HERE,n));
paths.push(protocol,...['FREEZE.json','RESULT.json','AUDIT.json'].map(n=>join(RUNTIME,n)),
 ...['FREEZE.json','RESULT.json','AUDIT.json'].map(n=>join(INDEX,n)));
const freeze={source_and_input_pins:Object.fromEntries(paths.map(p=>[p,sha(readFileSync(p))])),
 cases:runtime.rows.map(r=>({case_id:r.case_id,runtime_receipt_sha256:r.receipt_sha256,
  parser_output_sha256:source.rows.find(s=>s.case_id===r.case_id).parser_output_sha256})),
 request_cap:16384,reply_cap:32768,authority_effect:'none',open_questions_owner:'G01-ADAPTIVE-COMMON-TOOLS-R1.json'};
mkdirSync(OUT,{mode:0o700});const save=(n,v)=>{createReceipt(join(OUT,n),v);return sha(readFileSync(join(OUT,n)));};
const freezeHash=save('FREEZE.json',freeze),start=Date.now(),rows=[];
for(const item of freeze.cases){
 const bytes=readFileSync(join(RUNTIME,item.case_id+'.json'));assert.equal(sha(bytes),item.runtime_receipt_sha256);
 const current=JSON.parse(bytes),sourceBytes=readFileSync(join(INDEX,item.case_id,'PARSER-OUTPUT.jsonl'));
 assert.equal(sha(sourceBytes),item.parser_output_sha256);
 const records=sourceBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
 const methods=new Map(records.flatMap(r=>r.methods.map(m=>[m.entity_id,{m,path:r.path}])));
 let requests=0,pages=0,maxReply=0;const transcript=createHash('sha256');
 function call(request){const reply=run(request),encoded=JSON.stringify(reply);
  assert.ok(Buffer.byteLength(encoded)<=32768);maxReply=Math.max(maxReply,Buffer.byteLength(encoded));requests++;
  transcript.update(JSON.stringify(request)+'\n'+encoded+'\n');return reply;}
 function collect(request){let offset=0,items=[];
  do{const reply=call({...request,offset,limit:50});pages++;
   assert.equal(reply.status,'page');assert.equal(reply.offset,offset);
   items.push(...reply.items);offset+=reply.items.length;
   assert.equal(reply.next_offset,offset<reply.total?offset:null);
   if(reply.next_offset===null){assert.equal(items.length,reply.total);break;}
   assert.ok(reply.items.length>0);
  }while(true);return items;}
 const status=call({operation:'runtime_status',case_id:item.case_id});
 let observed=[],positive=[];
 if(!current.runtime_available){
  assert.equal(status.status,'runtime-unavailable');assert.equal(status.source_case_retained,true);
  assert.equal(call({operation:'list_runtime_methods',case_id:item.case_id}).status,'runtime-unavailable');
 }else{
  assert.equal(status.compiled_methods,current.methods.length);
  observed=collect({operation:'list_runtime_methods',case_id:item.case_id});
  positive=collect({operation:'list_runtime_methods',case_id:item.case_id,positive_only:true});
  const expected=current.methods.map(m=>({class_name:m.class_name,class_sha256:m.class_sha256,class_id:m.class_id,
   path:m.path,name:m.name,descriptor:m.descriptor,access_flags:m.access_flags,status:m.status,
   source_method_id:m.source_method_id,reported:m.reported,reported_positive:m.reported_positive,
   reported_counters:m.reported_counters,source_association:'conservative-coordinate-only',
   type_attributed_signature:false,test_exclusive:false,negative_relevance_inference:false}));
  assert.deepEqual(observed,expected);assert.deepEqual(positive,expected.filter(m=>m.reported_positive));
  for(const m of observed)if(m.source_method_id!==null){
   assert.ok(methods.has(m.source_method_id));assert.equal(methods.get(m.source_method_id).path,m.path);
   assert.equal(m.status,'unique-coordinate-association');
  }
 }
 const files=collect({operation:'list_files',case_id:item.case_id});
 assert.deepEqual(files.map(r=>r.path),records.map(r=>r.path));
 const first=records.find(r=>r.methods.length)?.methods[0];assert.ok(first);
 const whole=call({operation:'get_method',case_id:item.case_id,method_id:first.entity_id});
 assert.equal(whole.status,'method-source');assert.equal(whole.source,first.span.source);
 const row={case_id:item.case_id,runtime_available:current.runtime_available,
  source_files:files.length,source_methods:methods.size,runtime_methods:observed.length,
  positive_observations:positive.length,unresolved_positive:positive.filter(m=>m.source_method_id===null).length,
  requests,pages,maximum_reply_bytes:maxReply,transcript_sha256:transcript.digest('hex')};
 const receiptHash=save(item.case_id+'.json',row);rows.push({...row,receipt_sha256:receiptHash});
 console.log(JSON.stringify(row));
}
for(const[p,pin]of Object.entries(freeze.source_and_input_pins))assert.equal(sha(readFileSync(p)),pin);
const sum=k=>rows.reduce((n,r)=>n+r[k],0);
assert.equal(rows.length,16);assert.equal(sum('source_files'),2821);assert.equal(sum('source_methods'),38711);
assert.equal(sum('runtime_methods'),33652);assert.equal(sum('positive_observations'),1900);assert.equal(sum('unresolved_positive'),230);
const result={status:'all16-common-source-runtime-tools-qualified',freeze_sha256:freezeHash,rows,
 elapsed_ms:Date.now()-start,requests:sum('requests'),pages:sum('pages'),runtime_methods:sum('runtime_methods'),
 source_methods:sum('source_methods'),positive_observations:sum('positive_observations'),unresolved_positive:sum('unresolved_positive'),
 maximum_reply_bytes:Math.max(...rows.map(r=>r.maximum_reply_bytes)),provider_calls:0,reference_label_reads:0,
 authority_effect:'none',claim_ceiling:'Tool functionality only, no reader accuracy or superiority',
 open_questions_owner:'G01-ADAPTIVE-COMMON-TOOLS-R1.json'};
console.log(JSON.stringify({result_sha256:save('RESULT.json',result),...result}));
