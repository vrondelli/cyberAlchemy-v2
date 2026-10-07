#!/usr/bin/env python3
"""Privately stage only disjoint-seed 500K history and questions, no references."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
SOURCE_SHA = 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122'
PREFLIGHT = ROOT / 'SOURCE-PREFLIGHT.json'
PREFLIGHT_SHA = '8c7b401df2ecf33a59229dd0fb711f077ab78fa14ddf9fc96a4e70a23a509049'
ROW_KEYS = {'conversation_key', 'turns', 'probes'}
TURN_KEYS = {'role', 'content', 'time_anchor'}
PROBE_KEYS = {'id', 'ability', 'question'}


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode('utf-8')


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else
        canonical(value)).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-dev-extract.' + reason)


def run():
    need(sha_file(SOURCE) == SOURCE_SHA and
        sha_file(PREFLIGHT) == PREFLIGHT_SHA, 'pinned-input-drift')
    preflight = json.loads(PREFLIGHT.read_text())
    eligible = set(preflight['eligible_seed_key_hashes'])
    excluded = set(preflight['excluded_overlap_seed_key_hashes'])
    need(preflight['status'] == 'source-only-development-supply-qualified' and
        len(eligible) == 30 and len(excluded) == 5 and
        not eligible & excluded, 'preflight-binding')
    source_rows = pq.read_table(SOURCE).to_pylist()
    need(len(source_rows) == 35, 'source-row-count')
    projections, keys, ids, excluded_seen = [], set(), set(), set()
    for row in source_rows:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        key_hash = sha(key)
        if key_hash in excluded:
            excluded_seen.add(key_hash)
            continue
        need(key_hash in eligible and key not in keys,
            'eligible-seed-binding')
        keys.add(key)
        turns = [{name: message[name] for name in
            ('role', 'content', 'time_anchor')}
            for segment in row['chat'] for message in segment]
        need(turns and all(set(turn) == TURN_KEYS for turn in turns),
            'turn-allowlist')
        parsed = ast.literal_eval(row['probing_questions'])
        need(set(parsed) == set(preflight['ability_counts']),
            'ability-shape')
        probes = []
        for ability in sorted(parsed):
            need(len(parsed[ability]) == 2, 'probe-quota')
            for ordinal, entry in enumerate(parsed[ability]):
                question = entry['question']
                need(isinstance(question, str) and question.strip(),
                    'question-shape')
                question_sha = sha(question)
                probe_id = sha([key, ability, ordinal, question_sha])[:24]
                need(probe_id not in ids, 'probe-id-collision')
                ids.add(probe_id)
                probe = {'id': probe_id, 'ability': ability,
                    'question': question}
                need(set(probe) == PROBE_KEYS, 'probe-allowlist')
                probes.append(probe)
        projection = {'conversation_key': key, 'turns': turns,
            'probes': probes}
        need(set(projection) == ROW_KEYS and len(probes) == 20,
            'row-allowlist')
        projections.append(projection)
    need(len(projections) == len(keys) == 30 and len(ids) == 600 and
        excluded_seen == excluded, 'population-accounting')
    return projections


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    need(args.output != args.receipt and not args.output.exists() and
        not args.receipt.exists(), 'fresh-output-required')
    rows = run()
    data = b''.join(canonical(row) + b'\n' for row in rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    receipt = {'schema_version': 'are.g03-beam-500k-dev-source-only-extract/v1',
        'status': 'source-only-private-development',
        'input_source_sha256': SOURCE_SHA,
        'input_preflight_sha256': PREFLIGHT_SHA,
        'output_sha256': sha(data), 'output_bytes': len(data),
        'conversations': len(rows),
        'turns': sum(len(row['turns']) for row in rows),
        'probes': sum(len(row['probes']) for row in rows),
        'row_keys': sorted(ROW_KEYS), 'turn_keys': sorted(TURN_KEYS),
        'probe_keys': sorted(PROBE_KEYS),
        'reserved_seed_overlap_excluded': 5,
        'evaluator_fields_emitted': False, 'model_calls': 0,
        'claim_ceiling': 'Disjoint-seed BEAM 500K development history and questions only; no reference, answer score, heldout 100K use, or superiority',
        'open_questions': [
            'Does the existing ARE selector reach cited source turns better than BM25 on these development questions?',
            'Can a changed source-grounded mechanism improve answer quality under a matched 8K protocol?']}
    receipt_bytes = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    with args.receipt.open('xb') as stream:
        stream.write(receipt_bytes)
    print(json.dumps({'status': receipt['status'],
        'conversations': receipt['conversations'],
        'turns': receipt['turns'], 'probes': receipt['probes'],
        'source_only_sha256': receipt['output_sha256'],
        'receipt_sha256': sha(receipt_bytes)}, sort_keys=True))


if __name__ == '__main__':
    main()
