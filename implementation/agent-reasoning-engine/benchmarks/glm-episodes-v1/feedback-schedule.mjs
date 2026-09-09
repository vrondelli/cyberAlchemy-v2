// Open questions: FRESH-FEEDBACK.md
export function selectFeedbackSchedule(record,freshMode=false) {
 if(![false,true,12].includes(freshMode))throw Error('feedback-mode-invalid');
 const freshCount=freshMode===12?12:freshMode?4:0;
 if(record?.status!=='COMPLETED'||!Array.isArray(record.trials))throw Error('feedback-incomplete-initial-run');
 const schedule=freshCount?record.trials:record.trials.filter(t=>t.gate);
 if(schedule.length!==(freshCount||6)||freshCount&&(record.planned!==freshCount||record.completed!==freshCount))throw Error('feedback-schedule-invalid');
 const ids=new Set(),indices=new Set();
 for(const row of schedule) {
  if(typeof row.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(row.id)||ids.has(row.id)||!Number.isSafeInteger(row.index)||row.index<0||indices.has(row.index)||typeof row.gate!=='boolean'||typeof row.repair!=='boolean')throw Error('feedback-trial-invalid');
  ids.add(row.id);indices.add(row.index);
 }
 if(freshCount===12){
  const expected=new Set(['archive-slice-bounds','exact-json-scoring','retention-tool-pairs','retention-long-window'].flatMap(task=>[8000,10000,12000].map(window=>task+':'+window)));
  for(const row of schedule){if(!expected.delete(row.episode+':'+row.soft_limit))throw Error('feedback-matrix-condition-invalid');}
  if(expected.size)throw Error('feedback-matrix-incomplete');
 }
 return {schedule,maximum_model_attempts:freshCount||2};
}
export function feedbackOutcome(results,oracle) {
 const passed=new Set(oracle.filter(x=>x.result?.ok).map(x=>x.id));
 return {final_verified:results.filter(x=>['UNCHANGED','REPAIRED'].includes(x.result.status)&&passed.has(x.id)).length,corrected_verified:results.filter(x=>x.result.status==='REPAIRED'&&passed.has(x.id)).length,unsubmitted:results.filter(x=>(x.result.status==='NO_SUBMISSION'||x.result.format&&x.result.format.status!=='FORMAT_REPAIRED')).length};
}

// Delivery completion and accepted submission are independent states.
export function selectCorrectionInput(trace,candidate) {
 const present=candidate!==undefined;
 if(!trace||typeof trace.status!=='string')throw Error('feedback-trace-invalid');
 if(present){
  if(trace.status!=='AWAITING_APPROVAL'||trace.completion_gate?.passed!==true||trace.candidate_validation?.ok===false)throw Error('feedback-candidate-state-invalid');
  return {candidate};
 }
 if(trace.status==='AWAITING_APPROVAL')throw Error('feedback-candidate-missing');
 const e=trace.final_response_evidence;
 if(trace.status!=='BLOCK'||trace.completion_gate?.passed!==true||!trace.reason_codes?.includes('glm.candidate-invalid')||e?.truncated!==false||typeof e.text!=='string')return {rejected_text:''};
 return {rejected_text:e.text};
}
