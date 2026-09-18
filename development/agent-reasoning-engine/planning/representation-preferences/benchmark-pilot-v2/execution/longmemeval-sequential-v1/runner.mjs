import {ingestionMessages,answerMessages} from './chunks.mjs';
import {recordNotes} from './ledger.mjs';
const validUsage=u=>Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
export async function runSequential({tasks,preflight,provider,save,saveClaim,budget=204800}){
 let total=0;const calls=[],answers=[];
 const snapshot=(status,extra={})=>({status,total_tokens:total,completed_calls:calls.length,completed_answers:answers.length,calls,answers,usage_complete:true,...extra});
 if(tasks.length!==4||!preflight.admitted||preflight.maximum_tokens>budget)throw Error('schedule not admitted');
 let activeCall=null;
 try{
  for(let repetition=1;repetition<=2;repetition++)for(const task of tasks)for(const arm of repetition===1?['control','treatment']:['treatment','control']){
   let notes='';const claims=[];
   for(let step=0;step<=task.chunks.length;step++){
    const phase=step===task.chunks.length?'answer':'ingestion';
    const reservation=preflight.calls.find(c=>c.task_id===task.task_id&&c.phase===phase&&(phase==='answer'||c.arm===arm&&c.chunk===step));
    if(!reservation)throw Error('missing call reservation');
    const inputCap=reservation.input_tokens+reservation.carried_notes_reservation,outputCap=reservation.output_reserve;
    if(total+inputCap+outputCap>budget)throw Error('cumulative reservation exhausted');
    const messages=phase==='answer'?answerMessages(task,notes):ingestionMessages(task.chunks[step],arm,notes);
    const id=`r${repetition}-${task.task_id.replaceAll(':','-')}-${arm}-${phase}-${step}`;
    const measured=await provider.tokenize(id+'-admission',messages);
    if(!Number.isSafeInteger(measured.usage?.prompt_tokens)||measured.usage.prompt_tokens>inputCap||measured.usage.prompt_tokens>7168)throw Error('actual input exceeds reserved admission');
    activeCall=id;
    let receipt;try{receipt=await provider.generate(id,messages,outputCap);}catch(error){
     const known=validUsage(error.receipt?.usage);if(known)total+=error.receipt.usage.total_tokens;
     await save(snapshot('stopped',{failed_call:id,failed_usage:error.receipt?.usage??null,usage_complete:known,failure:error.receipt?.failure??'generation-error'}));
     error.recorded=true;throw error;
    }
    if(!validUsage(receipt.usage))throw Error('unknown generation usage');
    total+=receipt.usage.total_tokens;
    const row={id,task_id:task.task_id,arm,repetition,phase,step,input_reservation:inputCap,usage:receipt.usage};
    calls.push(row);
    if(receipt.usage.prompt_tokens>inputCap||receipt.usage.completion_tokens>outputCap||total>budget)throw Error('actual usage exceeds frozen reservation');
    if(phase==='ingestion'){
     notes=receipt.output;
     if(arm==='treatment'){
      const claim=recordNotes({prepared:task.ledger,notes,step:step+1,prior_claims:claims});claims.push(claim);
      await saveClaim(id,claim);notes=claim.event.content.notes;
      row.source_refs=claim.used_source_refs;row.unknown_refs=claim.unknown_refs;row.claim_digest=claim.event.event_digest;
     }
    }else answers.push({...row,output:receipt.output});
    await save(snapshot('running'));activeCall=null;
   }
  }
  if(calls.length!==preflight.generation_calls||answers.length!==16)throw Error('schedule incomplete');
  const result=snapshot('completed');await save(result);return result;
 }catch(error){if(!error.recorded)await save(snapshot('stopped',{failed_call:activeCall,failure:String(error.message),usage_complete:!activeCall||calls.some(c=>c.id===activeCall)}));throw error;}
}
