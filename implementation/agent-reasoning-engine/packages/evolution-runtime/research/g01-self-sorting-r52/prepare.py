#!/usr/bin/env python3
"""Build gold-blind Self-Sorting selection packets from sealed r51 lists."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
R51 = ARCHIVE / 'order-robust-r51'
ARM_ORDER = ['graph', 'historical_raw', 'reverse', 'rotate_half']


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    prediction_path = R51 / 'predictions/PREDICTIONS.jsonl'
    seal_path = R51 / 'predictions/PREDICTION-SEAL.json'
    packet_path = R51 / 'PACKETS.jsonl'
    seal = json.loads(seal_path.read_text())
    if seal['predictions_sha256'] != sha(prediction_path.read_bytes()) or seal['gold_opened'] is not False:
        raise SystemExit('r52.r51-seal')
    predictions = jsonl(prediction_path)
    source_packets = jsonl(packet_path)
    contexts = {}
    for packet in source_packets:
        key = (packet['cohort'], packet['ordinal'], packet['id'])
        prompt = packet['prompt']
        failure = prompt.split('Failure:\n', 1)[1].split('Entity cards:\n', 1)[0].rstrip()
        if key in contexts and contexts[key] != failure:
            raise SystemExit('r52.failure-context-mismatch')
        contexts[key] = failure
    rows = []
    for sequence, prediction in enumerate(predictions, 1):
        key = (prediction['cohort'], prediction['ordinal'], prediction['id'])
        rankings = {
            'graph': prediction['graph_ranked_files'],
            'historical_raw': prediction['historical_raw_ranked_files'],
            'reverse': prediction['reverse_ranked_files'],
            'rotate_half': prediction['rotate_half_ranked_files'],
        }
        if any(ranking is None or len(ranking) < 8 for ranking in rankings.values()):
            raise SystemExit('r52.ranking-input')
        shift = (sequence - 1) % 4
        presented = ARM_ORDER[shift:] + ARM_ORDER[:shift]
        mapping = []
        list_blocks = []
        for display_id, arm in enumerate(presented, 1):
            paths = rankings[arm][:8]
            mapping.append({'display_id': display_id, 'arm': arm, 'top8': paths})
            list_blocks.append(f'List {display_id}:\n' + '\n'.join(f'{index}. {path}' for index, path in enumerate(paths, 1)))
        prompt = (
            'Rank the four anonymous candidate-file rankings by how well each ranking prioritizes the implementation files '
            'most likely responsible for the failure. Judge the ordered file paths against the failure evidence. '
            'List display position is not evidence. Return only JSON {"list_ids":[...]} containing each of the four '
            'distinct list IDs exactly once, best list first. No prose.\nFailure:\n' + contexts[key] +
            '\nCandidate rankings:\n' + '\n\n'.join(list_blocks)
        )
        rows.append({
            'schema_version': 'are.g01-self-sorting-r52-packet/v1',
            'sequence': sequence,
            'cohort': prediction['cohort'],
            'ordinal': prediction['ordinal'],
            'id': prediction['id'],
            'repo': prediction['repo'],
            'language': prediction['language'],
            'display_map': mapping,
            'prompt': prompt,
            'prompt_bytes': len(prompt.encode()),
            'r51_prediction_sha256': sha(stable(prediction)),
            'gold_opened': False,
        })
    if len(rows) != 71 or max(row['prompt_bytes'] for row in rows) > 24_000:
        raise SystemExit('r52.denominator-or-prompt')
    payload = b''.join(stable(row) + b'\n' for row in rows)
    (output / 'PACKETS.jsonl').write_bytes(payload)
    protocol = Path(__file__).with_name('PROTOCOL.md')
    freeze = {
        'schema_version': 'are.g01-self-sorting-r52-packet-freeze/v1',
        'packets': 71,
        'm': 4, 'n': 1, 'k': 8, 'lambda': 0.5,
        'presentation_rule': 'left-rotate-arm-order-by-zero-based-sequence-modulo-4',
        'gold_opened': False,
        'r51_predictions_sha256': sha(prediction_path.read_bytes()),
        'r51_prediction_seal_sha256': sha(seal_path.read_bytes()),
        'r51_packets_sha256': sha(packet_path.read_bytes()),
        'protocol_sha256': sha(protocol.read_bytes()),
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'packets_sha256': sha(payload),
        'maximum_prompt_bytes': max(row['prompt_bytes'] for row in rows),
        'total_prompt_bytes': sum(row['prompt_bytes'] for row in rows),
    }
    (output / 'PACKET-FREEZE.json').write_text(json.dumps(freeze, sort_keys=True, indent=2) + '\n')
    print(json.dumps(freeze, sort_keys=True))


if __name__ == '__main__':
    main()
