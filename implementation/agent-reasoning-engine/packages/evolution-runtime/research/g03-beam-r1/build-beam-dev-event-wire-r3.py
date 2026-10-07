#!/usr/bin/env python3
"""Rebuild sealed r3 development wires with the calibrated GLM output key."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
BUILDER = HERE / 'build-beam-dev-event-wire-r1.py'
BUILDER_SHA = 'f4ec4b06fb1d2d727fb570a67b87cc0a3429fdd5662dd5c6e6398218cea91569'
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SEAL = ROOT / 'DEV-SELECTIONS-r3.json'
SEAL_SHA = 'c8deb9446fef6ea40df1e0b8d07f5db2bddb6e608d39c662b51553d4fb35675c'
OUTPUT_RESERVE = 1024


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-wire-r3.' + reason)


def run():
    need(sha(BUILDER.read_bytes()) == BUILDER_SHA and
        sha(SEAL.read_bytes()) == SEAL_SHA, 'input-drift')
    spec = importlib.util.spec_from_file_location('beam_wire_r1', BUILDER)
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.SEAL = SEAL
    builder.SEAL_SHA = SEAL_SHA
    result = builder.run()
    need(len(result['wires']) == 8 and result['evaluator_fields_read'] is False,
        'wire-boundary')
    for row in result['wires']:
        request = row['request']
        need(request.pop('max_completion_tokens') == 512,
            'old-output-reserve')
        request['max_tokens'] = OUTPUT_RESERVE
        request['reasoning_effort'] = 'low'
        request['thinking'] = {'type': 'enabled'}
        row['request_sha256'] = sha(canonical(request))
    result['schema_version'] = 'are.g03-beam-dev-event-wire-r3/v1'
    result['status'] = 'source-only-r3-unqualified-wire'
    result.pop('r2_selection_sha256')
    result['r3_selection_sha256'] = SEAL_SHA
    result['builder_r1_code_sha256'] = BUILDER_SHA
    result['output_reserve_tokens'] = OUTPUT_RESERVE
    result['parameter'] = 'max_tokens'
    result['reasoning_effort'] = 'low'
    result['claim_ceiling'] = ('Source-only r3 development wires pending actual '
        'tokenizer checks; no generated answer, native score, holdout, or superiority')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'],
        'wires': len(result['wires']), 'output': str(args.output),
        'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
