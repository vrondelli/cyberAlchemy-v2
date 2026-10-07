// Receipt-bound paired analysis of the fixed 80-question LongMemEval-S replication.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';

const [sourceManifestPath,generationPath,scorePath,outputPath]=process.argv.slice(2);
if(!sourceManifestPath||!generationPath||!scorePath||!outputPath)
  throw Error('usage: analyze-product-longmemeval.mjs SOURCE_MANIFEST GENERATION_RESULT SCORE_RESULT NEW_OUTPUT');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceBytes=readFileSync(resolve(sourceManifestPath)),source=JSON.parse(sourceBytes);
const generationBytes=readFileSync(resolve(generationPath)),generation=JSON.parse(generationBytes);
const generationRunBytes=readFileSync(join(dirname(resolve(generationPath)),'RUN.json')),
  generationRun=JSON.parse(generationRunBytes);
const scoreBytes=readFileSync(resolve(scorePath)),score=JSON.parse(scoreBytes);
const scoreRunBytes=readFileSync(join(dirname(resolve(scorePath)),'RUN.json')),
  scoreRun=JSON.parse(scoreRunBytes);
if(source.rows?.length!==80||new Set(source.question_ids).size!==80||
  generation.status!=='completed'||generation.completed!==80||generation.unknown_usage!==false||
  generationRun.schema_version!=='are.longmemeval-product-replication-paired-run/v1'||
  generationRun.source_manifest_file_sha256!==sha(sourceBytes)||
  score.schema_version!=='are.longmemeval-product-replication-score-result/v1'||
  score.status!=='completed'||score.valid_judgments>160||score.judgments?.length!==160||
  scoreRun.schema_version!=='are.longmemeval-product-replication-score-run/v1'||
  scoreRun.generation_result_sha256!==sha(generationBytes)||
  scoreRun.cohort_manifest_sha256!==sha(sourceBytes)||scoreRun.planned_judgments!==160)
  throw Error('longmemeval-analysis.incomplete-or-drift');
const ids=source.question_ids;
if(JSON.stringify(generation.question_ids)!==JSON.stringify(ids)||JSON.stringify(score.question_ids)!==JSON.stringify(ids))
  throw Error('longmemeval-analysis.ids');
const rows=[];
for(let index=0;index<80;index++){
  const id=ids[index],type=source.rows[index].question_type,result=generation.results[index];
  if(source.rows[index].question_id!==id||result.question_id!==id||result.status!=='completed'||
    result.unknown_usage!==false)throw Error('longmemeval-analysis.generation-row:'+id);
  const arms={};
  for(const arm of ['control','treatment']){
    const judge=score.judgments.filter(item=>item.question_id===id&&item.arm===arm);
    if(judge.length!==1)throw Error('longmemeval-analysis.judge-row:'+id+':'+arm);
    const ownCalls=result.calls.filter(call=>call.arm===arm);
    if(ownCalls.some(call=>call.status!=='completed'||!Number.isSafeInteger(call.usage?.total_tokens)))
      throw Error('longmemeval-analysis.call-accounting:'+id+':'+arm);
    const tokens=ownCalls.reduce((sum,call)=>sum+call.usage.total_tokens,0)+judge[0].usage.total_tokens;
    const milliseconds=result.arm_elapsed_ms[arm]+judge[0].elapsed_ms;
    if(!Number.isFinite(tokens)||tokens<=0||!Number.isFinite(milliseconds)||milliseconds<=0)
      throw Error('longmemeval-analysis.cost:'+id+':'+arm);
    arms[arm]={correct:judge[0].correct===true,judge_valid:judge[0].valid===true,tokens,milliseconds};
  }
  rows.push({question_id:id,question_type:type,...arms});
}
const sum=(sample,arm,key)=>sample.reduce((n,row)=>n+row[arm][key],0);
const metric=sample=>({control_accuracy:sum(sample,'control','correct')/sample.length,
  treatment_accuracy:sum(sample,'treatment','correct')/sample.length,
  accuracy_difference:(sum(sample,'treatment','correct')-sum(sample,'control','correct'))/sample.length,
  token_ratio:sum(sample,'treatment','tokens')/sum(sample,'control','tokens'),
  time_ratio:sum(sample,'treatment','milliseconds')/sum(sample,'control','milliseconds')});
