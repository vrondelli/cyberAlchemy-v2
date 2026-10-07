#!/usr/bin/env python3
"""Independent full audit and pre-gold disagreement census for selective r38."""
from __future__ import annotations
import gzip, hashlib, json, os, subprocess
from pathlib import Path

BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE=BASE/'code-projection-r36/RESULT.json'; QUERIES=BASE/'query-only-r37/QUERIES.jsonl'
ARE=BASE/'rankings-r38/are'; GRAPH=BASE/'rankings-r38/graph'; OUTPUT=BASE/'rankings-r38/R38-AUDIT.json'
PINS={'source':'14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
      'queries':'999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65'}
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
    if not ok: raise SystemExit(why)
def main():
    need(not OUTPUT.exists() and sha(SOURCE.read_bytes())==PINS['source'] and
         sha(QUERIES.read_bytes())==PINS['queries'],'input-pin-or-output-drift')
    sources=json.loads(SOURCE.read_bytes())['records']; queries=[json.loads(x) for x in QUERIES.read_text().splitlines()]
    are_seal_data=(ARE/'ARE-SEAL.json').read_bytes(); are_seal=json.loads(are_seal_data)
    graph_freeze_data=(GRAPH/'FREEZE.json').read_bytes(); graph_freeze=json.loads(graph_freeze_data)
    need(len(sources)==len(queries)==len(are_seal['rankings'])==24 and
         graph_freeze['are_seal_sha256']==sha(are_seal_data) and graph_freeze['cases']==24,
         'seal-or-denominator')
    rows=[]
    for ordinal,(src,query,aseal) in enumerate(zip(sources,queries,are_seal['rankings']),1):
        root=Path(src['root']).resolve(strict=True)
        paths=sorted(p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if p)
        tree=hashlib.sha256(); total=0
        for rel in paths:
            data=(root/rel).read_bytes(); total+=len(data); tree.update(rel.encode()+b'\0'+hashlib.sha256(data).digest())
        need(len(paths)==src['projected_files'] and total==src['projected_bytes'] and
             tree.hexdigest()==src['projected_tree_sha256'],f'source-tree-{ordinal}')
        adata=(ARE/f'ARE-RANKING-{ordinal:02d}.json').read_bytes(); a=json.loads(adata)
        gdata=(GRAPH/f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes(); g=json.loads(gdata)
        need(sha(adata)==aseal['ranking_sha256'] and
             a['ordinal']==g['ordinal']==query['ordinal']==src['slot']==ordinal and
             a['id']==g['id']==query['id']==src['image_tag'] and
             len(a['ranked_files'])==len(set(a['ranked_files']))==len(paths) and
             len(g['ranked_files'])==len(set(g['ranked_files']))==len(paths) and
             set(a['ranked_files'])==set(g['ranked_files'])==set(paths) and
             g['are_ranking_sha256']==sha(adata) and not a['gold_opened'] and not g['gold_opened'] and
             a['network_calls']==a['model_calls']==g['network_calls']==g['model_calls']==0,
             f'ranking-audit-{ordinal}')
        prov=query['log_provenance']; compressed=(BASE/prov['compressed_log']).read_bytes()
        need(sha(compressed)==prov['compressed_log_sha256'] and
             sha((BASE/prov['receipt']).read_bytes())==prov['receipt_sha256'],f'log-receipt-{ordinal}')
        raw=gzip.decompress(compressed)
        need(sha(raw)==prov['log_sha256'] and len(raw)==prov['log_bytes']==len(raw),f'raw-log-{ordinal}')
        disagree=a['ranked_files'][0]!=g['ranked_files'][0]
        rows.append({'ordinal':ordinal,'id':query['id'],'are_ranking_sha256':sha(adata),
                     'graph_ranking_sha256':sha(gdata),'are_top1':a['ranked_files'][0],
                     'graph_top1':g['ranked_files'][0],'dispatch_glm':disagree})
    receipt={'schema_version':'are.g01-selective-r38-ranking-audit/v1','input_sha256':PINS,
             'are_seal_sha256':sha(are_seal_data),'graph_freeze_sha256':sha(graph_freeze_data),
             'script_sha256':sha(Path(__file__).read_bytes()),'cases':24,
             'top1_agreement_cases':sum(not x['dispatch_glm'] for x in rows),
             'top1_disagreement_cases':sum(x['dispatch_glm'] for x in rows),
             'selective_glm_calls':sum(x['dispatch_glm'] for x in rows),'always_glm_calls':24,
             'router_rule':'dispatch GLM iff unchanged ARE and graph-r2 top-1 paths differ',
             'gold_opened':False,'passing_source_opened':False,'patches_opened':False,
             'network_calls':0,'model_calls':0,'rows':rows,
             'open_questions':['Do later gold outcomes show that top-1 disagreement predicts errors?',
                               'What matched cost and accuracy difference results from selective versus always GLM?']}
    encoded=(json.dumps(receipt,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(encoded)
    print(json.dumps({'cases':24,'top1_agreement_cases':receipt['top1_agreement_cases'],
                      'top1_disagreement_cases':receipt['top1_disagreement_cases'],
                      'selective_glm_calls':receipt['selective_glm_calls'],'audit_sha256':sha(encoded)}))
if __name__=='__main__':main()
