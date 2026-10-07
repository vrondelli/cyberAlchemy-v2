#!/usr/bin/env python3
"""Export only r3 final answers and four-conversation development references."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
BUILDER = HERE / 'prepare-beam-dev-answer-review-r1.py'
BUILDER_SHA = 'e19f7360658850307fcbcd6ed70fa69a2026b21cbf29eca5cad50d9efd3c3ab3'
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
RUN = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-event-run-r3-20261002')
WIRE = ROOT / 'DEV-EVENT-WIRES-r3.json'
WIRE_SHA = '22b0e2144aa071a6bd13e7bcb7a781fa0cd9cf38d2a67bec1703dadb87f591a2'
FREEZE_SHA = 'c8d58b888183a90c74202ce97b6c05690b3dfc219e313a76279495235d2a47c7'
RESULT_SHA = 'edc24105b16389b43eafadc818f2fadc0f314c7f61426e9ca1f96c77f72cb286'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-answer-review-r3.' + reason)


def run():
    need(sha(BUILDER.read_bytes()) == BUILDER_SHA and
        sha(WIRE.read_bytes()) == WIRE_SHA and
        sha((RUN / 'FREEZE.json').read_bytes()) == FREEZE_SHA and
        sha((RUN / 'RUN-RESULT.json').read_bytes()) == RESULT_SHA,
        'input-drift')
    spec = importlib.util.spec_from_file_location('beam_answer_review_r1', BUILDER)
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.RUN = RUN
    builder.WIRE = WIRE
    builder.WIRE_SHA = WIRE_SHA
    builder.FREEZE = RUN / 'FREEZE.json'
    builder.FREEZE_SHA = FREEZE_SHA
    builder.RESULT = RUN / 'RUN-RESULT.json'
    builder.RESULT_SHA = RESULT_SHA
    packet = builder.run()
    need(packet['development_conversations'] == 4 and
        packet['heldout_conversations'] == 16 and len(packet['cases']) == 8 and
        packet['reasoning_content_exported'] is False and
        packet['heldout_evaluator_values_accessed_in_code'] is False,
        'review-boundary')
    packet['schema_version'] = 'are.g03-beam-dev-answer-review-packet-r3/v1'
    packet['status'] = 'r3-development-review-packet-not-scored'
    packet['builder_r1_code_sha256'] = BUILDER_SHA
    packet['claim_ceiling'] = ('Exposed development final-answer review only; '
        'no calibrated native score, independent holdout, or superiority')
    return packet


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': packet['status'], 'cases': len(packet['cases']),
        'packet_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
