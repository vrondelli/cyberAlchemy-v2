import {existsSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {bindDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const root='agent-reasoning-engine/research/contextbench-v1/',live='/home/vrondelli/.cache/are/contextbench-round26-live';
const matrix=JSON.parse(readFileSync(root+'development-matrix-v26.json'));
const outPath=root+'round27-oracle-availability.json';
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;

export function analyze(){
  const rows=[];
  for(const cell of matrix.branches){
    const resultPath=resolve(live,cell.cell_id,'result.json');if(!existsSync(resultPath))continue;
    const result=JSON.parse(readFileSync(resultPath)),observations=bindDelivery(result).read_observations.map(({id,path,start_line,end_line,source_sha256})=>({id,path,start_line,end_line,source_sha256}));
    rows.push({cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm:cell.state_arm,status:result.status,observations});
  }
  const temp=mkdtempSync(join(tmpdir(),'are-cb-oracle-')),input=join(temp,'input.json'),native=join(temp,'native.json');
  try{
    writeFileSync(input,JSON.stringify({rows}));
    const run=spawnSync('/tmp/are-contextbench-venv-117/bin/python',['implementation/agent-reasoning-engine/benchmarks/contextbench-v1/oracle-availability.py','--upstream','/tmp/are-contextbench-upstream-117','--gold','/tmp/are-contextbench-upstream-117/data/full.parquet','--input',input,'--cache','/tmp/are-contextbench-native-score-cache-v1','--out',native],{encoding:'utf8',timeout:180000,maxBuffer:16000000});
    if(run.status!==0)throw Error('oracle-availability.native:'+run.stderr);
    const scored=JSON.parse(readFileSync(native)).rows,scheduled=[];
    for(const task of matrix.tasks)for(let repetition=1;repetition<=3;repetition++)for(const state_arm of ['control','state']){
      const cell=matrix.branches.find(c=>c.instance_id===task.instance_id&&c.repetition===repetition&&c.state_arm===state_arm),row=scored.find(r=>r.cell_id===cell.cell_id);
      scheduled.push(row??{cell_id:cell.cell_id,instance_id:cell.instance_id,state_arm,status:'not-executed',delivered_handles:0,gold_positive_handles:0,selected_handles:0,selected_read_ids:[],selected_spans:{},span_f1:0,file_f1:0});
    }
    const oracleSpan=mean(scheduled.map(r=>r.span_f1)),oracleFile=mean(scheduled.map(r=>r.file_f1)),positive=scheduled.filter(r=>r.gold_positive_handles>0).length;
    const report={schema_version:'are.contextbench-round27-oracle-availability/v1',status:oracleSpan>=0.05&&positive>0?'oracle-signal-available':'oracle-signal-not-demonstrated',source_round:'contextbench-development-round26',scheduled_branches:48,executed_branches:rows.length,oracle_policy:{input:'successful receipt-bound delivered reads only',gold_use:'rank handles internally by overlap; never expose gold text, path, line, score, or source bytes not already delivered',maximum_paths:8,maximum_handles_per_path:1,selection:'per-path maximum gold-line intersection, then precision, then newest delivery; top eight paths'},scheduled_zero_filled_oracle_span_f1:oracleSpan,scheduled_zero_filled_oracle_file_f1:oracleFile,branches_with_gold_positive_delivered_handle:positive,mean_oracle_span_f1_on_executed:mean(scored.map(r=>r.span_f1)),mean_oracle_file_f1_on_executed:mean(scored.map(r=>r.file_f1)),rows:scheduled,claim_ceiling:'Availability gate only. It proves whether delivered observations contain selectable gold-overlapping evidence; it does not prove that model-facing oracle state changes model behavior.',authority_effect:'none',benchmark_cleared:false,open_questions:['Does a model-facing oracle beat an equal-token placebo on the same shared prefix?','How much of the oracle upper bound survives strict equal-token projection?']};
    writeFileSync(outPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;
  }finally{rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const r=analyze();console.log(JSON.stringify({status:r.status,span_f1:r.scheduled_zero_filled_oracle_span_f1,file_f1:r.scheduled_zero_filled_oracle_file_f1,positive_branches:r.branches_with_gold_positive_delivered_handle}));}
