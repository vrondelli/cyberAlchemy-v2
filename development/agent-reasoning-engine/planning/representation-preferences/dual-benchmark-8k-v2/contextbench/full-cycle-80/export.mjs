import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function exportPilot(root){
  const campaign=JSON.parse(readFileSync(join(root,'CAMPAIGN-SETTLEMENT.json'),'utf8'));
  if(campaign.outcomes.length!==2)throw Error('cycle.assigned-outcomes-required');
  const rows=[];
  for(const outcome of campaign.outcomes){
    const {slot}=outcome,r=join(root,'runs',slot.id);
    const row={slot_id:slot.id,task_id:slot.task_id,arm:slot.arm,harness_exit:outcome.harness_exit,
      valid_export:false,known_total_tokens:null,unknown_usage_dispatched_requests:null,
      model_calls:null,patch_attempted:false,patch_changed:false};
    try{
      if(outcome.harness_state?.Running)throw Error('cycle.unsettled-process');
      const seal=JSON.parse(readFileSync(join(r,'evidence/RESULTS.json'),'utf8'));
      const episode=JSON.parse(readFileSync(join(r,'evidence/run/result.json'),'utf8'));
      const events=readFileSync(join(r,'evidence/run/events.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
      row.patch_changed=Boolean(episode.patch);
      row.patch_attempted=events.some(event=>event.kind==='tool-result'&&event.tool==='apply_edits');
      row.tool_batch_corrections=seal.tool_batch_corrections;
      for(const key of ['known_total_tokens','unknown_usage_dispatched_requests','model_calls'])row[key]=seal[key];
      row.status=seal.status;
      if(!seal.native_export)throw Error('cycle.are-no-native-export');
      writeFileSync(join(r,'prediction.json'),JSON.stringify(seal.native_export.prediction,null,2),{flag:'wx'});
      row.valid_export=true;
    }catch(error){
      row.export_error=String(error.message);
      if(row.known_total_tokens===null)row.accounting_incomplete=true;
      if(!existsSync(join(r,'evidence/RESULTS.json')))row.accounting_incomplete=true;
    }
    rows.push(row);
  }
  const result={schema_version:'are.full-cycle-exports/v1',rows,native_scoring_pending:true,benchmark_cleared:false};
  writeFileSync(join(root,'EXPORTS.json'),JSON.stringify(result,null,2),{flag:'wx'});
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  console.log(JSON.stringify(exportPilot(resolve(process.argv[2]))));
}
