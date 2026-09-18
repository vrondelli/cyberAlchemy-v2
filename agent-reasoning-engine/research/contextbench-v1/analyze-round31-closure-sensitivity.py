#!/usr/bin/env python3
"""Post-hoc cap sensitivity over frozen Round 31 trajectories; no model calls."""
import hashlib, json, re, subprocess, sys
from collections import defaultdict
from functools import lru_cache
from pathlib import Path

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[2]
UPSTREAM=Path('/tmp/are-contextbench-upstream-117')
sys.path.insert(0,str(UPSTREAM))
from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

def read(path): return json.loads(Path(path).read_text())
def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def merge(intervals):
    result=[]
    for start,end in sorted(intervals):
        if result and start<=result[-1][1]+1: result[-1]=(result[-1][0],max(result[-1][1],end))
        else: result.append((start,end))
    return result
def size(intervals): return sum(end-start+1 for start,end in merge(intervals))
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
    offsets=[0]+[i+1 for i,b in enumerate(content) if b==10]
    start_line=max(1,start_line);end_line=max(start_line,end_line);si=start_line-1;ei=end_line-1
    if si>=len(offsets):return None
    return offsets[si],(offsets[ei+1]-1 if ei+1<len(offsets) else len(content)-1)
@lru_cache(maxsize=4096)
def source(cache,commit,path):
    try:return subprocess.check_output(['git','-C',cache,'show',f'{commit}:{path}'],stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:return None
def score_spans(gold,cache,commit,pred):
    if not pred:return {'span_coverage':0,'span_precision':0,'span_f1':0,'file_coverage':0,'file_precision':0}
    pred={k:merge([line_to_byte(source(cache,commit,k),a,b) for a,b in ranges if source(cache,commit,k) is not None]) for k,ranges in pred.items()}
    pred={k:[x for x in ranges if x] for k,ranges in pred.items() if any(ranges)}
    gold_spans=defaultdict(list)
    for item in gold.init+gold.add:
        path=_normalize_rel_path(item.get('file',''))
        if path:
            content=source(cache,commit,path)
            if content is not None:gold_spans[path].append(line_to_byte(content,item.get('start_line',1),item.get('end_line',1)))
    gold_spans={k:merge([x for x in v if x]) for k,v in gold_spans.items()}
    pred_size=sum(size(x) for x in pred.values());gold_size=sum(size(x) for x in gold_spans.values());hit=sum(intersection(pred.get(p,[]),gold_spans.get(p,[])) for p in set(pred)|set(gold_spans))
    coverage=hit/gold_size if gold_size else 1.;precision=hit/pred_size if pred_size else 1.;f1=2*coverage*precision/(coverage+precision) if coverage+precision else 0
    gold_files=set(gold.files());file_hit=len(set(pred)&gold_files);file_cov=file_hit/len(gold_files) if gold_files else 1.;file_prec=file_hit/len(pred) if pred else 1.
    return {'span_coverage':coverage,'span_precision':precision,'span_f1':f1,'file_coverage':file_cov,'file_precision':file_prec}
def selected_spans(selected,export):
    events={x['id']:x for x in export['source_projection']['events']}; projections={x['read_id']:x for x in export['source_projection']['projections']}
    pred=defaultdict(list)
    for rid in selected:
        for eid in projections[rid]['event_ids']:
            event=events[eid];pred[event['path']].append((event['start_line'],event['end_line']))
    return pred
def metrics(gold,cache,commit,selected,export):return score_spans(gold,cache,commit,selected_spans(selected,export))
def patch_hunks(patch):
    path=None;hunks=defaultdict(list)
    for line in (patch or '').splitlines():
        file=re.match(r'^diff --git a/(.+?) b/(.+)$',line)
        if file:path=file.group(2);continue
        hunk=re.match(r'^@@ -(\d+)(?:,(\d+))? \+',line)
        if hunk and path:
            start=int(hunk.group(1));count=int(hunk.group(2) or 1)
            if count:hunks[path].append((start,start+count-1))
    return hunks
def cropped_metrics(gold,cache,commit,model_ids,closure_ids,export,patch,radius):
    pred=selected_spans(model_ids,export);events={x['id']:x for x in export['source_projection']['events']};projections={x['read_id']:x for x in export['source_projection']['projections']};hunks=patch_hunks(patch);model=set(model_ids)
    for rid in closure_ids:
        if rid in model:continue
        for eid in projections[rid]['event_ids']:
            event=events[eid]
            for start,end in hunks.get(event['path'],[]):
                a=max(event['start_line'],start-radius);b=min(event['end_line'],end+radius)
                if a<=b:pred[event['path']].append((a,b))
    return score_spans(gold,cache,commit,pred)
def intersects(a,b):return max(a[0],b[0])<=min(a[1],b[1])
def policy_ids(model_ids,closure_ids,export,patch,policy):
    if policy=='all':return closure_ids
    model_spans=selected_spans(model_ids,export);hunks=patch_hunks(patch);events={x['id']:x for x in export['source_projection']['events']};projections={x['read_id']:x for x in export['source_projection']['projections']}
    if policy=='novel-path':return [rid for rid in closure_ids if all(events[eid]['path'] not in model_spans for eid in projections[rid]['event_ids'])]
    covered={path:list(ranges) for path,ranges in model_spans.items()};chosen=[]
    for rid in closure_ids:
        useful=False
        for eid in projections[rid]['event_ids']:
            event=events[eid];candidate=(event['start_line'],event['end_line'])
            for hunk in hunks.get(event['path'],[]):
                overlap=(max(candidate[0],hunk[0]),min(candidate[1],hunk[1]))
                if overlap[0]<=overlap[1] and not any(intersects(overlap,prior) for prior in covered.get(event['path'],[])):useful=True
        if useful:
            chosen.append(rid)
            for eid in projections[rid]['event_ids']:
                event=events[eid];covered.setdefault(event['path'],[]).append((event['start_line'],event['end_line']))
    return chosen
def reranked_ids(export,patch,policy,limit=6):
    hunks=patch_hunks(patch);base_hashes={event['path']:event['source_sha256'] for event in export['source_projection']['events']};ranked=[]
    for path,path_hunks in hunks.items():
        candidates=[]
        for index,item in enumerate(export['delivery_binding']['read_observations']):
            if item['path']!=path or item['source_sha256']!=base_hashes.get(path):continue
            overlap=sum(max(0,min(item['end_line'],end)-max(item['start_line'],start)+1) for start,end in path_hunks);width=item['end_line']-item['start_line']+1
            if overlap:candidates.append({**item,'overlap':overlap,'width':width,'index':index})
        if policy=='wide-tie':candidates.sort(key=lambda x:(-x['overlap'],-x['width'],-x['index']))
        elif policy=='narrow-tie':candidates.sort(key=lambda x:(-x['overlap'],x['width'],-x['index']))
        elif policy=='density':candidates.sort(key=lambda x:(-x['overlap']/x['width'],-x['overlap'],x['width'],-x['index']))
        elif policy=='narrow':candidates.sort(key=lambda x:(x['width'],-x['overlap'],-x['index']))
        ranked.extend(candidates)
    return list(dict.fromkeys(x['id'] for x in ranked))[:limit]
def repeated_attention_ids(export,path_limit):
    base_hashes={event['path']:event['source_sha256'] for event in export['source_projection']['events']};paths={}
    for index,item in enumerate(export['delivery_binding']['read_observations']):
        if item['source_sha256']!=base_hashes.get(item['path']):continue
        row=paths.setdefault(item['path'],{'count':0,'last':-1,'items':[]});row['count']+=1;row['last']=index;row['items'].append({**item,'index':index,'width':item['end_line']-item['start_line']+1})
    ranked=sorted(paths.values(),key=lambda x:(-x['count'],-x['last'],-max(i['width'] for i in x['items'])))[:path_limit]
    return [sorted(x['items'],key=lambda i:(-i['width'],-i['index']))[0]['id'] for x in ranked]

outcome=read(ROOT/'round31-outcome-review.json')
freeze=read(ROOT/'freeze-round31-execution.json')
inventory={x['instance_id']:x for x in read(freeze['repository_inventory_ref'])['repositories']}
gold_loader=GoldLoader(str(Path(freeze['upstream'])/'data/full.parquet'))
caps={k:[] for k in range(7)};radii={k:[] for k in (0,2,5,10,20)};policies={k:[] for k in ('novel-path','uncovered-effect')};rankings={k:[] for k in ('wide-tie','narrow-tie','density','narrow')};fallbacks={k:[] for k in range(1,5)};validated=0
live=Path('/home/vrondelli/.local/share/are/contextbench-retained-v1/contextbench-round31-live')
for row in outcome['rows']:
    result_path=live/row['cell_id']/'result.json'
    if not result_path.exists() or not row.get('final_read_ids'):
        for k in caps:caps[k].append({**row,'diagnostic':{'span_f1':0,'span_coverage':0,'span_precision':0,'file_coverage':0,'file_precision':0}})
        for radius in radii:radii[radius].append({**row,'diagnostic':{'span_f1':0,'span_coverage':0,'span_precision':0,'file_coverage':0,'file_precision':0}})
        for policy in policies:policies[policy].append({**row,'diagnostic':{'span_f1':0,'span_coverage':0,'span_precision':0,'file_coverage':0,'file_precision':0},'selected_closure_ids':0})
        for policy in rankings:rankings[policy].append({**row,'diagnostic':{'span_f1':0,'span_coverage':0,'span_precision':0,'file_coverage':0,'file_precision':0},'selected_closure_ids':0})
        for limit in fallbacks:fallbacks[limit].append({**row,'diagnostic':{'span_f1':0,'span_coverage':0,'span_precision':0,'file_coverage':0,'file_precision':0},'selected_fallback_ids':0})
        continue
    result=read(result_path);binding=inventory[row['instance_id']];gold=gold_loader.get(row['instance_id'])
    for k in caps:
        ids=list(dict.fromkeys(row['model_read_ids']+row['closure_read_ids'][:k]))
        caps[k].append({**row,'diagnostic':metrics(gold,binding['cache_path'],binding['base_commit'],ids,result['native_export'])})
    for radius in radii:
        diagnostic=cropped_metrics(gold,binding['cache_path'],binding['base_commit'],row['model_read_ids'],row['closure_read_ids'],result['native_export'],result['patch'],radius)
        radii[radius].append({**row,'diagnostic':diagnostic})
    for policy in policies:
        chosen=policy_ids(row['model_read_ids'],row['closure_read_ids'],result['native_export'],result['patch'],policy)
        diagnostic=metrics(gold,binding['cache_path'],binding['base_commit'],list(dict.fromkeys(row['model_read_ids']+chosen)),result['native_export'])
        policies[policy].append({**row,'diagnostic':diagnostic,'selected_closure_ids':len(chosen)})
    for policy in rankings:
        chosen=reranked_ids(result['native_export'],result['patch'],policy)
        if patch_hunks(result['patch']) and policy=='wide-tie' and chosen!=row['closure_read_ids']:raise RuntimeError(f'ranking mismatch {row["cell_id"]}')
        diagnostic=metrics(gold,binding['cache_path'],binding['base_commit'],list(dict.fromkeys(row['model_read_ids']+chosen)),result['native_export'])
        rankings[policy].append({**row,'diagnostic':diagnostic,'selected_closure_ids':len(chosen)})
    for limit in fallbacks:
        chosen=row['closure_read_ids'] if patch_hunks(result['patch']) else repeated_attention_ids(result['native_export'],limit)
        diagnostic=metrics(gold,binding['cache_path'],binding['base_commit'],list(dict.fromkeys(row['model_read_ids']+chosen)),result['native_export'])
        fallbacks[limit].append({**row,'diagnostic':diagnostic,'selected_fallback_ids':len(chosen) if not patch_hunks(result['patch']) else 0})
    for key in ('span_f1','span_coverage','span_precision','file_coverage','file_precision'):
        if abs(caps[0][-1]['diagnostic'][key]-row['baseline_'+key])>1e-12:raise RuntimeError(f'baseline mismatch {row["cell_id"]} {key}')
        if abs(caps[6][-1]['diagnostic'][key]-row['treatment_'+key])>1e-12:raise RuntimeError(f'treatment mismatch {row["cell_id"]} {key}')
    validated+=1
def mean(rows,key):return sum(x['diagnostic'][key] for x in rows)/len(rows)
summary=[]
base=caps[0]
for k,rows in caps.items():
    summary.append({'cap':k,'span_f1':mean(rows,'span_f1'),'span_f1_gain':mean(rows,'span_f1')-mean(base,'span_f1'),'span_coverage':mean(rows,'span_coverage'),'span_precision':mean(rows,'span_precision'),'file_coverage':mean(rows,'file_coverage'),'file_precision':mean(rows,'file_precision')})
crop_summary=[]
for radius,rows in radii.items():crop_summary.append({'radius':radius,'span_f1':mean(rows,'span_f1'),'span_f1_gain':mean(rows,'span_f1')-mean(base,'span_f1'),'span_coverage':mean(rows,'span_coverage'),'span_precision':mean(rows,'span_precision'),'file_coverage':mean(rows,'file_coverage'),'file_precision':mean(rows,'file_precision')})
policy_summary=[]
for policy,rows in policies.items():policy_summary.append({'policy':policy,'selected_closure_ids':sum(x['selected_closure_ids'] for x in rows),'span_f1':mean(rows,'span_f1'),'span_f1_gain':mean(rows,'span_f1')-mean(base,'span_f1'),'span_coverage':mean(rows,'span_coverage'),'span_precision':mean(rows,'span_precision'),'file_coverage':mean(rows,'file_coverage'),'file_precision':mean(rows,'file_precision')})
ranking_summary=[]
for policy,rows in rankings.items():ranking_summary.append({'policy':policy,'selected_closure_ids':sum(x['selected_closure_ids'] for x in rows),'span_f1':mean(rows,'span_f1'),'span_f1_gain':mean(rows,'span_f1')-mean(base,'span_f1'),'span_coverage':mean(rows,'span_coverage'),'span_precision':mean(rows,'span_precision'),'file_coverage':mean(rows,'file_coverage'),'file_precision':mean(rows,'file_precision')})
fallback_summary=[]
for limit,rows in fallbacks.items():fallback_summary.append({'no_effect_path_limit':limit,'selected_fallback_ids':sum(x['selected_fallback_ids'] for x in rows),'span_f1':mean(rows,'span_f1'),'span_f1_gain':mean(rows,'span_f1')-mean(base,'span_f1'),'span_coverage':mean(rows,'span_coverage'),'span_precision':mean(rows,'span_precision'),'file_coverage':mean(rows,'file_coverage'),'file_precision':mean(rows,'file_precision')})
artifact={'schema_version':'are.contextbench-round31-closure-sensitivity/v1','status':'verified-exposed-posthoc-diagnostic','source_outcome_ref':str(ROOT/'round31-outcome-review.json'),'source_outcome_sha256':sha(ROOT/'round31-outcome-review.json'),'scheduled_trajectories':len(outcome['rows']),'reconstructed_trajectories':validated,'caps':summary,'effect_fragment_radii':crop_summary,'minimality_policies':policy_summary,'ranking_policies':ranking_summary,'no_effect_attention_fallbacks':fallback_summary,'exact_reconstruction':{'cap_0_matches_frozen_baseline':True,'cap_6_matches_frozen_treatment':True,'wide_tie_recreates_frozen_closure_ids':True},'model_calls':0,'additional_model_tokens':0,'claim_ceiling':'Post-hoc analysis of exposed failed confirmation. It may select a development hypothesis but cannot clear ContextBench or serve as new confirmation.','authority_effect':'none','benchmark_cleared':False,'open_questions_ref':'PLAN-round31.md#open-questions'}
target=ROOT/'round31-closure-sensitivity.json';target.write_text(json.dumps(artifact,indent=2)+'\n')
print(json.dumps({'status':artifact['status'],'caps':summary,'effect_fragment_radii':crop_summary,'minimality_policies':policy_summary,'ranking_policies':ranking_summary,'no_effect_attention_fallbacks':fallback_summary}))
