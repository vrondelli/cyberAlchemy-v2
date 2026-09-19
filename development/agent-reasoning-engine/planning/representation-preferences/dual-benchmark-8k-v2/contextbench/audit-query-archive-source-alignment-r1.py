# Evaluator-side structural audit only. Open questions: query-archive-descriptive-live-r1/RESULT-SUMMARY.md.
from pathlib import Path
import json,sys,subprocess,hashlib
root=Path.cwd();c=root/'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench';config=json.loads((c/'discovery-v1/live-config.json').read_text());up=Path(config['upstream']);sys.path.insert(0,str(up))
from contextbench.parsers.gold import GoldLoader,_normalize_rel_path
from contextbench.core.fileio import line_to_byte
hashfile=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
manifest=json.loads(Path(config['source_manifest']).read_text())
for b in manifest['files']: assert hashfile(up/b['path'])==b['sha256']
loader=GoldLoader(str(up/'data/full.parquet'));rows=[]
for i,t in enumerate(config['tasks']):
 task=json.loads(Path(t['task_path']).read_text());assert hashfile(t['task_path'])==t['task_sha256'];g=loader.get(task['instance_id']);base=c/'query-archive-production-live-r1/source_root'/f'{i:02d}'/'base';bad=0;missing=0;logical_eof=0
 for span in g.init+g.add:
  f=base/_normalize_rel_path(span.get('file',''));a=span.get('start_line',1);b=span.get('end_line',1)
  if not f.is_file():missing+=1;continue
  body=f.read_bytes();logical_lines=len(body.split(b'\n'));interval=line_to_byte(str(f),a,b)
  if not 1<=a<=b<=logical_lines or interval is None or not 0<=interval[0]<=interval[1]<len(body):bad+=1
  if body.endswith(b'\n') and b==logical_lines:logical_eof+=1
 rows.append({'sequence':i,'task_id':t['id'],'task_sha256':t['task_sha256'],'instance_matches':g._data.get('inst_id')==task['instance_id'],'original_instance_matches':g._data.get('original_inst_id')==task['original_inst_id'],'repo_matches':g.repo_url==task['repo_url'],'commit_matches':g.commit==task['base_commit'],'checkout_matches':subprocess.check_output(['git','-C',str(base),'rev-parse','HEAD'],text=True).strip()==g.commit,'gold_file_count':len(g.files()),'gold_context_count':len(g.init+g.add),'missing_gold_source_files':missing,'invalid_native_ranges':bad,'annotations_ending_at_logical_eof':logical_eof})
report={'schema':'are.contextbench-source-alignment-audit/v1','rows':rows,'source_manifest_sha256':hashfile(config['source_manifest']),'gold_sha256':hashfile(up/'data/full.parquet'),'method':'Verify pinned upstream files, dataset task/alias/repository/commit identity, actual base checkout, source existence, logical newline ranges and native byte interval bounds. Do not expose reference paths or content to runtime.','new_model_calls':0,'claim_ceiling':'Structural evaluator/source alignment only. Gold contains no problem statement, so text provenance and semantic annotation relevance are not established.','open_questions_ref':'RESULT-SUMMARY.md#open-questions'}
assert all(all(r[k] for k in ['instance_matches','original_instance_matches','repo_matches','commit_matches','checkout_matches']) and r['missing_gold_source_files']==0 and r['invalid_native_ranges']==0 for r in rows)
out=c/'query-archive-descriptive-live-r1/SOURCE-ALIGNMENT.json';out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'tasks_checked':4,'identity_source_range_checks_passed':True,'semantic_relevance_proven':False,'output':str(out)}))
