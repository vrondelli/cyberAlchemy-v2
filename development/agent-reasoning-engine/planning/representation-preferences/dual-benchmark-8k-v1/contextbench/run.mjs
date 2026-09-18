// Complete native trajectories. No shared prefix or model retries. Open questions: README.md.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statfsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { runPreparedTask } from './orchestrate.mjs';
import { liveClientFactory } from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/live-client.mjs';
import { exportModelSelectedContext } from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';
import { stable } from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const read=p=>JSON.parse(readFileSync(p));
const zero=()=>({span_coverage:0,span_precision:0,span_f1:0,file_coverage:0,file_precision:0});
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
async function nativeScore(config,directory,result,task){
  if(!result.native_export?.prediction || !result.selection?.final_read_ids?.length)return {complete:false,metrics:zero(),reconstructed:result.selection==null||!result.selection.final_read_ids?.length};
  const snapshots=readdirSync(join(directory,'snapshots')).filter(n=>n.endsWith('.json')).map(n=>read(join(directory,'snapshots',n)));
  const rebuilt=exportModelSelectedContext({...result,task:read(task.task_path),source_snapshots:snapshots,response_capture:result.response_captures.at(-1)},join(directory,'base'));
  if(stable(rebuilt.prediction)!==stable(read(join(directory,'prediction.json')))||stable(rebuilt.selection)!==stable(result.selection))throw Error('independent reconstruction mismatch');
  const out=join(directory,'native-score.json'),worktrees=join(directory,'native-worktrees');mkdirSync(worktrees);
  await new Promise((yes,no)=>{
    const proc=spawn(config.python,[config.scorer,'--upstream',config.upstream,'--manifest',config.source_manifest,'--gold',join(config.upstream,'data/full.parquet'),'--pred',join(directory,'prediction.json'),'--cache',config.scoring_cache,'--out',out],{env:{...process.env,CONTEXTBENCH_TMP_ROOT:worktrees}});
    proc.stdout.resume();
    let stderr='';proc.stderr.on('data',b=>{if(stderr.length<10000)stderr+=b;});const timer=setTimeout(()=>proc.kill('SIGKILL'),180000);
    proc.on('error',e=>{clearTimeout(timer);no(e);});proc.on('close',code=>{clearTimeout(timer);code===0?yes():no(Error('native scorer failed:'+stderr));});
  });
  const final=read(out).native.final;if(!final?.span||!final?.file)throw Error('native metrics missing');
  const c=final.span.coverage,p=final.span.precision;
  for(const n of [c,p,final.file.coverage,final.file.precision])if(!Number.isFinite(n))throw Error('native metric invalid');
  return {complete:true,reconstructed:true,metrics:{span_coverage:c,span_precision:p,span_f1:c+p?2*c*p/(c+p):0,file_coverage:final.file.coverage,file_precision:final.file.precision},native_score_path:out};
}
export function accountReceipts(receipts=[]){
  const models=receipts.filter(r=>r.kind==='model'&&r.dispatched),known=models.filter(r=>Number.isSafeInteger(r.input_tokens)&&Number.isSafeInteger(r.output_tokens));
  const input=known.reduce((s,r)=>s+r.input_tokens,0),output=known.reduce((s,r)=>s+r.output_tokens,0),unknown=models.length-known.length;
  const limited=receipts.find(r=>r.status===429||r.failure_code==='rate-limited'||['1302','1305'].includes(String(r.provider_code)));
  return {prompt_tokens:input,completion_tokens:output,total_tokens:input+output,unknown_usage_calls:unknown,conservative_total_tokens:input+output+unknown*8000,model_calls:models.length,rate_limited:Boolean(limited),provider_error_code:limited?.provider_code??null};
}
export async function runPair({config=read(new URL('./config.json',import.meta.url)),task_id,directory,repetition=1,signal,run_task=runPreparedTask,client_factory=liveClientFactory}={}){
  const task=config.tasks.find(t=>t.id===task_id);if(!task)throw Error('unknown frozen task');
  if(config.context_limit!==8000||config.total_tokens_per_arm!==96000)throw Error('invalid contextbench budget');
  if(existsSync(directory))throw Error('existing pair; automatic reruns prohibited');
  const parent=resolve(directory,'..');mkdirSync(parent,{recursive:true});const disk=statfsSync(parent);if(disk.bavail*disk.bsize<5_000_000_000)throw Error('disk headroom below5GB');
  if(resolve(directory).startsWith('/tmp/'))throw Error('tmpfs checkout prohibited');
  mkdirSync(directory);const arms={},order=repetition%2?['control','treatment']:['treatment','control'];
  for(const arm of order){
    if(signal?.aborted){arms[arm]={status:'not-started-aborted',complete:false,metrics:zero(),usage:accountReceipts()};continue;}
    const cell=structuredClone(task.cell_template);cell.cell_id=task_id+'-r'+repetition+'-'+arm;cell.limits.compact_representation=arm==='treatment';cell.context_limit=8000;cell.limits.total_tokens=96000;
    const out=join(directory,arm),controller=new AbortController();const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,1800000);
    let result;
    try{result=await run_task({task_path:task.task_path,task_sha256:task.task_sha256,repository_cache:task.repository_cache,out,cell,...client_factory({credential_path:config.credential_path,signal:controller.signal})});}
    catch(e){
      const ledger=join(out,'state','glm-transport-ledger.json'),retained=join(out,'result.json');
      const state=existsSync(ledger)?read(ledger):null;
      const receipts=structuredClone(state?.receipts??[]);
      const missing=Math.max(0,(state?.model_calls??0)-receipts.filter(r=>r.kind==='model').length);
      for(let i=0;i<missing;i++)receipts.push({kind:'model',dispatched:true,status:null,failure_code:'missing-completion-receipt',conservative_assumption:true});
      result=existsSync(retained)?read(retained):{status:'local_execution_error',error:String(e.message),receipts};
      if(existsSync(out)&&!existsSync(retained))save(retained,result);
    }
    finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    const usage=accountReceipts(result.receipts);
    arms[arm]={status:result.status,error:result.error,usage,complete:result.status==='final_context_selected'&&Boolean(result.native_export?.prediction),scoring_pending:true,run_directory:out};save(join(directory,arm+'-summary.json'),arms[arm]);
    if(usage.rate_limited||usage.unknown_usage_calls){const remaining=order.filter(a=>!arms[a]);for(const a of remaining)arms[a]={status:'not-started-after-provider-failure',complete:false,metrics:zero(),usage:accountReceipts()};break;}
  }
  const values=Object.values(arms),usage={prompt_tokens:values.reduce((s,x)=>s+x.usage.prompt_tokens,0),completion_tokens:values.reduce((s,x)=>s+x.usage.completion_tokens,0),total_tokens:values.reduce((s,x)=>s+x.usage.total_tokens,0)};
  const unknown_usage_calls=values.reduce((s,x)=>s+x.usage.unknown_usage_calls,0);
  const output={status:values.every(x=>x.complete)&&unknown_usage_calls===0?'completed':'incomplete',task_id,instance_id:task.instance_id,repetition,arms,usage,unknown_usage_calls,unknown_usage:unknown_usage_calls>0,conservative_total_tokens:values.reduce((s,x)=>s+x.usage.conservative_total_tokens,0),rate_limited:values.some(x=>x.usage.rate_limited),provider_error_code:values.find(x=>x.usage.provider_error_code)?.usage.provider_error_code??null,quality_scope:'native ContextBench source selection, not verified code repair',authority_effect:'none',open_questions_ref:'README.md'};
  save(join(directory,'pair-result.json'),output);save(join(directory,'result.json'),output);return output;
}
/** Evaluator boundary: invoke only after both predictions are sealed. No model calls. */
export async function scorePair({config=read(new URL('./config.json',import.meta.url)),directory}={}){
  const pair=read(join(directory,'pair-result.json')),task=config.tasks.find(t=>t.id===pair.task_id);
  for(const arm of ['control','treatment']){
    const row=pair.arms[arm];if(!row.run_directory){row.metrics=zero();row.complete=false;continue;}
    try{Object.assign(row,await nativeScore(config,row.run_directory,read(join(row.run_directory,'result.json')),task));}
    catch(e){Object.assign(row,{complete:false,reconstructed:false,metrics:zero(),scoring_error:String(e.message)});}
    row.scoring_pending=false;
  }
  save(join(directory,'scored-pair-result.json'),pair);save(join(directory,'scored-result.json'),pair);return pair;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const [task_id,directory,rep='1']=process.argv.slice(2);if(!directory)throw Error('task-id output-directory [repetition] required');console.log(JSON.stringify(await runPair({task_id,directory:resolve(directory),repetition:Number(rep)})));}
