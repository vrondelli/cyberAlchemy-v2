#!/usr/bin/env python3
"""Post-seal exposed attribution, not next-policy input. Open Questions: G01-CANONICAL-ENTITY-READER-R1.md."""
import json
import re
from hashlib import sha256
from pathlib import Path

ROOT = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-entity-reader-r1')
SOURCE = Path('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1')
digest = lambda b: sha256(b).hexdigest()


def main():
    assert not (ROOT/'DIAGNOSTIC.json').exists()
    score_bytes = (ROOT/'SCORE.json').read_bytes(); score = json.loads(score_bytes)
    packets = [json.loads(line) for line in (ROOT/'PACKETS.jsonl').read_text().splitlines()]
    seal = json.loads((ROOT/'PREDICTION-SEAL.json').read_bytes())
    result_bytes = (ROOT/'GENERATION-RESULT.json').read_bytes()
    assert digest(result_bytes) == seal['generation_result_sha256']
    predictions = {(p['case_id'], p['arm']): p['ranked_files'] for p in json.loads(result_bytes)['predictions']}
    by_packet = {(p['case_id'], p['arm']): p for p in packets}
    are = {c['case_id']: c for c in json.loads((SOURCE/'ARE-SCREEN.json').read_bytes())['cases']}
    rows = []
    for row in score['per_case']:
        c = are[row['case_id']]
        paths = [s['path'] for s in json.loads((Path(c['projection_root'])/'RECEIPT.json').read_bytes())['sources']]
        label = Path('/home/vlad_/are-benchmark-archive/defects4j-metadata-v3.0.1/framework/projects')/c['project']/'modified_classes'/f"{c['bug']}.src"
        gold = set()
        for cls in label.read_text().splitlines():
            if cls.strip():
                suffix = cls.strip().split('$', 1)[0].replace('.', '/')+'.java'
                matches = [p for p in paths if p == suffix or p.endswith('/'+suffix)]
                assert len(matches) == 1; gold.add(matches[0])
        arms = {}
        for arm in ['combined', 'width_control']:
            p = by_packet[(row['case_id'], arm)]
            candidates = {x['path']: x for x in p['candidates']}
            selected = predictions[(row['case_id'], arm)]
            first = min((selected.index(path)+1 for path in gold if path in selected), default=None)
            reachable = bool(gold.intersection(candidates))
            arms[arm] = {'reachable': reachable, 'first_gold_rank': first,
                         'failure_kind': None if first and first <= 3 else ('reader' if reachable else 'retrieval'),
                         'selected_top3': selected[:3], 'gold_candidate_excerpts': [
                             {'path': path, 'start_line': candidates[path]['start_line'],
                              'package_or_import': bool(re.search(r'\b(package|import)\s', candidates[path]['excerpt'])),
                              'method_like': bool(re.search(r'\b(?:public|protected|private)\s+[^;{}\n]*\([^;{}\n]*\)\s*(?:throws\s+[^{}]+)?\s*\{', candidates[path]['excerpt']))}
                             for path in sorted(gold.intersection(candidates))]}
        rows.append({'case_id': row['case_id'], 'cohort': row['cohort'], 'arms': arms,
                     'mrr_delta': row['metrics']['glm_combined']['mrr_at_8']-row['metrics']['glm_width_control']['mrr_at_8']})
    aggregate = {}
    for cohort in ['r3', 'r4']:
        selected = [r for r in rows if r['cohort'] == cohort]
        aggregate[cohort] = {arm: {'retrieval_misses': sum(r['arms'][arm]['failure_kind'] == 'retrieval' for r in selected),
                                  'reader_top3_misses': sum(r['arms'][arm]['failure_kind'] == 'reader' for r in selected)}
                              for arm in ['combined', 'width_control']}
        controls = score['cohorts'][cohort]['hit3_counts']['glm_width_control']
        aggregate[cohort]['maximum_hit3_advantage_over_frozen_control'] = len(selected)-controls
        aggregate[cohort]['same_six_hit_gate_feasible_against_frozen_control'] = len(selected)-controls >= 6
        aggregate[cohort]['treatment_only_hit3'] = [r['case_id'] for r in selected if not r['arms']['combined']['failure_kind'] and r['arms']['width_control']['failure_kind']]
        aggregate[cohort]['control_only_hit3'] = [r['case_id'] for r in selected if r['arms']['combined']['failure_kind'] and not r['arms']['width_control']['failure_kind']]
    result = {'schema': 'are.canonical-entity-reader-exposed-attribution/v1', 'score_sha256': digest(score_bytes),
              'posture': 'post-seal exposed diagnosis; package/method regex is not gold-method coverage',
              'aggregate': aggregate, 'cases': rows, 'open_questions_owner': 'G01-CANONICAL-ENTITY-READER-R1.md'}
    with (ROOT/'DIAGNOSTIC.json').open('x') as stream:
        json.dump(result, stream, indent=2); stream.write('\n')
    print(json.dumps({'aggregate': aggregate, 'sha256': digest((ROOT/'DIAGNOSTIC.json').read_bytes())}))


if __name__ == '__main__':
    main()
