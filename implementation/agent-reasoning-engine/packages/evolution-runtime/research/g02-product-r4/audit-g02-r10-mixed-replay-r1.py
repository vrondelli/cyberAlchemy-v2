#!/usr/bin/env python3
"""Audit a provider-free mixed-source replay of terminal G02 r9 pair 2."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


OLD = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr9-mixed-02')
NEW = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr10-mixed-replay-02')
OUTPUT = Path('/opt/are/evolution-runtime/g02-r10-mixed-replay-audit-r1/RESULT.json')
RAW_SHA = '25ff57a4af17125efd21904ef289d4e316e6c65a9fd133682346203e55b0540a'
PROJECTOR_SHA = '846dde045ec4c7bf533207d0a03f23f823eb1db39edaba0392d88d80c0030e5a'
PACKET_SHA = '08a3417a8dfaa3e28a0360bb361019cd67fbd72fceffa2a61eb95b6e988ccb5b'
POLICY_SHA = '906e5ae3dcd1f8fb66b9b3a15e56076f3a861b9d5efebadfbb05e963994f7bb1'
PRED_SHA = '0ce2549511636b00ffafa30a8c1b28c845d918d7d32b62af158c86cf4112f37c'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r10-mixed-replay-audit.' + reason)


def git(root, *args):
    source = root / 'sources/session/base'
    return subprocess.check_output(['git', '-c', f'safe.directory={source}',
                                    '-C', str(source), *args], text=True).strip()


def f1(metric):
    p, r = metric['precision'], metric['coverage']
    return 2 * p * r / (p + r) if p + r else 0.0


def main():
    need(not OUTPUT.exists() and OLD.is_dir() and NEW.is_dir(), 'roots-or-output')
    need(sha(OLD / 'PAIR-PRE-SCORE-SEAL.json') == RAW_SHA and
         sha(NEW / 'PAIR-PRE-SCORE-SEAL.json') == RAW_SHA and
         sha('/opt/are/evolution-runtime/g02-r10-projector-code-r1/project-g02-r10-mixed-pruning-r1.py') == PROJECTOR_SHA and
         sha('/opt/are/evolution-runtime/g02-r10-packet-code-r1/receipt-packet-mixed-source-r1.py') == PACKET_SHA and
         sha(NEW / 'policy-pruning/POLICY-SEAL.json') == POLICY_SHA and
         sha(NEW / 'policy-pruning/prediction.json') == PRED_SHA,
         'pinned-input-drift')
    raw = read(NEW / 'PAIR-PRE-SCORE-SEAL.json')
    policy = read(NEW / 'policy-pruning/POLICY-SEAL.json')
    need(raw['status'] == 'both-valid-predictions-and-costs-sealed-before-scoring' and
         policy['status'] == 'prediction-sealed-before-native-score' and
         policy['source_prediction_sha256'] == raw['predictions']['are']['sha256'] and
         policy['prediction_sha256'] == PRED_SHA and
         policy['packet_code_sha256'] == PACKET_SHA and
         policy['script_sha256'] == PROJECTOR_SHA,
         'seal-linkage')
    for relative in ('evidence/run/prediction.json', 'dsh-export/prediction.json',
                     'tasks/binding.json', 'FREEZE.json', 'PAIR-PRE-SCORE-SEAL.json'):
        need(sha(OLD / relative) == sha(NEW / relative), 'clone-input-drift:' + relative)
    need(sha(NEW / 'evidence/run/prediction.json') == raw['predictions']['are']['sha256'] and
         sha(NEW / 'dsh-export/prediction.json') == raw['predictions']['dsh']['sha256'],
         'raw-prediction-linkage')
    need(git(OLD, 'rev-parse', 'HEAD') == git(NEW, 'rev-parse', 'HEAD') and
         git(OLD, 'status', '--porcelain', '--untracked-files=no') == '' and
         git(NEW, 'status', '--porcelain', '--untracked-files=no') == '',
         'base-checkout-drift')
    rows = {}
    for arm, path in (('are', NEW / 'policy-pruning/native-score.json'),
                      ('dsh', NEW / 'dsh-export/native-score.json')):
        need(path.is_file() and
             (NEW / 'PAIR-PRE-SCORE-SEAL.json').stat().st_mtime_ns <
             (NEW / 'policy-pruning/POLICY-SEAL.json').stat().st_mtime_ns <
             path.stat().st_mtime_ns, 'score-order:' + arm)
        score = read(path)['native']['final']
        rows[arm] = {'file_f1': f1(score['file']), 'span_f1': f1(score['span']),
                     'known_model_tokens': raw['known_model_tokens'][arm],
                     'raw_arm_seconds': raw['arm_seconds'][arm],
                     'score_sha256': sha(path)}
    payload = {'schema_version': 'are.g02-r10-mixed-replay-audit/v1',
               'posture': 'evaluator-only-terminal-replay-on-clone-no-new-provider-calls',
               'r9_raw_seal_sha256': RAW_SHA,
               'r10_projector_sha256': PROJECTOR_SHA,
               'r10_packet_sha256': PACKET_SHA,
               'r10_policy_seal_sha256': POLICY_SHA,
               'r10_prediction_sha256': PRED_SHA,
               'script_sha256': sha(__file__),
               'instance_id': raw['instance_id'],
               'results': rows,
               'claim_ceiling': 'Exposed terminal replay only; not a matched r9 score, an r10 campaign, or a superiority claim.',
               'open_questions': ['Will a separately frozen mixed-source successor remain valid across all 24 pairs?',
                                  'Can ARE improve both quality metrics and all-in efficiency against selection-only DSH?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT), 'results': rows}))


if __name__ == '__main__':
    main()
