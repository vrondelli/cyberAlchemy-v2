#!/usr/bin/env python3
"""Gold-blind Round 34 task selection using a projected public-column parquet read."""
import hashlib,json
from pathlib import Path
import pyarrow.parquet as pq
ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
UPSTREAM=Path('/home/vrondelli/.local/share/are/contextbench-upstream-117')
TASK_ROOT=REPO/'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round34'
PUBLIC=['instance_id','original_inst_id','repo','repo_url','language','base_commit','problem_statement','source']
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
exposed=set();matrix_refs=[]
for path in sorted(ROOT.glob('*matrix*.json')):
 try:data=json.loads(path.read_text())
 except Exception:continue
 ids={row.get('instance_id') for row in data.get('tasks',[]) if row.get('instance_id')}
 if ids:exposed.update(ids);matrix_refs.append({'path':str(path.relative_to(REPO)),'sha256':sha(path),'task_count':len(ids)})
rows=pq.read_table(UPSTREAM/'data/full.parquet',columns=PUBLIC).to_pylist()
eligible=[row for row in rows if row['instance_id'] not in exposed and row['source']!='Pro' and all(isinstance(row[key],str) and row[key] for key in PUBLIC)]
by_language={language:sorted((row for row in eligible if row['language']==language),key=lambda row:row['instance_id']) for language in ['c','cpp','go','javascript','python','rust','typescript']}
selected=[by_language[language][0] for language in by_language]+[by_language['c'][1]]
selected=sorted(selected,key=lambda row:row['instance_id'])
TASK_ROOT.mkdir(parents=True,exist_ok=False);manifest=[]
for row in selected:
 path=TASK_ROOT/(row['instance_id']+'.json');path.write_text(json.dumps(row,indent=2)+'\n');manifest.append({'instance_id':row['instance_id'],'file':path.name,'sha256':sha(path)})
manifest_path=TASK_ROOT/'manifest.json';manifest_path.write_text(json.dumps({'schema_version':'are.contextbench-task-manifest/v1','tasks':manifest,'gold_fields_present':False,'projected_columns':PUBLIC,'authority_effect':'none'},indent=2)+'\n')
artifact={'schema_version':'are.contextbench-round34-task-selection/v1','status':'selected-fresh-development-canary','selection_rule':'First lexicographic never-matrix-exposed non-Pro task in each of seven language groups, plus the second C task for within-domain variation. Only projected public columns were loaded.','projected_columns':PUBLIC,'forbidden_columns_not_loaded':['gold_context','patch','test_patch','f2p','p2p'],'tasks':[{'instance_id':row['instance_id'],'repo':row['repo'],'language':row['language'],'source':row['source'],'repo_url':row['repo_url'],'base_commit':row['base_commit'],'task_file':str(TASK_ROOT/(row['instance_id']+'.json')),'task_sha256':manifest[i]['sha256'],'prior_exposure':'none-in-recorded-contextbench-matrices'} for i,row in enumerate(selected)],'task_count':len(selected),'eligible_unexposed_public_tasks':len(eligible),'prior_exposed_identities':len(exposed),'prior_matrix_refs':matrix_refs,'task_manifest_ref':str(manifest_path),'task_manifest_sha256':sha(manifest_path),'upstream_ref':str(UPSTREAM),'upstream_revision':'1436c28a8eb95496da4ea69ad458b9f8a8eb7d61','gold_inspected_for_selection':False,'model_calls':0,'authority_effect':'none','benchmark_cleared':False,'open_questions_ref':'PLAN-round34.md#open-questions'}
(ROOT/'round34-task-selection.json').write_text(json.dumps(artifact,indent=2)+'\n')
print(json.dumps({'tasks':artifact['task_count'],'eligible':len(eligible),'exposed':len(exposed),'identities':[row['instance_id'] for row in selected]}))
