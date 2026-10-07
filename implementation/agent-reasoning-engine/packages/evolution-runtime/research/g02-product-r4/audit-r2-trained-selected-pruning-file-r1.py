#!/usr/bin/env python3
"""Evaluator-only file-F1 screen of sealed r2-trained G02 pruning predictions."""

import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SEAL = BASE / 'g02-r2-trained-selected-pruning-r1/SEAL.json'
OUTPUT = BASE / 'g02-r2-trained-selected-pruning-file-audit-r1/RESULT.json'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
SEAL_SHA = '4fd240425fdba4f216a378e6ca6c27d48627484e07261095cbaffe348f267ddc'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-r2-trained-selected-pruning-file-r1.{reason}')


def f1(selected, gold):
    return 2 * len(selected & gold) / (len(selected) + len(gold)) if selected or gold else 1.0


def main():
    need(sha(SEAL) == SEAL_SHA and sha(UPSTREAM / 'data/full.parquet') == PARQUET_SHA,
         'frozen-input-drift')
    seal = read(SEAL)
    need(len(seal['rows']) == 32 and seal['policy'] == {
        'drop_selected_below_probability': 0.5,
        'minimum_original_selected_files_retained': 1,
        'new_file_additions': 0,
        'spans': 'unchanged-for-retained-files'}, 'policy')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    grouped = defaultdict(list)
    for row in seal['rows']:
        need(sha(row['source_prediction']) == row['source_prediction_sha256'] and
             sha(row['prediction']) == row['prediction_sha256'] and
             sha(row['packet']) == row['packet_sha256'], 'binding')
        source, candidate = read(row['source_prediction']), read(row['prediction'])
        need(source['instance_id'] == candidate['instance_id'] and
             source['traj_data']['pred_steps'] == candidate['traj_data']['pred_steps'],
             'instance-or-steps')
        before, after = set(source['traj_data']['pred_files']), set(candidate['traj_data']['pred_files'])
        need(bool(after) and after <= before and len(before - after) == row['dropped_files'] and
             all(source['traj_data']['pred_spans'][path] == candidate['traj_data']['pred_spans'][path]
                 for path in after), 'not-pruning-only')
        gold = set(loader.get(source['instance_id']).files())
        old_native = read(row['are_score'])['native']['final']['file']
        need(old_native['gold_size'] == len(gold) and old_native['pred_size'] == len(before) and
             old_native['intersection'] == len(before & gold), 'native-binding')
        result = {'original_f1': f1(before, gold), 'candidate_f1': f1(after, gold),
                  'dropped_gold': len((before - after) & gold),
                  'dropped_false': len((before - after) - gold)}
        for key in (f"cohort:{row['cohort']}", f"repository:{row['cohort']}:{row['repo']}"):
            grouped[key].append(result)
    summaries = {}
    for key, members in sorted(grouped.items()):
        n = len(members)
        summaries[key] = {'pairs': n,
                          'mean_original_file_f1': sum(m['original_f1'] for m in members) / n,
                          'mean_candidate_file_f1': sum(m['candidate_f1'] for m in members) / n,
                          'mean_file_f1_change': sum(m['candidate_f1'] - m['original_f1'] for m in members) / n,
                          'dropped_gold': sum(m['dropped_gold'] for m in members),
                          'dropped_false': sum(m['dropped_false'] for m in members),
                          'wins': sum(m['candidate_f1'] > m['original_f1'] for m in members),
                          'losses': sum(m['candidate_f1'] < m['original_f1'] for m in members)}
    need(summaries['cohort:r2']['pairs'] == 23 and summaries['cohort:r3']['pairs'] == 9,
         'denominators')
    payload = {'schema_version': 'are.g02-r2-trained-selected-pruning-file-audit/v1',
               'posture': 'evaluator-only-exposed-development-no-model-or-prediction-mutation',
               'prediction_seal_sha256': SEAL_SHA, 'gold_parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'summaries': summaries,
               'native_scoring_screen': 'Advance to native Span-F1 only if mean File-F1 rises in both r2 and r3 and no repository mean falls.',
               'claim_ceiling': 'Evaluator-only File-F1 screen; not native Span-F1, fresh holdout or superiority.',
               'open_questions': ['Does this fixed deletion policy clear the stated quality screen?',
                                  'Would a successful screen preserve native Span-F1 and efficiency?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'cohorts': {k: v for k, v in summaries.items() if k.startswith('cohort:')},
                      'screen_pass': all(summaries[f'cohort:{c}']['mean_file_f1_change'] > 0 for c in ('r2', 'r3'))
                      and all(v['mean_file_f1_change'] >= 0 for k, v in summaries.items()
                              if k.startswith('repository:'))}))


if __name__ == '__main__':
    main()
