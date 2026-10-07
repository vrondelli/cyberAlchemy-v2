// Receipt-bound analysis for G01 and G02 product-page replications.
// Run only after the full frozen campaign has reached terminal receipts.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';

const [branch,manifestPath,rootOrUnused,outputPath]=process.argv.slice(2);
if(!['g01','g02'].includes(branch)||!manifestPath||!rootOrUnused||!outputPath)
  throw Error('usage: analyze-product-paired-cohort.mjs g01|g02 MANIFEST ROOT_OR_DASH NEW_OUTPUT');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifestBytes=readFileSync(resolve(manifestPath));
const manifest=JSON.parse(manifestBytes),manifestSha=sha(manifestBytes);
const planned=branch==='g01'?manifest.tasks??manifest.ordered_tasks:manifest.ordered_pairs;
if(!Array.isArray(planned)||planned.length!==24)throw Error('analysis.planned-count');
let driver=null,driverSha=null;
if(branch==='g02'){
  const bytes=readFileSync(resolve(rootOrUnused));driver=JSON.parse(bytes);driverSha=sha(bytes);
  if(driver.schema_version!=='are.g02-product-replication-driver/v1'||
    driver.status!=='completed-dispatch'||driver.plan_sha256!==manifestSha||
    driver.remaining_outcomes?.length!==24)throw Error('analysis.g02-driver-incomplete');
}
const rows=[];
for(const task of planned){
  const id=branch==='g01'?task.slug:task.instance_id;
  const stratum=task.repo;
  const path=branch==='g01'?join(resolve(rootOrUnused),task.slug,'PAIR-RESULT.json'):
    join(task.root,'PAIR-DECISION.json');
  if(!existsSync(path)){
    if(branch!=='g02')throw Error('analysis.not-terminal:'+id);
    const outcome=driver.remaining_outcomes.find(item=>item.instance_id===id);
    if(!outcome||outcome.decision!==null||outcome.exit_code===0)
      throw Error('analysis.unbound-missing-decision:'+id);
    rows.push({id,stratum,status:'invalid',reason:'driver-error:'+outcome.exit_code,
      receipt_sha256:driverSha,control:null,candidate:null});
    continue;
  }
  const bytes=readFileSync(path),result=JSON.parse(bytes);
  let valid=false,control=null,candidate=null,reason=null;
  if(branch==='g01'){
    if(result.schema!=='are.g01-fast-live-pair-result/v1'||result.task_sha256!==sha(readFileSync(task.task_path)))
      throw Error('analysis.g01-binding:'+id);
    valid=result.status==='scored';reason=valid?null:result.status;
    if(valid){control=result.control;candidate=result.candidate;}
  }else{
    if(result.schema_version!=='are.g02-cross-layer-pair-decision/v1'||result.instance_id!==id)
      throw Error('analysis.g02-binding:'+id);
    valid=Boolean(result.quality?.are&&result.quality?.dsh);
    reason=valid?null:result.strict_four_gate_decision;
    if(valid){control=result.quality.dsh;candidate=result.quality.are;}
  }
  const metric=arm=>arm&&({span_f1:arm.span_f1,file_f1:arm.file_f1,
    known_model_tokens:arm.known_model_tokens,seconds:branch==='g01'?arm.duration_seconds:arm.arm_seconds});
  const row={id,stratum,status:valid?'valid':'invalid',reason,receipt_sha256:sha(bytes),
    control:metric(control),candidate:metric(candidate)};
  if(valid){
    for(const arm of [row.control,row.candidate])
      if(!arm||![arm.span_f1,arm.file_f1,arm.known_model_tokens,arm.seconds].every(Number.isFinite)||
        arm.span_f1<0||arm.span_f1>1||arm.file_f1<0||arm.file_f1>1||
        arm.known_model_tokens<=0||arm.seconds<=0)throw Error('analysis.invalid-metric:'+id);
  }
  rows.push(row);
}
const valid=rows.filter(row=>row.status==='valid');
if(!valid.length)throw Error('analysis.no-valid-pairs');
function metrics(sample){
  const n=sample.length;
  const sum=(side,key)=>sample.reduce((a,row)=>a+row[side][key],0);
  return {span_f1_difference:(sum('candidate','span_f1')-sum('control','span_f1'))/n,
    file_f1_difference:(sum('candidate','file_f1')-sum('control','file_f1'))/n,
    token_ratio:sum('candidate','known_model_tokens')/sum('control','known_model_tokens'),
    time_ratio:sum('candidate','seconds')/sum('control','seconds')};
}
let state=parseInt(manifestSha.slice(0,8),16)||1;
const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/0x100000000;};
const groups=[...new Set(valid.map(row=>row.stratum))].sort().map(stratum=>valid.filter(row=>row.stratum===stratum));
const draws={span_f1_difference:[],file_f1_difference:[],token_ratio:[],time_ratio:[]};
for(let b=0;b<20000;b++){
  const sample=groups.flatMap(group=>Array.from({length:group.length},()=>group[Math.floor(random()*group.length)]));
  const value=metrics(sample);
  for(const key of Object.keys(draws))draws[key].push(value[key]);
}
const intervals=Object.fromEntries(Object.entries(draws).map(([key,values])=>{
  values.sort((a,b)=>a-b);
  return[key,[values[Math.floor(0.025*(values.length-1))],values[Math.floor(0.975*(values.length-1))]]];
}));
const complete=valid.length===24;
const headline=complete&&intervals.span_f1_difference[0]>0&&intervals.file_f1_difference[0]>0&&
  intervals.token_ratio[1]<1&&intervals.time_ratio[1]<1;
const analysis={schema_version:'are.product-paired-replication-analysis/v1',branch,manifest_sha256:manifestSha,
  planned_pairs:24,valid_pairs:valid.length,invalid_pairs:rows.length-valid.length,
  driver_sha256:driverSha,
  completeness:complete?'complete':'incomplete',rows,point:metrics(valid),intervals,
  method:{resamples:20000,seed_source:'first eight hex digits of manifest SHA-256',seed:parseInt(manifestSha.slice(0,8),16),
    resampling:'paired rows within repository strata',percentiles:'floor((B-1)*p), p=0.025 and 0.975',
    timing_disclosure:'Bootstrap implementation details bound after some native scores had opened; interval family and directional rule were frozen before dispatch'},
  directional_product_headline_admissible:headline,
  claim_ceiling:complete?'Fixed cohort only; independent score and label audit still required':'Incomplete cohort: no directional product-page claim',
  script_sha256:sha(readFileSync(import.meta.filename))};
writeFileSync(resolve(outputPath),JSON.stringify(analysis,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({branch,planned:24,valid:valid.length,point:analysis.point,intervals,headline}));
