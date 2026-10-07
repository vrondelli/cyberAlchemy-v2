#!/usr/bin/env python3
"""Audit r4's BM25 top-100/300/500 pool ceilings against development citation IDs."""

import argparse
import ast
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import pyarrow.parquet as pq


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PARQUET = ROOT / 'source/500K-00000-of-00001.parquet'
SELECTIONS = ROOT / 'CROSS-R4-ALL-SELECTIONS.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    SELECTIONS: '21563d67cd378171d9e21e3778ee92a4a56dfd0dfe2566e3ce810d58341e8f02',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
}


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
        raise ValueError('g03-beam-500k-ie-cross-pool-diagnosis-r2.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pool(probe, units, bm25, candidate):
    corpora = [Counter(bm25.tokens(unit['content'], candidate.STOP))
        for unit in units]
    lengths = [sum(freq.values()) for freq in corpora]
    average = sum(lengths) / len(lengths) if lengths else 1
    df = Counter(term for corpus in corpora for term in corpus)
    query = set(bm25.tokens(probe['question'], candidate.STOP))
    scored = []
    for index, corpus in enumerate(corpora):
        score = 0.0
        for term in query:
            freq = corpus.get(term, 0)
            if freq:
                idf = math.log(1 + (len(units) - df[term] + 0.5) /
                    (df[term] + 0.5))
                score += idf * freq * (bm25.K1 + 1) / (freq + bm25.K1 *
                    (1 - bm25.B + bm25.B * lengths[index] / average))
        unit = units[index]
        scored.append((-score, unit['role'] != 'user',
            -unit['source_turn'], -unit['part_index'], index))
    scored.sort()
    return [item[4] for item in scored]


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    candidate = import_file('beam_candidate_pool_diagnosis', CANDIDATE)
    bm25 = import_file('beam_bm25_pool_diagnosis', BM25)
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    selections = json.loads(SELECTIONS.read_text())
    need(len(source) == 30 and len(selections['selections']) == 60 and
        selections['evaluator_fields_read'] is False, 'sealed-source')
    by_id = {item['probe_id']: item for item in selections['selections']}
    raw = {}
    for row in pq.read_table(PARQUET,
            columns=['conversation_seed', 'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        raw[f"{seed['category']}:{seed['id']}"] = row['probing_questions']
    need(len(raw) == 35, 'raw-row-count')
    out = []
    for row in source:
        key = row['conversation_key']
        entries = ast.literal_eval(raw[key])['information_extraction']
        probes = [probe for probe in row['probes']
            if probe['ability'] == 'information_extraction']
        need(len(probes) == len(entries) == 2, 'ie-quota')
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        for ordinal, (probe, entry) in enumerate(zip(probes, entries)):
            probe_id = digest([key, 'information_extraction', ordinal,
                digest(entry['question'])])[:24]
            need(probe_id == probe['id'] and probe_id in by_id,
                'probe-binding')
            cited = set(entry['source_chat_ids'])
            need(cited and all(type(i) is int and 0 <= i < len(row['turns'])
                for i in cited), 'citation-binding')
            ranked_indices = pool(probe, units, bm25, candidate)
            candidate_indices = ranked_indices[:100]
            top300 = {units[index]['source_turn'] for index in ranked_indices[:300]}
            top500 = {units[index]['source_turn'] for index in ranked_indices[:500]}
            pooled = {units[index]['source_turn'] for index in candidate_indices}
            selected = {identity[0] for identity in
                by_id[probe_id]['treatment']['selected_fragment_identities']}
            control = {identity[0] for identity in
                by_id[probe_id]['control']['selected_fragment_identities']}
            need(selected <= pooled and
                by_id[probe_id]['conversation_key_sha256'] == digest(key),
                'r4-pool-binding')
            out.append({'probe_id': probe_id, 'cited_turns': len(cited),
                'pool_reached': len(cited & pooled),
                'top300_reached': len(cited & top300),
                'top500_reached': len(cited & top500),
                'total_fragments': len(ranked_indices),
                'treatment_reached': len(cited & selected),
                'control_reached': len(cited & control),
                'pool_fragments': len(candidate_indices),
                'selected_fragments': len(by_id[probe_id]['treatment'][
                    'selected_fragment_identities'])})
    need(len(out) == 60, 'question-count')
    summary = {'questions': 60,
        'cited_turns': sum(x['cited_turns'] for x in out),
        'pool_reached_turns': sum(x['pool_reached'] for x in out),
        'treatment_reached_turns': sum(x['treatment_reached'] for x in out),
        'control_reached_turns': sum(x['control_reached'] for x in out),
        'pool_hit_all': sum(x['pool_reached'] == x['cited_turns'] for x in out),
        'top300_hit_all': sum(x['top300_reached'] == x['cited_turns'] for x in out),
        'top500_hit_all': sum(x['top500_reached'] == x['cited_turns'] for x in out),
        'top300_reached_turns': sum(x['top300_reached'] for x in out),
        'top500_reached_turns': sum(x['top500_reached'] for x in out),
        'treatment_hit_all': sum(x['treatment_reached'] == x['cited_turns']
            for x in out),
        'pool_zero': sum(x['pool_reached'] == 0 for x in out),
        'r4_zero_but_pool_nonzero': sum(x['treatment_reached'] == 0 and
            x['pool_reached'] > 0 for x in out),
        'r4_partial_but_pool_all': sum(x['treatment_reached'] <
            x['cited_turns'] and x['pool_reached'] == x['cited_turns']
            for x in out)}
    return {'schema_version': 'are.g03-beam-500k-ie-cross-pool-diagnosis-r2/v1',
        'status': 'evaluator-only-exposed-development-pool-diagnosed',
        'input_sha256': {path.name: value for path, value in PINS.items()},
        'summary': summary, 'per_question': sorted(out,
            key=lambda item: item['probe_id']),
        'evaluator_answer_and_rubric_fields_read': False,
        'reserved_100k_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Development citation-pool diagnostic only; no answer quality, independent holdout, or superiority',
        'open_questions': ['Would a larger pool or improved packing materially improve answer-bearing evidence?',
            'How much added reranker cost would that require?']}


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
    print(json.dumps({'summary': result['summary'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
