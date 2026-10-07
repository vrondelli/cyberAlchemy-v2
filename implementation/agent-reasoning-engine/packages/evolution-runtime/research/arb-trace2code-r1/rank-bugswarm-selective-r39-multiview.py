#!/usr/bin/env python3
"""Gold-blind exact-symbol/path channel and fixed three-view RRF for G01 r39."""
from __future__ import annotations
import hashlib, json, os, re, subprocess
from pathlib import Path, PurePosixPath

BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/selective-r28')
SOURCE=BASE/'code-projection-r36/RESULT.json'; QUERIES=BASE/'query-only-r37/QUERIES.jsonl'
R38=BASE/'rankings-r38'; AUDIT=R38/'R38-AUDIT.json'; ARE=R38/'are'; GRAPH=R38/'graph'
OUTPUT=BASE/'rankings-r39'; RANKINGS=OUTPUT/'MULTIVIEW-RANKINGS.jsonl'; SEAL=OUTPUT/'MULTIVIEW-SEAL.json'
PROTOCOL=Path(__file__).resolve().parents[2]/'evidence/G01-BUGSWARM-SELECTIVE-R39-MULTIVIEW-PROTOCOL-2026-10-04.md'
PINS={'source':'14766f233d6b369551b94fc7d3372b85d3cb88f0936b337024d7bb7247188395',
      'queries':'999d207a6108e7b374249cc131f1cde6fa9067bfe9931ada233f7a666d96ee65',
      'r38_audit':'ef02489f4b42a1363fee82af76a2c812a98ce595ae1ce621d0e8ea10c2dc68fe',
      'protocol':'b2e1122d8c4106cc57abbf6c5b428ffc5cc393ef460f5ee78f4655fbe0630a06'}
IDENT=re.compile(r'[A-Za-z_][A-Za-z0-9_]{2,}')
DECL=re.compile(r'\b(?:class|interface|enum|record|def)\s+([A-Za-z_][A-Za-z0-9_]*)')
CAMEL=re.compile(r'([a-z0-9])([A-Z])')
STOP={'the','and','for','with','from','this','that','test','tests','failed','failure','error','exception',
      'traceback','file','line','java','python','build','result','running','assert','true','false','none',
      'does','not','trigger','callback','behavior','dynamic','output','input','expected','actual'}
RRF_K=60; MAX_SOURCE_BYTES=256*1024
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
    if not ok: raise SystemExit(why)
def parts(value):
    value=CAMEL.sub(r'\1 \2',value)
    return {x.lower() for x in re.split(r'[^A-Za-z0-9]+',value) if len(x)>=3 and x.lower() not in STOP}
def rank_symbol(root,paths,query):
    qids={x.lower() for x in IDENT.findall(query) if x.lower() not in STOP}
    qtokens=set().union(*(parts(x) for x in qids)) if qids else set()
    scores={}; diag={'positive_score_files':0,'exact_stem_hits':0,'declaration_hits':0,'path_token_hits':0}
    for rel in paths:
        posix=PurePosixPath(rel); stem=posix.stem; score=0
        if stem.lower() in qids: score+=8; diag['exact_stem_hits']+=1
        score+=2*len(parts(stem)&qtokens)
        path_tokens=set().union(*(parts(x) for x in posix.parts[:-1])) if len(posix.parts)>1 else set()
        ph=len(path_tokens&qtokens); score+=ph; diag['path_token_hits']+=ph
        text=(root/rel).read_bytes()[:MAX_SOURCE_BYTES].decode('utf-8',errors='replace')
        dh=len({x.lower() for x in DECL.findall(text)}&qids); score+=5*dh; diag['declaration_hits']+=dh
        scores[rel]=score
        if score>0: diag['positive_score_files']+=1
    return sorted(paths,key=lambda p:(-scores[p],p)),diag
def fuse(rankings):
    positions=[{path:i for i,path in enumerate(ranking,1)} for ranking in rankings]
    return sorted(rankings[0],key=lambda p:(-sum(1/(RRF_K+pos[p]) for pos in positions),p))
def tree(root,paths):
    h=hashlib.sha256(); total=0
    for rel in paths:
        data=(root/rel).read_bytes(); total+=len(data); h.update(rel.encode()+b'\0'+hashlib.sha256(data).digest())
    return total,h.hexdigest()
