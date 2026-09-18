import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validateTerminalEvidenceHandleIncrementalPair} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-evidence-handle-incremental-validation.mjs';

const read=path=>JSON.parse(readFileSync(path));
const writeExact=(path,value)=>{
  const bytes=JSON.stringify(value,null,2)+'\n';
  if(existsSync(path)){
    if(readFileSync(path,'utf8')!==bytes)throw Error('round52.replay-drift:'+path);
  }else writeFileSync(path,bytes,{flag:'wx'});
};

export function replayRound51IncrementalValidator({liveRoot,reportPath}){
  const rows=[1,2].map(pair=>{
    const id=String(pair).padStart(2,'0');
    const prefixCell=`r51-${id}-terminal-prefix-8k`;
    const controlCell=`r51-${id}-control-review-rep1-8k`;
    const treatmentCell=`r51-${id}-terminal-handles-rep1-8k`;
    const validation=validateTerminalEvidenceHandleIncrementalPair({
      prefix:read(resolve(liveRoot,prefixCell,'result.json')),
      control:read(resolve(liveRoot,controlCell,'result.json')),
      treatment:read(resolve(liveRoot,treatmentCell,'result.json')),
      maximum_state_tokens:160,
      maximum_state_bytes:1024,
      maximum_handles:3,
      minimum_input_token_reduction:128,
      maximum_paired_token_difference:3072,
      total_token_limit:96000
    });
    return {pair,prefix_cell_id:prefixCell,control_cell_id:controlCell,treatment_cell_id:treatmentCell,...validation};
  });
  const checks={
    pair1_remains_valid:rows[0].ok,
    pair2_becomes_valid:rows[1].ok,
    zero_treatment_added_occurrences:rows.every(row=>row.measurements.treatment_added_full_read_id_occurrences===0),
    inherited_occurrences_paired:rows.every(row=>row.measurements.inherited_full_read_id_occurrences_paired===true),
    pair2_reports_inherited_occurrence:rows[1].measurements.inherited_full_read_id_occurrences>0,
    input_reduction_preserved:rows.every(row=>row.measurements.first_request_input_token_difference<=-128),
    exact_handle_resolution_preserved:rows.every(row=>!row.issues.some(issue=>String(issue.detail??'').includes('handle-resolution')))
  };
  const report={
    schema_version:'are.contextbench-round52-round51-replay/v1',
    status:Object.values(checks).every(Boolean)?'passed':'failed',
    source_round:51,
    target_round:52,
    live_root:liveRoot,
    checks,
    rows,
    model_calls:0,
    authority_effect:'none',
    open_questions_ref:'PLAN-round52.md#open-questions'
  };
  writeExact(reportPath,report);
  return report;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const liveRoot=resolve(process.argv[2]??`${process.env.HOME}/.local/share/are/contextbench-retained-v1/contextbench-round51-live`);
  const reportPath=resolve(process.argv[3]??'agent-reasoning-engine/research/contextbench-v1/round52-round51-replay.json');
  const report=replayRound51IncrementalValidator({liveRoot,reportPath});
  console.log(JSON.stringify({status:report.status,checks:report.checks,measurements:report.rows.map(row=>row.measurements)}));
  if(report.status!=='passed')process.exitCode=1;
}
