#!/usr/bin/env python3
"""Select BEAM development conversations without reading evaluator fields."""

import argparse
import hashlib
import json
from pathlib import Path


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-ONLY.jsonl')
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
TREATMENT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/TREATMENT-PROJECTION-r1.json')
TREATMENT_SHA = '061452525015aa9a274fa70ef87da957b7e2088cf1183b342353ad726528476c'
SEED = 'g03-beam-100k-development-four-r1'
PREVIOUSLY_INSPECTED = 'Coding:1'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-split.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(TREATMENT.read_bytes()) == TREATMENT_SHA, 'input-drift')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    keys = [row['conversation_key'] for row in rows]
    need(len(keys) == len(set(keys)) == 20 and PREVIOUSLY_INSPECTED in keys,
        'source-keys')
    remaining = sorted((key for key in keys if key != PREVIOUSLY_INSPECTED),
        key=lambda key: (sha((SEED + '\0' + key).encode()), key))
    development = [PREVIOUSLY_INSPECTED, *remaining[:3]]
    heldout = sorted(set(keys) - set(development))
    need(len(development) == 4 and len(heldout) == 16 and
        not set(development).intersection(heldout), 'split')
    manifest = {'schema_version': 'are.g03-beam-development-split/v1',
        'status': 'sealed-source-only-before-citation-audit',
        'source_only_sha256': SOURCE_SHA,
        'treatment_candidate_receipt_sha256': TREATMENT_SHA,
        'seed': SEED, 'development_conversation_keys': development,
        'heldout_conversation_keys': heldout,
        'development_probe_count': 80, 'heldout_probe_count': 320,
        'forced_development_key': PREVIOUSLY_INSPECTED,
        'forced_reason': 'Evaluator citation-schema examples for this row were inspected before split sealing; exclude it from independent holdout',
        'evaluator_fields_read_by_selector': False,
        'model_calls': 0, 'holdout_citation_fields_read': False,
        'claim_ceiling': 'Source-only development split; no independent BEAM cohort, model result, native score, or superiority',
        'open_questions': ['Does the source-only candidate reach cited turns on development conversations?',
            'Can a separately frozen protocol use the 16 untouched conversations as an independent holdout?']}
    data = json.dumps(manifest, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': manifest['status'],
        'development_conversations': len(development),
        'heldout_conversations': len(heldout),
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
