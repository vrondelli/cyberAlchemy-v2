// Read-only terminal fixture analysis; new exclusive receipts only.
// Open Questions: evidence/G01-JACOCO-CLASS-IDENTITY-R5.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';
import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{classInventory,bindClassInfo}from'./jacoco-class-binding-r5.mjs';
const here=dirname(fileURLToPath(import.meta.url)),parent='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r4-20261006',root='/home/vlad_/are-benchmark-archive/g01-jacoco-class-identity-r5-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,s)=>{if(!v)throw Error(s);},save=(n,o)=>writeFileSync(join(root,n),JSON.stringify(o,null,2)+'\n',{flag:'wx',mode:0o600});
need(!existsSync(root),'no-overwrite');const fb=readFileSync(join(parent,'FREEZE.json')),freeze=JSON.parse(fb);
for(const[n,pin]of Object.entries(freeze.source_sha256))need(sha(readFileSync(join(here,n)))===pin,'frozen-r4-source-drift');
const inputs=freeze.cases.map(c=>{const p=join(parent,c.case_id,'RESULT.json');if(!existsSync(p))return{case_id:c.case_id,status:'pending-no-fixture-read'};const rb=readFileSync(p),r=JSON.parse(rb);return{case_id:c.case_id,status:'terminal-fixture',result_sha256:sha(rb),classinfo_present:r.operations.some(o=>o.label==='CLASSINFO'),compiled_root:r.compiled_root};});
mkdirSync(root,{mode:0o700});save('FREEZE.json',{parent_freeze_sha256:sha(fb),cases:inputs,source_sha256:Object.fromEntries(['jacoco-class-binding-r5.mjs','jacoco-class-binding-r5.test.mjs','preflight-jacoco-class-identity-r5.mjs','jacoco-class-binding-r3b.mjs'].map(n=>[n,sha(readFileSync(join(here,n)))])),protocol_sha256:sha(readFileSync(join(here,'../../evidence/G01-JACOCO-CLASS-IDENTITY-R5.json'))),provider_calls:0,test_executions:0,authority_effect:'none'});
const rows=[];
for(const input of inputs){const row={case_id:input.case_id,status:input.status,identity_bound:false,error:null};if(input.status!=='terminal-fixture'||!input.classinfo_present){rows.push(row);continue;}
 try{const p=join(parent,input.case_id),rb=readFileSync(join(p,'RESULT.json'));need(sha(rb)===input.result_sha256,'parent-result-drift');const r=JSON.parse(rb),inventory=classInventory(join(p,'trusted-fixture',input.compiled_root));
  const old=JSON.parse(readFileSync(join(p,'CLASSES-BEFORE.json')));need(JSON.stringify(inventory.map(({class_id,...rest})=>rest))===JSON.stringify(old),'complete-parent-byte-inventory');
  const text=readFileSync(join(p,'CLASSINFO.stdout'),'utf8'),op=r.operations.find(o=>o.label==='CLASSINFO');need(sha(text)===op.stdout_sha256,'parent-classinfo-drift');
  const instrumentation=JSON.parse(readFileSync(join(p,'INSTRUMENTATION.json'))),names=new Set(inventory.map(x=>x.path.slice(0,-6).replaceAll('/','.')));
  row.compiled_classes=inventory.length;row.generated_with_methods=inventory.filter(x=>(x.access_flags&4096)&&x.method_count>0).length;
  row.missing_declared_types=instrumentation.classes.filter(n=>!names.has(n));
  const parsed=[...text.matchAll(/class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/-]+)/g)];need(parsed.every(m=>inventory.find(x=>x.path===m[2]+'.class')?.class_id===m[1]),'classinfo-crc-mismatch');row.reported_ids_independently_reconstructed=parsed.length;
  const bound=bindClassInfo(text,inventory,instrumentation);row.identity_bound=true;row.generated_line_coverage_unavailable=bound.filter(x=>!x.analyzed).length;
  save(input.case_id+'-BOUND-CLASSINFO.json',{parent_result_sha256:input.result_sha256,rows:bound,claim_ceiling:'Exact class identity only; synthetic source-line coverage unavailable, not zero.',authority_effect:'none'});
 }catch(e){row.error=String(e.message).slice(0,240);}
 rows.push(row);
}
const out={status:'terminal-class-identity-preflight-only',rows,all16_parent_cases_accounted:rows.length===16,pending_parent_cases:rows.filter(x=>x.status==='pending-no-fixture-read').length,identity_bound_cases:rows.filter(x=>x.identity_bound).length,provider_calls:0,new_test_executions:0,reference_label_reads:0,authority_effect:'none',claim_ceiling:'Retained terminal compiled class identity only; not new execution/availability/source coverage/quality/superiority; parent r4 outcomes unchanged.',open_questions_owner:'G01-JACOCO-CLASS-IDENTITY-R5.json'};save('RESULT.json',out);console.log(JSON.stringify(out));
