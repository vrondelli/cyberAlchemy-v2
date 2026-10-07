#!/usr/bin/env python3
"""Apply unchanged graph-r2 to one authenticated selective-r38 case."""
from __future__ import annotations
import gzip, hashlib, importlib.util, json, os, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE=BASE/'code-projection-r36/RESULT.json'; QUERIES=BASE/'query-only-r37/QUERIES.jsonl'
ARE=BASE/'rankings-r38/are'; OUTPUT=BASE/'rankings-r38/graph'
RULE=HERE/'rank-bugswarm-graph-dev-r2-graph.py'
PINS={'source':'14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
      'queries':'999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65',
      'graph_rule':'e0664909091562e38a547f04c7901e88ae2723bfe9d4bd2f0cdef2c561a770d0'}
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
    if not ok: raise SystemExit(why)
def save(path,data):
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
def main():
    need(len(sys.argv)==2 and sys.argv[1].isdigit(),'ordinal-argument')
    ordinal=int(sys.argv[1]); need(1<=ordinal<=24,'ordinal-range')
    need(sha(SOURCE.read_bytes())==PINS['source'] and sha(QUERIES.read_bytes())==PINS['queries'] and
         sha(RULE.read_bytes())==PINS['graph_rule'],'input-pin-drift')
    sources=json.loads(SOURCE.read_bytes())['records']
    queries=[json.loads(x) for x in QUERIES.read_text().splitlines()]
    seals=json.loads((ARE/'ARE-SEAL.json').read_bytes())['rankings']
    need(len(sources)==len(queries)==len(seals)==24,'denominator')
    src,query,seal=(rows[ordinal-1] for rows in (sources,queries,seals))
    need(src['slot']==query['ordinal']==seal['ordinal']==ordinal and
         src['image_tag']==query['id']==seal['id'] and src['repo']==query['repo'] and
         src['failed_commit']==query['base_commit'] and src['language']==query['language'],
         'case-identity')
    are_path=ARE/f'ARE-RANKING-{ordinal:02d}.json'; are_data=are_path.read_bytes()
    need(sha(are_data)==seal['ranking_sha256'],'are-ranking-drift'); are=json.loads(are_data)
    provenance=query['log_provenance']
    log_path=(BASE/provenance['compressed_log']).resolve(strict=True)
    receipt_path=(BASE/provenance['receipt']).resolve(strict=True)
    need(log_path.is_relative_to(BASE) and receipt_path.is_relative_to(BASE) and
         sha(log_path.read_bytes())==provenance['compressed_log_sha256'] and
         sha(receipt_path.read_bytes())==provenance['receipt_sha256'],'log-provenance-drift')
    log=gzip.decompress(log_path.read_bytes())
    need(sha(log)==provenance['log_sha256'] and len(log)==provenance['log_bytes'],'log-body-drift')
    spec=importlib.util.spec_from_file_location('g01_graph_r2',RULE)
    need(spec is not None and spec.loader is not None,'graph-rule-unavailable')
    rule=importlib.util.module_from_spec(spec); spec.loader.exec_module(rule)
    root=Path(src['root']).resolve(strict=True)
    need(root.parent==(BASE/'code-projection-r36/roots').resolve(),'root-boundary')
    ranking,diag=rule.rank_case(root,are['ranked_files'],log.decode('utf-8',errors='replace'),
                                query['query'],src['language'])
    need(diag['source_tree_sha256']==src['projected_tree_sha256'] and
         len(ranking)==len(set(ranking))==src['projected_files'] and
         set(ranking)==set(are['ranked_files']),'graph-tree-or-coverage')
    OUTPUT.mkdir(parents=True,exist_ok=True,mode=0o700)
    if ordinal==1:
        freeze={'schema_version':'are.g01-selective-r38-graph-freeze/v1','input_sha256':PINS,
                'are_seal_sha256':sha((ARE/'ARE-SEAL.json').read_bytes()),
                'runner_sha256':sha(Path(__file__).read_bytes()),'cases':24,
                'gold_opened':False,'passing_source_opened':False,'patches_opened':False,
                'network_calls':0,'model_calls':0}
        save(OUTPUT/'FREEZE.json',(json.dumps(freeze,sort_keys=True,indent=2)+'\n').encode())
    else: need((OUTPUT/'FREEZE.json').exists(),'missing-freeze')
    row={'schema_version':'are.g01-selective-r38-graph-ranking/v1','ordinal':ordinal,
         'id':query['id'],'repo':query['repo'],'language':query['language'],
         'base_commit':query['base_commit'],'query_sha256':query['query_sha256'],
         'log_sha256':provenance['log_sha256'],'are_ranking_sha256':seal['ranking_sha256'],
         'ranked_files':ranking,'candidate_count':len(ranking),**diag,'gold_opened':False,
         'passing_source_opened':False,'patches_opened':False,'network_calls':0,'model_calls':0}
    encoded=(json.dumps(row,sort_keys=True)+'\n').encode()
    save(OUTPUT/f'GRAPH-RANKING-{ordinal:02d}.json',encoded)
    print(json.dumps({'ordinal':ordinal,'candidate_count':len(ranking),
                      'ranking_sha256':sha(encoded),'ranker_elapsed_ms':diag['ranker_elapsed_ms']}))
if __name__=='__main__':main()

