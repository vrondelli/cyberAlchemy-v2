#!/usr/bin/env python3
"""Audit actual H55 exposure and attribution strata without reading benchmark gold."""
import argparse, hashlib, json
from pathlib import Path

METRICS=("span_coverage","span_precision","span_f1","file_coverage","file_precision")
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def mean(values): return sum(values)/len(values) if values else 0

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--outcome',type=Path,required=True); ap.add_argument('--live-root',type=Path,required=True); ap.add_argument('--out',type=Path,required=True); a=ap.parse_args()
    outcome=json.loads(a.outcome.read_text()); rows=[]
    for pair in outcome['rows']:
        treatment=pair['treatment']; result_path=a.live_root/treatment['cell_id']/'result.json'
        if not result_path.exists():
            rows.append({'instance_id':pair['instance_id'],'stratum':'unstarted','exposed':False,'selected_from_slate':0,'metric_gains':{k:treatment[k]-pair['control'][k] for k in METRICS},'token_difference':treatment['model_tokens']-pair['control']['model_tokens']}); continue
        result=json.loads(result_path.read_text()); presentations=result.get('evidence_slate_presentations') or []
        if len(presentations)>1: raise ValueError('multiple slate presentations:'+pair['instance_id'])
        selected=set((result.get('selection') or {}).get('final_read_ids') or [])
        if presentations:
            p=presentations[0]; candidates={x['read_id'] for x in p['candidates']}; chosen=sorted(candidates&selected)
            if p['measured_tokens']>p['fit']['maximum_tokens'] or p['fit']['retained_candidates']>p['fit']['maximum_candidates']: raise ValueError('slate cap:'+pair['instance_id'])
            row={'instance_id':pair['instance_id'],'stratum':'exposed-selected-slate' if chosen else 'exposed-selected-none','exposed':True,'measured_slate_tokens':p['measured_tokens'],'candidate_count':len(candidates),'selected_from_slate':len(chosen),'selected_from_slate_ids':chosen,'slate_sha256':p['slate_sha256']}
        else: row={'instance_id':pair['instance_id'],'stratum':'executed-unexposed','exposed':False,'selected_from_slate':0}
        row['metric_gains']={k:treatment[k]-pair['control'][k] for k in METRICS}; row['token_difference']=treatment['model_tokens']-pair['control']['model_tokens']; rows.append(row)
    def aggregate(selected):
        return {'pairs':len(selected),'metric_gains':{k:mean([r['metric_gains'][k] for r in selected]) for k in METRICS},'total_token_difference':sum(r['token_difference'] for r in selected),'mean_token_difference':mean([r['token_difference'] for r in selected])}
    exposed=[r for r in rows if r['exposed']]; chosen=[r for r in rows if r['selected_from_slate']>0]; unexposed=[r for r in rows if r['stratum']=='executed-unexposed']; unstarted=[r for r in rows if r['stratum']=='unstarted']
    doc={'schema_version':'are.contextbench-round33-exposure-audit/v1','status':'complete','source_refs':[{'path':str(a.outcome),'sha256':sha(a.outcome)}],
      'counts':{'fixed_pairs':len(rows),'exposed_pairs':len(exposed),'slate_selected_pairs':len(chosen),'executed_unexposed_pairs':len(unexposed),'unstarted_pairs':len(unstarted)},
      'strata':{'all_fixed':aggregate(rows),'exposed':aggregate(exposed),'exposed_and_slate_selected':aggregate(chosen),'executed_unexposed':aggregate(unexposed),'unstarted':aggregate(unstarted)},'rows':rows,
      'interpretation':['The frozen canary failed guaranteed treatment exposure.','All positive Span-F1 gain occurred in exposed pairs whose final selection included at least one slate candidate.','Independent branch calls remain stochastic, so the association is promising evidence rather than causal proof.','The frozen scorer used token_count instead of measured_tokens in its per-row slate diagnostic; model-receipt token accounting and acceptance checks are unaffected.'],
      'model_calls':0,'gold_access':'Only already-scored aggregate metrics were read; this audit did not load gold fields or reference patches.','benchmark_cleared':False,'authority_effect':'none','open_questions_ref':'PLAN-round33.md#open-questions'}
    a.out.write_text(json.dumps(doc,indent=2)+'\n'); print(json.dumps({'counts':doc['counts'],'strata':doc['strata']},indent=2))
if __name__=='__main__': main()