def main():
    need(not OUTPUT.exists() and sha(SOURCE.read_bytes())==PINS['source'] and
         sha(QUERIES.read_bytes())==PINS['queries'] and sha(AUDIT.read_bytes())==PINS['r38_audit'] and
         sha(PROTOCOL.read_bytes())==PINS['protocol'],'input-pin-or-output-drift')
    sources=json.loads(SOURCE.read_bytes())['records']; queries=[json.loads(x) for x in QUERIES.read_text().splitlines()]
    audit=json.loads(AUDIT.read_bytes()); need(len(sources)==len(queries)==len(audit['rows'])==24,'denominator')
    rows=[]
    for ordinal,(src,query,prior) in enumerate(zip(sources,queries,audit['rows']),1):
        root=Path(src['root']).resolve(strict=True)
        paths=sorted(p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if p)
        total,tree_sha=tree(root,paths)
        need(len(paths)==src['projected_files'] and total==src['projected_bytes'] and tree_sha==src['projected_tree_sha256'],f'tree-{ordinal}')
        adata=(ARE/f'ARE-RANKING-{ordinal:02d}.json').read_bytes(); gdata=(GRAPH/f'GRAPH-RANKING-{ordinal:02d}.json').read_bytes()
        need(sha(adata)==prior['are_ranking_sha256'] and sha(gdata)==prior['graph_ranking_sha256'],f'r38-hash-{ordinal}')
        ar=json.loads(adata)['ranked_files']; gr=json.loads(gdata)['ranked_files']
        need(set(ar)==set(gr)==set(paths) and len(ar)==len(gr)==len(paths),f'r38-coverage-{ordinal}')
        sr,diag=rank_symbol(root,paths,query['query']); fr=fuse([ar,gr,sr])
        need(set(sr)==set(fr)==set(paths) and len(sr)==len(fr)==len(paths),f'r39-coverage-{ordinal}')
        tops=[ar[0],gr[0],sr[0]]; counts={p:tops.count(p) for p in set(tops)}
        union=sorted(set(ar[:10])|set(gr[:10])|set(sr[:10]))
        row={'schema_version':'are.g01-selective-r39-multiview-ranking/v1','ordinal':ordinal,
             'id':query['id'],'repo':query['repo'],'language':query['language'],
             'base_commit':query['base_commit'],'query_sha256':query['query_sha256'],
             'source_tree_sha256':tree_sha,'candidate_count':len(paths),
             'r38_are_sha256':sha(adata),'r38_graph_sha256':sha(gdata),
             'symbol_ranked_files':sr,'fused_ranked_files':fr,
             'are_top1':ar[0],'graph_top1':gr[0],'symbol_top1':sr[0],'fused_top1':fr[0],
             'top1_relation':'all-three-agree' if len(counts)==1 else 'two-agree' if max(counts.values())==2 else 'all-different',
             'fused_top1_channel_top5_support':sum(fr[0] in x[:5] for x in (ar,gr,sr)),
             'top10_union':union,'top10_union_size':len(union),**diag,
             'rrf_k':RRF_K,'gold_opened':False,'passing_source_opened':False,
             'patches_opened':False,'network_calls':0,'model_calls':0}
        rows.append(row)
        print(json.dumps({'ordinal':ordinal,'top1_relation':row['top1_relation'],
                          'fused_top1_channel_top5_support':row['fused_top1_channel_top5_support'],
                          'top10_union_size':len(union),'positive_score_files':diag['positive_score_files']}),flush=True)
    OUTPUT.mkdir(mode=0o700)
    encoded=(''.join(json.dumps(x,sort_keys=True)+'\n' for x in rows)).encode()
    fd=os.open(RANKINGS,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(encoded)
    counts={name:sum(x['top1_relation']==name for x in rows) for name in ('all-three-agree','two-agree','all-different')}
    seal={'schema_version':'are.g01-selective-r39-multiview-seal/v1','input_sha256':PINS,
          'runner_sha256':sha(Path(__file__).read_bytes()),'rankings_sha256':sha(encoded),'cases':24,
          'rrf_k':RRF_K,'top1_relation_counts':counts,
          'fused_top1_support_histogram':{str(n):sum(x['fused_top1_channel_top5_support']==n for x in rows) for n in range(4)},
          'top10_union_min':min(x['top10_union_size'] for x in rows),
          'top10_union_max':max(x['top10_union_size'] for x in rows),
          'top10_union_mean':sum(x['top10_union_size'] for x in rows)/24,
          'gold_opened':False,'passing_source_opened':False,'patches_opened':False,
          'network_calls':0,'model_calls':0}
    data=(json.dumps(seal,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(SEAL,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'cases':24,'top1_relation_counts':counts,'rankings_sha256':sha(encoded),'seal_sha256':sha(data)}))
if __name__=='__main__':main()

