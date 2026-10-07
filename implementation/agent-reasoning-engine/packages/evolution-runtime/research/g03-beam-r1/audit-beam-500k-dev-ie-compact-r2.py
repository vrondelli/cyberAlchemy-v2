#!/usr/bin/env python3
"""Independently audit the sealed compact IE selector with the r1 citation rules."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
AUDITOR = HERE / 'audit-beam-500k-dev-ie-citations-r1.py'
SELECTIONS = ROOT / 'IE-COMPACT-R2-SELECTIONS.json'
AUDITOR_SHA = '49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799'
SELECTIONS_SHA = 'b47cf80b3ba4561124b0f79001912e35a7ed65134e9d1621f5646fe062a7c0af'


def sha(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-compact-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'fresh-output-required')
    need(sha(AUDITOR) == AUDITOR_SHA and
        sha(SELECTIONS) == SELECTIONS_SHA, 'pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g03_beam_500k_ie_auditor_r1',
        AUDITOR)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.SELECTIONS = SELECTIONS
    result = auditor.run()
    need(result['sealed_selections_sha256'] == SELECTIONS_SHA and
        result['aggregate']['questions'] == 60, 'audit-binding')
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-compact-citation-audit-r2/v1'
    result['status'] = 'development-compact-citation-reach-audited'
    result['auditor_code_sha256'] = AUDITOR_SHA
    result['claim_ceiling'] = ('BEAM 500K exposed development citation reach '
        'for compact treatment versus unchanged BM25; not answer quality, '
        'native score, reserved holdout, or superiority')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'aggregate': result['aggregate'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
