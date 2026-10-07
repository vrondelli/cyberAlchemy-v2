#!/usr/bin/env python3
"""Independent read-only audit of exposed G02 format recovery scoring."""

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r4-grounded-reviewer-recovery-r1'
ROOT = BASE / 'g02-r4-grounded-reviewer-recovery-score-r2'
SOURCE_SHA = '58ac2e212dc6ecb046bd395208c6c6d1656d316448ed13678a288313751a6fcc'
SEAL_SHA = 'c6b75e0b2808a3d36e44557aecce79aefeca61411e420de82a1d70d876ee5e4c'
RESULT_SHA = '8854bc13463306f9227683a5a7c797325b362d73617d9509853b0065fd9bd467'


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-format-audit-r2.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def f1(metric):
    c, p = metric['coverage'], metric['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def quote(value, source):
    return isinstance(value, str) and 8 <= len(value) <= 240 and '\n' not in value and value in source


def audit():
    need(sha(SOURCE / 'PRE-SCORE-SEAL.json') == SOURCE_SHA and
         sha(ROOT / 'SCORE-SEAL.json') == SEAL_SHA and
         sha(ROOT / 'RESULT.json') == RESULT_SHA, 'root-drift')
    prescore, seal, result = (read(p) for p in
                              (SOURCE / 'PRE-SCORE-SEAL.json', ROOT / 'SCORE-SEAL.json',
                               ROOT / 'RESULT.json'))
    need(result['seal_sha256'] == SEAL_SHA and
         seal['source_prescore_seal_sha256'] == SOURCE_SHA and
         len(prescore['rows']) == len(seal['rows']) == len(result['rows']) == 32 and
         prescore['recovered'] == seal['recovered'] == 5 and
         result['model_calls_added'] == 0, 'seal-shape')
    groups = defaultdict(list)
    recovered_rows = []
    for source, bound, row in zip(prescore['rows'], seal['rows'], result['rows']):
        identity = (source['cohort'], source['pair'], source['repo'])
        need(identity == (bound['cohort'], bound['pair'], bound['repo']) ==
             (row['cohort'], row['pair'], row['repo']) and
             source['recovered'] == bound['recovered'] == row['recovered'],
             'row-identity')
        for key in ('packet', 'response', 'source_prediction', 'old_prediction',
                    'prediction', 'old_score', 'are_score', 'dsh_score'):
            need(sha(source[key]) == source[key + '_sha256'], f'{identity}:{key}-drift')
        need(sha(row['score_path']) == row['score_sha256'], 'score-hash')
        packet, response = read(source['packet']), read(source['response'])
        original, prediction = read(source['source_prediction']), read(source['prediction'])
        if source['recovered']:
            need(response['status'] == 'invalid' and response['review'] is None and
                 row['score_path'].startswith(str(ROOT) + '/') and
                 prediction['traj_data']['pred_steps'] == original['traj_data']['pred_steps'],
                 'recovered-state')
            content = response['content']
            fence = re.fullmatch(r'```(?:json)?\s*\n([\s\S]*?)\n```\s*', content)
            raw = json.loads(fence.group(1) if fence else content)
            need(set(raw) == {'add', 'drop'} and len(raw['add']) <= 5 and
                 len(raw['drop']) <= 3 and source['fenced_json'] == bool(fence),
                 'recovered-json')
            handles = {h['index']: h for h in packet['delivered_reads']}
            need(len(handles) == len(packet['delivered_reads']), 'duplicate-handles')
            need(not raw['drop'], 'unexpected-drop')
            expected = json.loads(json.dumps(original))
            for add in raw['add']:
                need(set(add) == {'read_index', 'requirement_quote', 'evidence_quote', 'causal_role'} and
                     type(add['read_index']) is int and add['read_index'] in handles,
                     'add-shape')
                h = handles[add['read_index']]
                need(h['path'] not in packet['current_selected_files'] and
                     quote(add['requirement_quote'], packet['issue']) and
                     quote(add['evidence_quote'], h['snippet']) and
                     isinstance(add['causal_role'], str) and
                     12 <= len(add['causal_role'].strip()) <= len(add['causal_role']) <= 512,
                     'add-citation')
                files = expected['traj_data']['pred_files']
                spans = expected['traj_data']['pred_spans']
                if h['path'] not in files:
                    files.append(h['path'])
                    spans[h['path']] = []
                span = {'start': h['start'], 'end': h['end']}
                if span not in spans[h['path']]:
                    spans[h['path']].append(span)
            need(prediction == expected, 'recovered-prediction')
            recovered_rows.append(identity)
        else:
            need(response['status'] == 'valid' and
                 source['prediction_sha256'] == source['old_prediction_sha256'] and
                 row['score_path'] == source['old_score'], 'unchanged-reuse')
        score = read(row['score_path'])['native']['final']
        old = read(source['are_score'])['native']['final']
        dsh = read(source['dsh_score'])['native']['final']
        for prefix, metric in (('', score), ('base_', old), ('dsh_', dsh)):
            for kind in ('file', 'span'):
                need(abs(row[f'{prefix}{kind}_f1'] - f1(metric[kind])) < 1e-12,
                     'metric-recompute')
        groups[source['cohort']].append(row)
    need(len(recovered_rows) == 5 and len(groups['r2']) == 23 and len(groups['r3']) == 9,
         'cohort-denominator')
    for cohort, rows in groups.items():
        reported = result['summary'][cohort]
        need(reported['pairs'] == len(rows) and
             reported['recovered'] == sum(x['recovered'] for x in rows),
             'summary-count')
        for key in ('file_f1', 'base_file_f1', 'dsh_file_f1',
                    'span_f1', 'base_span_f1', 'dsh_span_f1'):
            need(abs(reported[f'mean_{key}'] - sum(x[key] for x in rows) / len(rows)) < 1e-12,
                 'summary-metric')
    return {'status': 'independent-exposed-recovery-audit-passed',
            'pairs': 32, 'recovered': len(recovered_rows),
            'recovered_rows': recovered_rows, 'summary': result['summary'],
            'claim_ceiling': 'Exposed post-hoc formatting recovery only; no superiority claim'}


if __name__ == '__main__':
    result = audit()
    path = ROOT / 'INDEPENDENT-AUDIT.json'
    with path.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': result['status'], 'audit_sha256': sha(path),
                      'pairs': result['pairs'], 'recovered': result['recovered']}))
