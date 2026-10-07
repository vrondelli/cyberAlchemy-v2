#!/usr/bin/env python3
"""Fresh original/caller comparator seal, no labels or providers.

Open Questions: G01-DEFECTS4J-CALLER-R4-PROTOCOL.md.
"""
import json
import os
from hashlib import sha256
from pathlib import Path
import subprocess
import sys
import time
from production_path_r1 import production_path

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args],timeout=120).decode().strip()

def main(trees, official, are_sha, output):
    assert not output.exists()
    assert git(official,'rev-parse','HEAD')=='07014c986f3deadb1548c62b32c0ffbe6a81465d'
    assert not git(official,'status','--porcelain=v1')
    are_path=trees/'SEALED-CALLER-ARE.json'
    assert digest(are_path)==are_sha
    are=json.loads(are_path.read_bytes())
    assert are['gold_opened'] is False and len(are['cases'])==30
    assert are['manifest_sha256']=='40a2de6ad161ea0ce054477637c961c6da74da187ff6363df957b3212f9a298b'
    sys.dont_write_bytecode=True
    sys.path.insert(0,str(official/'src'))
    from agent_retrieval_bench.repomap_eval import build_repomap_index, rank_files_for_sample
    cases=[]; started=time.monotonic()
    for c in are['cases']:
        root=trees/(c['case_id']+'-checkout')
        assert git(root,'rev-parse','HEAD')==c['buggy_revision'] and not git(root,'status','--porcelain=v1')
        paths=sorted(p for p in (trees/(c['case_id']+'.paths')).read_text().splitlines() if p.endswith('.java'))
        chunks=[]; digests=[]
        for p in paths:
            full=root/p
            assert full.resolve().is_relative_to(root) and full.is_file()
            raw=full.read_bytes(); chunks.append({'path':p,'kind':'file','text':raw.decode(errors='replace')[:20_000]})
            digests.append(f'{p}\t{sha256(raw).hexdigest()}\n')
        projection=sha256(''.join(digests).encode()).hexdigest()
        assert len(paths)==c['candidate_count'] and projection==c['java_source_projection_sha256']
        index=build_repomap_index(chunks); assert set(index.nodes)==set(paths)
        ranks={}
        for name,query in [('original',c['query']),('caller',c['expanded_query'])]:
            assert sha256(query.encode()).hexdigest()==c['trace_view_sha256' if name=='original' else 'expanded_query_sha256']
            sample={'task_type':'trace2code','query':{'command':'','failure_excerpt':query,'run_strategy':'recorded_trigger_tests','source_type':'defects4j'}}
            ranked=rank_files_for_sample(sample=sample,query_text=query,index=index,candidate_paths=set(paths),query_weight=.65,pagerank_weight=.25,affinity_weight=.10)
            assert len(ranked)==len(paths) and {r[0] for r in ranked}==set(paths)
            ranks[name]={'ranked_files_top20':[r[0] for r in ranked[:20]],'production_ranked_files_top20':[r[0] for r in ranked if production_path(r[0])][:20]}
        cases.append({'case_id':c['case_id'],'candidate_count':len(paths),'java_source_projection_sha256':projection,'trace_view_sha256':c['trace_view_sha256'],'expanded_query_sha256':c['expanded_query_sha256'],**ranks})
        print(json.dumps({'case_id':c['case_id'],'elapsed_s':round(time.monotonic()-started,1)}),flush=True)
    result={'schema':'are.defects4j-caller-repomap-r4/v1','gold_opened':False,'cases':cases,'are_sha256':are_sha,'official_commit':'07014c986f3deadb1548c62b32c0ffbe6a81465d','implementation_sha256':digest(Path(__file__)),'filter_sha256':digest(Path(__file__).with_name('production_path_r1.py')),'elapsed_s':time.monotonic()-started}
    data=(json.dumps(result,indent=2,sort_keys=True)+'\n').encode()
    fd=os.open(output,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as stream: stream.write(data)
    print(json.dumps({'cases':30,'sha256':sha256(data).hexdigest()}),flush=True)

if __name__=='__main__':
    assert len(sys.argv)==5
    main(Path(sys.argv[1]).resolve(strict=True),Path(sys.argv[2]).resolve(strict=True),sys.argv[3],Path(sys.argv[4]).resolve())
