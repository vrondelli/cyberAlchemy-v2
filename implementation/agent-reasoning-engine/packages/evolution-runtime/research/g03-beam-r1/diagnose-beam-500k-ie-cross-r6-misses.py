#!/usr/bin/env python3
"""Locate r6 zero-reach development misses in its actual 900-char BM25 pool."""

import argparse
import ast
import hashlib
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PARQUET = ROOT / 'source/500K-00000-of-00001.parquet'
SELECTIONS = ROOT / 'CROSS-R6-ALL-SELECTIONS.json'
AUDIT = ROOT / 'CROSS-R6-CITATION-AUDIT.json'
PLANNER = HERE / 'plan-beam-500k-dev-ie-cross-r6.py'
POOL_DIAGNOSIS = HERE / 'diagnose-beam-500k-ie-cross-pool-r2.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    SELECTIONS: '228a8fe577266d705cc5708db58facd04cdbf0bcebecdc6d9f7b8c976f4f7e68',
    AUDIT: 'b732fcf2c7a6089b47e1fe5386b33d868f2eddd301a59ca1fb483230033f4891',
    PLANNER: 'b0f4793d5aa1c0932074c17b39db5a576a874026c5f3dafd5781e4f9b120344a',
    POOL_DIAGNOSIS: '14711e750620904e5ab4771ed389fc7bf3580f8514ada8363aff42ba892979f6',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-r6-miss-diagnosis.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run():
    need(all(sha(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    pool_diagnosis = import_file('r6_pool_miss_diagnosis', POOL_DIAGNOSIS)
    candidate = pool_diagnosis.import_file('r6_candidate_miss_diagnosis',
        pool_diagnosis.CANDIDATE)
    bm25 = pool_diagnosis.import_file('r6_bm25_miss_diagnosis',
        pool_diagnosis.BM25)
    candidate.UNIT_CHARS = 900
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    selection = json.loads(SELECTIONS.read_text())
    audit = json.loads(AUDIT.read_text())
    need(len(source) == 30 and len(selection['selections']) == 60 and
        len(audit['per_question']) == 60, 'population')
    by_id = {row['probe_id']: row for row in selection['selections']}
    missed = {row['probe_id'] for row in audit['per_question'] if
        row['treatment']['cited_turns_reached'] == 0}
    raw = {}
    for row in pq.read_table(PARQUET,
            columns=['conversation_seed', 'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        raw[f"{seed['category']}:{seed['id']}"] = (
            ast.literal_eval(row['probing_questions'])['information_extraction'])
    need(len(raw) == 35, 'raw-population')
    results = []
    for row in source:
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == len(raw[row['conversation_key']]) == 2,
            'ie-quota')
        if not any(probe['id'] in missed for probe in probes):
            continue
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        for ordinal, probe in enumerate(probes):
            if probe['id'] not in missed:
                continue
            entry = raw[row['conversation_key']][ordinal]
            need(probe['question'] == entry['question'], 'question-binding')
            cites = set(entry['source_chat_ids'])
            need(cites, 'citations')
            pool = pool_diagnosis.pool(probe, units, bm25, candidate)[:300]
            pooled = {units[index]['source_turn'] for index in pool}
            selected = {item[0] for item in by_id[probe['id']]['treatment'][
                'selected_fragment_identities']}
            need(len(pool) == 300 and selected <= pooled and
                not selected & cites, 'sealed-selection-binding')
            results.append({'probe_id': probe['id'],
                'cited_turns': len(cites),
                'cited_source_turns': sorted(cites),
                'cited_turns_in_actual_900_char_top300': len(cites & pooled),
                'cited_fragment_pool_ranks': [
                    rank + 1 for rank, index in enumerate(pool)
                    if units[index]['source_turn'] in cites],
                'selected_fragments': len(by_id[probe['id']]['treatment'][
                    'selected_fragment_identities'])})
    need(len(results) == len(missed), 'miss-accounting')
    return {'schema_version': 'are.g03-beam-500k-r6-miss-diagnosis/v1',
        'status': 'actual-short-window-pool-audited',
        'input_sha256': {path.name: expected for path, expected in PINS.items()},
        'zero_reach_questions': len(missed),
        'zero_reach_with_cited_turn_in_pool': sum(
            row['cited_turns_in_actual_900_char_top300'] > 0
            for row in results),
        'per_question': sorted(results, key=lambda row: row['probe_id']),
        'evaluator_answer_or_rubric_fields_read': False,
        'glm_or_cross_encoder_calls': 0,
        'claim_ceiling': 'Exposed-development evaluator-only pool diagnosis; no answer-quality or superiority claim',
        'open_questions': ['Are pool-available citations ranked too low by the cross-encoder or excluded by 5K packing?']}


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
    print(json.dumps({'zero_reach_questions': result['zero_reach_questions'],
        'zero_reach_with_cited_turn_in_pool':
            result['zero_reach_with_cited_turn_in_pool'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
