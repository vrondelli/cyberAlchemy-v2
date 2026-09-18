"""Pin small reference-only benchmark selections. No model calls or dataset vendoring."""
import hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SEED='are-preference-pilot-v1'
def sha(b): return hashlib.sha256(b).hexdigest()
def canonical(v): return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()
def fetch(url,limit=32*1024*1024):
    with urllib.request.urlopen(url,timeout=60) as r:
        b=r.read(limit+1);assert len(b)<=limit,'download limit exceeded'
        return b,dict((k.lower(),v) for k,v in r.headers.items())
def js(url):return json.loads(fetch(url)[0])
def rank(identifier):return sha((SEED+identifier).encode())
PREF='50795054b5ff5f418d2b768a331d71e480f93331'
LONG='98d7416c24c778c2fee6e6f3006e7a073259d48f'
BENCH='301031ab04f13bb45559389fddccff79e85ea27a'
tasks=[];sources=[]
# Four strata, deterministic two per stratum. No model outcomes enter selection.
strata=[('explicit_preference','education_learning_styles'),('explicit_preference','professional_work_location_style'),
        ('implicit_preference/choice-based','travel_activities'),('implicit_preference/persona-driven','education_resources')]
for style,topic in strata:
    path=f'benchmark_dataset/{style}/{topic}.json';url=f'https://raw.githubusercontent.com/amazon-science/PrefEval/{PREF}/{path}'
    b,_=fetch(url);rows=json.loads(b);sources.append({'benchmark':'PrefEval','url':url,'revision':PREF,'sha256':sha(b),'bytes':len(b)})
    chosen=sorted(range(len(rows)),key=lambda i:rank(path+':'+str(i)))[:2]
    for split,i in zip(['development','reserved'],chosen):
        tasks.append({'task_id':f'prefeval:{style}:{topic}:{i}','benchmark':'PrefEval','split':split,'stratum':f'{style}/{topic}',
         'source_url':url,'revision':PREF,'selector':{'row_index':i},'record_sha256':sha(canonical(rows[i])),
         'license':'CC-BY-NC-4.0','execution_gate':'commercial-use-permission-unresolved','input_contract':'explicit: preference and question; implicit: conversation and question only',
         'gold_fields':['preference','explanation','aligned_op'],'metric':'preference-following-and-answer-quality'})
url=f'https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned/resolve/{LONG}/longmemeval_oracle.json'
b,_=fetch(url);rows=json.loads(b);sources.append({'benchmark':'LongMemEval','url':url,'revision':LONG,'sha256':sha(b),'bytes':len(b)})
used=set()
for kind in ['single-session-preference','knowledge-update','multi-session','abstention']:
    eligible=[r for r in rows if (r['question_id'].endswith('_abs') if kind=='abstention' else r['question_type']==kind and not r['question_id'].endswith('_abs'))]
    chosen=[]
    for r in sorted(eligible,key=lambda r:rank(r['question_id'])):
        family=r['question_id'].removesuffix('_abs')
        if family in used:continue
        used.add(family);chosen.append(r)
        if len(chosen)==2:break
    assert len(chosen)==2
    for split,r in zip(['development','reserved'],chosen):
        tasks.append({'task_id':'longmemeval:'+r['question_id'],'benchmark':'LongMemEval','split':split,'stratum':kind,
         'source_url':url,'revision':LONG,'selector':{'question_id':r['question_id']},'record_sha256':sha(canonical(r)),
         'license':'MIT','execution_gate':'adapter-and-protocol-freeze-required','variant':'oracle-evidence-only',
         'input_contract':'timestamped history and question/date; strip has_answer and all answer labels',
         'gold_fields':['answer','answer_session_ids','has_answer'],'metric':'answer-accuracy-update-or-abstention'})
# Distinct profiles and recipient contexts across development/reserved partitions.
# Select row references only; do not save profile text or gold labels in this package.
for split,offsets in [('development',[0,13,26,34]),('reserved',[353,366,378,388])]:
    for i in offsets:
        url=f'https://datasets-server.huggingface.co/rows?dataset=sangyon%2FBenchPreS&config=default&split=test&offset={i}&length=1'
        b,headers=fetch(url);assert headers.get('x-revision')==BENCH,'BenchPreS viewer revision changed'
        row=json.loads(b)['rows'][0];assert row['row_idx']==i
        r=row['row'];tasks.append({'task_id':f'benchpres:test:{i}','benchmark':'BenchPreS','split':split,'stratum':r['domain'],
          'source_url':f'https://huggingface.co/datasets/sangyon/BenchPreS/blob/{BENCH}/data/test-00000-of-00001.parquet',
          'viewer_url':url,'revision':BENCH,'selector':{'row_index':i},'record_sha256':sha(canonical(r)),
          'license':'CC-BY-NC-4.0','execution_gate':'commercial-use-permission-unresolved',
          'input_contract':'original prompt only; labels stay with evaluator','gold_fields':['preference_label'],
          'metric':'appropriate-application-rate-and-misapplication-rate','recipient':r['recipient']})
licenses=[{'benchmark':'PrefEval','license':'CC-BY-NC-4.0','url':f'https://raw.githubusercontent.com/amazon-science/PrefEval/{PREF}/LICENSE'},
 {'benchmark':'BenchPreS','license':'CC-BY-NC-4.0','url':f'https://huggingface.co/datasets/sangyon/BenchPreS/blob/{BENCH}/README.md'},
 {'benchmark':'LongMemEval','license':'MIT','url':f'https://huggingface.co/datasets/xiaowu0162/longmemeval-cleaned/blob/{LONG}/README.md'}]
manifest={'schema_version':'are.preference-task-selection/v1','selection_seed':SEED,'status':'SELECTED_NOT_RUN','authority_effect':'none',
 'claim_ceiling':'Small development and reserved pilot; not official benchmark scores or independent confirmation. Reserved content must stay out of tuning.',
 'canonical_record_hash':'sha256 of UTF-8 JSON, sorted keys, compact separators, Unicode unescaped (Python ensure_ascii=False)',
 'sources':sources,'licenses':licenses,'tasks':tasks}
path=ROOT/'tasks.json';data=json.dumps(manifest,indent=2,ensure_ascii=False)+'\n'
if path.exists():assert path.read_text()==data,'selection drift; use successor version'
else:path.write_text(data)
print(json.dumps({'status':manifest['status'],'tasks':len(tasks),'development':12,'reserved':12,'bytes':len(data.encode())}))
