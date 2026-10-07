#!/usr/bin/env python3
"""Independently audit archived exposed two-arm G02 API transfer evidence."""

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-r6-api-transfer-exposed-20261001')
FREEZE_SHA = '5508f4a81e01ea0405d9be42fd8f6df33f9b372843c5c84fdd3cd3ee0b0ddadf'
SEAL_SHA = '9494e8f1acdedd3be56e8c6aa52a150706f87208a28efdbfc095dad47996f69f'
RESULT_SHA = '16e524f00c7ab5c76aa5fe1519f311727a157b834d9af9f7b9767955b8e30655'
TASK_SHA = '4cf8b98745e0b7d2f092a478ac3a29849bc0ea68b409ca2d8b1dabc843f88173'
RANKERS = {'baseline': '70ce7350ff6029bac290fe5f542ab6a2fef9a37a999f858451441f3a6139a9ce',
           'api_contract': 'c5ed4b1ddbf29fff95a80db129da11727d711a2306ac42d1602a6190e3c5a582'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(value, code):
    if not value:
        raise ValueError('g02-r6-api-transfer-audit.' + code)


def f1(measure):
    c, p = measure['coverage'], measure['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def main():
    freeze_path = ARCHIVE / 'freeze/FREEZE.json'
    seal_path = ARCHIVE / 'freeze/PRE-SCORE-SEAL.json'
    result_path = ARCHIVE / 'freeze/RESULT.json'
    need([sha(p) for p in (freeze_path, seal_path, result_path)] ==
         [FREEZE_SHA, SEAL_SHA, RESULT_SHA], 'top-level-digests')
    frozen, seal, result = map(read, (freeze_path, seal_path, result_path))
    need(frozen['status'] == 'frozen-before-model-dispatch' and
         seal['score_unopened'] and seal['freeze_sha256'] == FREEZE_SHA and
         result['freeze_sha256'] == FREEZE_SHA and result['pre_score_seal_sha256'] == SEAL_SHA and
         result['score_script_sha256'] == sha(ARCHIVE / 'scripts/score-g02-r6-api-transfer-exposed-r2.py'),
         'freeze-seal-result-binding')
    metrics = {}
    source_hashes = {}
    for arm in ('baseline', 'api_contract'):
        root = ARCHIVE / ('baseline' if arm == 'baseline' else 'candidate')
        tools = ARCHIVE / ('baseline-tools' if arm == 'baseline' else 'candidate-tools')
        prepared = read(root / 'FREEZE.json')
        binding = read(root / 'tasks/binding.json')
        task = root / 'tasks' / binding['task_file']
        row = seal['arms'][arm]
        scored = result['arms'][arm]
        run = read(root / 'evidence/RESULTS.json')
        settlement = read(root / 'ARE-SETTLEMENT.json')
        raw = read(root / 'evidence/run/prediction.json')
        projected = read(root / 'policy-pruning/prediction.json')
        policy = read(root / 'policy-pruning/POLICY-SEAL.json')
        native_path = root / 'policy-pruning/native-score.json'
        final = read(native_path)['native']['final']
        need(sha(task) == TASK_SHA and binding['task_sha256'] == TASK_SHA and
             prepared['instance_id'] == binding['instance_id'] == raw['instance_id'] and
             binding['base_commit'] == raw['commit'] and
             prepared['source_hashes']['code/ranked-source-acquisition.mjs'] == RANKERS[arm] and
             sha(root / 'code/ranked-source-acquisition.mjs') == RANKERS[arm] and
             sha(root / 'FREEZE.json') == frozen['input_sha256'][frozen['arm_roots'][arm] + '/FREEZE.json'] and
             sha(root / 'tasks/binding.json') == frozen['input_sha256'][frozen['arm_roots'][arm] + '/tasks/binding.json'],
             'source-or-task-binding:' + arm)
        need(run['status'] == 'final_context_selected' and
             run['unknown_usage_dispatched_requests'] == 0 and
             settlement['status'] == 'completed' and
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
        need(sha(tools / 'product-replication-gitconfig') ==
             '02fe83e9ab0afa033ab5a0f127d26eaa155355d4466fac7605b567f9c1aac9f4',
             'symmetric-git-config:' + arm)
        source_hashes[arm] = prepared['source_hashes']
        metrics[arm] = {k: scored[k] for k in ('file_f1', 'span_f1', 'known_model_tokens',
                                               'model_calls', 'duration_seconds')}
    common = set(source_hashes['baseline']) | set(source_hashes['api_contract'])
    need(all(source_hashes['baseline'].get(key) == source_hashes['api_contract'].get(key)
             for key in common if key not in
             ('code/ranked-source-acquisition.mjs', 'tasks/binding.json')),
         'non-ranker-source-difference')
    a, b = metrics['api_contract'], metrics['baseline']
    need(abs((a['file_f1'] - b['file_f1']) - result['candidate_minus_baseline']['file_f1']) < 1e-12 and
         abs((a['span_f1'] - b['span_f1']) - result['candidate_minus_baseline']['span_f1']) < 1e-12 and
         abs(a['known_model_tokens'] / b['known_model_tokens'] -
             result['candidate_over_baseline']['known_model_tokens']) < 1e-12 and
         abs(a['duration_seconds'] / b['duration_seconds'] -
             result['candidate_over_baseline']['duration_seconds']) < 1e-12,
         'aggregate-recomputation')
    failed = read(ARCHIVE / 'failed-zero-call/evidence/RESULTS.json')
    need(failed['status'] == 'orchestration_error' and failed['model_calls'] == 0 and
         failed['known_total_tokens'] == 0, 'failed-attempt-lineage')
    payload = {
        'schema_version': 'are.g02-r6-api-transfer-exposed-audit/v1',
        'status': 'passed-exposed-only',
        'freeze_sha256': FREEZE_SHA, 'pre_score_seal_sha256': SEAL_SHA,
        'result_sha256': RESULT_SHA,
        'metrics': metrics,
        'candidate_minus_baseline': result['candidate_minus_baseline'],
        'candidate_over_baseline': result['candidate_over_baseline'],
        'source_delta': 'ranker instruction only; Git trust repair symmetric',
        'claim_ceiling': 'One exposed task; no independent population, matched DSH, interval, or superiority.',
        'open_questions': ['Why did span precision fall despite higher File-F1?',
                           'Can a selective API-consumer acquisition rule transfer without token regression?'],
    }
    output = ARCHIVE / 'AUDIT.json'
    if output.exists():
        raise ValueError('g02-r6-api-transfer-audit.output-exists')
    output.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output),
                      'candidate_minus_baseline': payload['candidate_minus_baseline']}))


if __name__ == '__main__':
    main()
