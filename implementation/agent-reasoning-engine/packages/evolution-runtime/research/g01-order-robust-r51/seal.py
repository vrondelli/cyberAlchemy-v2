#!/usr/bin/env python3
"""Build gold-blind full rankings and the fixed four-view RRF for r51."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = ARCHIVE / 'order-robust-r51'
RRF_K = 60
SOURCES = {
    'r43': {
        'root': ARCHIVE / 'selective-r28/entity-r43',
        'graph': ARCHIVE / 'selective-r28/rankings-r38/graph',
    },
    'r44': {
        'root': ARCHIVE / 'graph-dev-b-r2/code-only/entity-r44',
        'graph': ARCHIVE / 'graph-dev-b-r2/code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl',
    },
    'r50': {
        'root': ARCHIVE / 'guarded-confirm-r50',
        'graph': ARCHIVE / 'guarded-confirm-r50/packets/GRAPH-RANKINGS.jsonl',
    },
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def graph_rows(cohort: str, source: Path) -> list[dict]:
    if cohort == 'r43':
        return [json.loads(path.read_text()) for path in sorted(source.glob('GRAPH-RANKING-*.json'))]
    return jsonl(source)


def complete(selected: list[str], graph: list[str]) -> list[str]:
    if len(selected) != len(set(selected)) or not set(selected) <= set(graph):
        raise SystemExit('r51.selection-universe')
    return selected + [path for path in graph if path not in set(selected)]


def rrf(rankings: list[list[str]], graph: list[str]) -> list[str]:
    universe = set(graph)
    if any(set(ranking) != universe or len(ranking) != len(universe) for ranking in rankings):
        raise SystemExit('r51.ranking-universe')
    graph_position = {path: index for index, path in enumerate(graph)}
    positions = [{path: index + 1 for index, path in enumerate(ranking)} for ranking in rankings]
    return sorted(graph, key=lambda path: (
        -sum(1 / (RRF_K + position[path]) for position in positions),
        graph_position[path], path,
    ))


def diagnostic_paths(generation: dict, candidates: set[str]) -> list[str] | None:
    try:
        content = generation['provider_payload']['choices'][0]['message']['content'].strip()
        value = json.loads(content)
        paths = value['candidate_ids']
        if (isinstance(paths, list) and len(paths) <= 8 and
                all(isinstance(path, str) for path in paths) and
                len(paths) == len(set(paths)) and set(paths) <= candidates):
            return paths
    except (KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        pass
    return None


def main() -> None:
    run = ROOT / 'vps-run'
    output = ROOT / 'predictions'
    output.mkdir(mode=0o700, exist_ok=False)
    packets = jsonl(ROOT / 'PACKETS.jsonl')
    packet_by_sequence = {index: packet for index, packet in enumerate(packets, 1)}
    source = {}
    source_hashes = {}
    for cohort, paths in SOURCES.items():
        prediction_path = paths['root'] / 'predictions/PREDICTIONS.jsonl'
        graphs = graph_rows(cohort, paths['graph'])
        predictions = jsonl(prediction_path)
        graph_path = paths['graph']
        source_hashes[cohort] = {
            'historical_predictions_sha256': sha(prediction_path.read_bytes()),
            'graph_input_sha256': (sha(graph_path.read_bytes()) if graph_path.is_file() else
                                   sha(b''.join(stable(row) + b'\n' for row in graphs))),
        }
        for prediction in predictions:
            key = (cohort, prediction['ordinal'], prediction['id'])
            matches = [row for row in graphs if row['ordinal'] == prediction['ordinal'] and row['id'] == prediction['id']]
            if len(matches) != 1:
                raise SystemExit('r51.graph-join')
            historical = prediction.get('raw_ranked_files', prediction.get('ranked_files'))
            graph = matches[0]['ranked_files']
            if set(historical) != set(graph) or len(historical) != len(graph):
                raise SystemExit('r51.historical-universe')
            source[key] = {'graph': graph, 'historical_raw': historical, 'prediction': prediction}
    views: dict[tuple, dict[str, dict]] = {}
    strict_valid = diagnostic_valid = 0
    for sequence in range(1, 143):
        packet = packet_by_sequence[sequence]
        decision_path = run / f'DECISION-{sequence:03d}.json'
        generation_path = run / f'GENERATION-{sequence:03d}.json'
        decision = json.loads(decision_path.read_text())
        generation = json.loads(generation_path.read_text())
        key = (packet['cohort'], packet['ordinal'], packet['id'])
        candidate_paths = {row['path'] for row in packet['display_map']}
        selected = decision['selected_paths'] if decision['valid'] else diagnostic_paths(generation, candidate_paths)
        strict_valid += int(decision['valid'])
        diagnostic_valid += int(selected is not None)
        views.setdefault(key, {})[packet['view']] = {
            'strict_valid': decision['valid'],
            'diagnostic_path_normalized': not decision['valid'] and selected is not None,
            'selected_paths': selected,
            'decision_sha256': sha(decision_path.read_bytes()),
            'generation_sha256': sha(generation_path.read_bytes()),
        }
    rows = []
    for key in sorted(source):
        cohort, ordinal, case_id = key
        case_views = views.get(key, {})
        if set(case_views) != {'reverse', 'rotate_half'}:
            raise SystemExit('r51.view-join')
        base = source[key]
        full = {}
        for view, record in case_views.items():
            full[view] = complete(record['selected_paths'], base['graph']) if record['selected_paths'] is not None else None
        diagnostic_complete = all(ranking is not None for ranking in full.values())
        fused = rrf([base['graph'], base['historical_raw'], full['reverse'], full['rotate_half']], base['graph']) if diagnostic_complete else None
        rows.append({
            'schema_version': 'are.g01-order-robust-r51-prediction/v1',
            'cohort': cohort,
            'ordinal': ordinal,
            'id': case_id,
            'repo': base['prediction']['repo'],
            'language': base['prediction']['language'],
            'strict_valid': all(record['strict_valid'] for record in case_views.values()),
            'diagnostic_complete': diagnostic_complete,
            'views': case_views,
            'graph_ranked_files': base['graph'],
            'historical_raw_ranked_files': base['historical_raw'],
            'reverse_ranked_files': full['reverse'],
            'rotate_half_ranked_files': full['rotate_half'],
            'rrf_ranked_files': fused,
            'rrf_k': RRF_K,
            'gold_opened': False,
        })
    payload = b''.join(stable(row) + b'\n' for row in rows)
    (output / 'PREDICTIONS.jsonl').write_bytes(payload)
    run_result = run / 'RUN-RESULT.json'
    seal = {
        'schema_version': 'are.g01-order-robust-r51-prediction-seal/v1',
        'cases': len(rows),
        'strict_valid_responses': strict_valid,
        'diagnostically_normalized_responses': diagnostic_valid - strict_valid,
        'diagnostically_complete_responses': diagnostic_valid,
        'strict_valid_cases': sum(row['strict_valid'] for row in rows),
        'diagnostically_complete_cases': sum(row['diagnostic_complete'] for row in rows),
        'rrf_k': RRF_K,
        'normalization_status': 'diagnostic-only-does-not-satisfy-frozen-validity-gate',
        'gold_opened': False,
        'packets_sha256': sha((ROOT / 'PACKETS.jsonl').read_bytes()),
        'run_result_sha256': sha(run_result.read_bytes()),
        'source_inputs': source_hashes,
        'predictions_sha256': sha(payload),
    }
    (output / 'PREDICTION-SEAL.json').write_text(json.dumps(seal, sort_keys=True, indent=2) + '\n')
    print(json.dumps(seal, sort_keys=True))


if __name__ == '__main__':
    main()
