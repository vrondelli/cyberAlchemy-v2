// Pure fixed-denominator statistics for untouched same-trajectory confirmation.
import {createHash} from 'node:crypto';

export const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
export const f1=metric=>{const coverage=Number.isFinite(metric?.coverage)?metric.coverage:0,precision=Number.isFinite(metric?.precision)?metric.precision:0;return coverage+precision>0?2*coverage*precision/(coverage+precision):0;};
const metricKeys=['span_coverage','span_precision','span_f1','file_coverage','file_precision'];

function seedState(seed){const bytes=createHash('sha256').update(seed).digest();return bytes.readUInt32BE(0)||0x9e3779b9;}
function xorshift32(state){state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;}

export function repositoryClusterBootstrap(rows,{seed,resamples}){
  if(typeof seed!=='string'||!seed||!Number.isSafeInteger(resamples)||resamples<1)throw Error('confirmation.bootstrap-config');
  const repositories=[...new Set(rows.map(row=>row.repo))].sort();if(!repositories.length||repositories.some(repo=>typeof repo!=='string'||!repo))throw Error('confirmation.bootstrap-repositories');
  const byRepository=new Map(repositories.map(repo=>[repo,rows.filter(row=>row.repo===repo)])),estimates=[];let state=seedState(seed);
  for(let repetition=0;repetition<resamples;repetition++){
    const sampled=[];
    for(let draw=0;draw<repositories.length;draw++){state=xorshift32(state);sampled.push(...byRepository.get(repositories[state%repositories.length]));}
    estimates.push(mean(sampled.map(row=>row.treatment_span_f1-row.baseline_span_f1)));
  }
  estimates.sort((a,b)=>a-b);const lower=estimates[Math.floor(0.025*resamples)],upper=estimates[Math.min(resamples-1,Math.floor(0.975*resamples))];
  return{method:'paired repository-cluster bootstrap; resample repositories with replacement and retain all trajectory rows in each sampled repository',prng:'xorshift32 seeded by first uint32be of sha256(seed)',seed,resamples,repositories:repositories.length,lower_95:lower,upper_95:upper};
}

export function evaluateConfirmation(rows,criteria,bootstrapConfig){
  if(!Array.isArray(rows)||rows.length!==criteria.scheduled_trajectories)throw Error('confirmation.denominator');
  const baseline={},treatment={},gains={};
  for(const key of metricKeys){baseline[key]=mean(rows.map(row=>row['baseline_'+key]));treatment[key]=mean(rows.map(row=>row['treatment_'+key]));gains[key]=treatment[key]-baseline[key];}
  const repetitions=Object.fromEntries([...new Set(rows.map(row=>row.repetition))].sort().map(repetition=>{
    const selected=rows.filter(row=>row.repetition===repetition);return[repetition,{rows:selected.length,span_f1_gain:mean(selected.map(row=>row.treatment_span_f1-row.baseline_span_f1))}];
  }));
  const bootstrap=repositoryClusterBootstrap(rows,bootstrapConfig),unknown=rows.reduce((sum,row)=>sum+row.unknown_usage_calls,0);
  const checks={
    full_denominator:rows.length===criteria.scheduled_trajectories&&new Set(rows.map(row=>row.cell_id)).size===criteria.scheduled_trajectories,
    span_f1_gain:gains.span_f1>=criteria.paired_macro_span_f1_gain_minimum,
    bootstrap_lower_above_zero:bootstrap.lower_95>0,
    each_repetition_positive:Object.keys(repetitions).length===criteria.required_repetitions&&Object.values(repetitions).every(row=>row.span_f1_gain>0),
    span_coverage_nondegrade:gains.span_coverage>=0,
    span_precision_nondegrade:gains.span_precision>=0,
    file_coverage_nondegrade:gains.file_coverage>=0,
    file_precision_nondegrade:gains.file_precision>=0,
    independent_reconstruction:rows.every(row=>row.independent_reconstruction_agrees===true),
    usage_known:unknown===criteria.unknown_model_usage,
    zero_model_overhead:rows.every(row=>row.additional_model_calls===criteria.additional_model_calls&&row.additional_model_tokens===criteria.additional_model_tokens),
    closure_cap:rows.every(row=>row.closure_ids<=criteria.maximum_closure_evidence)
  };
  return{baseline,treatment,gains,repetitions,bootstrap,unknown_model_receipts:unknown,checks,passed:Object.values(checks).every(Boolean)};
}
