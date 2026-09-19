// Source-bound actual-wire audit. No providers or references. Open questions: DEMAND-RECOVERY.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(x,m)=>{if(!x)throw Error(m);};
const dir=new URL('./',import.meta.url),root=new URL('../../../../../../',dir);
const source=readFileSync(new URL('REQUEST-REPETITION.json',dir));
const diagnostic=JSON.parse(source),rows=[],bindings=[{path:'REQUEST-REPETITION.json',sha256:hash(source)}];
for(const outcome of diagnostic.outcomes.filter(x=>x.arm==='treatment')){
 const binding=diagnostic.source_bindings.find(x=>x.path.endsWith('/'+outcome.task_id+'/run/treatment/result.json'));
 need(binding,'missing source');const raw=readFileSync(new URL(binding.path,root));need(hash(raw)===binding.sha256,'source drift');bindings.push(binding);
 const result=JSON.parse(raw),presentations=[];
 for(const presentation of result.recovery_presentations){
  const matches=result.receipts.filter(r=>r.kind==='model'&&r.dispatched&&r.status===200&&r.request_sha256===presentation.request_sha256);
  need(matches.length===1,'receipt ambiguity');const receipt=matches[0];
  need(outcome.requests.some(r=>r.request_sha256===receipt.request_sha256),'request outside reconciled set');
  const prompts=[...new Set(result.captures.map(c=>{need(hash(c.prompt)===c.prompt_sha256,'capture drift');return c.prompt;}))].filter(p=>hash(stable(bodyForReceipt(p,receipt)))===receipt.request_sha256);
  need(prompts.length===1,'prompt ambiguity');
  const pages=JSON.parse(prompts[0]).messages.filter(m=>m.role==='user').flatMap(m=>{try{const x=JSON.parse(m.content);return x&&Array.isArray(x.entries)&&x.snapshot===presentation.delivery.snapshot&&x.offset===presentation.delivery.page_offset?[x]:[];}catch{return [];}});
  need(pages.length===1,'catalog ambiguity');const page=pages[0];
  need(Number.isSafeInteger(page.total)&&page.total>=0,'invalid total');
  presentations.push({request_sha256:receipt.request_sha256,snapshot:page.snapshot,total:page.total,entries:page.entries.length});
 }
 rows.push({task_id:outcome.task_id,presentations:presentations.length,empty_presentations:presentations.filter(x=>x.total===0&&x.entries===0).length,snapshots:result.recovery_snapshots.map(s=>({fingerprint:s.fingerprint,capture_count:s.capture_count,receipt_count:s.receipt_count})),explicit_recovery_calls:result.events.filter(e=>['list_recovery_page','recover_archived_read'].includes(e.tool)).length,requests:presentations});
}
need(rows.length===4,'fixed cohort missing');
const report={schema:'are.recovery-visibility/v1',status:'completed',rows,source_bindings:bindings,implementation_sha256:hash(readFileSync(new URL(import.meta.url))),model_calls:0,tokenizer_calls:0,gold_access:false,claim:'Actual acknowledged catalogs stayed empty; absence of calls does not test the utility of populated recovery catalogs.',limitations:['Descriptive implementation diagnosis, not causal proof of quality impact.','Other retention mechanisms and normal source reads remained available.','The original explicit-refresh contract was followed; archive freshness was not automatic.'],open_questions_ref:'DEMAND-RECOVERY.md'};
const bytes=JSON.stringify(report,null,2)+'\n';need(Buffer.byteLength(bytes)<1048576,'output cap');
writeFileSync(new URL('RECOVERY-VISIBILITY.json',dir),bytes,{flag:'wx'});
console.log(JSON.stringify(rows.map(({task_id,presentations,empty_presentations,explicit_recovery_calls})=>({task_id,presentations,empty_presentations,explicit_recovery_calls}))));
