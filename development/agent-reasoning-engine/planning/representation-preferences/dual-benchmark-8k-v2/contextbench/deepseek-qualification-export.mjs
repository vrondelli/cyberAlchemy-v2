// Post-settlement single-control qualification; no model calls.
// Open questions: DEEPSEEK-CONTROL-FIT-DAG.md.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadSealedExchanges,reconcileTransport} from './deepseek-durable-transport.mjs';
import {exportDeepSeekWire} from './deepseek-wire-export.mjs';
export function exportQualification(root){
 const settlement=JSON.parse(readFileSync(join(root,'QUALIFICATION-SETTLEMENT.json'),'utf8'));
 if(settlement.slot?.arm!=='deepseek-harness-adapted'||settlement.harness_state?.Running!==false||settlement.proxy_state?.Running!==false)throw Error('qualification.unsettled-process');
 const r=join(root,'runs',settlement.slot.id),transport=join(r,'transport');
 const result={schema_version:'are.dsh-qualification/v1',slot:settlement.slot,harness_exit:settlement.harness_exit,valid_export:false,accounting_complete:false,known_total_tokens:null,unknown_usage_dispatched_requests:null,model_calls:null,benchmark_cleared:false};
 // Reconcile costs before success-only export checks. Missing accounting stays null.
 try{
  const accounting=reconcileTransport(transport);
  Object.assign(result,{known_total_tokens:accounting.known_total_tokens,unknown_usage_dispatched_requests:accounting.unknown_usage_dispatched_requests,model_calls:accounting.model_calls,attempts:accounting.attempts});
  const seal=JSON.parse(readFileSync(join(transport,'RESULTS.json'),'utf8'));
  for(const k of Object.keys(accounting))if(JSON.stringify(accounting[k])!==JSON.stringify(seal[k]))throw Error('qualification.seal-mismatch-'+k);
  result.accounting_complete=accounting.cost_complete&&accounting.unsettled_attempts.length===0&&seal.state?.closed===true&&seal.state?.busy===false;
  const events=accounting.bindings.map(b=>JSON.parse(readFileSync(join(transport,b.name),'utf8')));
  const requestKinds=new Map(events.filter(e=>e.kind==='request').map(e=>[e.attempt,JSON.parse(e.request_bytes).messages.some(m=>typeof m.content==='string'&&m.content.includes('You are now acting as a compaction engine'))?'native_summary':'task_work']));
  result.request_trace=events.filter(e=>e.kind==='receipt').map(e=>({attempt:e.attempt,kind:requestKinds.get(e.attempt),dispatched:e.dispatched,ok:e.ok,code:e.code??null,usage:e.usage??null}));
  result.token_breakdown={classification:'native request compaction-engine marker',native_summary:0,task_work:0};
  for(const e of result.request_trace)if(e.dispatched&&e.usage)result.token_breakdown[e.kind]+=e.usage.total;
  if(result.token_breakdown.native_summary+result.token_breakdown.task_work!==result.known_total_tokens)throw Error('qualification.trace-accounting-mismatch');
  const task=JSON.parse(readFileSync(join(root,'tasks',settlement.slot.task_id+'.json'),'utf8'));
  const records=readdirSync(join(r,'tools')).filter(n=>/^\d{6}\.json$/.test(n)).sort().map(n=>JSON.parse(readFileSync(join(r,'tools',n),'utf8')));
  result.patch_attempted=records.some(e=>e.kind==='tool-intent'&&e.call?.function?.name==='apply_edits');
  result.patch_changed=Boolean(execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',join(r,'sources/work'),'diff','--no-ext-diff','--no-textconv','--name-only',task.base_commit,'--'],{encoding:'utf8',timeout:30000}));
  if(settlement.harness_exit!==0)throw Error('qualification.harness-failed');
  const {exchanges}=loadSealedExchanges(transport);
  const exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(r,'sources/base')});
  if(exported.token_accounting.known_total_tokens!==result.known_total_tokens||!result.accounting_complete)throw Error('qualification.accounting-incomplete');
  writeFileSync(join(root,'NATIVE-EXPORT.json'),JSON.stringify(exported,null,2),{flag:'wx'});
  writeFileSync(join(root,'prediction.json'),JSON.stringify(exported.prediction,null,2),{flag:'wx'});
  result.valid_export=true;
 }catch(e){result.error=String(e.message).slice(0,500);}
 writeFileSync(join(root,'QUALIFICATION-EXPORT.json'),JSON.stringify(result,null,2),{flag:'wx'});
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(exportQualification(resolve(process.argv[2]))));
