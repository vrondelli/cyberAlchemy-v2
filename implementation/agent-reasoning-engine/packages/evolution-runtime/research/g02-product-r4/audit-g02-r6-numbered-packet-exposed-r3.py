#!/usr/bin/env python3
"""Independently recompute sealed G02 packet result bindings and metrics."""

import hashlib
import json
from pathlib import Path


ROOT = Path('/opt/are/evolution-runtime/g02-r6-numbered-packet-exposed-r3')
BASE = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-base-01')
CANDIDATE = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-03')
FAILED = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr6-packet-candidate-02')
FREEZE_SHA = 'cedcee6cfbea8fa060d154c3564a6300c5be38a0bd03e52a775eb2addda0e33f'
SEAL_SHA = '57ea0348e7d30813c525d5a6543bda4dce9d8799d3198c983d10d8e569d4edfb'
RESULT_SHA = '4dad3621fc3146a7612dbe8c62b190411b8cefcdeaa29b5507a434de13d9d8e5'
LEAD = 'lib/ansible/cli/arguments/option_helpers.py'
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__18d7bbbc'
COMMIT = 'e094d48b1bdd93cbc189f416543e810c19b2e561'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def need(value, reason):
    if not value:
        raise ValueError('numbered-packet-audit.' + reason)


def f1(measure):
    coverage, precision = measure['coverage'], measure['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    output = ROOT / 'INDEPENDENT-AUDIT.json'
    need(not output.exists(), 'already-audited')
    for name, expected in [('FREEZE.json', FREEZE_SHA), ('PRE-SCORE-SEAL.json', SEAL_SHA),
                           ('RESULT.json', RESULT_SHA)]:
        need(sha(ROOT / name) == expected, 'result-binding:' + name)
    frozen, sealed, result = (read(ROOT / name) for name in ('FREEZE.json', 'PRE-SCORE-SEAL.json', 'RESULT.json'))
    need(sealed['freeze_sha256'] == FREEZE_SHA and result['pre_score_seal_sha256'] == SEAL_SHA,
         'chain-drift')
    failed_settlement = read(FAILED / 'ARE-SETTLEMENT.json')
    need(failed_settlement['exit_code'] == 125 and not (FAILED / 'evidence/RESULTS.json').exists(),
         'zero-call-lineage')
    roots = {'baseline': BASE, 'numbered_packet': CANDIDATE}
    measured = {}
    for arm, root in roots.items():
        need(str(root) == sealed['arms'][arm]['root'], 'root-drift:' + arm)
        for name, relative in [('result', 'evidence/RESULTS.json'),
                               ('prediction', 'evidence/run/prediction.json'),
                               ('settlement', 'ARE-SETTLEMENT.json'),
                               ('events', 'evidence/run/events.jsonl'),
                               ('export', 'evidence/run/export-evidence.json')]:
            need(sha(root / relative) == sealed['arms'][arm]['sha256'][name], 'raw-drift:' + arm + ':' + name)
        original = read(root / 'evidence/run/prediction.json')
        projected = read(root / 'policy-pruning/prediction.json')
        policy = read(root / 'policy-pruning/POLICY-SEAL.json')
        native = read(root / 'policy-pruning/native-score.json')['native']['final']
        reported = result['arms'][arm]
        need(original['instance_id'] == TASK_ID and original['commit'] == COMMIT and
             read(root / 'tasks/binding.json')['instance_id'] == TASK_ID,
             'task-drift:' + arm)
        need(policy['source_prediction_sha256'] == sealed['arms'][arm]['sha256']['prediction'] and
             policy['prediction_sha256'] == sha(root / 'policy-pruning/prediction.json') and
             sha(root / 'policy-pruning/POLICY-SEAL.json') == reported['policy_seal_sha256'] and
             sha(root / 'policy-pruning/native-score.json') == reported['score_sha256'],
             'policy-score-drift:' + arm)
        need(set(projected['traj_data']['pred_files']) <= set(original['traj_data']['pred_files']) and
             projected['traj_data']['pred_files'] == reported['selected_files'], 'projection-drift:' + arm)
        metrics = {'file_f1': f1(native['file']), 'span_f1': f1(native['span']),
                   'known_model_tokens': read(root / 'evidence/RESULTS.json')['known_total_tokens'],
                   'duration_seconds': read(root / 'ARE-SETTLEMENT.json')['elapsed_seconds']}
        for name, value in metrics.items():
            need(abs(value - reported[name]) < 1e-12, 'metric-drift:' + arm + ':' + name)
        measured[arm] = metrics
    candidate, baseline = measured['numbered_packet'], measured['baseline']
    for name in ('file_f1', 'span_f1'):
        need(abs(candidate[name] - baseline[name] - result['candidate_minus_baseline'][name]) < 1e-12,
             'difference-drift:' + name)
    for name in ('known_model_tokens', 'duration_seconds'):
        need(abs(candidate[name] / baseline[name] - result['candidate_over_baseline'][name]) < 1e-12,
             'ratio-drift:' + name)
    need(sealed['arms']['numbered_packet']['lead_confirmed'] and
         sealed['arms']['numbered_packet']['initial_paths'] == sealed['arms']['baseline']['initial_paths'] + [LEAD],
         'packet-drift')
    payload = {'schema_version': 'are.g02-r6-numbered-packet-independent-audit/v3',
               'status': 'passed-exposed-only', 'freeze_sha256': FREEZE_SHA,
               'seal_sha256': SEAL_SHA, 'result_sha256': RESULT_SHA,
               'script_sha256': sha(Path(__file__)), 'recomputed_arms': measured,
               'claim_ceiling': 'No prospective, DSH or product superiority.'}
    with output.open('x') as stream:
        json.dump(payload, stream, indent=2, sort_keys=True)
        stream.write('\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output)}))


if __name__ == '__main__':
    main()
