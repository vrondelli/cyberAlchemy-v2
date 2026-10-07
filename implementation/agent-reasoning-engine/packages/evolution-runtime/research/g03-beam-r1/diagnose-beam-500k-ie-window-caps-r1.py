#!/usr/bin/env python3
"""Development-only BM25 pool bounds for shorter BEAM source fragments."""

import argparse
import ast
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PARQUET = ROOT / 'source/500K-00000-of-00001.parquet'
LIBRARY = HERE / 'diagnose-beam-500k-ie-cross-pool-r2.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    LIBRARY: '14711e750620904e5ab4771ed389fc7bf3580f8514ada8363aff42ba892979f6',
}
CAPS = (900, 1200, 1600, 2500)


def sha_file(path):
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
        raise ValueError('g03-beam-500k-ie-window-caps.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run():
    need(all(sha_file(path) == value for path, value in PINS.items()),
        'pinned-input-drift')
    library = import_file('beam_pool_library_window_caps', LIBRARY)
    candidate = library.import_file('beam_candidate_window_caps',
        library.CANDIDATE)
    bm25 = library.import_file('beam_bm25_window_caps', library.BM25)
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    raw = {}
    for row in pq.read_table(PARQUET,
            columns=['conversation_seed', 'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        raw[f"{seed['category']}:{seed['id']}"] = row['probing_questions']
    need(len(source) == 30 and len(raw) == 35, 'population')
    results = {}
    for cap in CAPS:
        candidate.UNIT_CHARS = cap
        entries_out = []
        for row in source:
            key = row['conversation_key']
            entries = ast.literal_eval(raw[key])['information_extraction']
            probes = [probe for probe in row['probes']
                if probe['ability'] == 'information_extraction']
            need(len(entries) == len(probes) == 2, 'ie-quota')
            units = [unit for turn_id, turn in enumerate(row['turns'])
                for unit in candidate.split_turn(turn, turn_id)]
            for ordinal, (probe, entry) in enumerate(zip(probes, entries)):
                probe_id = digest([key, 'information_extraction', ordinal,
                    digest(entry['question'])])[:24]
                need(probe_id == probe['id'], 'probe-binding')
                cited = set(entry['source_chat_ids'])
                need(cited and all(type(i) is int and 0 <= i < len(row['turns'])
                    for i in cited), 'citation-binding')
                ranking = library.pool(probe, units, bm25, candidate)
                top100 = {units[i]['source_turn'] for i in ranking[:100]}
                top300 = {units[i]['source_turn'] for i in ranking[:300]}
                entries_out.append({'probe_id': probe_id,
                    'cited_turns': len(cited),
                    'top100_reached': len(cited & top100),
                    'top300_reached': len(cited & top300),
                    'fragment_count': len(units)})
        need(len(entries_out) == 60, 'question-count')
        results[str(cap)] = {'questions': 60,
            'mean_fragment_count': sum(x['fragment_count']
                for x in entries_out) / 60,
            'cited_turns': sum(x['cited_turns'] for x in entries_out),
            'top100_hit_all': sum(x['top100_reached'] == x['cited_turns']
                for x in entries_out),
            'top300_hit_all': sum(x['top300_reached'] == x['cited_turns']
                for x in entries_out),
            'top100_cited_turns': sum(x['top100_reached'] for x in entries_out),
            'top300_cited_turns': sum(x['top300_reached'] for x in entries_out)}
        if cap == 2500:
            need(results[str(cap)]['top100_hit_all'] == 40 and
                results[str(cap)]['top300_hit_all'] == 48 and
                results[str(cap)]['top100_cited_turns'] == 51 and
                results[str(cap)]['top300_cited_turns'] == 60,
                'original-cap-reproduction')
    return {'schema_version': 'are.g03-beam-500k-ie-window-cap-diagnosis-r1/v1',
        'status': 'evaluator-only-exposed-development-cap-diagnosis',
        'input_sha256': {path.name: value for path, value in PINS.items()},
        'caps_utf16_chars': list(CAPS), 'results': results,
        'evaluator_answer_and_rubric_fields_read': False,
        'reserved_100k_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Development BM25 pool upper bounds for altered fragment size; no achieved retrieval, answer quality, cost, holdout, or superiority',
        'open_questions': ['Which fragment cap balances pool coverage and cross-encoder truncation?',
            'Would a selector using that cap improve answer-bearing evidence under 5K?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'fresh-output-required')
    result = run()
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'results': result['results'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
