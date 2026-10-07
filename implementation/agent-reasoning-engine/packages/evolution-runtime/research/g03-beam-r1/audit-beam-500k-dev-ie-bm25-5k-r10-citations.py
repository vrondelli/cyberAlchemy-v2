#!/usr/bin/env python3
"""Secondary source-citation comparison of sealed equal-5K BM25 and r9."""

import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
BM25 = ROOT / 'BM25-5K-R10-SELECTIONS.json'
R9 = ROOT / 'DUAL-VIEW-R9-ALL-SELECTIONS.json'
PINS = {
    SOURCE: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    BM25: '058c069af971657d124734f010f9be8595cf56686e5f8e72003cd56e8ca9680e',
    R9: '5d9107da49b1fa90016f1e84d9a99a36f839af9cae7aeb053b9348e7363a8e6a',
}


def file_sha(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(',', ':')).encode()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-bm25-5k-r10-citations.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and
         all(file_sha(path) == expected for path, expected in PINS.items()),
         'input-drift')
    bm25_packet = json.loads(BM25.read_text())
    r9_packet = json.loads(R9.read_text())
    need(bm25_packet['questions'] == 60 and
         bm25_packet['evaluator_fields_read'] is False and
         bm25_packet['model_calls'] == 0 and
         r9_packet['information_extraction_questions'] == 60,
         'sealed-selection')
    bm25 = {row['probe_id']: row for row in bm25_packet['selections']}
    r9 = {row['probe_id']: row for row in r9_packet['selections']}
    need(len(bm25) == len(r9) == 60 and set(bm25) == set(r9),
         'paired-population')
    results = []
    for row in pq.read_table(SOURCE, columns=['conversation_seed',
                                               'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        key_hash = digest(key)
        entries = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(entries) == 2, 'ie-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = digest([key, 'information_extraction', ordinal,
                               digest(entry['question'])])[:24]
            if probe_id not in bm25:
                continue
            need(bm25[probe_id]['conversation_key_sha256'] == key_hash and
                 r9[probe_id]['conversation_key_sha256'] == key_hash,
                 'conversation-binding')
            cited = set(entry['source_chat_ids'])
            need(cited and all(type(item) is int for item in cited),
                 'citation-type')
            result = {'probe_id': probe_id, 'cited_turns': len(cited)}
            for arm, identities in (
                    ('dual_view_r9', r9[probe_id]['treatment']['selected_fragment_identities']),
                    ('bm25_5k', bm25[probe_id]['selected_fragment_identities'])):
                reached = len(cited & {item[0] for item in identities})
                result[arm] = {'hit_any': int(reached > 0),
                               'hit_all': int(reached == len(cited)),
                               'cited_turns_reached': reached}
            results.append(result)
    need(len(results) == 60 and
         {row['probe_id'] for row in results} == set(bm25),
         'result-completeness')
    tally = Counter()
    for row in results:
        tally['questions'] += 1
        tally['cited_turns'] += row['cited_turns']
        for arm in ('dual_view_r9', 'bm25_5k'):
            for metric in ('hit_any', 'hit_all', 'cited_turns_reached'):
                tally[arm + '_' + metric] += row[arm][metric]
        left = row['dual_view_r9']['cited_turns_reached']
        right = row['bm25_5k']['cited_turns_reached']
        tally['dual_view_win'] += left > right
        tally['bm25_5k_win'] += right > left
        tally['tie'] += left == right
    packet = {
        'schema_version': 'are.g03-beam-500k-dev-ie-bm25-5k-r10-citations/v1',
        'status': 'secondary-exposed-development-citation-audit',
        'input_sha256': {str(path): value for path, value in PINS.items()},
        'aggregate': dict(sorted(tally.items())),
        'per_question': sorted(results, key=lambda row: row['probe_id']),
        'reserved_100k_evaluator_values_accessed': False,
        'model_calls': 0,
        'claim_ceiling': 'Source-citation identity reach only; no answer correctness or superiority',
        'open_questions': ['Does equal-budget BM25 answer as well as dual-view?',
                           'Which source citations do not carry the actual answer?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(raw)
    print(json.dumps({'aggregate': packet['aggregate'],
                      'receipt_sha256': hashlib.sha256(raw).hexdigest()},
                     sort_keys=True))


if __name__ == '__main__':
    main()
