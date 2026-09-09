"""Check exact inputs, live isolation and independently recompute frozen literal scores."""
import hashlib,json
from pathlib import Path
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[6]
load=lambda n:json.loads((BASE/n).read_text())
m=load('MANIFEST.json');material={k:v for k,v in m.items() if k!='manifest_digest'}
assert hashlib.sha256(json.dumps(material,sort_keys=True,separators=(',',':')).encode()).hexdigest()==m['manifest_digest']
for e in m['files']:assert hashlib.sha256((ROOT/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
print('PASS: frozen input closure',len(m['files']))
if not (BASE/'RESULT.json').exists():raise SystemExit(0)
r=load('RESULT.json');corpus=load('cases.json');rubric=load('rubric.json')
assert r['model_calls']<=41 and r['optional_provider_calls']==r['model_judge_calls']==0 and not r['tool_events']
assert r['manifest_digest']==m['manifest_digest']
if r['status']!='PASS':print('Live run',r['status'],r.get('reason'),'dependent quality checks not_evaluable');raise SystemExit(0)
assert r['model_calls']==41 and len(r['training'])==5 and len(r['evaluation'])==36
assert len({t['id'] for t in r['threads']})==38
assert all(t['model']==m['model'] and t['returned_history_length'] in [None,0] for t in r['threads'])
train={t['thread_id'] for t in r['training']};evaluation=[e['thread_id'] for e in r['evaluation']]
assert len(set(evaluation))==36 and not train.intersection(evaluation)
assert sorted(l['revision'] for l in r['lesson_history'])==[1,1,2]
revised=next(l for l in r['lesson_history'] if l['revision']==2)
assert any(l['record_digest']==revised['predecessor_digest'] and l['lesson_id']==revised['lesson_id'] for l in r['lesson_history'])
expected={c['id']:c for c in corpus['evaluation']}
for d in r['dispatches']:
 c=d['current']
 if 'arm' not in c:continue
 assert len(d['selected_lessons'])==(expected[c['case_id']]['expected_selected'] if c['arm']=='C' else 0)
 assert d['memory_summary_present']==(c['arm']=='B')
 if c['arm']=='C' and expected[c['case_id']]['invalidate']:assert any(a['disposition']=='unsupported' for a in d['assessments'])
 if c['arm']=='C' and expected[c['case_id']]['override']:assert any(a['disposition']=='overridden' for a in d['assessments'])
for e in r['evaluation']:
 assert e['status']=='completed';v=e['response'].strip();rule=rubric[e['case_id']]
 passed=bool(v) and all(x.lower() in v.lower() for x in rule.get('includes',[])) and all(x.lower() not in v.lower() for x in rule.get('excludes',[]))
 if 'exact' in rule:passed=passed and v==rule['exact']
 if 'ends' in rule:passed=passed and v.endswith(rule['ends'])
 assert passed==e['score']['passed']
for arm in ['B','C']:
 rows=[e for e in r['evaluation'] if e['arm']==arm]
 assert len(rows)==18 and len({(e['repetition'],e['case_id']) for e in rows})==18
 assert sum(e['score']['passed'] for e in rows)==r['arm_results'][arm]['passes']
print('PASS: 41 calls, 36 fresh evaluation threads, revision lineage, source invalidation, overrides, independent scoring')
