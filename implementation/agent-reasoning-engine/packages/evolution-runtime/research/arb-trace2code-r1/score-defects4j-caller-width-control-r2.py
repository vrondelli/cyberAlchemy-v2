#!/usr/bin/env python3
"""Post-gold numeric reach screen, never a prospective accuracy claim.

Open Questions: G01-DEFECTS4J-32-R3-RESULT.md.
"""
import json
from hashlib import sha256
from pathlib import Path
import sys

def digest(path):
    return sha256(path.read_bytes()).hexdigest()

def main(root, trees, manifest_path, metadata, output):
    assert not output.exists()
    screen_path = root/'CALLER-WIDTH-CONTROL-R2.json'
    screen = json.loads(screen_path.read_bytes())
    original_score = json.loads((root/'SCORE.json').read_bytes())
    assert screen['packets_sha256'] == digest(root/'PACKETS.jsonl')
    cases = {c['case_id']: c for c in json.loads(manifest_path.read_bytes())['cases']}
    assert len(screen['cases']) == len(cases) == 32
    rows = []
    for candidate in screen['cases']:
        cid = candidate['case_id']; case = cases[cid]
        label = metadata/'framework/projects'/case['project']/'modified_classes'/f"{case['bug_id']}.src"
        assert digest(label) == original_score['gold_label_sha256'][cid]
        tracked = (trees/f'{cid}.paths').read_text().splitlines()
        gold = set()
        for cls in label.read_text().splitlines():
            if not cls.strip():
                continue
            suffix = cls.strip().split('$', 1)[0].replace('.', '/') + '.java'
            matches = [p for p in tracked if p == suffix or p.endswith('/'+suffix)]
            assert len(matches) == 1
            gold.add(matches[0])
        original = bool(gold & set(candidate['original_candidates']))
        screened = bool(gold & set(candidate['candidates']))
        rows.append({'case_id':cid,'original_reachable':original,'screened_reachable':screened,
                     'caller_production_top20_reachable':bool(gold & set(candidate['caller_production_top20'])),
                     'candidate_count':len(candidate['candidates'])})
    result = {'schema':'are.defects4j-caller-width-control-score-r2/v1',
              'posture':'post-gold exposed development reach only; not GLM accuracy, gate pass, or superiority',
              'screen_sha256':digest(screen_path),'original_score_sha256':digest(root/'SCORE.json'),
              'original_reachable':sum(r['original_reachable'] for r in rows),
              'screened_reachable':sum(r['screened_reachable'] for r in rows),
              'gains':sum(not r['original_reachable'] and r['screened_reachable'] for r in rows),
              'losses':sum(r['original_reachable'] and not r['screened_reachable'] for r in rows),
              'candidate_max':max(r['candidate_count'] for r in rows),'cases_numeric':rows}
    with output.open('x') as handle:
        handle.write(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k != 'cases_numeric'}))

if __name__ == '__main__':
    main(*(Path(arg).resolve() for arg in sys.argv[1:]))
