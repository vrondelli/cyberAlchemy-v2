#!/usr/bin/env python3
"""Freeze an unchanged copy of the r52 packets for the r53 conformance repair."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
SOURCE = ARCHIVE / 'self-sorting-r52'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    source_packets = SOURCE / 'PACKETS.jsonl'
    source_freeze = SOURCE / 'PACKET-FREEZE.json'
    payload = source_packets.read_bytes()
    prior = json.loads(source_freeze.read_text())
    if prior['packets'] != 71 or prior['packets_sha256'] != sha(payload) or prior['gold_opened'] is not False:
        raise SystemExit('r53.source-integrity')
    shutil.copyfile(source_packets, output / 'PACKETS.jsonl')
    here = Path(__file__).parent
    base_runner = here.parent / 'g01-self-sorting-r52/run_vps.py'
    freeze = {
        'schema_version': 'are.g01-self-sorting-r53-packet-freeze/v1',
        'packets': 71, 'm': 4, 'n': 1, 'k': 8, 'lambda': 0.5,
        'packets_unchanged_from_r52': True,
        'gold_opened': False,
        'r52_packets_sha256': sha(payload),
        'r52_packet_freeze_sha256': sha(source_freeze.read_bytes()),
        'protocol_sha256': sha((here / 'PROTOCOL.md').read_bytes()),
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'base_runner_sha256': sha(base_runner.read_bytes()),
        'wrapper_sha256': sha((here / 'run_vps.py').read_bytes()),
        'packets_sha256': sha(payload),
    }
    (output / 'PACKET-FREEZE.json').write_text(json.dumps(freeze, sort_keys=True, indent=2) + '\n')
    print(json.dumps(freeze, sort_keys=True))


if __name__ == '__main__':
    main()
