export async function executeSchedule({schedule,counts,generate,save,score,budget=204800,input_limit=7168,output_reserve=1024}) {
 const results=[];let tokens=0;
 for(const row of schedule) {
  const expected=counts[row.input_digest];
  if(!Number.isSafeInteger(expected)||expected<0||expected>input_limit)throw Error('input admission failed');
  if(tokens+input_limit+output_reserve>budget)throw Error('remaining budget cannot cover next call');
  let receipt;
  try {receipt=await generate(row.id,row.messages,output_reserve);}
  catch(error) {
   const u=error.receipt?.usage;
   const known=Number.isSafeInteger(u?.prompt_tokens)&&u.prompt_tokens>=0&&Number.isSafeInteger(u?.completion_tokens)&&u.completion_tokens>=0&&u.total_tokens===u.prompt_tokens+u.completion_tokens;
   if(known)tokens+=u.total_tokens;
   await save({status:'stopped',completed:results.length,total_tokens:tokens,failed_call:row.id,failed_usage:u??null,usage_complete:known,results});
   throw error;
  }
  const u=receipt.usage;
  if(!Number.isSafeInteger(u?.prompt_tokens)||u.prompt_tokens<0||!Number.isSafeInteger(u?.completion_tokens)||u.completion_tokens<0||u.total_tokens!==u.prompt_tokens+u.completion_tokens) {
   await save({status:'stopped',completed:results.length,total_tokens:tokens,failed_call:row.id,usage_complete:false,results});
   throw Error('invalid generation usage');
  }
  tokens+=u.total_tokens;
  const within=u.prompt_tokens<=input_limit&&u.completion_tokens<=output_reserve&&tokens<=budget;
  const result={id:row.id,task_id:row.task_id,arm:row.arm,repetition:row.repetition,usage:u,tokenizer_input:expected,input_count_difference:u.prompt_tokens-expected,within_budget:within,score:within?score(row.task_id,receipt.output):null};
  results.push(result);
  await save({status:within?'running':'stopped',completed:results.length,total_tokens:tokens,usage_complete:true,results});
  if(!within)throw Error('actual usage exceeds admission');
 }
 const result={status:'completed',completed:results.length,total_tokens:tokens,usage_complete:true,results};
 await save(result);return result;
}
