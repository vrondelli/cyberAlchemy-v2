import {createHash} from 'node:crypto';
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Fixed denominators; unknown reservations are never labelled actual spend. */
export function summarizeRun({manifest,state}) {
  const counts={planned:manifest.jobs.length,completed:0,failed:0,unknown:0,blocked:0,budget_blocked:0,pending:0,running:0};
  const events=[], rows=[];let known=0,unknown=0,held=0,correct=0,scored=0;
  for(const job of manifest.jobs){
    const r=state.jobs[job.id];if(!r||!Object.hasOwn(counts,r.status))throw Error('Missing/invalid job disposition');
    counts[r.status]++;
    const usage=r.usage;
    if(usage){if(!Number.isSafeInteger(usage.total_tokens)||usage.total_tokens<0||usage.prompt_tokens+usage.completion_tokens!==usage.total_tokens)throw Error('Invalid usage');known+=usage.total_tokens;}
    else if(['unknown','failed'].includes(r.status))unknown+=job.reservation_tokens;
    else if(r.status==='running')held+=job.reservation_tokens;
    if(job.expected_output!==undefined){scored++;if(r.status==='completed'&&r.result?.output?.text?.trim()===job.expected_output)correct++;}
    const start=Date.parse(r.started_at),end=Date.parse(r.finished_at);
    if(Number.isFinite(start)&&Number.isFinite(end)){if(end<start)throw Error('Invalid timing');events.push([start,1],[end,-1]);}
    rows.push({id:job.id,status:r.status,attempt_id:r.attempt_id??null,started_at:r.started_at??null,finished_at:r.finished_at??null,known_tokens:usage?.total_tokens??null,output_sha256:r.result?.output?sha(r.result.output):null,error:r.error??null});
  }
  events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let active=0,peak=0;for(const [,change] of events){active+=change;peak=Math.max(peak,active);}
  return {schema_version:'are.benchmark-scheduler-report/v1',manifest_id:manifest.id,manifest_hash:state.manifest_hash,counts,exact_output:{correct,planned:scored},known_tokens:known,unknown_reserved_tokens:unknown,running_reserved_tokens:held,exact_total_tokens:unknown||held?null:known,accounted_tokens:known+unknown+held,token_budget:manifest.token_budget,within_budget:known+unknown+held<=manifest.token_budget,maximum_job_overlap:peak,elapsed_ms:events.length?events.at(-1)[0]-events[0][0]:null,final_concurrency:state.concurrency,halt_reason:state.halt_reason,rows,authority_effect:'none'};
}
