// Compare Round 32 feature rows with the exact Round 33 runtime candidate builder.
// Reconstructs only observed files in a temporary directory and performs no model calls.
// Open questions: PLAN-round33.md#open-questions.
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {bindDelivery,stable} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {evidenceSlateCandidatesFromDelivery} from '../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.mjs';
const research=resolve('agent-reasoning-engine/research/contextbench-v1'),read=path=>JSON.parse(readFileSync(path));
const hash=value=>createHash('sha256').update(value).digest('hex');
const fields=['read_id','path','start_line','end_line','width','distinct_path_observations','receipt_presentations','last_confirmed_receipt','task_path_token_overlap','task_body_token_overlap'];

function taskMap(){const out=new Map;for(const freezeName of ['freeze-round30-postprocess-recovery.json','freeze-round31-execution.json']){const freeze=read(join(research,freezeName)),manifest=read(resolve(freeze.task_manifest_ref));for(const entry of manifest.tasks){if(!entry.file)continue;const task=read(resolve(freeze.task_directory,entry.file));out.set(task.instance_id,task);}}return out;}
function baseFiles(run,binding){const snapshots=readdirSync(join(run,'snapshots')).filter(name=>name.endsWith('.json')).map(name=>read(join(run,'snapshots',name))),byKey=new Map(snapshots.map(item=>[`${item.path}\0${item.source_sha256}`,item])),files=new Map;
  for(const observation of binding.read_observations){if(files.has(observation.path))continue;const source=byKey.get(`${observation.path}\0${observation.source_sha256}`);if(source)files.set(observation.path,source);}
  return files;
}
export function verify(sourceName='round32-runtime-features.json'){const artifact=read(join(research,sourceName)),tasks=taskMap(),mismatches=[],counts={trajectories:0,candidate_paths:0,exact_paths:0};
  for(const trajectory of artifact.trajectories){const result=read(trajectory.result_ref),binding=bindDelivery({captures:result.captures,receipts:result.receipts}),root=mkdtempSync(join(tmpdir(),'are-feature-replay-')),run=dirname(trajectory.result_ref);try{
      for(const source of baseFiles(run,binding)){const target=join(root,source[0]);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,source[1].utf8);}
      const actual=evidenceSlateCandidatesFromDelivery({task:tasks.get(trajectory.instance_id),delivery:binding,repoRoot:root}),expected=artifact.rows.filter(row=>row.cell_id===trajectory.cell_id),byPath=new Map(actual.map(row=>[row.path,row]));counts.trajectories++;counts.candidate_paths+=expected.length;
      for(const row of expected){const candidate=byPath.get(row.path),differences={};for(const field of fields){const expectedValue=field==='read_id'?row.candidate_read_id:row[field],actualValue=candidate?.[field];if(stable(expectedValue)!==stable(actualValue))differences[field]={expected:expectedValue,actual:actualValue??null};}if(Object.keys(differences).length)mismatches.push({round:trajectory.round,cell_id:trajectory.cell_id,instance_id:trajectory.instance_id,path:row.path,differences});else counts.exact_paths++;}
    }finally{rmSync(root,{recursive:true,force:true});}}
  return{schema_version:'are.contextbench-round33-feature-replay/v1',status:mismatches.length?'mismatch':'exact',source_ref:sourceName,implementation_ref:'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-slate-v1.mjs',counts,mismatch_count:mismatches.length,mismatches,model_calls:0,additional_model_tokens:0,benchmark_cleared:false,authority_effect:'none',open_questions_ref:'PLAN-round33.md#open-questions'};}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const sourceName=process.argv[2]??'round32-runtime-features.json',targetName=process.argv[3]??'round33-feature-replay.json',report=verify(sourceName),target=join(research,targetName),bytes=JSON.stringify(report,null,2)+'\n';writeFileSync(target,bytes,{flag:'wx'});console.log(JSON.stringify({status:report.status,...report.counts,mismatch_count:report.mismatch_count,sha256:hash(bytes)}));}
