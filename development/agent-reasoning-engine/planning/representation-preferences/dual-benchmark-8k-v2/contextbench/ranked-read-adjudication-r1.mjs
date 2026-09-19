// Fixed prospective descriptive comparison, never a campaign success override.
// Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const contractPath=new URL('./RANKED-READ-ACQUISITION-MEASUREMENTS-R1.json',import.meta.url);
const hash=x=>createHash('sha256').update(x).digest('hex');
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const fraction=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1;
const need=(v,m)=>{if(!v)throw Error('ranked-adjudication.'+m);};
export const COUNTERS=Object.freeze(['ranked-mode-requested-calls','ranked-mode-successful-calls','ranked-windows-returned','receipt-confirmed-ranked-observations','ranked-mode-empty-output-calls','navigation-only-model-responses']);
export function adjudicateRankedRead(rows){
 const bytes=readFileSync(contractPath),contract=JSON.parse(bytes);
 for(const b of contract.source_bindings)need(hash(readFileSync(b.path))===b.sha256,'baseline-source-drift');
 const tasks=contract.baseline.fixed_tasks,seen=new Set();need(Array.isArray(rows),'rows');
 for(const row of rows){need(row&&tasks.includes(row.task_id)&&!seen.has(row.task_id),'task-identity');seen.add(row.task_id);}
 const mapped=tasks.map(task_id=>{
  const row=rows.find(r=>r.task_id===task_id)??{task_id,status:'missing'},baseline=contract.baseline.rows.find(r=>r.task_id===task_id),reasons=[];
  for(const flag of ['valid','native_reconstructed','accounting_complete','window_verified','counters_reconstructed'])if(row[flag]!==true)reasons.push(flag);
  if(!natural(row.total_model_tokens)||row.total_model_tokens===0)reasons.push('positive-complete-cost');
  if(!fraction(row.exported_union_span_recall)||!fraction(row.native_span_f1))reasons.push('native-metrics');
  const c=row.counters;
  if(!c||!COUNTERS.every(k=>natural(c[k])))reasons.push('counter-values');
  else if(c['ranked-mode-successful-calls']>c['ranked-mode-requested-calls']||c['ranked-mode-empty-output-calls']>c['ranked-mode-successful-calls']||c['receipt-confirmed-ranked-observations']>c['ranked-windows-returned']||c['ranked-windows-returned']>5*(c['ranked-mode-successful-calls']-c['ranked-mode-empty-output-calls'])||c['ranked-windows-returned']<c['ranked-mode-successful-calls']-c['ranked-mode-empty-output-calls'])reasons.push('counter-reconciliation');
  const eligible=reasons.length===0,Q=eligible?10000*row.exported_union_span_recall/row.total_model_tokens:null;
  return {task_id,status:row.status??null,eligible,reasons,total_model_tokens:row.total_model_tokens??null,known_model_tokens:row.known_model_tokens??null,conservative_model_tokens:row.conservative_model_tokens??null,counters:c?structuredClone(c):null,exported_union_span_recall:row.exported_union_span_recall??null,native_span_f1:row.native_span_f1??null,coverage_per_10000_tokens:Q,coverage_per_10000_tokens_delta:eligible?Q-baseline.coverage_per_10000_tokens:null,native_span_f1_delta:eligible?row.native_span_f1-baseline.native_span_f1:null};
 });
 const eligible=mapped.every(r=>r.eligible),meanQ=eligible?mapped.reduce((n,r)=>n+r.coverage_per_10000_tokens,0)/tasks.length:null,meanF1=eligible?mapped.reduce((n,r)=>n+r.native_span_f1,0)/tasks.length:null;
 const zero_use_tasks=mapped.filter(r=>r.counters?.['receipt-confirmed-ranked-observations']===0).map(r=>r.task_id);
 let disposition='inconclusive',reason='incomplete-fixed-cohort';
 if(eligible){
  if(zero_use_tasks.length===tasks.length)reason='zero-confirmed-ranked-use';
  else{const support=meanQ>contract.baseline.mean_coverage_per_10000_tokens+contract.comparison_tolerance&&meanF1>=contract.baseline.mean_native_span_f1-contract.comparison_tolerance;disposition=support?'supporting':'counterevidence';reason=support?'descriptive-cohort-efficiency-without-mean-quality-regression':'efficiency-or-quality-comparison-failed';}
 }
 return {schema:'are.ranked-read-adjudication/v1',measurement_contract_sha256:hash(bytes),rows:mapped,eligible,disposition,reason,zero_use_tasks,mean_coverage_per_10000_tokens:meanQ,mean_native_span_f1:meanF1,mean_coverage_per_10000_tokens_delta:eligible?meanQ-contract.baseline.mean_coverage_per_10000_tokens:null,mean_native_span_f1_delta:eligible?meanF1-contract.baseline.mean_native_span_f1:null,claim_ceiling:'Descriptive fixed-cohort candidate comparison only; no causal attribution or benefit assigned to zero-use tasks.',campaign_goal_achieved:false,matched_control_savings_evaluable:false,accepted_token_savings:null,authority_effect:'none',open_questions_ref:'RANKED-READ-ACQUISITION-PROTOCOL-R2.md'};
}
