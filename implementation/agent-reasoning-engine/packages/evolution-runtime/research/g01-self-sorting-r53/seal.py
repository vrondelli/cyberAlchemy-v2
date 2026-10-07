#!/usr/bin/env python3
"""Seal r53 Self-Sorting rankings before evaluator labels are opened."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'self-sorting-r53'
R51 = ARCHIVE / 'order-robust-r51'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def main() -> None:
    output = ROOT / 'predictions'
    output.mkdir(mode=0o700, exist_ok=False)
    r51_path = R51 / 'predictions/PREDICTIONS.jsonl'
    r51_seal_path = R51 / 'predictions/PREDICTION-SEAL.json'
    packet_path = ROOT / 'PACKETS.jsonl'
    run = ROOT / 'vps-run'
    run_result_path = run / 'RUN-RESULT.json'
    r51_seal = json.loads(r51_seal_path.read_text())
    run_result = json.loads(run_result_path.read_text())
    if (r51_seal['predictions_sha256'] != sha(r51_path.read_bytes()) or
            r51_seal['gold_opened'] is not False or run_result['valid_responses'] != 71):
        raise SystemExit('r53.input-seal')
    r51_rows = jsonl(r51_path)
    packets = jsonl(packet_path)
    if len(r51_rows) != 71 or len(packets) != 71:
        raise SystemExit('r53.denominator')
    rows = []
    for sequence, (source, packet) in enumerate(zip(r51_rows, packets), 1):
        if (source['cohort'], source['ordinal'], source['id']) != (packet['cohort'], packet['ordinal'], packet['id']):
            raise SystemExit('r53.join')
        decision_path = run / f'DECISION-{sequence:03d}.json'
        decision = json.loads(decision_path.read_text())
        if not decision['valid'] or sorted(decision['ranked_arms']) != ['graph', 'historical_raw', 'reverse', 'rotate_half']:
            raise SystemExit('r53.decision-validity')
        top8 = {row['arm']: row['top8'] for row in packet['display_map']}
        scores = {}
        for list_rank, arm in enumerate(decision['ranked_arms'], 1):
            for position, path in enumerate(top8[arm], 1):
                scores[path] = scores.get(path, 0.0) + 1 / math.sqrt(list_rank * position)
        rrf = source['rrf_ranked_files']
        graph = source['graph_ranked_files']
        rrf_position = {path: index for index, path in enumerate(rrf)}
        graph_position = {path: index for index, path in enumerate(graph)}
        promoted = sorted(scores, key=lambda path: (-scores[path], rrf_position[path], graph_position[path], path))
        ss = promoted + [path for path in rrf if path not in scores]
        if len(ss) != len(graph) or set(ss) != set(graph):
            raise SystemExit('r53.universe')
        rows.append({
            'schema_version': 'are.g01-self-sorting-r53-prediction/v1',
            'sequence': sequence, 'cohort': source['cohort'], 'ordinal': source['ordinal'],
            'id': source['id'], 'repo': source['repo'], 'language': source['language'],
            'ranked_arms': decision['ranked_arms'], 'top8_by_arm': top8,
            'lambda': 0.5, 'm': 4, 'n': 1, 'k': 8,
            'graph_ranked_files': graph,
            'historical_raw_ranked_files': source['historical_raw_ranked_files'],
            'r51_rrf_ranked_files': rrf,
            'self_sorting_ranked_files': ss,
            'decision_sha256': sha(decision_path.read_bytes()),
            'gold_opened': False,
        })
    payload = b''.join(stable(row) + b'\n' for row in rows)
    (output / 'PREDICTIONS.jsonl').write_bytes(payload)
    seal = {
        'schema_version': 'are.g01-self-sorting-r53-prediction-seal/v1',
        'cases': 71, 'strict_valid_responses': 71,
        'lambda': 0.5, 'm': 4, 'n': 1, 'k': 8,
        'gold_opened': False,
        'r51_predictions_sha256': sha(r51_path.read_bytes()),
        'r51_prediction_seal_sha256': sha(r51_seal_path.read_bytes()),
        'packets_sha256': sha(packet_path.read_bytes()),
        'run_result_sha256': sha(run_result_path.read_bytes()),
        'predictions_sha256': sha(payload),
    }
    (output / 'PREDICTION-SEAL.json').write_text(json.dumps(seal, sort_keys=True, indent=2) + '\n')
    print(json.dumps(seal, sort_keys=True))


if __name__ == '__main__':
    main()
