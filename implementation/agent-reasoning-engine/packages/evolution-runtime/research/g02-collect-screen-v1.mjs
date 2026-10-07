#!/usr/bin/env node
// One-task development collector. It never dispatches a model and never changes the native scorer.
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,why)=>{if(!ok)throw Error(`g02-collect.${why}`);};
const load=path=>{const bytes=readFileSync(resolve(path));return {value:JSON.parse(bytes),sha256:sha(bytes)};};
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const f1=({coverage,precision})=>coverage+precision===0?0:2*coverage*precision/(coverage+precision);

export function summarizeG02Screen({task_id,result,run_result=null,native_score=null,minimum_span_f1,minimum_file_f1,maximum_model_tokens,bindings={}}){
 need(typeof task_id==='string'&&task_id.length>0&&result?.task_id===task_id,'task-binding');
 need([minimum_span_f1,minimum_file_f1].every(x=>finite(x)&&x>=0&&x<=1),'quality-gate');
 need(Number.isSafeInteger(maximum_model_tokens)&&maximum_model_tokens>0,'token-gate');
 need(Number.isSafeInteger(result.model_calls)&&result.model_calls>=0&&Number.isSafeInteger(result.known_total_tokens)&&result.known_total_tokens>=0&&Number.isSafeInteger(result.unknown_usage_dispatched_requests)&&result.unknown_usage_dispatched_requests>=0,'accounting');
 const export_valid=result.status==='final_context_selected'&&result.native_export?.prediction!==undefined&&(!run_result||run_result.status===result.status);
 const score_valid=export_valid&&native_score?.native?.error==null&&native_score?.native?.instance_id===result.native_export.prediction.instance_id&&
  ['span','file'].every(key=>{const metric=native_score.native.final?.[key];return metric&&[metric.coverage,metric.precision].every(x=>finite(x)&&x>=0&&x<=1);});
 const span_f1=score_valid?f1(native_score.native.final.span):null;
 const file_f1=score_valid?f1(native_score.native.final.file):null;
 const gates={valid_export:!!export_valid,known_usage:result.unknown_usage_dispatched_requests===0,
  token_ceiling:result.known_total_tokens<=maximum_model_tokens,native_score:!!score_valid,
  span_quality:span_f1===null?null:span_f1>=minimum_span_f1,file_quality:file_f1===null?null:file_f1>=minimum_file_f1};
 return {schema_version:'are.g02-development-screen/v1',task_id,decision:Object.values(gates).every(x=>x===true)?'pass':'reject',
  status:result.status,error:run_result?.error??result.error??null,model_calls:result.model_calls,
  known_total_tokens:result.known_total_tokens,unknown_usage_dispatched_requests:result.unknown_usage_dispatched_requests,
  metrics:{span_f1,file_f1},thresholds:{minimum_span_f1,minimum_file_f1,maximum_model_tokens},gates,
  bindings,claim_ceiling:'One exposed development task only; no paired, full-cohort, deep-window, or efficiency claim.',authority_effect:'none'};
}

function parseArgs(argv){
 const allowed=new Set(['result','run-result','out','task','min-span','min-file','max-tokens','scorer','upstream','gold','cache']);
 const options={};for(let i=0;i<argv.length;i+=2){const key=argv[i]?.replace(/^--/,'');need(argv[i]?.startsWith('--')&&allowed.has(key)&&argv[i+1]!==undefined&&!Object.hasOwn(options,key),'arguments');options[key]=argv[i+1];}
 for(const key of ['result','out','task','min-span','min-file','max-tokens'])need(options[key]!==undefined,`missing-${key}`);
 return options;
}

export function collectG02Screen(options){
 const {value:result,sha256:result_sha256}=load(options.result);
 const run=options['run-result']?load(options['run-result']):null;
 const threshold={minimum_span_f1:Number(options['min-span']),minimum_file_f1:Number(options['min-file']),maximum_model_tokens:Number(options['max-tokens'])};
 // Validate all gate values before creating an output directory or invoking the scorer.
 summarizeG02Screen({task_id:options.task,result,run_result:run?.value,...threshold});
 const out=resolve(options.out);mkdirSync(out,{mode:0o700});
 const bindings={result_sha256,...(run?{run_result_sha256:run.sha256}:{})};
 let score=null,score_error=null;
 if(result.status==='final_context_selected'&&result.native_export?.prediction){
  const prediction=Buffer.from(JSON.stringify(result.native_export.prediction,null,2)+'\n');
  const predictionPath=resolve(out,'prediction.json');writeFileSync(predictionPath,prediction,{flag:'wx',mode:0o600});bindings.prediction_sha256=sha(prediction);
  const scorePath=resolve(out,'native-score.json');
  if(['scorer','upstream','gold','cache'].every(key=>options[key])){
   bindings.scorer_sha256=sha(readFileSync(resolve(options.scorer)));
   const scored=spawnSync('python3',[resolve(options.scorer),'--upstream',resolve(options.upstream),'--gold',resolve(options.gold),'--pred',predictionPath,'--cache',resolve(options.cache),'--out',scorePath],{encoding:'utf8',timeout:180000,maxBuffer:1048576});
   if(scored.status!==0)score_error=`native-scorer-exit:${scored.status??'timeout'}`;
  }else score_error='native-scorer-inputs-missing';
  if(score_error===null){try{const loaded=load(scorePath);score=loaded.value;bindings.native_score_sha256=loaded.sha256;}catch{score_error='native-score-missing-or-invalid';}}
 }
 const screen=summarizeG02Screen({task_id:options.task,result,run_result:run?.value,native_score:score,...threshold,bindings});
 if(score_error)screen.score_error=score_error;
 writeFileSync(resolve(out,'screen.json'),JSON.stringify(screen,null,2)+'\n',{flag:'wx',mode:0o600});
 return screen;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const screen=collectG02Screen(parseArgs(process.argv.slice(2)));
 console.log(JSON.stringify({task_id:screen.task_id,decision:screen.decision,status:screen.status,metrics:screen.metrics,tokens:screen.known_total_tokens,gates:screen.gates}));
}
