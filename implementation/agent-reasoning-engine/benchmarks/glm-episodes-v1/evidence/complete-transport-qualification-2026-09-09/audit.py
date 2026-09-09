"""Independent receipt audit. Open questions: README.md#open-questions."""
import json,sys,statistics,hashlib
from pathlib import Path
b=Path(sys.argv[1]);run=b/'run';aggregate=json.load(open(run/'result.json'));assert aggregate['status']=='COMPLETED'
manifest=json.load(open(run/'manifest.json'))
assert all(hashlib.sha256(Path(s['path']).read_bytes()).hexdigest()==s['sha256'] for s in manifest['sources']), 'frozen source drift'
rows=[];receipts=[];corrections=[];workers=[];oracle_checks=0;public_checks=0;finals=[]
for d in sorted(run.glob('round-*')):
 initial=json.load(open(d/'initial/result.json'));feedback=json.load(open(d/'feedback/result.json'))
 for row in initial['trials']:
  rows.append({'round':d.name,**row})
  v=json.load(open(d/f"initial/trial-{row['index']:02d}/visible-trace.json"))
  rows[-1]['model_retries']=sum(r.get('attempt_index')==1 for r in v['receipts'] if r['kind']=='model')
  receipts.extend({'round':d.name,'id':row['id'],'phase':'initial',**r} for r in v['receipts'])
 oracles={o['id']:o['result'] for o in feedback['oracle']}
 for r in feedback['results']:
  x=r['result'];last=x.get('after') or x.get('before');o=oracles[r['id']]
  ok=x['status'] in ['UNCHANGED','REPAIRED'] and last is not None and last['ok'] and o is not None and o['ok']
  finals.append({'round':d.name,'id':r['id'],'passed':bool(ok),'status':x['status']})
  if ok:oracle_checks+=o['passed'];public_checks+=last['passed']
  workers.extend(x[k] for k in ['before','after'] if x.get(k))
  if x.get('correction_dispatches',0):corrections.append({'round':d.name,'id':r['id'],'kind':x.get('correction_kind'),'passed':bool(ok)})
  receipts.extend({'round':d.name,'id':r['id'],'phase':'correction',**t} for t in (r.get('transport') or {}).get('receipts',[]))
models=[r for r in receipts if r['kind']=='model'];tokenizers=[r for r in receipts if r['kind']=='tokenizer'];recycled=[r for r in rows if r['recycles']>0]
assert len(rows)==len(finals)==36
assert len({(r['round'],r['id']) for r in rows})==36
assert len({(r['round'],r['id']) for r in finals})==36
assert sum(x['passed'] for x in finals)==aggregate['final_verified']
assert len(models)==aggregate['model_attempts'] and len(tokenizers)==aggregate['tokenizer_attempts']
result={'frozen_source_files_verified':len(manifest['sources']),'first_pass':sum(r['repair'] for r in rows),'final_verified':sum(x['passed'] for x in finals),'total':36,
 'delivery_gate_passes':sum(r['gate'] for r in rows),'minimum_headroom':min(r['minimum_headroom'] for r in rows if r['minimum_headroom'] is not None),
 'recycled_trials':len(recycled),'continuity_passes':sum(r['continuity'] for r in recycled),'recycle_events':sum(r['recycles'] for r in rows),
 'long_8k_recycled_rounds':sum(r['recycles']>0 for r in rows if r['id']=='long-8000'),
 'model_attempts':len(models),'tokenizer_attempts':len(tokenizers),'corrections':corrections,
 'initial_proposal_passes_without_transport_retry':sum(r['repair'] and r['model_retries']==0 for r in rows),
 'retry_attempts':sum(r.get('attempt_index')==1 for r in models),
 'correction_retry_attempts':sum(r.get('attempt_index')==1 and r['phase']=='correction' for r in models),
 'retry_trials':[{'round':r['round'],'id':r['id'],'retries':r['model_retries'],'initial_proposal_passed':r['repair']} for r in rows if r['model_retries']],
 'validation_workers':len(workers),'cleanup_verified':all(w['worker_cleanup_verified'] for w in workers),
 'validation_execution_ok':all(x['passed'] or x['reason']=='output-mismatch' for w in workers for x in w['results']),
 'final_public_checks_passed':public_checks,'final_oracle_checks_passed':oracle_checks,'failed_trials':[x for x in finals if not x['passed']],
 'transport_failures':[{k:r.get(k) for k in ['round','id','phase','kind','status','latency_ms','timeout_ms','dispatched','provider_code']} for r in receipts if r['status']!=200],
 'successful_model_calls_above_30s':[{k:r[k] for k in ['round','id','phase','latency_ms']} for r in models if r['status']==200 and r['latency_ms']>30000],
 'per_window':{str(w):{'initial':sum(r['repair'] for r in rows if r['soft_limit']==w),'final':sum(x['passed'] for x in finals if x['id'].endswith('-'+str(w))),'total':12} for w in [8000,10000,12000]},
 'authority_effect':'none','open_questions_ref':'README.md#open-questions'}
print(json.dumps(result,indent=2))
