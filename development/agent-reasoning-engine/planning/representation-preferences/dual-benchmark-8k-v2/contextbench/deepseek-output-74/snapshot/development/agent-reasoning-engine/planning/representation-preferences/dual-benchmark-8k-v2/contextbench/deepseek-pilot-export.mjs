// Post-settlement export only. Open questions: DEEPSEEK-COMPARISON-DAG.md.
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadSealedExchanges,reconcileTransport} from './deepseek-durable-transport.mjs';import {exportDeepSeekWire} from './deepseek-wire-export.mjs';
export function exportPilot(root){
 const campaign=JSON.parse(readFileSync(join(root,'CAMPAIGN-SETTLEMENT.json'),'utf8'));if(campaign.outcomes.length!==8)throw Error('pilot.eight-outcomes-required');const rows=[];
 for(const outcome of campaign.outcomes){
  const {slot}=outcome,r=join(root,'runs',slot.id),row={slot_id:slot.id,task_id:slot.task_id,arm:slot.arm,harness_exit:outcome.harness_exit,valid_export:false,known_total_tokens:null,unknown_usage_dispatched_requests:null,model_calls:null,patch_attempted:false,patch_changed:false};
  try{
   if(outcome.harness_state?.Running||outcome.proxy_state?.Running)throw Error('pilot.unsettled-process');
   let exported;
   if(slot.arm==='current-are'){
    const seal=JSON.parse(readFileSync(join(r,'evidence/RESULTS.json'),'utf8'));
    const episode=JSON.parse(readFileSync(join(r,'evidence/run/result.json'),'utf8'));row.patch_changed=Boolean(episode.patch);
    const events=readFileSync(join(r,'evidence/run/events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));row.patch_attempted=events.some(e=>e.kind==='tool-result'&&e.tool==='apply_edits');for(const k of ['known_total_tokens','unknown_usage_dispatched_requests','model_calls'])row[k]=seal[k];row.status=seal.status;
    if(!seal.native_export)throw Error('pilot.are-no-native-export');exported=seal.native_export;
   }else{
    const accounting=reconcileTransport(join(r,'transport'));for(const k of ['known_total_tokens','unknown_usage_dispatched_requests','model_calls'])row[k]=accounting[k];
    const task=JSON.parse(readFileSync(join(root,'tasks',slot.task_id+'.json'),'utf8'));
    const records=readdirSync(join(r,'tools')).filter(n=>/^\d{6}\.json$/.test(n)).sort().map(n=>JSON.parse(readFileSync(join(r,'tools',n),'utf8')));
    row.patch_attempted=records.some(e=>e.kind==='tool-intent'&&e.call?.function?.name==='apply_edits');
    row.patch_changed=Boolean(execFileSync('git',['-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',join(r,'sources/work'),'diff','--no-ext-diff','--no-textconv','--name-only',task.base_commit,'--'],{encoding:'utf8',timeout:30000}));
    const {exchanges}=loadSealedExchanges(join(r,'transport'));
    exported=exportDeepSeekWire({exchanges,records,task,repoRoot:join(r,'sources/base')});
    if(exported.token_accounting.known_total_tokens!==row.known_total_tokens)throw Error('pilot.accounting-mismatch');
    writeFileSync(join(r,'NATIVE-EXPORT.json'),JSON.stringify(exported,null,2),{flag:'wx'});row.status='final_context_selected';
   }
   writeFileSync(join(r,'prediction.json'),JSON.stringify(exported.prediction,null,2),{flag:'wx'});row.valid_export=true;
  }catch(e){row.export_error=String(e.message);if(row.known_total_tokens===null)row.accounting_incomplete=true;if(!existsSync(join(r,slot.arm==='current-are'?'evidence/RESULTS.json':'transport/RESULTS.json')))row.accounting_incomplete=true;}
  rows.push(row);
 }
 const result={schema_version:'are.external-control-pilot-exports/v1',rows,native_scoring_pending:true,benchmark_cleared:false};writeFileSync(join(root,'EXPORTS.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(exportPilot(resolve(process.argv[2]))));
