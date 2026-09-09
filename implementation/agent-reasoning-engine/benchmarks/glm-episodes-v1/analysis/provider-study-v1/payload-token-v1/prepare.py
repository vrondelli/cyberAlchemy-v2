"""Frozen matched requests. Open questions: README.md."""
import sys,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'payload-view-v1'))
from projection import project_prompt,stable,digest
rows=[];sources=[]
for trial,soft in [('b2-admission',8000),('b5-admission',10000),('b8-admission',12000)]:
    source=ROOT.parent/'measured-pressure-episode-v1/live'/trial
    rendered=json.loads((source/'rendered.json').read_text()); result=json.loads((source/'result.json').read_text())
    for name in ['rendered.json','result.json']:
        p=source/name;sources.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    receipt=next(r for r in result['receipts'] if r['kind']=='tokenizer' and r['status']==200 and r['input_tokens']+2560>=soft-256)
    render=next(r for r in rendered if r['tokenizer_request_sha256']==receipt['request_sha256'])
    original=json.loads(render['prompt'])
    assert digest(stable({'model':'glm-5.3-flash',**original}))==receipt['request_sha256']
    for condition in ['observed','payload-heavy']:
        prompt=json.loads(json.dumps(original))
        if condition=='payload-heavy':
            # Add opaque source data equally to both arms; retain original facts.
            tool=next(m for m in prompt['messages'] if m['role']=='tool')
            value=json.loads(tool['content'])
            value['output']['utf8']+='\n'+ '\n'.join(hashlib.sha256(f'h23-negative-{i}'.encode()).hexdigest() for i in range(128))
            value['output']['sha256']=digest(value['output']['utf8'])
            value['output']['byte_count']=len(value['output']['utf8'].encode())
            body=json.dumps({k:value['output'][k] for k in ('path','utf8','sha256','byte_count')},ensure_ascii=False,separators=(',',':'))
            value['output_bytes']=len(body.encode());value['output_sha256']=digest(body)
            tool['content']=stable(value)
        projected,receipts=project_prompt(stable(prompt))
        assert sum(r['projected'] for r in receipts)==6
        for arm,body in [('original',prompt),('projected',json.loads(projected))]:
            raw=stable({'model':'glm-5.3-flash',**body})
            assert len(raw.encode())<=126976
            rows.append({'id':f'{trial}-{condition}-{arm}','window':soft,'condition':condition,'arm':arm,'raw':raw,'sha256':digest(raw),'historical_original_tokens':receipt['input_tokens'] if condition=='observed' else None})
manifest={'rows':rows,'sources':sources,'maximum_tokenizer_attempts':12,'model_attempts':0,'input_margin':512,'output_reserve':2048,'soft_headroom':256,'criteria':{'supporting':'All original observed requests still reject; all projected observed requests fit; both arms of all payload-heavy controls still reject.','counterevidence':'Known matched counts fail any required threshold.','inconclusive':'Any missing/error receipt, source drift or changed historical original token count.'},'authority_effect':'none','open_questions_ref':'README.md'}
with (ROOT/'prepared.json').open('x') as f:json.dump(manifest,f,indent=2);f.write('\n')
print(json.dumps({'requests':len(rows),'source_trials':3,'model_attempts':0}))
