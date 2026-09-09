"""Verify frozen inputs and experimental isolation; quality scores are observations."""
import hashlib,json
from pathlib import Path
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[6]
load=lambda n:json.loads((BASE/n).read_text())
m=load('MANIFEST.json'); material={k:v for k,v in m.items() if k!='manifest_digest'}
assert hashlib.sha256(json.dumps(material,sort_keys=True,separators=(',',':')).encode()).hexdigest()==m['manifest_digest']
for e in m['files']:assert hashlib.sha256((ROOT/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
r=load('RESULT.json');c=load('cases.json')
assert r['manifest_digest']==m['manifest_digest']
assert r['model_calls']<=24
assert r['optional_provider_calls']==r['model_judge_calls']==0
assert r['tool_events']==[]
assert len({t['id'] for t in r['threads']})==len(r['threads'])
if r['status']=='PASS':
 assert r['model_calls']==24 and len(r['training'])==6 and len(r['evaluation'])==18
 training={t['thread_id'] for t in r['training']}; evaluation=[e['thread_id'] for e in r['evaluation']]
 assert len(set(evaluation))==18 and not training.intersection(evaluation)
 for d in r['dispatches']:
  current=d['current']
  if 'arm' not in current:continue
  assert len(d['selected_lessons'])==(1 if current['arm']=='C' and current['kind']=='applicable' else 0)
  assert d['memory_summary_present']==(current['arm']=='B')
 assert all(e['status']=='completed' for e in r['evaluation'])
 print('PASS: complete 24-call experiment, 18 isolated evaluation threads, exact lesson selection and summary controls')
else:print('Partial run:',r['status'],r.get('reason'),'quality not evaluable')
print('PASS: frozen input closure, protocol identity, call budget and zero tool events')
