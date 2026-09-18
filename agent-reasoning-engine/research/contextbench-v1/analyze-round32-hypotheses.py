#!/usr/bin/env python3
"""Repository-held-out comparison of zero-token no-effect relevance hypotheses."""
import collections,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parent
features=json.loads((ROOT/'round32-runtime-features.json').read_text());labels=json.loads((ROOT/'round32-marginal-utility-labels.json').read_text())
label={(x['round'],x['cell_id'],x['candidate_read_id']):x for x in labels['labels']};cells={(x['round'],x['cell_id']) for x in features['trajectories']};rows=[]
names=['log_width','log_distinct_observations','log_receipt_presentations','log_recency','task_path_overlap','task_body_overlap','task_path_jaccard','model_path_same_directory','log_model_path_prefix','edited_after_observation','log_assistant_path_mentions','log_assistant_basename_mentions']
def vector(x):return [math.log1p(x['width']),math.log1p(x['distinct_path_observations']),math.log1p(x['receipt_presentations']),math.log1p(max(0,x['last_confirmed_receipt'])),x['task_path_token_overlap'],x['task_body_token_overlap'],x['task_path_jaccard'],int(x['model_path_same_directory']),math.log1p(x['maximum_model_path_prefix']),int(x['edited_after_observation']),math.log1p(x['assistant_path_mentions']),math.log1p(x['assistant_basename_mentions'])]
for x in features['rows']:
 if not x['selected_by_model']:rows.append((x,vector(x),label[(x['round'],x['cell_id'],x['candidate_read_id'])]))
def solve(A,b):
 n=len(b);matrix=[A[i][:]+[b[i]] for i in range(n)]
 for i in range(n):
  pivot=max(range(i,n),key=lambda row:abs(matrix[row][i]));matrix[i],matrix[pivot]=matrix[pivot],matrix[i];value=matrix[i][i]
  if abs(value)<1e-15:continue
  for j in range(i,n+1):matrix[i][j]/=value
  for row in range(n):
   if row==i:continue
   value=matrix[row][i]
   for j in range(i,n+1):matrix[row][j]-=value*matrix[i][j]
 return [matrix[i][n] for i in range(n)]
def fit(data,regularization=10):
 means=[sum(row[1][j] for row in data)/len(data) for j in range(len(names))];std=[(sum((row[1][j]-means[j])**2 for row in data)/len(data))**.5 or 1 for j in range(len(names))]
 X=[[1]+[(row[1][j]-means[j])/std[j] for j in range(len(names))] for row in data];Y=[row[2]['marginal']['span_f1'] for row in data];n=len(names)+1
 A=[[sum(x[i]*x[j] for x in X)+(regularization if i==j and i else 0) for j in range(n)] for i in range(n)];b=[sum(x[i]*y for x,y in zip(X,Y)) for i in range(n)]
 return {'weights':solve(A,b),'means':means,'standard_deviations':std,'regularization':regularization}
def predict(v,model):return model['weights'][0]+sum(model['weights'][j+1]*(v[j]-model['means'][j])/model['standard_deviations'][j] for j in range(len(v)))
def grouped(data):
 result=collections.defaultdict(list)
 for row in data:result[(row[0]['round'],row[0]['cell_id'])].append(row)
 return result
def choose_fixed(predicate,rank):
 selected={}
 for cell,items in grouped(rows).items():
  candidates=[row for row in items if predicate(row[0])]
  if candidates:selected[cell]=max(candidates,key=lambda row:(rank(row[0]),row[0]['candidate_read_id']))
 return selected
def choose_ridge_heldout():
 selected={};repos=sorted(set(row[0]['repo'] for row in rows))
 for repo in repos:
  model=fit([row for row in rows if row[0]['repo']!=repo]);holdout=grouped([row for row in rows if row[0]['repo']==repo])
  for cell,items in holdout.items():
   scored=[(predict(row[1],model),row) for row in items];score,row=max(scored,key=lambda item:(item[0],item[1][0]['candidate_read_id']))
   if score>0:selected[cell]=row
 return selected