const sourceSha=sha(sourceBytes);let state=parseInt(sourceSha.slice(0,8),16)||1;
const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/0x100000000;};
const groups=[...new Set(rows.map(row=>row.question_type))].sort().map(type=>rows.filter(row=>row.question_type===type));
const draws={accuracy_difference:[],token_ratio:[],time_ratio:[]};
for(let b=0;b<20000;b++){
  const sample=groups.flatMap(group=>Array.from({length:group.length},()=>group[Math.floor(random()*group.length)]));
  const value=metric(sample);
  for(const key of Object.keys(draws))draws[key].push(value[key]);
}
const intervals=Object.fromEntries(Object.entries(draws).map(([key,values])=>{
  values.sort((a,b)=>a-b);
  return[key,[values[Math.floor(0.025*(values.length-1))],values[Math.floor(0.975*(values.length-1))]]];
}));
const treatmentOnly=rows.filter(row=>row.treatment.correct&&!row.control.correct).length;
const controlOnly=rows.filter(row=>row.control.correct&&!row.treatment.correct).length;
const discordant=treatmentOnly+controlOnly;
let probability=discordant?Math.pow(0.5,discordant):1,sumTail=probability;
for(let k=1;k<=Math.min(treatmentOnly,controlOnly);k++){
  probability*=((discordant-k+1)/k);
  sumTail+=probability;
}
const mcnemarP=discordant?Math.min(1,2*sumTail):1;
const point=metric(rows);
const controlFavoringSensitivityDifference=(rows.filter(row=>row.treatment.correct).length-
  rows.filter(row=>row.control.correct||!row.control.judge_valid).length)/80;
const interruptedAttemptedUsageUnknown=generation.interrupted_attempted_usage_unknown===true;
const analysis={schema_version:'are.product-longmemeval-replication-analysis/v1',
  source_manifest_sha256:sourceSha,generation_run_sha256:sha(generationRunBytes),
  generation_result_sha256:sha(generationBytes),
  score_run_sha256:sha(scoreRunBytes),score_result_sha256:sha(scoreBytes),
  planned_questions:80,rows,point,intervals,control_favoring_sensitivity_difference:controlFavoringSensitivityDifference,
  recovery_lineage:generation.recovery_lineage??null,
  interrupted_attempted_usage_unknown:interruptedAttemptedUsageUnknown,
  efficiency_cost_scope:interruptedAttemptedUsageUnknown?'successful per-question attempts only; interrupted attempt cost incomplete':'all known generation and judging attempts',
  discordants:{treatment_only:treatmentOnly,control_only:controlOnly,two_sided_exact_mcnemar_p:mcnemarP},
  invalid_judgments:160-score.valid_judgments,
  method:{resamples:20000,seed_source:'first eight hex digits of source manifest SHA-256',seed:parseInt(sourceSha.slice(0,8),16),
    resampling:'paired questions within six question-type strata',percentiles:'floor((B-1)*p), p=0.025 and 0.975',
    timing_disclosure:'Bootstrap implementation detail bound after G01/G02 scoring had begun, before G03 reference scoring'},
  directional_product_headline_admissible:!interruptedAttemptedUsageUnknown&&score.valid_judgments===160&&intervals.accuracy_difference[0]>0&&
    intervals.token_ratio[1]<1&&intervals.time_ratio[1]<1,
  claim_ceiling:interruptedAttemptedUsageUnknown?
    'Recovered fixed 80-question quality result; incomplete interrupted-attempt cost forbids a complete all-in efficiency headline':
    'Fixed 80-question LongMemEval-S cohort only; independent audit and reviewer sign-off still required',
  script_sha256:sha(readFileSync(import.meta.filename))};
writeFileSync(resolve(outputPath),JSON.stringify(analysis,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({planned:80,point,intervals,mcnemarP,headline:analysis.directional_product_headline_admissible}));
