#!/usr/bin/env python3
"""Independently seal all selective-r38 ARE rankings."""
from __future__ import annotations
import hashlib, json, os, subprocess
from pathlib import Path

BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE=BASE/'code-projection-r36/RESULT.json'; QUERIES=BASE/'query-only-r37/QUERIES.jsonl'
RANKINGS=BASE/'rankings-r38/are'; OUTPUT=RANKINGS/'ARE-SEAL.json'
PINS={'source':'14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
      'queries':'999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65'}
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
    if not ok: raise SystemExit(why)
def main():
    need(not OUTPUT.exists() and sha(SOURCE.read_bytes())==PINS['source'] and
         sha(QUERIES.read_bytes())==PINS['queries'],'input-pin-or-output-drift')
    sources=json.loads(SOURCE.read_bytes())['records']
    queries=[json.loads(x) for x in QUERIES.read_text().splitlines()]
    freeze_data=(RANKINGS/'FREEZE.json').read_bytes(); freeze=json.loads(freeze_data)
    need(len(sources)==len(queries)==24 and freeze['cases']==24 and
         freeze['input_sha256']['source']==PINS['source'] and
         freeze['input_sha256']['queries']==PINS['queries'] and not freeze['gold_opened'] and
         freeze['network_calls']==freeze['model_calls']==0,'denominator-or-freeze')
    rows=[]
    for ordinal,(src,query) in enumerate(zip(sources,queries),1):
        data=(RANKINGS/f'ARE-RANKING-{ordinal:02d}.json').read_bytes(); row=json.loads(data)
        root=Path(src['root']).resolve(strict=True)
        paths=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
        paths=sorted(p for p in paths if p)
        ranked=row['ranked_files']
        need(row['ordinal']==src['slot']==query['ordinal']==ordinal and
             row['id']==src['image_tag']==query['id'] and row['repo']==src['repo']==query['repo'] and
             row['base_commit']==src['failed_commit']==query['base_commit'] and
             row['language']==src['language']==query['language'] and
             row['query_sha256']==query['query_sha256'] and
             row['candidate_count']==len(ranked)==len(set(ranked))==src['projected_files'] and
             set(ranked)==set(paths) and row['indexed_bytes']==src['projected_bytes'] and
             not row['gold_opened'] and row['network_calls']==row['model_calls']==0,
             f'ranking-identity-or-coverage-{ordinal}')
        rows.append({'ordinal':ordinal,'id':row['id'],'ranking_sha256':sha(data),
                     'candidate_count':len(ranked),'ranker_elapsed_ms':row['ranker_elapsed_ms'],
                     'top1':ranked[0]})
    receipt={'schema_version':'are.g01-selective-r38-are-seal/v1','input_sha256':PINS,
             'freeze_sha256':sha(freeze_data),'script_sha256':sha(Path(__file__).read_bytes()),
             'gold_opened':False,'network_calls':0,'model_calls':0,'rankings':rows}
    encoded=(json.dumps(receipt,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(encoded)
    print(json.dumps({'rankings':len(rows),'seal_sha256':sha(encoded),
                      'total_ranker_elapsed_ms':sum(x['ranker_elapsed_ms'] for x in rows)}))
if __name__=='__main__':main()

