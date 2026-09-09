// Independent receipt and admission arithmetic audit. Open questions: README.md.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {sha,padded} from './calibration.mjs';
import {stable,MODEL} from '../../../../../packages/coding-agent-runtime/glm-flash-v1/transport.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),need=(v,m)=>{if(!v)throw Error(m);},binding=read('execution-binding-80.json');
for(const ref of binding.sources)need(sha(readFileSync(new URL(ref.path,root)))===ref.sha256,'binding drift');
const result=read('live/result.json'),templates=read('templates/templates.json'),receipts=new Map(),sources=[];
need(result.model_attempts===0&&result.tokenizer_attempts<=96&&result.receipts.length===result.tokenizer_attempts,'physical counts');
need(readdirSync(new URL('live/',root)).filter(n=>/^receipt-/.test(n)).length===result.receipts.length,'unaccounted receipt');
for(const [i,r] of result.receipts.entries()){
 need(r.id===i&&r.status===200&&r.dispatched&&r.automatic_retries===0&&Number.isSafeInteger(r.input_tokens),'receipt status');
 const raw=readFileSync(new URL(`live/request-${i}.json`,root),'utf8'),body=JSON.parse(raw),started=read(`live/started-${i}.json`),dispatch=read(`live/dispatch-${i}.json`);
 need(raw===stable(body)&&body.model===MODEL&&sha(raw)===r.request_sha256&&Buffer.byteLength(raw)===r.request_bytes,'exact normalized request');
 need(started.request_sha256===r.request_sha256&&dispatch.request_sha256===r.request_sha256,'reservation mismatch');
 need(stable(read(`live/receipt-${i}.json`))===stable(r),'receipt mismatch');need(!receipts.has(r.request_sha256),'duplicate physical measurement');receipts.set(r.request_sha256,r);
 for(const name of ['request','started','dispatch','receipt']){const path=`live/${name}-${i}.json`;sources.push({path,sha256:sha(readFileSync(new URL(path,root)))});}
}
need(JSON.stringify(result.results.map(r=>r.window))==='[8000,10000,12000]','window set');const windows=[];
for(const r of result.results){
 const g=templates.groups.find(g=>g.soft===r.window),e=read('templates/'+r.window+'.json');
 const tokens=(b,n)=>{const key=sha(stable(padded(b,n)));need(receipts.has(key),'missing exact request measurement');return receipts.get(key).input_tokens;};
 need(r.padding_blocks===r.below_padding_blocks+1,'neighbor bracket');const full=tokens(g.full,r.padding_blocks),below=tokens(g.full,r.below_padding_blocks),fallback=tokens(g.fallback,r.padding_blocks),prefix=g.prefix.map(b=>tokens(b,r.padding_blocks)),limit=r.window-256;
 need(full===r.full_tokens&&below===r.below_tokens&&fallback===r.fallback_tokens&&stable(prefix)===stable(r.prefix_tokens),'reported counts drift');
 need(r.output_reservation===2048&&r.input_margin===512&&r.effective_limit===limit,'reserve drift');
 need(full+2560>=limit&&below+2560<limit&&fallback+2560<limit&&prefix.every(t=>t+2560<limit)&&r.bracketed,'pressure interval invalid');
 const present=(body,f)=>body.messages.some(m=>{try{const o=JSON.parse(m.content);return m.role==='tool'&&o.ok===true&&o.tool_name==='read-file'&&o.output?.path===f.path&&o.output.sha256===f.sha256&&o.output.utf8===f.utf8;}catch{return false;}});
 need(e.task.facts.length===2&&e.task.facts.every(f=>present(g.full,f)&&!present(g.fallback,f)&&g.prefix.some(b=>present(b,f))),'fact exposure');
 windows.push({window:r.window,padding_blocks:r.padding_blocks,effective_limit:limit,full_projected:full+2560,fallback_projected:fallback+2560,maximum_prefix_projected:Math.max(...prefix)+2560,full_fact_bodies:2,fallback_fact_bodies:0,prefix_deliverable_fact_bodies:2});
}
writeFileSync(new URL('audit.json',root),JSON.stringify({passed:true,windows,tokenizer_attempts:result.tokenizer_attempts,model_attempts:0,sources,source_result_sha256:sha(readFileSync(new URL('live/result.json',root))),auditor_sha256:sha(readFileSync(new URL('audit.mjs',root))),claim_ceiling:'Actual-tokenizer feasibility for fixed templates. Prefix requests could be admitted; no live model trajectory was executed. Fallback template has no original fact bodies; GLM semantic outcome is unknown.',authority_effect:'none',open_questions_ref:'README.md'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({passed:true,windows,tokenizer_attempts:result.tokenizer_attempts,model_attempts:0}));
