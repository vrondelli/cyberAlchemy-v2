"""Score only settled, verified exports. Open questions: PLAN.md.
No model calls; evaluator gold stays on the local scoring host.
"""
import json, pathlib, subprocess, hashlib
HERE=pathlib.Path(__file__).resolve().parent
REPO=next(p for p in HERE.parents if (p/'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py').exists())
ROOT=pathlib.Path.home()/'.local/share/are'
analysis=json.loads((HERE/'evidence/ACCOUNTING-VERIFICATION.json').read_text())
assert len(analysis['rows'])==8
assert all(x.get('ledger_reconciled') and not x.get('verification_error') for x in analysis['rows']), 'Every ledger must reconcile, including unknown usage.'
freeze=json.loads((HERE/'SCORER-FREEZE.json').read_text())
for binding in freeze['bindings']:
 assert hashlib.sha256((REPO/binding['path']).read_bytes()).hexdigest()==binding['sha256'], 'Scorer source drift: '+binding['path']
out=HERE/'scores';out.mkdir(exist_ok=True)
for row in analysis['rows']:
 row['metrics']=None
 if not row['valid_export'] or not row['accounting_verified']:continue
 pred=HERE/'evidence/runs'/row['slot_id']/'prediction.json';native=out/(row['slot_id']+'-native.json')
 assert not native.exists(), 'Scoring outputs are exclusive; do not silently replay.'
 cmd=[str(ROOT/'contextbench-venv-117/bin/python'),str(REPO/'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),'--upstream',str(ROOT/'contextbench-upstream-117'),'--gold',str(ROOT/'contextbench-upstream-117/data/full.parquet'),'--pred',str(pred),'--cache',str(ROOT/'contextbench-retained-v1/contextbench-round52-score-cache'),'--out',str(native)]
 with (out/(row['slot_id']+'-score.log')).open('x') as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
 score=json.loads(native.read_text())['native'];assert not score.get('error');metrics={}
 for name in ['span','file']:
  x=score['final'][name];p,r=x['precision'],x['coverage'];metrics.update({name+'_precision':p,name+'_recall':r,name+'_f1':2*p*r/(p+r) if p+r else 0})
 row['metrics']=metrics;row['prediction_sha256']=hashlib.sha256(pred.read_bytes()).hexdigest();row['score_sha256']=hashlib.sha256(native.read_bytes()).hexdigest()
 print(json.dumps({'slot':row['slot_id'],'metrics':metrics}),flush=True)
summary={}
for arm in ['current-are','deepseek-harness-adapted']:
 rows=[x for x in analysis['rows'] if x['arm']==arm];assert len(rows)==4
 valid=[x for x in rows if x['metrics'] is not None]
 summary[arm]={'assigned':4,'valid_source_selections':len(valid),'known_total_model_tokens':sum(x['known_total_tokens']for x in rows),'unknown_usage_dispatched_requests':sum(x['unknown_usage_dispatched_requests']for x in rows),'token_accounting_complete':all(x['accounting_verified']for x in rows),'total_model_tokens':sum(x['known_total_tokens']for x in rows) if all(x['accounting_verified']for x in rows) else None,'model_calls':sum(x['model_calls']for x in rows),'maximum_observed_input_tokens':max(x['maximum_input_tokens']for x in rows),'valid_only_mean_span_f1':sum(x['metrics']['span_f1']for x in valid)/len(valid) if valid else None,'valid_only_mean_file_f1':sum(x['metrics']['file_f1']for x in valid)/len(valid) if valid else None}
result={'run':'output-74','context_capacity':1000000,'output_cap':8192,'rows':analysis['rows'],'summary':summary,'claim_ceiling':'Four exposed tasks, one run per harness; source-selection quality, not patch correctness or held-out generalization. Valid-only means are not comparable cohorts if completion differs.','benchmark_cleared':False,'authority_effect':'none','open_questions_ref':'PLAN.md'}
with (HERE/'RESULTS.json').open('x')as f:json.dump(result,f,indent=2)
print(json.dumps(summary,indent=2))
