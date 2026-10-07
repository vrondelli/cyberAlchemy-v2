#!/usr/bin/env python3
"""Diagnose exposed 500K IE retrieval misses without exporting source text."""

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
SOURCE_ONLY = ROOT / 'SOURCE-ONLY.jsonl'
PARQUET = ROOT / 'source/500K-00000-of-00001.parquet'
PREFLIGHT = ROOT / 'SOURCE-PREFLIGHT.json'
MOSAIC = HERE / 'plan-beam-dev-mosaic-r1.py'
PINS = {
    SOURCE_ONLY: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    PREFLIGHT: '8c7b401df2ecf33a59229dd0fb711f077ab78fa14ddf9fc96a4e70a23a509049',
    MOSAIC: '2300f749f97262f383c7286d5729db3a80dc73cbb040ab1123f1ac6375142cba',
}


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def digest(value):
    data = json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-miss-diagnosis.' + reason)


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    spec = importlib.util.spec_from_file_location('g03_beam_mosaic_diagnostic',
        MOSAIC)
    mosaic = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mosaic)
    source_rows = [json.loads(line) for line in SOURCE_ONLY.read_text().splitlines()]
    need(len(source_rows) == 30, 'source-count')
    by_key = {row['conversation_key']: row for row in source_rows}
    eligible = set(json.loads(PREFLIGHT.read_text())['eligible_seed_key_hashes'])
    labels = pq.read_table(PARQUET, columns=['conversation_seed',
        'probing_questions']).to_pylist()
    need(len(labels) == 35, 'label-count')
    summary = Counter()
    detail = []
    for row in labels:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        if digest(key) not in eligible:
            continue
        source = by_key[key]
        probes = [probe for probe in source['probes'] if
            probe['ability'] == 'information_extraction']
        labels_ie = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(probes) == len(labels_ie) == 2, 'ie-quota')
        for source_probe, label_probe in zip(probes, labels_ie):
            need(source_probe['question'] == label_probe['question'],
                'question-binding')
            cited = set(label_probe['source_chat_ids'])
            query = set(mosaic.terms(source_probe['question']))
            ranked = mosaic.turn_ranking(source_probe['question'], source['turns'])
            position = {turn_id: rank + 1 for rank, turn_id in enumerate(ranked)}
            one = []
            for turn_id in cited:
                turn = source['turns'][turn_id]
                overlap = query & set(mosaic.terms(turn['content']))
                size = mosaic.chars({'archived_evidence': [{'source_turn': turn_id,
                    'role': turn['role'], 'content': turn['content']}]})
                one.append({'rank': position[turn_id],
                    'query_term_overlap': len(overlap),
                    'full_turn_projection_chars': size,
                    'role': turn['role']})
                summary['cited_turns'] += 1
                summary['cited_zero_query_term_overlap'] += not overlap
                summary['cited_full_turn_over_5k'] += size > 5000
                for limit in (2, 5, 10, 20, 50, 100):
                    summary[f'cited_rank_top_{limit}'] += position[turn_id] <= limit
            summary['questions'] += 1
            summary['questions_all_citations_zero_overlap'] += all(
                item['query_term_overlap'] == 0 for item in one)
            summary['questions_any_citation_top_10'] += any(
                item['rank'] <= 10 for item in one)
            detail.append({'probe_id': source_probe['id'],
                'question_type': str(label_probe.get('question_type', 'missing')),
                'cited_turns': sorted(one, key=lambda item: item['rank'])})
    need(summary['questions'] == 60 and summary['cited_turns'] == 74 and
        len(detail) == 60, 'population-accounting')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-miss-diagnosis/v1',
        'status': 'development-retrieval-misses-diagnosed',
        'source_only_sha256': PINS[SOURCE_ONLY],
        'evaluator_source_sha256': PINS[PARQUET],
        'mosaic_ranker_sha256': PINS[MOSAIC],
        'summary': dict(sorted(summary.items())),
        'per_question': sorted(detail, key=lambda item: item['probe_id']),
        'reserved_100k_evaluator_fields_read': False,
        'answers_or_rubrics_emitted': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed development label/lexical rank diagnosis only; no answer quality, holdout, or superiority',
        'open_questions': ['Would semantic retrieval cover low-lexical-overlap citations?',
            'What evidence is needed to establish that cited turns contain answers?']}


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
    print(json.dumps({'status': result['status'],
        'summary': result['summary'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
