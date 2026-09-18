#!/usr/bin/env python3
"""Gold-only offline labels for the separately extracted runtime-visible features."""
import hashlib,json,subprocess,sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

ROOT=Path(__file__).resolve().parent
UPSTREAM=Path('/tmp/are-contextbench-upstream-117')
sys.path.insert(0,str(UPSTREAM))
from contextbench.parsers.gold import GoldLoader,_normalize_rel_path

def read(path):return json.loads(Path(path).read_text())
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def merge(intervals):
 result=[]
 for start,end in sorted(intervals):
  if result and start<=result[-1][1]+1:result[-1]=(result[-1][0],max(result[-1][1],end))
  else:result.append((start,end))
 return result
def size(intervals):return sum(end-start+1 for start,end in merge(intervals))
def intersection(a,b):
 a,b=merge(a),merge(b);i=j=total=0
 while i<len(a) and j<len(b):
  total+=max(0,min(a[i][1],b[j][1])-max(a[i][0],b[j][0])+1)
  if a[i][1]<b[j][1]:i+=1
  elif b[j][1]<a[i][1]:j+=1
  else:i+=1;j+=1
 return total
def line_to_byte(content,start_line,end_line):
 if not content:return (0,0)
 offsets=[0]+[i+1 for i,b in enumerate(content) if b==10];si=max(1,start_line)-1;ei=max(start_line,end_line)-1
 if si>=len(offsets):return None
 return offsets[si],(offsets[ei+1]-1 if ei+1<len(offsets) else len(content)-1)
@lru_cache(maxsize=8192)
def source(cache,commit,path):
 try:return subprocess.check_output(['git','-C',cache,'show',f'{commit}:{path}'],stderr=subprocess.DEVNULL)
 except subprocess.CalledProcessError:return None
def metrics(gold,cache,commit,pred):
 if not pred:return {'span_coverage':0,'span_precision':0,'span_f1':0,'file_coverage':0,'file_precision':0}
 converted={}
 for path,ranges in pred.items():
  content=source(cache,commit,path)
  if content is None:continue
  values=[line_to_byte(content,a,b) for a,b in ranges];values=[value for value in values if value]
  if values:converted[path]=merge(values)
 gold_spans=defaultdict(list)
 for item in gold.init+gold.add:
  path=_normalize_rel_path(item.get('file',''));content=source(cache,commit,path) if path else None
  if content is not None:gold_spans[path].append(line_to_byte(content,item.get('start_line',1),item.get('end_line',1)))
 gold_spans={path:merge([value for value in values if value]) for path,values in gold_spans.items()}
 pred_size=sum(size(values) for values in converted.values());gold_size=sum(size(values) for values in gold_spans.values());hit=sum(intersection(converted.get(path,[]),gold_spans.get(path,[])) for path in set(converted)|set(gold_spans))
 coverage=hit/gold_size if gold_size else 1.;precision=hit/pred_size if pred_size else 1.;span_f1=2*coverage*precision/(coverage+precision) if coverage+precision else 0
 gold_files=set(gold.files());file_hit=len(set(converted)&gold_files)
 return {'span_coverage':coverage,'span_precision':precision,'span_f1':span_f1,'file_coverage':file_hit/len(gold_files) if gold_files else 1.,'file_precision':file_hit/len(converted) if converted else 1.}
def selected_spans(ids,binding):
 by_id={item['id']:item for item in binding};pred=defaultdict(list)
 for rid in ids:
  item=by_id.get(rid)
  if item:pred[item['path']].append((item['start_line'],item['end_line']))
 return pred

features=read(ROOT/'round32-runtime-features.json');gold_loader=GoldLoader(str(UPSTREAM/'data/full.parquet'))
outcomes={30:read(ROOT/'round30-confirmation-outcome.json'),31:read(ROOT/'round31-outcome-review.json')}
reported={(round,row['cell_id']):row for round,outcome in outcomes.items() for row in outcome['rows']}
by_cell=defaultdict(list)
for row in features['rows']:by_cell[(row['round'],row['cell_id'])].append(row)
labels=[];baseline_checks=[]
for trajectory in features['trajectories']:
 key=(trajectory['round'],trajectory['cell_id']);result=read(trajectory['result_ref']);gold=gold_loader.get(trajectory['instance_id'])
 native=result.get('native_export');binding=native['delivery_binding']['read_observations'] if native else []
 model_ids=result['selection']['model_read_ids'];base_pred=selected_spans(model_ids,binding) if binding else defaultdict(list)
 baseline=metrics(gold,trajectory['repository_cache'],trajectory['base_commit'],base_pred);expected=reported[key]
 for metric in ('span_coverage','span_precision','span_f1','file_coverage','file_precision'):
  if abs(baseline[metric]-expected['baseline_'+metric])>1e-12:raise RuntimeError(f'baseline mismatch {key} {metric}: {baseline[metric]} {expected["baseline_"+metric]}')
 baseline_checks.append({'round':key[0],'cell_id':key[1],'matched':True})
 for candidate in by_cell[key]:
  pred=defaultdict(list,{path:list(ranges) for path,ranges in base_pred.items()});pred[candidate['path']].append((candidate['start_line'],candidate['end_line']))
  treatment=metrics(gold,trajectory['repository_cache'],trajectory['base_commit'],pred);deltas={metric:treatment[metric]-baseline[metric] for metric in baseline}
  value=deltas['span_f1'];label='helpful' if value>1e-12 else 'harmful' if value<-1e-12 else 'neutral'
  labels.append({'round':key[0],'cell_id':key[1],'instance_id':trajectory['instance_id'],'repo':trajectory['repo'],'candidate_read_id':candidate['candidate_read_id'],'path':candidate['path'],'baseline':baseline,'candidate_union':treatment,'marginal':deltas,'utility_label':label,'gold_runtime_access':False})
artifact={'schema_version':'are.contextbench-round32-marginal-labels/v1','status':'labeled-exposed-offline-only','feature_ref':str(ROOT/'round32-runtime-features.json'),'feature_sha256':sha(ROOT/'round32-runtime-features.json'),'upstream_ref':str(UPSTREAM),'trajectory_count':len(features['trajectories']),'candidate_path_count':len(labels),'label_counts':{label:sum(row['utility_label']==label for row in labels) for label in ('helpful','neutral','harmful')},'baseline_reconstruction':{'checked':len(baseline_checks),'matched':sum(row['matched'] for row in baseline_checks)},'labels':labels,'model_calls':0,'additional_model_tokens':0,'claim_ceiling':'Gold-derived labels for exposed retrospective analysis only. Labels and identifiers are forbidden runtime selector inputs.','benchmark_cleared':False,'authority_effect':'none','open_questions_ref':'PLAN-round32.md#open-questions'}
(ROOT/'round32-marginal-utility-labels.json').write_text(json.dumps(artifact,indent=2)+'\n')
print(json.dumps({key:artifact[key] for key in ('status','trajectory_count','candidate_path_count','label_counts','baseline_reconstruction','model_calls')}))
