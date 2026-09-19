"""Score reconciled ARE exports and apply the prospective DSH Pareto gate."""
import hashlib, json, pathlib, subprocess

HERE=pathlib.Path(__file__).resolve().parent
REPO=next(parent for parent in HERE.parents if (parent/'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py').exists())
ARE_ROOT=pathlib.Path.home()/'.local/share/are'
analysis=json.loads((HERE/'evidence/ACCOUNTING-VERIFICATION.json').read_text())
assert len(analysis['rows'])==2
assert all(row.get('ledger_reconciled') and not row.get('verification_error') for row in analysis['rows'])
freeze=json.loads((HERE/'SCORER-FREEZE.json').read_text())
for binding in freeze['bindings']:
    source=REPO/binding['path']
    assert hashlib.sha256(source.read_bytes()).hexdigest()==binding['sha256'], 'Scorer source drift: '+binding['path']
out=HERE/'scores'
out.mkdir(exist_ok=True)
for row in analysis['rows']:
    row['metrics']=None
    if not row['valid_export'] or not row['accounting_verified']:
        continue
    prediction=HERE/'evidence/runs'/row['slot_id']/'prediction.json'
    native=out/(row['slot_id']+'-native.json')
    assert not native.exists()
    command=[
        str(ARE_ROOT/'contextbench-venv-117/bin/python'),
        str(REPO/'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'),
        '--upstream',str(ARE_ROOT/'contextbench-upstream-117'),
        '--gold',str(ARE_ROOT/'contextbench-upstream-117/data/full.parquet'),
        '--pred',str(pred),
        '--cache',str(ARE_ROOT/'contextbench-retained-v1/contextbench-round52-score-cache'),
        '--out',str(native)
    ]
    with (out/(row['slot_id']+'-score.log')).open('x') as log:
        subprocess.run(command,stdout=log,stderr=subprocess.STDOUT,check=True)
    score=json.loads(native.read_text())['native']
    assert not score.get('error')
    metrics={}
    for name in ['span','file']:
        item=score['final'][name]
        precision,recall=item['precision'],item['coverage']
        metrics.update({
            name+'_precision':precision,
            name+'_recall':recall,
            name+'_f1':2*precision*recall/(precision+recall) if precision+recall else 0
        })
    row['metrics']=metrics
    row['prediction_sha256']=hashlib.sha256(prediction.read_bytes()).hexdigest()
    row['score_sha256']=hashlib.sha256(native.read_bytes()).hexdigest()

dsh={'span_f1':0.7869999049700657,'file_f1':0.5714285714285715,
     'total_model_tokens':587645,'model_calls':22}
for row in analysis['rows']:
    metrics=row['metrics']
    row['pareto_score_win']=bool(metrics and
        metrics['span_f1']>=dsh['span_f1'] and
        metrics['file_f1']>=dsh['file_f1'] and
        (metrics['span_f1']>dsh['span_f1'] or metrics['file_f1']>dsh['file_f1']))
    row['relative_token_reduction_vs_dsh']=(
        (dsh['total_model_tokens']-row['known_total_tokens'])/dsh['total_model_tokens']
        if row['accounting_verified'] else None
    )

result={
    'run':'full-cycle-79',
    'context_capacity':1000000,
    'output_cap':8192,
    'dsh_baseline':dsh,
    'prospective_gate':'valid, complete accounting, no lower F1 metric and at least one strictly higher F1 metric',
    'rows':analysis['rows'],
    'score_goal_achieved':any(row['pareto_score_win'] for row in analysis['rows']),
    'efficiency_goal_achieved':any(row['pareto_score_win'] and row['relative_token_reduction_vs_dsh']>=0.15 for row in analysis['rows']),
    'claim_ceiling':'One exposed task and fixed historical DSH baseline; source-selection quality only, not patch correctness or held-out generalization.',
    'benchmark_cleared':False,
    'authority_effect':'none',
    'open_questions_ref':'PLAN.md'
}
with (HERE/'RESULTS.json').open('x') as handle:
    json.dump(result,handle,indent=2)
print(json.dumps(result,indent=2))
