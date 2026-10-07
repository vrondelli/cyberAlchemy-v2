#!/usr/bin/env python3
"""Independent transformation, hash, and metric audit of G02 pruning scores."""

import hashlib
import json
from collections import defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r2-trained-selected-pruning-native-r1'
INPUT = BASE / 'g02-r2-trained-selected-pruning-r1/SEAL.json'
FILE_AUDIT = BASE / 'g02-r2-trained-selected-pruning-file-audit-r1/RESULT.json'
PRESEAL_SHA = '835de038a95217af993b183a905d1b02fe41cee1a40626b5bd98d85f310eb74b'
INPUT_SHA = '4fd240425fdba4f216a378e6ca6c27d48627484e07261095cbaffe348f267ddc'
FILE_AUDIT_SHA = 'a57ffd798874349e0bfb3cc2cad9a86bf5210c8dc180ac280a772e54b746c6de'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-r2-trained-pruning-native-audit-r1.{reason}')


def f1(metric):
    c, p = metric['coverage'], metric['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    preseal_path, result_path = ROOT / 'PRE-SCORE-SEAL.json', ROOT / 'RESULT.json'
    need(sha(preseal_path) == PRESEAL_SHA and sha(INPUT) == INPUT_SHA and
         sha(FILE_AUDIT) == FILE_AUDIT_SHA, 'frozen-input-drift')
    preseal, result = read(preseal_path), read(result_path)
    need(result['preseal_sha256'] == PRESEAL_SHA and
         preseal['prediction_seal_sha256'] == INPUT_SHA and
         preseal['file_audit_sha256'] == FILE_AUDIT_SHA and
         len(preseal['rows']) == len(result['rows']) == 32, 'seals')
    groups = defaultdict(list)
    for bound, row in zip(preseal['rows'], result['rows']):
        need((bound['cohort'], bound['pair'], bound['repo']) ==
             (row['cohort'], row['pair'], row['repo']), 'row-order')
        for name in ('source_prediction', 'packet', 'prediction', 'are_score', 'dsh_score'):
            need(sha(bound[name]) == bound[name + '_sha256'], f'hash:{name}')
        source, candidate = read(bound['source_prediction']), read(bound['prediction'])
        before, after = set(source['traj_data']['pred_files']), set(candidate['traj_data']['pred_files'])
        need(source['instance_id'] == candidate['instance_id'] and after and after <= before and
             len(before - after) == bound['dropped_files'] == row['dropped_files'] and
             candidate['traj_data']['pred_steps'] == source['traj_data']['pred_steps'] and
             set(candidate['traj_data']['pred_spans']) == after and
             all(candidate['traj_data']['pred_spans'][p] == source['traj_data']['pred_spans'][p]
                 for p in after), 'prediction-transform')
        score_path = ROOT / f"{row['cohort']}-{row['pair']}" / 'native-score.json'
        need(sha(score_path) == row['score_sha256'] and
             preseal_path.stat().st_mtime_ns < score_path.stat().st_mtime_ns,
             'score-hash-or-time')
        new, old, dsh = (read(path)['native']['final'] for path in
                         (score_path, bound['are_score'], bound['dsh_score']))
        for key, metric in (('file_f1', new['file']),
                            ('base_file_f1', old['file']),
                            ('dsh_file_f1', dsh['file']),
                            ('span_f1', new['span']),
                            ('base_span_f1', old['span']),
                            ('dsh_span_f1', dsh['span'])):
            need(abs(row[key] - f1(metric)) < 1e-12, f'metric:{key}')
        need(new['file']['pred_size'] == len(after) and
             old['file']['pred_size'] == len(before) and
             new['file']['gold_size'] == old['file']['gold_size'] == dsh['file']['gold_size'],
             'native-file-size')
        groups[f"cohort:{row['cohort']}"].append(row)
        groups[f"repository:{row['cohort']}:{row['repo']}"].append(row)
    need(len(groups['cohort:r2']) == 23 and len(groups['cohort:r3']) == 9,
         'cohort-denominators')
    for key, members in groups.items():
        summary = result['summary'][key]
        need(summary['pairs'] == len(members) and
             summary['changed'] == sum(r['dropped_files'] > 0 for r in members),
             'summary-counts')
        for metric in ('file_f1', 'base_file_f1', 'dsh_file_f1',
                       'span_f1', 'base_span_f1', 'dsh_span_f1'):
            need(abs(summary[f'mean_{metric}'] -
                     sum(r[metric] for r in members) / len(members)) < 1e-12,
                 f'summary:{metric}')
        for metric in ('file_f1', 'span_f1'):
            need(abs(summary[f'mean_{metric}_gain'] -
                     sum(r[metric] - r[f'base_{metric}'] for r in members) /
                     len(members)) < 1e-12, f'gain:{metric}')
    print(json.dumps({'status': 'passed', 'pairs': 32, 'result_sha256': sha(result_path),
                      'preseal_sha256': PRESEAL_SHA}))


if __name__ == '__main__':
    main()
