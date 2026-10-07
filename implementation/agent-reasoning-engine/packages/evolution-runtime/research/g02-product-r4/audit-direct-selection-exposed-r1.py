#!/usr/bin/env python3
"""Independent hash, transformation, and metric audit of exposed G02 selection."""

import hashlib
import json
from collections import defaultdict
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
RUN = BASE / 'g02-direct-selection-exposed-r1'
SCORE = BASE / 'g02-direct-selection-score-r1'


def need(value, reason):
    if not value:
        raise ValueError(f'g02-direct-selection-audit-r1.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def f1(metric):
    c, p = metric['coverage'], metric['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    seal, result = read(SCORE / 'PRE-SCORE-SEAL.json'), read(SCORE / 'RESULT.json')
    freeze = read(RUN / 'FREEZE.json')
    need(sha(SCORE / 'PRE-SCORE-SEAL.json') == result['preseal_sha256'] and
         sha(RUN / 'FREEZE.json') == seal['freeze_sha256'] and
         sha(RUN / 'RUN-RESULT.json') == seal['run_result_sha256'] and
         len(seal['rows']) == len(result['rows']) == 32, 'seals')
    need([(r['cohort'], r['pair']) for r in seal['rows']] ==
         [(r['cohort'], r['pair']) for r in result['rows']] ==
         [(r['cohort'], r['pair']) for r in freeze['ordered_pairs']], 'order')
    counts = defaultdict(int)
    for bound, metric in zip(seal['rows'], result['rows']):
        for name in ('packet', 'response', 'started', 'source_prediction', 'are_score',
                     'dsh_score', 'prediction'):
            need(sha(bound[name]) == bound[name + '_sha256'], f'hash:{bound["pair"]}:{name}')
        response, started, packet = (read(bound['response']), read(bound['started']),
                                     read(bound['packet']))
        original, prediction = read(bound['source_prediction']), read(bound['prediction'])
        need((response['cohort'], response['pair'], response['packet_sha256']) ==
             (bound['cohort'], bound['pair'], sha(bound['packet'])) and
             started['request_sha256'] == response['request_sha256'], 'attempt')
        need(sha(bound['source_prediction']) == packet['prediction_sha256'] and
             prediction['traj_data']['pred_steps'] == original['traj_data']['pred_steps'],
             'source-or-steps')
        if response['status'] == 'invalid':
            need(response['selection'] is None and prediction == original and
                 bound['posture'] == 'invalid-preserved', 'invalid-preservation')
        else:
            raw = json.loads(response['content'])
            need(set(raw) == {'decision', 'read_indexes'} and
                 response['http_status'] == 200 and response['finish_reason'] == 'stop' and
                 response['selection']['read_indexes'] == raw['read_indexes'], 'valid-output')
            handles = {h['index']: h for h in packet['delivered_reads']}
            need(len(handles) == len(packet['delivered_reads']), 'duplicate-handles')
            if raw['decision'] == 'abstain' or not response['selection']['changed']:
                need(prediction == original and bound['posture'] == 'valid-unchanged',
                     'unchanged-preservation')
            else:
                indexes = raw['read_indexes']
                paths = [handles[i]['path'] for i in indexes]
                need(len(paths) == len(set(paths)) and len(paths) <= 12 and
                     bool(set(paths) & set(original['traj_data']['pred_files'])) and
                     prediction['traj_data']['pred_files'] == paths and
                     set(prediction['traj_data']['pred_spans']) == set(paths) and
                     bound['posture'] == 'valid-transformed', 'selection')
                for index in indexes:
                    handle = handles[index]
                    path = handle['path']
                    expected = (original['traj_data']['pred_spans'][path]
                                if path in original['traj_data']['pred_files'] else
                                [{'start': handle['start'], 'end': handle['end']}])
                    need(prediction['traj_data']['pred_spans'][path] == expected,
                         f'span:{bound["pair"]}')
        score_path = Path(bound['prediction']).with_name('native-score.json')
        need(sha(score_path) == metric['score_sha256'], 'native-score-hash')
        new = read(score_path)['native']['final']
        are = read(bound['are_score'])['native']['final']
        dsh = read(bound['dsh_score'])['native']['final']
        for value, score in ((metric['file_f1'], new['file']),
                             (metric['base_file_f1'], are['file']),
                             (metric['dsh_file_f1'], dsh['file']),
                             (metric['span_f1'], new['span']),
                             (metric['base_span_f1'], are['span']),
                             (metric['dsh_span_f1'], dsh['span'])):
            need(abs(value - f1(score)) < 1e-12, 'metric')
        counts[bound['cohort']] += 1
    need(dict(counts) == {'r3': 9, 'r2': 23}, 'denominators')
    for cohort, group in result['summary'].items():
        rows = [r for r in result['rows'] if r['cohort'] == cohort]
        need(len(rows) == group['pairs'], 'group-pairs')
        for key, field in (('mean_file_f1', 'file_f1'),
                           ('mean_base_file_f1', 'base_file_f1'),
                           ('mean_dsh_file_f1', 'dsh_file_f1')):
            need(abs(group[key] - sum(r[field] for r in rows) / len(rows)) < 1e-12,
                 f'group:{key}')
        need(abs(group['mean_file_f1_gain'] -
                 sum(r['file_f1'] - r['base_file_f1'] for r in rows) / len(rows)) < 1e-12,
             'group-gain')
    print(json.dumps({'status': 'passed', 'pairs': 32, 'cohorts': counts,
                      'result_sha256': sha(SCORE / 'RESULT.json')}))


if __name__ == '__main__':
    main()
