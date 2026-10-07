#!/usr/bin/env python3
"""Post-score diagnostic only: attribute misses to candidate reach or reranking."""
import json
from hashlib import sha256
from pathlib import Path
import sys

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def diagnose(root, manifest_path, trees, metadata, output):
    assert not output.exists()
    score_path = root / 'SCORE.json'
    score = json.loads(score_path.read_bytes())
    manifest = json.loads(manifest_path.read_bytes())
    packets = [json.loads(line) for line in (root/'PACKETS.jsonl').read_text().splitlines()]
    assert len(packets) == len(manifest['cases']) == score['cases'] == 32
    cases = {c['case_id']: c for c in manifest['cases']}
    scored = {c['case_id']: c for c in score['per_case_numeric']}
    rows = []
    for packet in packets:
        cid = packet['case_id']; case = cases[cid]
        label = metadata/'framework/projects'/case['project']/'modified_classes'/f"{case['bug_id']}.src"
        assert digest(label) == score['gold_label_sha256'][cid]
        tracked = (trees/f'{cid}.paths').read_text().splitlines()
        gold = set()
        for cls in label.read_text().splitlines():
            if not cls.strip():
                continue
            suffix = cls.strip().split('$', 1)[0].replace('.', '/') + '.java'
            matches = [p for p in tracked if p == suffix or p.endswith('/'+suffix)]
            assert len(matches) == 1
            gold.add(matches[0])
        union = {c['path'] for c in packet['candidates']}
        hit = bool(scored[cid]['metrics']['glm']['hit_at_3'])
        reachable = bool(gold & union)
        assert not hit or reachable
        rows.append({'case_id': cid, 'project': case['project'],
                     'gold_files': len(gold), 'candidate_count': len(union),
                     'gold_in_union': len(gold & union), 'glm_hit3': hit,
                     'miss_type': 'none' if hit else 'reranking' if reachable else 'candidate_retrieval',
                     'gold_in_are_top20': len(gold & set(packet['arm_ranked_files']['are'])),
                     'gold_in_repomap_top20': len(gold & set(packet['arm_ranked_files']['repomap']))})
    result = {'schema': 'are.defects4j-candidate-reach-diagnostic/v1',
              'posture': 'post-gold development diagnostic; does not change the frozen score or gate',
              'score_sha256': digest(score_path), 'packets_sha256': digest(root/'PACKETS.jsonl'),
              'manifest_sha256': digest(manifest_path), 'cases': 32,
              'reachable_cases': sum(r['gold_in_union'] > 0 for r in rows),
              'miss_counts': {kind: sum(r['miss_type'] == kind for r in rows)
                              for kind in ('none', 'reranking', 'candidate_retrieval')},
              'top20_union_reachable_cases': sum(r['gold_in_are_top20'] + r['gold_in_repomap_top20'] > 0 for r in rows),
              'cases_numeric': rows}
    with output.open('x') as handle:
        handle.write(json.dumps(result, indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k != 'cases_numeric'}))

if __name__ == '__main__':
    diagnose(*(Path(p).resolve() for p in sys.argv[1:]))
