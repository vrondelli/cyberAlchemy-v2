#!/usr/bin/env python3
"""Independent numeric/receipt audit of an exposed live selector microepisode."""

import hashlib
import json
import os
from pathlib import Path
from statistics import mean


ROOT = Path('/home/vlad_/are-benchmark-archive')
RUN = ROOT / 'g01-r17-dual-read-selector-exposed-r1-20261004'
LIVE = ROOT / 'g01-r17-dual-read-live-predictions-r1-20261004'
FIRST = ROOT / 'g01-r17-first-view-native-comparator-r1-20261004'
DUAL = ROOT / 'g01-r17-dual-view-native-projection-r1-20261004'
OUT = LIVE / 'INDEPENDENT-AUDIT.json'
SEAL_SHA = '23055c942cb8ae8125ecbef20203cc7b93ca8a4df663171d116e41dccedaa997'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_bytes())


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 0 if coverage + precision == 0 else 2 * coverage * precision / (coverage + precision)


def main():
    if OUT.exists() or sha((LIVE / 'PREDICTION-SEAL.json').read_bytes()) != SEAL_SHA:
        raise SystemExit('seal-drift-or-output-exists')
    seal = load(LIVE / 'PREDICTION-SEAL.json')
    if seal['model_calls'] != 4 or seal['known_model_tokens'] != 4402:
        raise SystemExit('usage-drift')
    rows = []
    for ordinal in (19, 20, 21, 22):
        response = RUN / f'RESPONSE-{ordinal}.json'
        record = load(response)
        binding = seal['responses'][str(ordinal)]
        if sha(response.read_bytes()) != binding['response_sha256'] or \
                record['ids'] != binding['ids'] or record['status'] != 'valid':
            raise SystemExit('response-drift')
        name = f'task-{ordinal:02d}-prediction.json'
        if sha((LIVE / name).read_bytes()) != seal['predictions_sha256'][name]:
            raise SystemExit('prediction-drift')
        native = {}
        hashes = {}
        for label, root in (('first', FIRST), ('dual', DUAL), ('live', LIVE)):
            path = root / f'task-{ordinal:02d}-native-score.json'
            score = load(path)
            if score['native'].get('error') or score['native']['num_steps'] != (1 if label == 'first' else 2):
                raise SystemExit('native-error-or-step-drift')
            hashes[label] = sha(path.read_bytes())
            native[label] = {'span_f1': f1(score['native']['final']['span']),
                             'file_f1': f1(score['native']['final']['file'])}
        rows.append({'ordinal': ordinal, 'selected_view_ids': binding['ids'],
                     'native_score_sha256': hashes, 'metrics': native,
                     'known_model_tokens': record['usage']['prompt_tokens'] + record['usage']['completion_tokens']})
    if sum(row['known_model_tokens'] for row in rows) != seal['known_model_tokens']:
        raise SystemExit('token-sum-drift')
    macro = {label: {'span_f1': mean(row['metrics'][label]['span_f1'] for row in rows),
                     'file_f1': mean(row['metrics'][label]['file_f1'] for row in rows)}
             for label in ('first', 'dual', 'live')}
    audit = {'schema_version': 'g01.r17-dual-read-live-independent-audit-r1/v1',
             'posture': 'evaluator-only-exposed-development',
             'prediction_seal_sha256': SEAL_SHA,
             'freeze_sha256': sha((RUN / 'FREEZE.json').read_bytes()),
             'rows': rows, 'macro': macro,
             'live_minus_first_macro_span_f1': macro['live']['span_f1'] - macro['first']['span_f1'],
             'live_minus_dual_macro_span_f1': macro['live']['span_f1'] - macro['dual']['span_f1'],
             'known_selector_model_tokens': seal['known_model_tokens'],
             'claim_ceiling': 'Four exposed live GLM view selections, but not a full ARE episode, matched campaign, fresh confirmation, all-in cost, or superiority.'}
    data = (json.dumps(audit, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)
    print(json.dumps({'audit_sha256': sha(data), 'macro': macro,
                      'known_selector_model_tokens': seal['known_model_tokens']}))


if __name__ == '__main__':
    main()
