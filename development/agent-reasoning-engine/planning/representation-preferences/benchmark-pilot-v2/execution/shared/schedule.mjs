import {sha} from './provider.mjs';

export function buildSchedule(tasks) {
 if(tasks.length!==4 || new Set(tasks.map(t=>t.task_id)).size!==4) throw Error('four distinct development tasks required');
 if(tasks.some(t=>t.split!=='development')) throw Error('reserved task prohibited');
 const schedule=[];
 for(let repetition=0;repetition<2;repetition++) for(const task of tasks) {
  for(const arm of repetition===0?['control','treatment']:['treatment','control']) {
   const items=task.treatment_projection?.items??[];
   const messages=structuredClone(task.messages);
   if(arm==='treatment' && items.length) messages.splice(messages.length-1,0,{role:'system',content:'ARE confirmed, scoped preferences for this request:\n'+JSON.stringify(items)});
   const id=`r${repetition+1}-${task.task_id}-${arm}`;
   schedule.push({id,task_id:task.task_id,repetition:repetition+1,arm,messages,input_digest:sha(messages),state_digest:task.exposure.state_digest,projected_items:arm==='treatment'?items.length:0});
  }
 }
 return schedule;
}

export function admitSchedule(schedule,counts,{input_limit=7168,output_reserve=1024,budget=204800}={}) {
 if(schedule.length!==16 || new Set(schedule.map(x=>x.id)).size!==16) throw Error('invalid schedule');
 let maximum_tokens=0;
 for(const row of schedule) {
  const n=counts[row.input_digest];
  if(!Number.isSafeInteger(n)||n<0) throw Error('unknown tokenizer usage');
  if(n>input_limit) throw Error('overlength');
  maximum_tokens+=n+output_reserve;
 }
 if(maximum_tokens>budget) throw Error('branch budget exceeded');
 return {admitted:true,generations:16,maximum_generation_tokens:maximum_tokens,input_limit,output_reserve,budget};
}
