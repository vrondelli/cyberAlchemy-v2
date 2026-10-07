#!/usr/bin/env python3
"""Independent recomputation audit of G01 r39 symbol/path and fixed RRF."""
from __future__ import annotations
import hashlib, json, os, re, subprocess
from pathlib import Path, PurePosixPath

BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE=BASE/'code-projection-r36/RESULT.json'; QUERIES=BASE/'query-only-r37/QUERIES.jsonl'
R38=BASE/'rankings-r38'; ARE=R38/'are'; GRAPH=R38/'graph'; R39=BASE/'rankings-r39'
RANKINGS=R39/'MULTIVIEW-RANKINGS.jsonl'; SEAL=R39/'MULTIVIEW-SEAL.json'; OUTPUT=R39/'MULTIVIEW-AUDIT.json'
IDENT=re.compile(r'[A-Za-z_][A-Za-z0-9_]{2,}'); DECL=re.compile(r'\b(?:class|interface|enum|record|def)\s+([A-Za-z_][A-Za-z0-9_]*)')
CAMEL=re.compile(r'([a-z0-9])([A-Z])'); STOP={'the','and','for','with','from','this','that','test','tests','failed','failure','error','exception','traceback','file','line','java','python','build','result','running','assert','true','false','none','does','not','trigger','callback','behavior','dynamic','output','input','expected','actual'}
sha=lambda data:hashlib.sha256(data).hexdigest(); K=60; CAP=256*1024
def need(ok,why):
    if not ok: raise SystemExit(why)
def tokens(value):
    value=CAMEL.sub(r'\1 \2',value)
    return {x.lower() for x in re.split(r'[^A-Za-z0-9]+',value) if len(x)>=3 and x.lower() not in STOP}
def symbol(root,paths,query):
    ids={x.lower() for x in IDENT.findall(query) if x.lower() not in STOP}
    qt=set().union(*(tokens(x) for x in ids)) if ids else set(); scored={}
    for rel in paths:
        p=PurePosixPath(rel); score=8*int(p.stem.lower() in ids)+2*len(tokens(p.stem)&qt)
        pt=set().union(*(tokens(x) for x in p.parts[:-1])) if len(p.parts)>1 else set(); score+=len(pt&qt)
        text=(root/rel).read_bytes()[:CAP].decode('utf-8',errors='replace')
        score+=5*len({x.lower() for x in DECL.findall(text)}&ids); scored[rel]=score
    return sorted(paths,key=lambda p:(-scored[p],p))
def main():
    need(not OUTPUT.exists(),'output-exists')
    sources=json.loads(SOURCE.read_bytes())['records']; queries=[json.loads(x) for x in QUERIES.read_text().splitlines()]
    rows=[json.loads(x) for x in RANKINGS.read_text().splitlines()]; seal_data=SEAL.read_bytes(); seal=json.loads(seal_data)
    need(len(sources)==len(queries)==len(rows)==24 and seal['rankings_sha256']==sha(RANKINGS.read_bytes()),'denominator-or-seal')
    audit_rows=[]
    for ordinal,(src,query,row) in enumerate(zip(sources,queries,rows),1):
        root=Path(src['root']).resolve(strict=True)
        paths=sorted(p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if p)
        ar=json.loads((ARE/f'ARE-RANKING-{ordinal:02d}.json').read_bytes())['ranked_files']
        gr=json.loads((GRAPH/f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes())['ranked_files']
        sr=symbol(root,paths,query['query']); positions=[{p:i for i,p in enumerate(x,1)} for x in (ar,gr,sr)]
        fr=sorted(paths,key=lambda p:(-sum(1/(K+pos[p]) for pos in positions),p))
        union=sorted(set(ar[:10])|set(gr[:10])|set(sr[:10])); tops=[ar[0],gr[0],sr[0]]
        rel='all-three-agree' if len(set(tops))==1 else 'two-agree' if max(tops.count(x) for x in set(tops))==2 else 'all-different'
        need(row['ordinal']==src['slot']==query['ordinal']==ordinal and row['id']==query['id']==src['image_tag'] and
             row['symbol_ranked_files']==sr and row['fused_ranked_files']==fr and row['top1_relation']==rel and
             row['top10_union']==union and row['top10_union_size']==len(union) and
             row['fused_top1_channel_top5_support']==sum(fr[0] in x[:5] for x in (ar,gr,sr)) and
             set(sr)==set(fr)==set(paths) and not row['gold_opened'] and row['network_calls']==row['model_calls']==0,
             f'recomputation-{ordinal}')
        audit_rows.append({'ordinal':ordinal,'top1_relation':rel,'fused_top1':fr[0],
                           'top5_support':row['fused_top1_channel_top5_support'],'top10_union_size':len(union)})
    counts={name:sum(x['top1_relation']==name for x in audit_rows) for name in ('all-three-agree','two-agree','all-different')}
    need(counts==seal['top1_relation_counts'],'census-drift')
    receipt={'schema_version':'are.g01-selective-r39-multiview-audit/v1','rankings_sha256':sha(RANKINGS.read_bytes()),
             'seal_sha256':sha(seal_data),'auditor_sha256':sha(Path(__file__).read_bytes()),'cases':24,
             'top1_relation_counts':counts,'gold_opened':False,'network_calls':0,'model_calls':0,'rows':audit_rows,
             'open_questions':['Does evaluator-only scoring validate any support feature as an escalation signal?']}
    data=(json.dumps(receipt,sort_keys=True,indent=2)+'\n').encode(); fd=os.open(OUTPUT,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'cases':24,'top1_relation_counts':counts,'audit_sha256':sha(data)}))
if __name__=='__main__':main()
