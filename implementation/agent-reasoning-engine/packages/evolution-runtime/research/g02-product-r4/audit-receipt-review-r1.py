#!/usr/bin/env python3
"""Independent read-only integrity/metric audit of exposed G02 reviewer scores."""

import hashlib
import json
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r4-reviewer-score-r1')
EXPECTED_PAIRS = {'r2': 23, 'r3': 9}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def f1(metric):
    p, r = metric['precision'], metric['coverage']
    return 2 * p * r / (p + r) if p + r else 0.0


def audit(root=ROOT):
    seal_path, result_path = root / 'PRE-SCORE-SEAL.json', root / 'RESULT.json'
    seal, result = read(seal_path), read(result_path)
    assert result['seal_sha256'] == sha(seal_path), 'seal hash'
    assert seal['posture'] == result['posture'] == 'exposed-development-only', 'posture'
    assert len(seal['rows']) == len(result['rows']) == 32, 'pair count'
    counts = {'r2': 0, 'r3': 0}
    for binding, row in zip(seal['rows'], result['rows']):
        cohort, pair = binding['cohort'], binding['pair']
        assert (cohort, pair) == (row['cohort'], row['pair']), 'pair order'
        counts[cohort] += 1
        for key in ('packet', 'response', 'source_prediction', 'are_score', 'dsh_score', 'prediction'):
            assert sha(Path(binding[key])) == binding[key + '_sha256'], f'{pair}:{key} hash'
        source = read(Path(binding['source_prediction']))
        prediction = read(Path(binding['prediction']))
        response = read(Path(binding['response']))
        assert prediction['traj_data']['pred_steps'] == source['traj_data']['pred_steps'], f'{pair}:steps'
        if response['status'] == 'invalid':
            assert prediction == source and binding['posture'] == 'invalid-preserved', f'{pair}:invalid'
        else:
            assert response['status'] == 'valid' and binding['posture'] == 'valid-transformed', f'{pair}:valid'
            packet = read(Path(binding['packet']))
            review = response['review']
            handles = {h['index']: h for h in packet['delivered_reads']}
            expected_files = [p for p in source['traj_data']['pred_files'] if p not in review['drop_files']]
            expected_spans = {p: list(source['traj_data']['pred_spans'][p]) for p in expected_files}
            for index in review['add_read_indexes']:
                h = handles[index]
                span = {'start': h['start'], 'end': h['end']}
                if h['path'] not in expected_files:
                    expected_files.append(h['path'])
                    expected_spans[h['path']] = []
                if span not in expected_spans[h['path']]:
                    expected_spans[h['path']].append(span)
            assert prediction['traj_data']['pred_files'] == expected_files, f'{pair}:files'
            assert prediction['traj_data']['pred_spans'] == expected_spans, f'{pair}:spans'
        score_path = Path(binding['prediction']).with_name('native-score.json')
        assert sha(score_path) == row['score_sha256'], f'{pair}:native score hash'
        for prefix, path in (('', score_path), ('base_', Path(binding['are_score'])),
                             ('dsh_', Path(binding['dsh_score']))):
            native = read(path)['native']['final']
            for metric in ('span', 'file'):
                assert abs(f1(native[metric]) - row[prefix + metric + '_f1']) < 1e-12, f'{pair}:{prefix}{metric}'
    assert counts == EXPECTED_PAIRS, f'cohort counts: {counts}'
    return {'status': 'passed', 'pairs': counts, 'seal_sha256': sha(seal_path),
            'result_sha256': sha(result_path), 'posture': 'exposed-development-only'}


if __name__ == '__main__':
    print(json.dumps(audit(), sort_keys=True))
