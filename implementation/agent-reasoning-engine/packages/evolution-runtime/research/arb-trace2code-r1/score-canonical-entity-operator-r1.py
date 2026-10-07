#!/usr/bin/env python3
"""Post-seal exposed reach and reader ceiling; not answer accuracy.

Open Questions: G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md.
"""
import json
import os
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1')


def digest(b):
    return sha256(b).hexdigest()


def main():
    output = ROOT / 'ENTITY-OPERATOR-SCORE-R1.json'
    assert not output.exists()
    sb = (ROOT / 'ENTITY-OPERATOR-SCREEN-R1.json').read_bytes()
    screen = json.loads(sb)
    ab, bb = (ROOT / 'ARE-SCREEN.json').read_bytes(), (ROOT / 'SOURCE-SCORE.json').read_bytes()
    assert digest(ab) == screen['are_sha256'] and digest(bb) == '5903d07c39962266afc07924f6e53e42d4f6d8033ee4210c9f389477214b188f'
    are = {c['case_id']: c for c in json.loads(ab)['cases']}
    baseline = json.loads(bb)
    by_case = {c['case_id']: c for c in baseline['cases']}
    assert len(screen['cases']) == len(are) == len(by_case) == 62 and baseline['mapping_complete']
    rows = []
    mappings = []
    for c in screen['cases']:
        p, old = are[c['case_id']], by_case[c['case_id']]
        assert c['base_candidates'] == old['candidates'] and c['source_tree_sha256'] == p['source_tree_sha256']
        rb = (Path(p['projection_root']) / 'RECEIPT.json').read_bytes()
        assert digest(rb) == p['projection_receipt_sha256']
        sources = json.loads(rb)['sources']
        labels = Path('/home/vlad_/are-benchmark-archive/defects4j-metadata-v3.0.1/framework/projects') / c['project'] / 'modified_classes' / f"{c['bug']}.src"
        lb = labels.read_bytes()
        assert digest(lb) == old['label_sha256']
        gold = set()
        for cls in lb.decode().splitlines():
            if not cls.strip():
                continue
            suffix = cls.strip().split('$', 1)[0].replace('.', '/') + '.java'
            matches = [s['path'] for s in sources if s['path'] == suffix or s['path'].endswith('/' + suffix)]
            mappings.append({'case_id': c['case_id'], 'class_sha256': digest(cls.strip().encode()), 'matches': len(matches)})
            if len(matches) == 1:
                gold.add(matches[0])
        variants = {}
        for name, v in c['variants'].items():
            assert len(v['candidates']) == len(v['control_candidates']) <= 36
            assert set(c['base_candidates']) <= set(v['candidates']) and set(c['base_candidates']) <= set(v['control_candidates'])
            assert len(v['added']) <= 4 and len(v['added']) == len(v['control_added'])
            assert set(v['added_witnesses']) == set(v['added'])
            variants[name] = {'reachable': bool(gold.intersection(v['candidates'])), 'control_reachable': bool(gold.intersection(v['control_candidates'])), 'candidate_count': len(v['candidates'])}
        rows.append({'case_id': c['case_id'], 'cohort': c['cohort'], 'base_reachable': old['caller_reachable'], 'variants': variants})
    aggregate = {}
    for name in ['combined', 'entity', 'operator']:
        aggregate[name] = {}
        for cohort, count in [('r3', 32), ('r4', 30)]:
            selected = [c for c in rows if c['cohort'] == cohort]
            assert len(selected) == count
            reach = sum(c['variants'][name]['reachable'] for c in selected)
            control = sum(c['variants'][name]['control_reachable'] for c in selected)
            strongest = baseline['aggregate'][cohort]['strongest_baseline_hits']
            aggregate[name][cohort] = {'cases': count, 'base': sum(c['base_reachable'] for c in selected), 'reach': reach, 'width_control': control, 'net_gain': reach - control, 'six_extra_hits_possible': reach >= strongest + 6}
    primary = aggregate['combined']
    criteria = {'complete_mappings': all(m['matches'] == 1 for m in mappings), 'net_gain_ge_2': sum(v['net_gain'] for v in primary.values()) >= 2, 'positive_gain_each_cohort': all(v['net_gain'] > 0 for v in primary.values()), 'no_base_losses': all(not c['base_reachable'] or c['variants']['combined']['reachable'] for c in rows), 'six_hit_ceiling_feasible_each_cohort': all(v['six_extra_hits_possible'] for v in primary.values())}
    result = {'schema': 'are.canonical-entity-operator-exposed-reach/v1', 'posture': 'already-exposed source reach/ceiling, not reader accuracy or superiority', 'screen_sha256': digest(sb), 'baseline_source_score_sha256': digest(bb), 'protocol_sha256': screen['protocol_sha256'], 'aggregate': aggregate, 'criteria': criteria, 'source_pilot_advanced': all(criteria.values()), 'mapping_failures': [m for m in mappings if m['matches'] != 1], 'cases': rows, 'implementation_sha256': digest(Path(__file__).read_bytes()), 'open_questions_owner': 'G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md'}
    data = (json.dumps(result, indent=2) + '\n').encode()
    with os.fdopen(os.open(output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
        stream.write(data)
    print(json.dumps({'aggregate': aggregate, 'criteria': criteria, 'source_pilot_advanced': result['source_pilot_advanced'], 'receipt_sha256': digest(data)}))


if __name__ == '__main__':
    main()
