#!/usr/bin/env python3
"""Independently audit archived r7 requirement-preservation development arms."""

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-r7-requirement-exposed-20261001')
FREEZE_SHA = '00574c2cc35758791e9329c6870baf7ab86f229a70bb9c04be4a8c6351a7aad1'
SEAL_SHA = 'c0a5c865fb706b8a65ba174e8f2c5329682be88a178d961cc5785b2ba64f9356'
RESULT_SHA = '3e7acf01128dcfd79d747580a1f5fb179d7aa402f2d67c3d50eb8c94471e3804'
TASK_SHA = '8bcc7cb877b092c4aeb091d7a3ff8fb371cb12855a7d08336f8043e497e0578b'
RANKERS = {'baseline': '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce',
           'requirement': '0fe0296cb566c08b72855a37b99f7d9d54a8c73fe97aab5870c9c251ce513dce'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(value, code):
    if not value:
        raise ValueError('g02-r7-requirement-audit.' + code)


def f1(measure):
    c, p = measure['coverage'], measure['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    paths = [ARCHIVE / 'freeze' / name for name in ('FREEZE.json', 'PRE-SCORE-SEAL.json', 'RESULT.json')]
    need([sha(p) for p in paths] == [FREEZE_SHA, SEAL_SHA, RESULT_SHA], 'top-level-digests')
    frozen, seal, result = map(read, paths)
    need(frozen['status'] == 'frozen-before-model-dispatch' and seal['score_unopened'] and
         seal['freeze_sha256'] == FREEZE_SHA and result['freeze_sha256'] == FREEZE_SHA and
         result['pre_score_seal_sha256'] == SEAL_SHA and
         result['score_script_sha256'] == sha(ARCHIVE / 'scripts/score-g02-r7-requirement-exposed-r1.py'),
         'freeze-seal-result-binding')
    metrics, source_hashes = {}, {}
    for arm in ('baseline', 'requirement'):
        root = ARCHIVE / arm
        prepared = read(root / 'FREEZE.json')
        binding = read(root / 'tasks/binding.json')
        row, scored = seal['arms'][arm], result['arms'][arm]
        run = read(root / 'evidence/RESULTS.json')
        settlement = read(root / 'ARE-SETTLEMENT.json')
        raw = read(root / 'evidence/run/prediction.json')
        projected = read(root / 'policy-pruning/prediction.json')
        policy = read(root / 'policy-pruning/POLICY-SEAL.json')
        native_path = root / 'policy-pruning/native-score.json'
        final = read(native_path)['native']['final']
        need(sha(root / 'tasks' / binding['task_file']) == TASK_SHA and
             binding['task_sha256'] == TASK_SHA and
             binding['instance_id'] == prepared['instance_id'] == raw['instance_id'] ==
             'SWE-Bench-Pro__python__maintenance__bugfix__d131db7a' and
             binding['base_commit'] == raw['commit'] ==
             '59ca05b70994b07a9507f61a0871146a4991b262' and
             prepared['source_hashes']['code/ranked-source-acquisition.mjs'] == RANKERS[arm] and
             sha(root / 'code/ranked-source-acquisition.mjs') == RANKERS[arm] and
             sha(root / 'FREEZE.json') == frozen['input_sha256'][frozen['arm_roots'][arm] + '/FREEZE.json'] and
             sha(root / 'tasks/binding.json') == frozen['input_sha256'][frozen['arm_roots'][arm] + '/tasks/binding.json'],
             'source-or-task-binding:' + arm)
        need(run['status'] == 'final_context_selected' and
             run['unknown_usage_dispatched_requests'] == 0 and settlement['status'] == 'completed' and
             sha(root / 'evidence/RESULTS.json') == row['result_sha256'] and
             sha(root / 'evidence/run/prediction.json') == row['prediction_sha256'] and
             sha(root / 'ARE-SETTLEMENT.json') == row['settlement_sha256'] and
             run['known_total_tokens'] == row['known_model_tokens'] == scored['known_model_tokens'] and
             run['model_calls'] == row['model_calls'] == scored['model_calls'] and
             settlement['elapsed_seconds'] == row['duration_seconds'] == scored['duration_seconds'],
             'run-or-cost-binding:' + arm)
        need(raw['traj_data']['pred_files'] == row['selected_files'] and
             set(projected['traj_data']['pred_files']) <= set(row['selected_files']) and
             projected['traj_data']['pred_files'] == scored['selected_files'] and
             policy['source_prediction_sha256'] == row['prediction_sha256'] and
             policy['prediction_sha256'] == sha(root / 'policy-pruning/prediction.json') and
             sha(root / 'policy-pruning/POLICY-SEAL.json') == scored['policy_seal_sha256'] and
             sha(native_path) == scored['score_sha256'] and
             abs(f1(final['file']) - scored['file_f1']) < 1e-12 and
             abs(f1(final['span']) - scored['span_f1']) < 1e-12,
             'policy-or-score-binding:' + arm)
        source_hashes[arm] = prepared['source_hashes']
        metrics[arm] = {k: scored[k] for k in ('file_f1', 'span_f1', 'known_model_tokens',
                                               'model_calls', 'duration_seconds')}
    keys = set(source_hashes['baseline']) | set(source_hashes['requirement'])
    need(all(source_hashes['baseline'].get(k) == source_hashes['requirement'].get(k)
             for k in keys if k not in ('code/ranked-source-acquisition.mjs', 'tasks/binding.json')),
         'non-ranker-source-difference')
    a, b = metrics['requirement'], metrics['baseline']
    need(abs(a['file_f1'] - b['file_f1'] - result['candidate_minus_baseline']['file_f1']) < 1e-12 and
         abs(a['span_f1'] - b['span_f1'] - result['candidate_minus_baseline']['span_f1']) < 1e-12 and
         abs(a['known_model_tokens'] / b['known_model_tokens'] -
             result['candidate_over_baseline']['known_model_tokens']) < 1e-12 and
         abs(a['duration_seconds'] / b['duration_seconds'] -
             result['candidate_over_baseline']['duration_seconds']) < 1e-12,
         'aggregate-recomputation')
    payload = {
        'schema_version': 'are.g02-r7-requirement-exposed-audit/v1',
        'status': 'passed-exposed-only',
        'freeze_sha256': FREEZE_SHA, 'pre_score_seal_sha256': SEAL_SHA,
        'result_sha256': RESULT_SHA, 'metrics': metrics,
        'candidate_minus_baseline': result['candidate_minus_baseline'],
        'candidate_over_baseline': result['candidate_over_baseline'],
        'claim_ceiling': 'One exposed ARE-only task; no matched DSH, interval or superiority.',
        'open_questions': ['Why do both API-oriented prompts gain File-F1 but lose Span-F1?',
                           'Which source-grounded span mechanism can improve both?'],
    }
    output = ARCHIVE / 'AUDIT.json'
    if output.exists():
        raise ValueError('g02-r7-requirement-audit.output-exists')
    output.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output),
                      'candidate_minus_baseline': payload['candidate_minus_baseline']}))


if __name__ == '__main__':
    main()