metric_names=['span_f1','span_coverage','span_precision','file_coverage','file_precision']
def selector_summary(selected):
 values=[row[2] for row in selected.values()]
 def summarize(cell_set):
  chosen=[selected[cell][2] for cell in cell_set if cell in selected]
  return {'denominator':len(cell_set),'selected':len(chosen),'gains':{metric:sum(row['marginal'][metric] for row in chosen)/len(cell_set) for metric in metric_names},'labels':{kind:sum(row['utility_label']==kind for row in chosen) for kind in ('helpful','neutral','harmful')}}
 by_repo={}
 for repo in sorted(set(row[0]['repo'] for row in rows)):
  repo_cells={cell for cell in cells if any(row[0]['repo']==repo and (row[0]['round'],row[0]['cell_id'])==cell for row in rows)};by_repo[repo]=summarize(repo_cells)
 return {'overall':summarize(cells),'by_round':{str(round):summarize({cell for cell in cells if cell[0]==round}) for round in (30,31)},'repository_holdouts':by_repo,'positive_repository_holdouts':sum(row['gains']['span_f1']>0 for row in by_repo.values()),'negative_repository_holdouts':sum(row['gains']['span_f1']<0 for row in by_repo.values())}
rank=lambda x:(x['task_path_token_overlap'],x['edited_after_observation'],x['task_body_token_overlap'],x['model_path_same_directory'],x['distinct_path_observations'],x['receipt_presentations'],x['width'])
selected={
 'H52_task_conditioned':choose_fixed(lambda x:x['task_body_token_overlap']>=3,rank),
 'H53_causal_tool_chain':choose_fixed(lambda x:x['edited_after_observation'],rank),
 'H54_ridge_abstention':choose_ridge_heldout(),
 'H0_abstain':{}
}
def combined_summary(chosen):
 result={}
 no_effect=set(cells)
 for round,path in [(30,ROOT/'round30-confirmation-outcome.json'),(31,ROOT/'round31-outcome-review.json')]:
  outcome=json.loads(path.read_text());sums={metric:0 for metric in metric_names}
  for row in outcome['rows']:
   cell=(round,row['cell_id'])
   if cell in no_effect:
    if cell in chosen:
     for metric in metric_names:sums[metric]+=chosen[cell][2]['marginal'][metric]
   else:
    for metric in metric_names:sums[metric]+=row['treatment_'+metric]-row['baseline_'+metric]
  gains={metric:value/len(outcome['rows']) for metric,value in sums.items()};result[str(round)]={'denominator':len(outcome['rows']),'gains':gains,'passes_quality':gains['span_f1']>=0.05 and all(gains[x]>=0 for x in ('span_coverage','span_precision','file_coverage','file_precision'))}
 return result
comparisons={}
for key,chosen in selected.items():comparisons[key]={**selector_summary(chosen),'combined_with_effect_closure':combined_summary(chosen)}
final_model=fit(rows)
artifact={'schema_version':'are.contextbench-round32-hypothesis-analysis/v1','status':'complete-exposed-repository-held-out-comparison','feature_ref':'round32-runtime-features.json','feature_sha256':__import__('hashlib').sha256((ROOT/'round32-runtime-features.json').read_bytes()).hexdigest(),'label_ref':'round32-marginal-utility-labels.json','label_sha256':__import__('hashlib').sha256((ROOT/'round32-marginal-utility-labels.json').read_bytes()).hexdigest(),'candidate_contract':{'maximum_added_paths':1,'abstention_allowed':True,'runtime_gold_access':False,'runtime_task_identity_feature':False},'comparisons':comparisons,'selected_for_implementation_replay':None,'selection_reason':'No terminal fallback advances. H52 and H54 pass the Round 30 aggregate only because that cohort dominates the sample, then both reverse direction and degrade span precision on the newer Round 31 temporal holdout. H53 adds too little and H0 leaves H49 below threshold.','fitted_selector':{'feature_names':names,**final_model,'admission_threshold':0,'tie_break':'candidate_read_id lexical descending','training_rows':len(rows),'training_repositories':len(set(row[0]['repo'] for row in rows))},'limitations':['All quality labels are exposed and hypothesis-generating.','Repository-held-out performance is uneven; fresh evidence is required.','Round 31 is only eight trajectories and its executed selector mismatch remains explicit.'],'model_calls':0,'additional_model_tokens':0,'benchmark_cleared':False,'authority_effect':'none','open_questions_ref':'PLAN-round32.md#open-questions'}
(ROOT/'round32-hypothesis-analysis.json').write_text(json.dumps(artifact,indent=2)+'\n')
print(json.dumps({'status':artifact['status'],'selected':artifact['selected_for_implementation_replay'],'comparisons':{key:{'no_effect_span_gain':value['overall']['gains']['span_f1'],'selected':value['overall']['selected'],'round30_combined_span_gain':value['combined_with_effect_closure']['30']['gains']['span_f1'],'round30_passes_quality':value['combined_with_effect_closure']['30']['passes_quality'],'round31_combined_span_gain':value['combined_with_effect_closure']['31']['gains']['span_f1']} for key,value in comparisons.items()},'model_calls':0}))
