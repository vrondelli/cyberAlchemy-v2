import {createHash} from 'node:crypto';
import {existsSync,mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildTerminalEffectState} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/terminal-effect-state.mjs';
import {exportModelSelectedContext} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/final-selection.mjs';

const research='agent-reasoning-engine/research/contextbench-v1',live='/home/vrondelli/.cache/are/contextbench-round26-live',implementation='implementation/agent-reasoning-engine/benchmarks/contextbench-v1';
const maxEvidence=Number(process.env.ARE_EFFECT_MAX_EVIDENCE??8),outputName=process.env.ARE_EFFECT_ANALYSIS_OUT??'round29-effect-closure-analysis.json';if(!Number.isSafeInteger(maxEvidence)||maxEvidence<1||maxEvidence>8)throw Error('effect-analysis.max-evidence');
const read=path=>JSON.parse(readFileSync(path)),sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const f1=m=>m.coverage+m.precision?2*m.coverage*m.precision/(m.coverage+m.precision):0;
const matrix=read(`${research}/development-matrix-v26.json`),manifest=read(`${implementation}/development-tasks/manifest.json`),scratch=mkdtempSync(join(tmpdir(),'are-effect-closure-analysis-')),rows=[];
try{
  for(const cell of matrix.branches){
    const run=join(live,cell.cell_id),resultPath=join(run,'result.json'),baseScorePath=join(run,'native-score.json');
    const row={cell_id:cell.cell_id,instance_id:cell.instance_id,source_status:'scheduled-zero',patch_bytes:0,closure_ids:0,new_ids:0,base_span_f1:0,closure_span_f1:0,base_file_f1:0,closure_file_f1:0};
    if(!existsSync(resultPath)){rows.push(row);continue;}
    const result=read(resultPath);row.source_status=result.status;row.patch_bytes=Buffer.byteLength(result.patch??'');
    if(!result.selection){rows.push(row);continue;}
    const closure=await buildTerminalEffectState({captures:result.captures,receipts:result.receipts,patch:result.patch,repoRoot:join(run,'base'),max_evidence:maxEvidence});
    row.closure_ids=closure.selection_read_ids.length;row.new_ids=closure.selection_read_ids.filter(id=>!result.selection.final_read_ids.includes(id)).length;row.closure_reason=closure.reason;
    if(existsSync(baseScorePath)){const final=read(baseScorePath).native.final;row.base_span_f1=f1(final.span);row.base_file_f1=f1(final.file);}
    row.closure_span_f1=row.base_span_f1;row.closure_file_f1=row.base_file_f1;
    if(closure.selection_read_ids.length){
      try{
        const taskEntry=manifest.tasks.find(x=>x.instance_id===cell.instance_id),task=read(join(implementation,'development-tasks',taskEntry.file)),source_snapshots=readdirSync(join(run,'snapshots')).filter(x=>x.endsWith('.json')).map(x=>read(join(run,'snapshots',x))),selection={...result.selection,model_read_ids:result.selection.final_read_ids,terminal_effect_read_ids:closure.selection_read_ids,final_read_ids:[...new Set([...result.selection.final_read_ids,...closure.selection_read_ids])]},exported=exportModelSelectedContext({...result,selection,task,source_snapshots,response_capture:result.response_captures.at(-1)},join(run,'base')),pred=join(scratch,cell.cell_id+'.prediction.json'),out=join(scratch,cell.cell_id+'.score.json');
        writeFileSync(pred,JSON.stringify(exported.prediction));const scored=spawnSync('/tmp/are-contextbench-venv-117/bin/python',[`${implementation}/score_native.py`,'--upstream','/tmp/are-contextbench-upstream-117','--gold','/tmp/are-contextbench-upstream-117/data/full.parquet','--pred',pred,'--cache','/tmp/are-contextbench-native-score-cache-v1','--out',out],{encoding:'utf8',timeout:180000,maxBuffer:2000000});if(scored.status!==0)throw Error('score:'+scored.stderr);
        const final=read(out).native.final;row.closure_span_f1=f1(final.span);row.closure_file_f1=f1(final.file);row.exported=true;
      }catch(error){row.export_error=String(error.message);row.closure_span_f1=0;row.closure_file_f1=0;}
    }
    rows.push(row);
  }
}finally{rmSync(scratch,{recursive:true,force:true});}
const mean=(key,selected=rows)=>selected.reduce((sum,row)=>sum+row[key],0)/selected.length,executed=rows.filter(row=>row.source_status!=='scheduled-zero'),changed=rows.filter(row=>row.new_ids>0);
const artifact={schema_version:'are.contextbench-effect-closure-posthoc-analysis/v1',status:'exposed-diagnostic',source_round:'contextbench-development-round26',maximum_evidence:maxEvidence,scheduled_branches:rows.length,executed_with_selection:executed.length,effectful:rows.filter(x=>x.patch_bytes>0).length,closure_applied:rows.filter(x=>x.closure_ids>0).length,selection_changed:changed.length,export_errors:rows.filter(x=>x.export_error).length,metrics:{scheduled_base_span_f1:mean('base_span_f1'),scheduled_closure_span_f1:mean('closure_span_f1'),scheduled_span_f1_delta:mean('closure_span_f1')-mean('base_span_f1'),scheduled_base_file_f1:mean('base_file_f1'),scheduled_closure_file_f1:mean('closure_file_f1'),scheduled_file_f1_delta:mean('closure_file_f1')-mean('base_file_f1'),changed_conditional_span_f1_delta:changed.length?mean('closure_span_f1',changed)-mean('base_span_f1',changed):0,changed_conditional_file_f1_delta:changed.length?mean('closure_file_f1',changed)-mean('base_file_f1',changed):0,additional_model_calls:0,additional_model_tokens:0},rows,source_refs:['development-matrix-v26.json','round26-outcome-review.json'].map(path=>({path,sha256:sha(`${research}/${path}`)})),claim_ceiling:'Post-hoc exposed trajectory diagnostic. It tests deterministic export/scoring and estimates closure contribution without model variance; it cannot clear development or confirmation.',authority_effect:'none',benchmark_cleared:false,open_questions:['Does the fixed zero-token closure delta exceed +0.05 on the exposed scheduled denominator?','Will the same deterministic mechanism retain its direction in a fresh paired development run?']};
writeFileSync(`${research}/${outputName}`,JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({maximum_evidence:maxEvidence,...artifact.metrics,selection_changed:artifact.selection_changed,closure_applied:artifact.closure_applied,export_errors:artifact.export_errors}));
