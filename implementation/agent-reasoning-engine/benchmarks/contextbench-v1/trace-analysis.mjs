// Descriptive instrumentation analysis; no post-hoc changes to native metrics.
// Open questions: README.md. Repeated reads are observations, not automatically waste.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {bindDelivery,stable} from './delivery.mjs';
import {sha} from './verify-freeze.mjs';
const [matrixPath,outRoot,reportPath]=process.argv.slice(2);
if(!reportPath)throw Error('matrix output-root report required');
const matrix=JSON.parse(readFileSync(matrixPath)),rows=[];
for(const cell of matrix.cells){
 const root=resolve(outRoot,cell.cell_id),complete=resolve(root,'completed.json');
 if(!existsSync(complete)){rows.push({cell_id:cell.cell_id,status:'not-completed'});continue;}
 const bytes=readFileSync(resolve(root,'result.json')),r=JSON.parse(bytes);
 if(sha(bytes)!==JSON.parse(readFileSync(complete)).result_sha256)throw Error('trace.result-integrity');
 const binding=bindDelivery(r),sourceKeys=new Set();let repeated=0;
 for(const read of binding.read_observations){
  const key=sha(stable([read.path,read.source_sha256,read.start_line,read.end_line,read.body]));
  if(sourceKeys.has(key))repeated++;sourceKeys.add(key);
 }
 const models=r.receipts.filter(x=>x.kind==='model'&&x.dispatched),events=r.events??[];
 const journal=readFileSync(resolve(root,'events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 const diagnostics=journal.filter(x=>x.kind==='terminal-diagnostic');
 const finalizations=journal.filter(x=>x.kind==='finalization-start');
 const responseEvents=journal.filter(x=>x.kind==='model-response');
 const calls=responseEvents.map(event=>{
  const receipt=r.receipts[event.response_capture.receipt_index];
  const tools=events.filter(e=>e.step===event.step);
  return {step:event.step,correction:diagnostics.some(d=>d.correction_remaining&&d.step<event.step),
    finalization:finalizations.some(f=>f.step<=event.step),input_tokens:receipt.input_tokens??null,output_tokens:receipt.output_tokens??null,
    tools:tools.map(e=>({name:e.tool,ok:e.output?.ok===true,total_matches:e.output?.output?.total??null})),
    new_delivery_observations:binding.read_observations.filter(x=>x.first_confirmed_receipt===event.response_capture.receipt_index).length};
 });
 rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,arm:cell.arm,status:r.status,source_result_sha256:sha(bytes),
  tokens:binding.token_accounting,model_calls:models.length,call_cap:cell.limits.maximum_calls,token_cap:cell.limits.total_tokens,
  unused_token_allowance:binding.token_accounting.cost_complete?cell.limits.total_tokens-binding.token_accounting.known_total_tokens:null,
  recycles:r.recycling?.recycles??null,tool_calls:events.length,tool_errors:events.filter(e=>e.output?.ok!==true).length,
  empty_searches:events.filter(e=>e.tool==='search'&&e.output?.ok===true&&e.output.output.total===0).length,
  empty_path_lists:events.filter(e=>e.tool==='list_files'&&e.output?.ok===true&&e.output.output.total===0).length,
  confirmed_read_observations:binding.read_observations.length,unique_exact_source_ranges:sourceKeys.size,repeated_exact_range_observations:repeated,
  terminal_diagnostics:diagnostics.map(x=>({step:x.step,correction_remaining:x.correction_remaining,issue_codes:x.diagnostic.issues.map(i=>i.code)})),
  terminal_corrections:r.terminal_corrections??0,finalization_events:finalizations,patch_produced:typeof r.patch==='string'&&r.patch.length>0,calls});
}
writeFileSync(reportPath,JSON.stringify({matrix_sha256:sha(readFileSync(matrixPath)),rows,
  claim_ceiling:'Completed-cell descriptive analysis only. No claim that repeated reads or empty searches are avoidable; no per-component token attribution or paired causal effect. Incomplete cells remain unmeasured.',
  benchmark_cleared:false,authority_effect:'none'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(rows.map(({cell_id,status,unused_token_allowance,empty_searches,repeated_exact_range_observations,terminal_corrections})=>({cell_id,status,unused_token_allowance,empty_searches,repeated_exact_range_observations,terminal_corrections}))));
