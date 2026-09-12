"""Read-only progress view; never starts or retries work. Open questions: PLAN.md."""
import pathlib,json
h=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text()) if p.exists() else None
cells=read(h/'matrix.json')['cells'];tasks=list(dict.fromkeys(c['task_id'] for c in cells));preflights=[];episodes=[]
for tid in tasks:
 for mode in ['base','gold']:
  r=read(h/'preflight'/f'{tid.split("-")[-1]}-{mode}-1'/'report.json')
  preflights.append({'task_id':tid,'mode':mode,'status':r['status'] if r else 'pending','resolved':r.get('resolved') if r else None})
for c in cells:
 d=h/'evidence'/c['cell_id'];r=read(d/'result.json');started=read(d/'started.json');last_step=None
 log=h/('run-'+c['cell_id']+'.log')
 if log.exists():
  for line in log.read_text().splitlines():
   try:
    value=json.loads(line)
    if 'step' in value:last_step=value['step']
   except (ValueError,TypeError):pass
 episodes.append({'cell_id':c['cell_id'],'status':r['status'] if r else 'started' if started else 'not_started','last_completed_step':last_step,'model_calls':r.get('model_attempts') if r else None,'patch_produced':r.get('patch_produced') if r else None,'evaluation':(read(d/'evaluation/report.json') or {}).get('status'),'reproduction':(read(d/'reproduction/report.json') or {}).get('status')})
print(json.dumps({'freeze_present':(h/'freeze.json').exists(),'preflights':preflights,'episodes':episodes,'completion_audited':(h/'closeout.json').exists(),'analysis_present':(h/'analysis.json').exists(),'authority_effect':'none','open_questions_ref':'PLAN.md'},indent=2))
