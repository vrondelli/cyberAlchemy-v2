// Additive, read-only post-run analysis. No provider calls, gold or source text output.
// Open questions: README.md; current execution sources remain frozen.
import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {stable,bodyForReceipt} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const MAX_FILE_BYTES=64*1024*1024;
const read=p=>{if(statSync(p).size>MAX_FILE_BYTES)throw Error('analysis file exceeds64MiB:'+p);return JSON.parse(readFileSync(p));};
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=x=>Buffer.byteLength(typeof x==='string'?x:stable(x));
const sum=(xs,f)=>xs.reduce((n,x)=>n+f(x),0);
const count=(xs,f)=>Object.fromEntries([...new Set(xs.map(f))].sort().map(k=>[k,xs.filter(x=>f(x)===k).length]));
export function summarizeNativeArm(directory){
  const path=join(directory,'result.json');if(!existsSync(path))return {status:'pending',directory};
  const r=read(path),model=(r.receipts??[]).filter(x=>x.kind==='model'&&x.dispatched===true);
  const known=model.filter(x=>Number.isSafeInteger(x.input_tokens)&&Number.isSafeInteger(x.output_tokens));
  const input=sum(known,x=>x.input_tokens),output=sum(known,x=>x.output_tokens),dispatches=r.recycling?.dispatches??[];
  const admitted=dispatches.filter(d=>Number.isSafeInteger(d.projected_upper_bound)&&d.projected_upper_bound<=8000);
  const promptCategories={system:0,user:0,assistant:0,tool:0,tools_schema:0,other:0};
  let matched=0,promptBytes=0,repeatedMessageBytes=0,sourceBodyBytes=0;
  const seen=new Set(),profiles=new Map();
  for(const receipt of model){
    if(!Number.isSafeInteger(receipt.output_cap)||typeof receipt.reasoning_effort!=='string')continue;
    const key=stable([receipt.model,receipt.output_cap,receipt.reasoning_effort]);
    if(!profiles.has(key)){
      const captures=new Map();
      for(const c of r.captures??[]){try{captures.set(hash(stable(bodyForReceipt(c.prompt,receipt))),c.prompt);}catch{}}
      profiles.set(key,captures);
    }
    const prompt=profiles.get(key).get(receipt.request_sha256);if(!prompt)continue;
    matched++;promptBytes+=bytes(prompt);const parsed=JSON.parse(prompt);promptCategories.tools_schema+=bytes(parsed.tools);
    for(const m of parsed.messages){
      const size=bytes(m),category=Object.hasOwn(promptCategories,m.role)?m.role:'other';promptCategories[category]+=size;
      const digest=hash(stable(m));if(seen.has(digest))repeatedMessageBytes+=size;seen.add(digest);
      if(m.role==='tool'){try{const out=JSON.parse(m.content)?.output;if(typeof out?.utf8==='string')sourceBodyBytes+=bytes(out.utf8);for(const observation of out?.observations??[])if(typeof observation.utf8==='string')sourceBodyBytes+=bytes(observation.utf8);}catch{}}
    }
  }
  const admissions=r.admissions??[],capacity=(r.receipts??[]).filter(x=>[429,503].includes(x.status)||['1302','1305'].includes(String(x.provider_code)));
  return {directory,status:r.status,error:r.error??null,model_calls:model.length,known_usage_calls:known.length,unknown_usage_calls:model.length-known.length,
    input_tokens:input,output_tokens:output,total_tokens:input+output,mean_input_tokens_per_known_call:known.length?input/known.length:null,mean_output_tokens_per_known_call:known.length?output/known.length:null,
    context_recycles:r.recycling?.recycles??null,finalizing:r.finalizing??false,admission_reasons:count(admissions,a=>a.reason??'missing'),last_admission:admissions.at(-1)??null,
    budget_finalization_reserved:admissions.some(a=>a.reason==='token-budget.finalization-reserved'),budget_exhausted:admissions.some(a=>a.reason==='token-budget.exhausted'),
    strict_window_evidence:{dispatches:dispatches.length,valid_dispatches:admitted.length,model_receipts:model.length,passed:dispatches.length>0&&dispatches.length===model.length&&admitted.length===dispatches.length,maximum_admitted:dispatches.length?Math.max(...dispatches.map(d=>d.projected_upper_bound)):null},
    provider_capacity_signals:capacity.map(x=>({kind:x.kind,status:x.status,provider_code:x.provider_code??null})),
    finish_reasons:count(model,x=>x.finish_reason??'missing'),prompt_overhead:{matched_dispatched_requests:matched,total_dispatched_requests:model.length,prompt_bytes:promptBytes,category_bytes:promptCategories,repeated_exact_message_bytes:repeatedMessageBytes,source_body_utf8_bytes:sourceBodyBytes,unit:'bytes, not per-category tokens',scope:'actual dispatched request captures; tokenizer-only candidate captures excluded'},
    evidence_limits:'Does not inspect semantic source contents, gold or hidden reasoning. Category bytes cannot establish token savings or causal quality.'};
}
export function decomposePair(control,treatment){
  if(!control.model_calls||!treatment.model_calls||control.unknown_usage_calls||treatment.unknown_usage_calls)return {interpretable:false,reason:'missing/unknown model calls'};
  const c=control.total_tokens/control.model_calls,t=treatment.total_tokens/treatment.model_calls;
  return {interpretable:true,control_tokens:control.total_tokens,treatment_tokens:treatment.total_tokens,reduction:1-treatment.total_tokens/control.total_tokens,
    control_calls:control.model_calls,treatment_calls:treatment.model_calls,control_mean_tokens_per_call:c,treatment_mean_tokens_per_call:t,
    total_difference:treatment.total_tokens-control.total_tokens,
    call_count_component_at_control_mean:(treatment.model_calls-control.model_calls)*c,
    mean_call_cost_component_at_treatment_count:treatment.model_calls*(t-c),
    interpretation:'Exact arithmetic decomposition, not causal attribution: request contents and task trajectories diverge.'};
}
export function analyzeStage(directory){
  const pairsRoot=join(directory,'pairs'),pairs=[];
  if(existsSync(pairsRoot))for(const id of readdirSync(pairsRoot).sort()){
    const pairDir=join(pairsRoot,id),config=join(pairDir,'config.json');
    if(!existsSync(config)||read(config).benchmark!=='contextbench')continue;
    const run=join(pairDir,'run'),control=summarizeNativeArm(join(run,'control')),treatment=summarizeNativeArm(join(run,'treatment'));
    pairs.push({id,sealed:existsSync(join(run,'result.json')),control,treatment,decomposition:decomposePair(control,treatment)});
  }
  return {schema_version:'dual8k.contextbench-trace-analysis/v1',stage_directory:directory,pairs,
    scheduler_caveat:'A pair waiting inside createGroupGate already occupies a global scheduler slot. Unequal benchmark durations can leave a benchmark waiting behind excess jobs of the other group; configured worker maxima alone do not prove model overlap.',
    authority_effect:'none',open_questions_ref:'README.md'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const directories=process.argv.slice(2);if(!directories.length)throw Error('one or more stage directories required');
  console.log(JSON.stringify(directories.map(d=>analyzeStage(resolve(d))),null,2));
}
