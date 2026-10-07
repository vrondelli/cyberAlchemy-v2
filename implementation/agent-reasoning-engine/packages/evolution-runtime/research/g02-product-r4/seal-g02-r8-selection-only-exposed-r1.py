#!/usr/bin/env python3
"""Seal one exposed DSH-only selection before native scoring."""

import hashlib
import json
from pathlib import Path


ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-selectonly-dev-01')
FREEZE = Path('/opt/are/evolution-runtime/g02-r8-selection-only-exposed-r1/FREEZE.json')
FREEZE_SHA = '8cea32ba0c1851c3d2d77067c665ad185fe06128af1a4c95b0d6f7f014266c6e'
PREPARED_SHA = 'bf1d80a338a942dda460069de16d9a3524da2033f975b40477d2593e664d79f3'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    out = ROOT / 'EXPOSED-PRE-SCORE-SEAL.json'
    if out.exists() or (ROOT / 'dsh-export/native-score.json').exists() or \
            sha(FREEZE) != FREEZE_SHA or sha(ROOT / 'FREEZE.json') != PREPARED_SHA:
        raise ValueError('selection-only-seal.input-or-output-drift')
    settlement = json.loads((ROOT / 'dsh-control/SETTLEMENT.json').read_text())
    transport = json.loads((ROOT / 'dsh-control/transport/RESULTS.json').read_text())
    exported = json.loads((ROOT / 'dsh-export/EXPORT.json').read_text())
    tool_names = []
    for path in sorted((ROOT / 'dsh-control/tools').glob('[0-9]' * 6 + '.json')):
        record = json.loads(path.read_text())
        if record.get('kind') == 'tool-intent':
            tool_names.append(record['call']['function']['name'])
    if settlement['exit_code'] != 0 or settlement['failure'] is not None or \
            transport['unknown_usage_dispatched_requests'] != 0 or \
            transport['unsettled_attempts'] or \
            exported['status'] != 'final_context_selected' or \
            exported['accounting']['known_total_tokens'] != transport['known_total_tokens'] or \
            'apply_edits' in tool_names:
        raise ValueError('selection-only-seal.invalid-comparator')
    payload = {
        'schema_version': 'are.g02-r8-selection-only-exposed-pre-score-seal/v1',
        'posture': 'exposed-DSH-only-protocol-diagnostic',
        'freeze_sha256': FREEZE_SHA,
        'prepared_sha256': PREPARED_SHA,
        'settlement_sha256': sha(ROOT / 'dsh-control/SETTLEMENT.json'),
        'transport_results_sha256': sha(ROOT / 'dsh-control/transport/RESULTS.json'),
        'export_sha256': sha(ROOT / 'dsh-export/EXPORT.json'),
        'prediction_sha256': sha(ROOT / 'dsh-export/prediction.json'),
        'model_calls': transport['model_calls'],
        'known_model_tokens': transport['known_total_tokens'],
        'arm_seconds': settlement['elapsed_seconds'],
        'tool_call_names': tool_names,
        'score_unopened': True,
        'claim_ceiling': 'Exposed one-arm native score only; no paired campaign or superiority.',
        'open_questions': ['How does selection-only DSH score on this exposed task?',
                           'Does the protocol transfer to a prospective matched cohort?'],
    }
    with out.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'sealed-before-score', 'sha256': sha(out),
                      'model_calls': payload['model_calls'],
                      'known_tokens': payload['known_model_tokens'],
                      'tool_calls': len(tool_names)}))


if __name__ == '__main__':
    main()
