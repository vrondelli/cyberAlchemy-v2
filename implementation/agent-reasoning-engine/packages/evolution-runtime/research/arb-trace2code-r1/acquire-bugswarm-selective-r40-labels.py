#!/usr/bin/env python3
"""One-shot evaluator-only GitHub comparison labels for selective G01 r40."""
from __future__ import annotations
import hashlib, json, os, subprocess
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
BASE=ROOT/'selective-r28'; OUTPUT=BASE/'evaluator-only-r40'
PATHS={'raw':ROOT/'1.3.1-bugswarm.json','cohort':BASE/'final-r34/RESULT.json',
       'source':BASE/'code-projection-r36/RESULT.json','r38_audit':BASE/'rankings-r38/R38-AUDIT.json',
       'r39_rankings':BASE/'rankings-r39/MULTIVIEW-RANKINGS.jsonl',
       'r39_seal':BASE/'rankings-r39/MULTIVIEW-SEAL.json','r39_audit':BASE/'rankings-r39/MULTIVIEW-AUDIT.json',
       'protocol':Path(__file__).resolve().parents[2]/'evidence/G01-BUGSWARM-SELECTIVE-R40-EVALUATION-PROTOCOL-2026-10-04.md'}
PINS={'raw':'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
      'cohort':'fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c',
      'source':'14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
      'r38_audit':'ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe',
      'r39_rankings':'9466de334f4d0a2ccd38a4db05b38a1bc8c55beb638542c755c509fb5b319cb9',
      'r39_seal':'cf2fda51657801c3795d51bdf854593134915622a3b487551be9ed1dff5afd20',
      'r39_audit':'9781bf39483ee5dc05db9ab68b69d7dea06d7164e27c9bc191d48972023e5158',
      'protocol':'fc6bc99459341bd32b9883b0ad459ff7022737420858a869875cecd3dd59cc36'}
MAX_BYTES=8*1024*1024
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
    if not ok: raise SystemExit(why)
def encoded(value): return (json.dumps(value,sort_keys=True,indent=2)+'\n').encode()
def save(path,data):
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
def safe_path(path,language):
    if not isinstance(path,str) or not path or '\\' in path: return False
    p=PurePosixPath(path)
    return not p.is_absolute() and '..' not in p.parts and '.git' not in p.parts and path.endswith('.py' if language=='Python' else '.java')
def fetch(url):
    req=Request(url,headers={'Accept':'application/vnd.github+json','User-Agent':'ARE-G01-selective-r40-evaluator/1'})
    try:
        with urlopen(req,timeout=35) as response:
            return response.status,response.read(MAX_BYTES+1),dict(response.headers)
    except HTTPError as error:
        return error.code,error.read(min(MAX_BYTES,65536)),dict(error.headers)
    except (URLError,TimeoutError): return 0,b'',{}
def main():
    need(not OUTPUT.exists() and all(sha(PATHS[n].read_bytes())==v for n,v in PINS.items()),'output-or-input-drift')
    raw={x['image_tag']:x for x in json.loads(PATHS['raw'].read_bytes())}
    cohort=json.loads(PATHS['cohort'].read_bytes())['rows']; sources=json.loads(PATHS['source'].read_bytes())['records']
    r39=[json.loads(x) for x in PATHS['r39_rankings'].read_text().splitlines()]
    need(len(raw)==4388 and len(cohort)==len(sources)==len(r39)==24,'denominator')
    OUTPUT.mkdir(parents=True,mode=0o700)
    freeze={'schema_version':'are.g01-selective-r40-label-freeze/v1','input_sha256':PINS,
            'script_sha256':sha(Path(__file__).read_bytes()),
            'endpoint':'https://api.github.com/repos/{repo}/compare/{failed}...{passed}',
            'maximum_requests':24,'automatic_retries':0,'maximum_response_bytes':MAX_BYTES,
            'rule':'complete exact comparison; all changed old-side language paths present in failed Git index',
            'passing_source_opened':False,'model_calls':0,'gold_export_to_vps':False}
    save(OUTPUT/'LABEL-FREEZE.json',encoded(freeze))
    rows=[]
    for ordinal,(slot,src,rank) in enumerate(zip(cohort,sources,r39),1):
        tag=src['image_tag']; meta=raw[tag]; failed=src['failed_commit']; passed=meta['passed_job']['trigger_sha']
        need(slot['slot']==src['slot']==rank['ordinal']==ordinal and slot['image_tag']==tag==rank['id'] and
             slot['repo']==src['repo']==rank['repo']==meta['repo'] and slot['failed_commit']==failed==meta['failed_job']['trigger_sha'] and
             isinstance(passed,str) and len(passed)==40,f'identity-{ordinal}')
        tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=src['root'],timeout=30).decode().split('\0')); tracked.discard('')
        url=f"https://api.github.com/repos/{quote(src['repo'],safe='/')}/compare/{quote(failed,safe='')}...{quote(passed,safe='')}"
        status,body,headers=fetch(url); body_name=f'COMPARE-{ordinal:02d}.json'
        if status==200 and len(body)<=MAX_BYTES: save(OUTPUT/body_name,body)
        identity=complete=False; changed=[]; changed_count=None
        if status==200 and len(body)<=MAX_BYTES:
            try:
                doc=json.loads(body); files=doc.get('files'); commits=doc.get('commits')
                changed_count=len(files) if isinstance(files,list) else None
                identity=(doc.get('base_commit',{}).get('sha')==failed and isinstance(commits,list) and bool(commits) and commits[-1].get('sha')==passed)
                complete=identity and isinstance(files,list) and len(files)<300 and not headers.get('Link')
                if complete:
                    changed=sorted({item.get('previous_filename',item.get('filename')) for item in files
                                    if safe_path(item.get('previous_filename',item.get('filename')),src['language']) and
                                    item.get('previous_filename',item.get('filename')) in tracked})
            except (ValueError,AttributeError,IndexError,TypeError): pass
        row={'ordinal':ordinal,'id':tag,'repo':src['repo'],'language':src['language'],
             'failed_sha':failed,'passed_sha':passed,'http_status':status,'response_sha256':sha(body),
             'response_file':body_name if status==200 and len(body)<=MAX_BYTES else None,
             'identity_matched':identity,'complete_file_list':complete,'changed_file_count':changed_count,
             'source_gold_paths':changed if complete else None,'gold_admissible':complete and bool(changed),
             'rate_remaining':headers.get('X-RateLimit-Remaining'),'passing_source_opened':False,
             'model_calls':0,'gold_export_to_vps':False}
        save(OUTPUT/f'LABEL-{ordinal:02d}.json',encoded(row)); rows.append(row)
        print(json.dumps({'ordinal':ordinal,'http_status':status,'complete':complete,
                          'gold_count':len(changed),'admissible':row['gold_admissible'],
                          'rate_remaining':row['rate_remaining']}),flush=True)
        if not row['gold_admissible']: break
    result={'schema_version':'are.g01-selective-r40-label-result/v1','attempted':len(rows),
            'admissible':sum(x['gold_admissible'] for x in rows),
            'all_24_admissible':len(rows)==24 and all(x['gold_admissible'] for x in rows),
            'results':rows,'freeze_sha256':sha((OUTPUT/'LABEL-FREEZE.json').read_bytes()),
            'passing_source_opened':False,'model_calls':0,'gold_export_to_vps':False}
    data=encoded(result); save(OUTPUT/'LABEL-RESULT.json',data)
    print(json.dumps({'attempted':result['attempted'],'admissible':result['admissible'],
                      'all_24_admissible':result['all_24_admissible'],'result_sha256':sha(data)}))
if __name__=='__main__':main()
