#!/usr/bin/env python3
"""Evaluator-only G02 direct-selection action errors; exports no gold paths."""

import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SCORE = BASE / 'g02-direct-selection-score-r1'
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
OUTPUT = BASE / 'g02-direct-selection-error-anatomy-r1/RESULT.json'
RESULT_SHA = '6bb34e9a773d530b18a5c1c6ee36a9faf4f0e53db43af5b4054618b55da8006d'
PRESEAL_SHA = '70c7f96f2ab25b43d39d980cb35c1064d226791aa35fb65a7e3fee6bbeb733b2'
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
FIELDS = ('added_gold', 'added_false', 'dropped_gold', 'dropped_false',
          'retained_gold', 'retained_false', 'original_gold', 'original_false',
          'candidate_gold', 'candidate_false')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-direct-selection-error-anatomy-r1.{reason}')


def main():
    need(sha(SCORE / 'RESULT.json') == RESULT_SHA and
         sha(SCORE / 'PRE-SCORE-SEAL.json') == PRESEAL_SHA and
         sha(PACKETS / 'SEAL.json') == PACKET_SEAL_SHA and
         sha(UPSTREAM / 'data/full.parquet') == PARQUET_SHA, 'frozen-input-drift')
    result, seal = read(SCORE / 'RESULT.json'), read(SCORE / 'PRE-SCORE-SEAL.json')
    need(len(result['rows']) == len(seal['rows']) == 32 and
         result['preseal_sha256'] == PRESEAL_SHA, 'pair-count-or-seal')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    grouped = defaultdict(list)
    for row, bound in zip(result['rows'], seal['rows']):
        need(row['pair'] == bound['pair'] and row['cohort'] == bound['cohort'], 'row-order')
        for name in ('packet', 'response', 'source_prediction', 'prediction', 'are_score'):
            need(sha(bound[name]) == bound[name + '_sha256'], f'input-hash:{name}')
        packet, response = read(bound['packet']), read(bound['response'])
        original, candidate = read(bound['source_prediction']), read(bound['prediction'])
        need(original['instance_id'] == candidate['instance_id'] and
             packet['prediction_sha256'] == bound['source_prediction_sha256'], 'identity')
        gold = set(loader.get(original['instance_id']).files())
        before, after = set(original['traj_data']['pred_files']), set(candidate['traj_data']['pred_files'])
        native = read(bound['are_score'])['native']['final']['file']
        need(native['gold_size'] == len(gold) and native['pred_size'] == len(before) and
             native['intersection'] == len(gold & before), 'native-gold-binding')
        if response['status'] == 'invalid':
            need(before == after, 'invalid-not-preserved')
        added, dropped, retained = after - before, before - after, after & before
        shape = ('adddrop' if added and dropped else 'add' if added else
                 'drop' if dropped else 'unchanged')
        counts = {'added_gold': len(added & gold), 'added_false': len(added - gold),
                  'dropped_gold': len(dropped & gold), 'dropped_false': len(dropped - gold),
                  'retained_gold': len(retained & gold), 'retained_false': len(retained - gold),
                  'original_gold': len(before & gold), 'original_false': len(before - gold),
                  'candidate_gold': len(after & gold), 'candidate_false': len(after - gold)}
        need(all(counts[k] >= 0 for k in FIELDS), 'negative-count')
        for key in (f"cohort:{row['cohort']}", f"cohort-shape:{row['cohort']}:{shape}",
                    f"repository:{row['cohort']}:{row['repo']}"):
            grouped[key].append({'counts': counts, 'file_delta': row['file_f1'] - row['base_file_f1'],
                                 'span_delta': row['span_f1'] - row['base_span_f1'],
                                 'status': response['status']})
    summaries = {}
    for key, members in sorted(grouped.items()):
        n = len(members)
        summaries[key] = {'pairs': n,
                          **{field: sum(m['counts'][field] for m in members) for field in FIELDS},
                          'mean_file_f1_change': sum(m['file_delta'] for m in members) / n,
                          'mean_span_f1_change': sum(m['span_delta'] for m in members) / n,
                          'file_wins': sum(m['file_delta'] > 1e-12 for m in members),
                          'file_losses': sum(m['file_delta'] < -1e-12 for m in members),
                          'invalid': sum(m['status'] == 'invalid' for m in members)}
    need(summaries['cohort:r2']['pairs'] == 23 and summaries['cohort:r3']['pairs'] == 9,
         'denominators')
    payload = {'schema_version': 'are.g02-direct-selection-error-anatomy/v1',
               'posture': 'evaluator-only-exposed-diagnostic-no-model-or-prediction-mutation',
               'result_sha256': RESULT_SHA, 'preseal_sha256': PRESEAL_SHA,
               'packet_seal_sha256': PACKET_SEAL_SHA, 'gold_parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'summaries': summaries,
               'claim_ceiling': 'Post-score evaluator-only diagnosis; not a selector or superiority result.',
               'open_questions': ['Which source-only causal evidence distinguishes safe drops from lost gold?',
                                  'How can acquisition recover gold files absent from delivered reads?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'audited', 'pairs': 32, 'sha256': sha(OUTPUT),
                      'cohorts': {k: v for k, v in summaries.items() if k.startswith('cohort:')}}))


if __name__ == '__main__':
    main()
