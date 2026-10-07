#!/usr/bin/env python3
"""Post-score numeric retrieval/reader attribution only.

Open Questions: G01-DEFECTS4J-CALLER-R4-PROTOCOL.md.
"""
from hashlib import sha256
import json
from pathlib import Path
import sys

BASE=Path('/home/vlad_/are-benchmark-archive')
def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def main(root):
    output=root/'REACH-DIAGNOSTIC.json'
    assert not output.exists()
    score=json.loads((root/'SCORE.json').read_bytes())
    assert score['cases']==30 and score['prediction_seal_sha256']==digest(root/'PREDICTION-SEAL.json')
    packets=[json.loads(s) for s in (root/'PACKETS.jsonl').read_text().splitlines()]
    assert digest(root/'PACKETS.jsonl')=='9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd'
    manifest=json.loads((BASE/'defects4j-trigger-supply-r4/SOURCE-ORDER-30.json').read_bytes())
    cases={c['case_id']:c for c in manifest['cases']}
    numeric={c['case_id']:c for c in score['per_case_numeric']}
    assert len(cases)==len(numeric)==len(packets)==30
    rows=[];mapping_failures=[]
    for p in packets:
        cid=p['case_id'];c=cases[cid]
        label=BASE/'defects4j-metadata-v3.0.1/framework/projects'/c['project']/'modified_classes'/f"{c['bug_id']}.src"
        assert digest(label)==score['gold_label_sha256'][cid]
        tracked=(BASE/'defects4j-buggy-source-30-r4'/f'{cid}.paths').read_text().splitlines()
        gold=set();unmapped=0
        for cls in label.read_text().splitlines():
            if not cls.strip():continue
            suffix=cls.strip().split('$',1)[0].replace('.','/')+'.java'
            matches=[path for path in tracked if path==suffix or path.endswith('/'+suffix)]
            if len(matches)!=1:
                unmapped+=1
                mapping_failures.append({'case_id':cid,'class_sha256':sha256(cls.encode()).hexdigest(),'matches':len(matches)})
                continue
            gold.add(matches[0])
        initial=bool(gold & set(p['original_candidates']))
        reachable=bool(gold & {x['path'] for x in p['candidates']})
        hit=bool(numeric[cid]['metrics']['glm']['hit_at_3'])
        rows.append({'case_id':cid,'mapping_complete':unmapped==0,'unmapped_classes':unmapped,'observations':len(p['caller_observations']),'original_reachable':initial,'reachable':reachable,'hit3':hit,'failure_class':None if hit else 'reranking' if reachable else 'retrieval','caller_are_top20_reachable':bool(gold & set(p['arm_ranked_files']['caller_are_production']))})
    result={'schema':'are.defects4j-caller-r4-post-score-diagnostic/v1','posture':'post-score attribution, not an independent confirmation','score_sha256':digest(root/'SCORE.json'),'prediction_seal_sha256':digest(root/'PREDICTION-SEAL.json'),'cases':30,'original_reachable':sum(r['original_reachable'] for r in rows),'reachable':sum(r['reachable'] for r in rows),'reach_gains':sum(r['reachable'] and not r['original_reachable'] for r in rows),'reach_losses':sum(r['original_reachable'] and not r['reachable'] for r in rows),'retrieval_misses':sum(r['failure_class']=='retrieval' for r in rows),'reranking_misses':sum(r['failure_class']=='reranking' for r in rows),'cases_numeric':rows}
    result.update(mapping_failures=mapping_failures,reach_metric_scope='Reach of mapped gold files only; incomplete mappings remain a failed confirmation criterion, never repaired by this diagnostic',implementation_sha256=digest(Path(__file__)))
    with output.open('x') as stream:stream.write(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='cases_numeric'}))

if __name__=='__main__':
    main(Path(sys.argv[1]).resolve(strict=True))
