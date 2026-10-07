#!/usr/bin/env python3
"""Build gold-blind counterbalanced r51 packets from sealed exposed packets."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
COHORTS = {
    'r43': ARCHIVE / 'selective-r28/entity-r43',
    'r44': ARCHIVE / 'graph-dev-b-r2/code-only/entity-r44',
    'r50': ARCHIVE / 'guarded-confirm-r50',
}
OLD_LEAD = ('Locate the implementation file responsible for the failure. Candidates are source files '
            'from the exact failed commit and are ordered by a strong graph prior. Entity cards contain '
            'bounded declarations, imports, and query-matching source lines. Move a lower-ranked file '
            'ahead only when its source evidence directly explains the failed test.')
NEW_LEAD = ('Locate the implementation file responsible for the failure. Candidates are source files '
            'from the exact failed commit. Every entity card records graph=N, its fixed graph-prior rank, '
            'and contains bounded declarations, imports, and query-matching source lines. Cards are shown '
            'in a deterministic counterbalanced presentation order. Judge source evidence and graph rank; '
            'do not treat display position or candidate ID as evidence.')
MARKER = 'Entity cards:\n'


def stable(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def view_order(size: int, name: str) -> list[int]:
    original = list(range(size))
    if name == 'reverse':
        return list(reversed(original))
    if name == 'rotate_half':
        half = size // 2
        return original[half:] + original[:half]
    raise ValueError(name)


def construct(packet: dict, cohort: str, view: str) -> dict:
    prompt = packet['prompt']
    if prompt.count(MARKER) != 1 or not prompt.startswith(OLD_LEAD):
        raise SystemExit(f'r51.prompt-contract:{cohort}:{packet.get("ordinal")}')
    prefix, cards_text = prompt.split(MARKER)
    lines = cards_text.splitlines()
    candidates = packet['candidates']
    if len(lines) != len(candidates) or len(candidates) > 30:
        raise SystemExit(f'r51.card-denominator:{cohort}:{packet.get("ordinal")}')
    for index, (line, candidate) in enumerate(zip(lines, candidates), 1):
        match = re.match(r'^\[([1-9][0-9]*)\] ', line)
        if not match or int(match.group(1)) != index or candidate['candidate_id'] != index:
            raise SystemExit(f'r51.card-identity:{cohort}:{packet.get("ordinal")}:{index}')
    order = view_order(len(candidates), view)
    presented = []
    mappings = []
    for display_id, original_index in enumerate(order, 1):
        candidate = candidates[original_index]
        presented.append(re.sub(r'^\[[1-9][0-9]*\]', f'[{display_id}]', lines[original_index], count=1))
        mappings.append({
            'display_id': display_id,
            'original_candidate_id': candidate['candidate_id'],
            'path': candidate['path'],
            'graph_rank': candidate['graph_rank'],
        })
    new_prefix = prefix.replace(OLD_LEAD, NEW_LEAD, 1)
    new_prompt = new_prefix + MARKER + '\n'.join(presented)
    result = {
        'schema_version': 'are.g01-order-robust-r51-packet/v1',
        'cohort': cohort,
        'ordinal': packet['ordinal'],
        'id': packet['id'],
        'repo': packet['repo'],
        'language': packet['language'],
        'base_commit': packet['base_commit'],
        'view': view,
        'candidate_count': len(candidates),
        'display_map': mappings,
        'original_prompt_sha256': sha(prompt.encode()),
        'prompt': new_prompt,
        'prompt_bytes': len(new_prompt.encode()),
        'gold_opened': False,
    }
    if result['prompt_bytes'] > 24_000:
        raise SystemExit(f'r51.prompt-bytes:{cohort}:{packet.get("ordinal")}:{view}')
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    protocol = Path(__file__).with_name('PROTOCOL.md')
    rows = []
    source_inputs = {}
    for cohort, root in COHORTS.items():
        packet_path = root / 'packets/PACKETS.jsonl'
        seal_path = root / 'packets/PACKET-SEAL.json'
        packets = load_jsonl(packet_path)
        expected = 23 if cohort == 'r43' else 24
        if len(packets) != expected:
            raise SystemExit(f'r51.source-denominator:{cohort}')
        source_inputs[cohort] = {
            'packets_path': str(packet_path),
            'packets_sha256': sha(packet_path.read_bytes()),
            'packet_seal_sha256': sha(seal_path.read_bytes()),
            'cases': expected,
        }
        for packet in packets:
            rows.extend(construct(packet, cohort, view) for view in ('reverse', 'rotate_half'))
    if len(rows) != 142:
        raise SystemExit('r51.output-denominator')
    packet_bytes = b''.join(stable(row) + b'\n' for row in rows)
    (output / 'PACKETS.jsonl').write_bytes(packet_bytes)
    freeze = {
        'schema_version': 'are.g01-order-robust-r51-packet-freeze/v1',
        'cases': 71,
        'views_per_case': 2,
        'packets': 142,
        'views': ['reverse', 'rotate_half'],
        'permutation_rule': 'reverse-and-left-rotate-by-floor-n-over-2',
        'display_ids_remapped': True,
        'graph_rank_retained_in_cards': True,
        'gold_opened': False,
        'protocol_sha256': sha(protocol.read_bytes()),
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'source_inputs': source_inputs,
        'packets_sha256': sha(packet_bytes),
        'maximum_prompt_bytes': max(row['prompt_bytes'] for row in rows),
        'total_prompt_bytes': sum(row['prompt_bytes'] for row in rows),
    }
    (output / 'PACKET-FREEZE.json').write_text(json.dumps(freeze, sort_keys=True, indent=2) + '\n')
    print(json.dumps(freeze, sort_keys=True))


if __name__ == '__main__':
    main()

