#!/usr/bin/env python3
"""Exposed caller reader packets; no label reads.

Open Questions: G01-DEFECTS4J-CALLER-DEV-R1-PROTOCOL.md.
"""
import json
from hashlib import sha256
from pathlib import Path
import re
import sys

BASE = Path('/home/vlad_/are-benchmark-archive')
ROOT = BASE / 'defects4j-production-r3'
TREES = BASE / 'defects4j-buggy-source-32-r3'

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def fusion(union, ranks):
    return sorted(union, key=lambda p: (-sum(1/(60+r.index(p)+1) for r in ranks if p in r), p))

def main(output):
    assert not output.exists()
    assert digest(ROOT/'PACKETS.jsonl') == '2ef2d9726c8b7117053b0c2fae945c62f210ff919309801db2b439a20a5dc139'
    assert digest(ROOT/'CALLER-CONTEXT-SCREEN-R1.json') == '50ffdfc6a02194388c73ed3022f25d511c5dbc8f734a60d107e44a83bb0a23b0'
    original = [json.loads(s) for s in (ROOT/'PACKETS.jsonl').read_text().splitlines()]
    callers = {c['case_id']:c for c in json.loads((ROOT/'CALLER-CONTEXT-SCREEN-R1.json').read_bytes())['cases']}
    repomap_path = ROOT/'SEALED-CALLER-REPOMAP-DEV-R1.json'
    repomap = {c['case_id']:c for c in json.loads(repomap_path.read_bytes())['cases']}
    packets = []
    for p in original:
        cid = p['case_id']; c = callers[cid]; r = repomap[cid]
        failure = p['prompt'].split('Failure:\n')[1].split('\nCandidates:\n')[0]
        expanded = failure+'\nCaller source observations:\n'+'\n'.join(f"{o['path']}:{o['start_line']}\n{o['utf8']}" for o in c['observations'])
        assert sha256(expanded.encode()).hexdigest() == c['expanded_query_sha256'] == r['expanded_query_sha256']
        checkout = TREES/(cid+'-checkout')
        for o in c['observations']:
            assert digest(checkout/o['path']) == o['source_sha256']
        qterms = set(re.findall(r'[a-z_][a-z_0-9]{2,}', expanded.lower()))
        candidates = []
        for i,path in enumerate(c['candidates'],1):
            raw = (checkout/path).read_bytes()
            lines = raw.decode(errors='replace')[:20_000].splitlines()
            windows = [(len(qterms & set(re.findall(r'[a-z_][a-z_0-9]{2,}', '\n'.join(lines[start:start+20]).lower()))), start) for start in range(0,len(lines),10)]
            start = sorted(windows,key=lambda pair:(-pair[0],pair[1]))[0][1] if windows else 0
            candidates.append({'candidate_id':i,'path':path,'start_line':start+1,'source_sha256':sha256(raw).hexdigest(),'excerpt':'\n'.join(lines[start:start+20])[:600]})
        arms = dict(p['arm_ranked_files'])
        arms.update(caller_are_production=c['caller_production_top20'], caller_repomap=r['ranked_files_top20'], caller_repomap_production=r['production_ranked_files_top20'])
        arms['caller_fusion'] = fusion(c['candidates'],[arms['caller_are_production'],arms['caller_repomap'],arms['stack']])
        arms['caller_fusion_production'] = fusion(c['candidates'],[arms['caller_are_production'],arms['caller_repomap_production'],arms['stack']])
        prompt = p['prompt'].split('Failure:\n')[0]+'Failure:\n'+expanded+'\nCandidates:\n'+'\n'.join(f"[{x['candidate_id']}] {x['path']}:{x['start_line']}\n{x['excerpt']}" for x in candidates)
        packets.append({**p,'prompt':prompt,'prompt_sha256':sha256(prompt.encode()).hexdigest(),'candidates':candidates,'arm_ranked_files':arms,'caller_observations':c['observations'],'expanded_query_sha256':c['expanded_query_sha256']})
    assert len(packets)==32 and max(len(p['candidates']) for p in packets)<=24
    output.mkdir(mode=0o700)
    (output/'PACKETS.jsonl').write_text(''.join(json.dumps(p,ensure_ascii=False)+'\n' for p in packets))
    seal = {'schema':'are.defects4j-caller-dev-r1-packets/v1','cases':32,'gold_opened':True,'posture':'exposed development, never confirmation', 'packets_sha256':digest(output/'PACKETS.jsonl'),'builder_sha256':digest(Path(__file__)),'caller_screen_sha256':digest(ROOT/'CALLER-CONTEXT-SCREEN-R1.json'),'caller_repomap_sha256':digest(repomap_path),'candidate_max':max(len(p['candidates']) for p in packets),'prompt_bytes_max':max(len(p['prompt'].encode()) for p in packets)}
    (output/'PACKET-SEAL.json').write_text(json.dumps(seal,indent=2)+'\n')
    print(json.dumps(seal))

if __name__=='__main__':
    main(Path(sys.argv[1]).resolve())
