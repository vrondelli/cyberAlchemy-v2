// Supplemental physical accounting; does not alter the frozen screen. Open questions: README.md.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,read,sha,verify,need} from './common.mjs';
const manifest=verify(),schedule=read(new URL('prepared/schedule.json',root)),rows=[],sources=[];
for(const scheduled of schedule){
 const dir=new URL('live/'+scheduled.id+'/',root);
 if(!existsSync(new URL('completed.json',dir)))continue;
 const bytes=name=>readFileSync(new URL(name,dir));
 const completed=read(new URL('completed.json',dir)),r=read(new URL('result.json',dir));
 need(completed.freeze_digest===manifest.digest&&completed.result_sha256===sha(bytes('result.json')),'completion identity drift');
 need(r.agent_result_sha256===sha(bytes('agent-result.json'))&&r.selected_sha256===sha(bytes('selected.json')),'evidence drift');
 const a=read(new URL('agent-result.json',dir)),selected=read(new URL('selected.json',dir));
 need(JSON.stringify(a.receipts)===JSON.stringify(r.receipts),'receipt drift');
 const tokens=a.receipts.filter(x=>x.kind==='tokenizer'),models=a.receipts.filter(x=>x.kind==='model'),dispatches=a.recycling.dispatches;
 rows.push({id:r.id,arm:r.arm,condition:r.condition,window:r.soft_limit,qualified:r.qualified,
  model_attempts:models.length,tokenizer_attempts:tokens.length,failed_receipts:a.receipts.filter(x=>x.status!==200).length,
  model_latency_ms:models.reduce((n,x)=>n+x.latency_ms,0),tokenizer_latency_ms:tokens.reduce((n,x)=>n+x.latency_ms,0),
  measured_input_tokens:tokens.map(x=>Number.isFinite(x.input_tokens)?x.input_tokens:null),
  dispatch_margin_to_soft_limit:dispatches.map(x=>r.soft_limit-x.projected_upper_bound),
  captured_prompt_bytes:selected.map(x=>Buffer.byteLength(x.prompt)),
  recycles:r.exposure.recycles,source_at_final:r.exposure.decisive_source_present_at_final});
 for(const name of ['completed.json','result.json','agent-result.json','selected.json'])sources.push({path:new URL(name,dir).pathname,sha256:sha(bytes(name))});
}
const summary=[];
for(const arm of ['baseline','admission'])for(const condition of ['visible','delayed']){
 const group=rows.filter(x=>x.arm===arm&&x.condition===condition),margins=group.flatMap(x=>x.dispatch_margin_to_soft_limit),measurements=group.flatMap(x=>x.measured_input_tokens);
 summary.push({arm,condition,completed:group.length,qualified:group.filter(x=>x.qualified).length,
  model_attempts:group.reduce((n,x)=>n+x.model_attempts,0),tokenizer_attempts:group.reduce((n,x)=>n+x.tokenizer_attempts,0),
  minimum_dispatch_margin:margins.length?Math.min(...margins):null,unknown_token_measurements:measurements.filter(x=>x===null).length,
  maximum_measured_input_tokens:measurements.some(x=>x!==null)?Math.max(...measurements.filter(x=>x!==null)):null});
}
const output={freeze_digest:manifest.digest,completed:rows.length,total:schedule.length,summary,rows,sources,
 analyzer_sha256:sha(readFileSync(new URL('analyze.mjs',root))),authority_effect:'none',
 claim_ceiling:'Supplemental physical accounting, not a replacement of the frozen semantic/exposure screen. Prompt bytes refer to captured normalized prompts; latency sums include failed attempts and are not end-to-end runtime. Headroom includes reserved output and existing input margin. Zero recycles cannot qualify pressured continuity.',open_questions_ref:'README.md'};
writeFileSync(resolve(process.argv[2]),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({completed:rows.length,summary}));
