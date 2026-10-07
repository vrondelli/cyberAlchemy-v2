// Post-hoc evaluator-only sensitivity. Never rewrites G01 r6 scores or its gate.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [analysisPath,auditPath,outputPath]=process.argv.slice(2);
if(!analysisPath||!auditPath||!outputPath)throw Error('usage: audit-r6-label-sensitivity-r1.mjs ANALYSIS LABEL_AUDIT NEW_OUTPUT');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const expectedAnalysis='b928ac86ed80d274fb683854ba5ec861fdfdc675b23b44719fb4ed503051fa6e';
const expectedAudit='1695aec39efbc3b1731b5254d271ff7586e8187f0b61bcf80bcc0aedbfa29fe6';
const analysisBytes=readFileSync(analysisPath),auditBytes=readFileSync(auditPath);
if(sha(analysisBytes)!==expectedAnalysis||sha(auditBytes)!==expectedAudit)throw Error('frozen input hash mismatch');
const analysis=JSON.parse(analysisBytes),audit=JSON.parse(auditBytes);
if(analysis.branch!=='g01'||analysis.planned_pairs!==24||analysis.valid_pairs!==24||
   analysis.rows.length!==24||audit.rows.length!==24||audit.summary.unresolved_count!==16)
  throw Error('unexpected frozen denominator');
const unresolvedKinds=new Set(['range-beyond-base','raw-content-mismatch','content-absent',
  'patch-referenced-file-absent-from-base','unexplained-file-absent-from-base','invalid-path']);
const affected=new Set(audit.rows.filter(row=>row.classifications.some(item=>unresolvedKinds.has(item.kind)))
  .map(row=>row.slug));
if(affected.size!==6||analysis.rows.some(row=>row.status!=='valid')||
   new Set(analysis.rows.map(row=>row.id)).size!==24||
   audit.rows.some(row=>!analysis.rows.some(score=>score.id===row.slug)))throw Error('label/score task binding mismatch');
const metrics=sample=>{
  const sum=(side,key)=>sample.reduce((value,row)=>value+row[side][key],0);
  return {span_f1_difference:(sum('candidate','span_f1')-sum('control','span_f1'))/sample.length,
    file_f1_difference:(sum('candidate','file_f1')-sum('control','file_f1'))/sample.length,
    token_ratio:sum('candidate','known_model_tokens')/sum('control','known_model_tokens'),
    time_ratio:sum('candidate','seconds')/sum('control','seconds')};
};
function intervals(rows){
  let state=parseInt(analysis.manifest_sha256.slice(0,8),16)||1;
  const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/0x100000000;};
  const groups=[...new Set(rows.map(row=>row.stratum))].sort().map(stratum=>rows.filter(row=>row.stratum===stratum));
  const draws={span_f1_difference:[],file_f1_difference:[],token_ratio:[],time_ratio:[]};
  for(let b=0;b<20000;b++){
    const sample=groups.flatMap(group=>Array.from({length:group.length},()=>group[Math.floor(random()*group.length)]));
    const values=metrics(sample);
    for(const key of Object.keys(draws))draws[key].push(values[key]);
  }
  return Object.fromEntries(Object.entries(draws).map(([key,values])=>{
    values.sort((left,right)=>left-right);
    return[key,[values[Math.floor(0.025*(values.length-1))],values[Math.floor(0.975*(values.length-1))]]];
  }));
}
const reproduced=intervals(analysis.rows);
for(const key of Object.keys(reproduced)){
  if(!analysis.intervals[key].every((value,index)=>Math.abs(value-reproduced[key][index])<1e-12))
    throw Error('frozen bootstrap reproduction mismatch:'+key);
}
const clean=analysis.rows.filter(row=>!affected.has(row.id));
const disputed=analysis.rows.filter(row=>affected.has(row.id));
if(clean.length!==18||disputed.length!==6)throw Error('sensitivity denominator mismatch');
const cleanPoint=metrics(clean),cleanIntervals=intervals(clean),disputedPoint=metrics(disputed);
const output={schema_version:'are.g01-r6-label-sensitivity/v1',
  posture:'post-hoc-evaluator-only-sensitivity-original-24-pair-gate-unchanged',
  analysis_sha256:expectedAnalysis,label_audit_sha256:expectedAudit,
  affected_task_ids:[...affected].sort(),clean_task_count:18,affected_task_count:6,
  frozen_24_pair_intervals_reproduced:true,
  frozen_point:analysis.point,clean_point:cleanPoint,clean_intervals:cleanIntervals,
  affected_point:disputedPoint,
  clean_directional_numeric_only:cleanIntervals.span_f1_difference[0]>0&&
    cleanIntervals.file_f1_difference[0]>0&&cleanIntervals.token_ratio[1]<1&&cleanIntervals.time_ratio[1]<1,
  method:'Original paired repository-stratified 20,000-resample bootstrap replayed exactly; post-hoc 18-task exclusion only for sensitivity, with same PRNG seed and interval calculation.',
  claim_ceiling:'Post-hoc sensitivity only. Six affected tasks remain in the frozen 24-pair result; unresolved labels continue to fail the prospectively frozen public headline rule.'};
const bytes=Buffer.from(JSON.stringify(output,null,2)+'\n');
writeFileSync(outputPath,bytes,{flag:'wx',mode:0o600});
console.log(JSON.stringify({clean_point:cleanPoint,clean_intervals:cleanIntervals,
  affected_point:disputedPoint,clean_directional_numeric_only:output.clean_directional_numeric_only,
  result_sha256:sha(bytes)}));
