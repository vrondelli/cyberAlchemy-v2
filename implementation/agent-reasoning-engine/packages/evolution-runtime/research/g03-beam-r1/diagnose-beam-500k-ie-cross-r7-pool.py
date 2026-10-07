#!/usr/bin/env python3
"""Audit actual r7 600-character BM25 pool versus sealed selections and citations."""

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
SELECTIONS = ROOT / 'CROSS-R7-ALL-SELECTIONS.json'
AUDIT = ROOT / 'CROSS-R7-CITATION-AUDIT.json'
POOL_LIBRARY = HERE / 'diagnose-beam-500k-ie-cross-pool-r2.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    SELECTIONS: 'bb1b8ec1695f7913d1dca4773ffd6c8e0c953206c54b1d4f98ceea2103dcaa47',
    AUDIT: '6160535be09b538ba0aa91693254f7d9ec4c300b6ea6d449274e3339457f4388',
    POOL_LIBRARY: '14711e750620904e5ab4771ed389fc7bf3580f8514ada8363aff42ba892979f6',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-r7-pool-diagnosis.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run():
    need(all(sha(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    library = import_file('beam_pool_r7_diagnosis', POOL_LIBRARY)
    candidate = library.import_file('beam_candidate_r7_diagnosis',
        library.CANDIDATE)
    bm25 = library.import_file('beam_bm25_r7_diagnosis', library.BM25)
    candidate.UNIT_CHARS = 600
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    selections = json.loads(SELECTIONS.read_text())
    audit = json.loads(AUDIT.read_text())
    need(len(source) == 30 and len(selections['selections']) == 60 and
        len(audit['per_question']) == 60 and
        selections['evaluator_fields_read'] is False,
        'population-or-seal')
    by_id = {entry['probe_id']: entry for entry in selections['selections']}
    audited = {entry['probe_id']: entry for entry in audit['per_question']}
    raw = {}
    for row in pq.read_table(PARQUET,
            columns=['conversation_seed', 'probing_questions']).to_pylist():
        seed = row['conversation_seed']
        raw[f"{seed['category']}:{seed['id']}"] = (
            ast.literal_eval(row['probing_questions'])['information_extraction'])
    need(len(raw) == 35, 'raw-population')
    out = []
    for row in source:
        key = row['conversation_key']
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        entries = raw[key]
        need(len(probes) == len(entries) == 2, 'ie-quota')
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        for probe, entry in zip(probes, entries):
            need(probe['question'] == entry['question'] and
                probe['id'] in by_id and probe['id'] in audited,
                'question-binding')
            cited = set(entry['source_chat_ids'])
            need(cited, 'citation-binding')
            pool = library.pool(probe, units, bm25, candidate)[:300]
            pooled = {units[index]['source_turn'] for index in pool}
            selected_ids = by_id[probe['id']]['treatment'][
                'selected_fragment_identities']
            selected = {identity[0] for identity in selected_ids}
            reached = len(cited & selected)
            need(selected <= pooled and reached == audited[probe['id']][
                'treatment']['cited_turns_reached'], 'sealed-selection-binding')
            out.append({'probe_id': probe['id'],
                'cited_turns': len(cited),
                'pool_cited_turns_reached': len(cited & pooled),
                'selected_cited_turns_reached': reached,
                'pool_hit_all': int(cited <= pooled),
                'selected_hit_all': int(cited <= selected),
                'selected_fragments': len(selected_ids),
                'selected_distinct_turns': len(selected),
                'cited_fragment_bm25_pool_ranks': [rank + 1
                    for rank, index in enumerate(pool)
                    if units[index]['source_turn'] in cited]})
    need(len(out) == 60, 'question-count')
    summary = {'questions': 60,
        'cited_turns': sum(row['cited_turns'] for row in out),
        'pool_hit_all': sum(row['pool_hit_all'] for row in out),
        'pool_cited_turns_reached': sum(row['pool_cited_turns_reached'] for row in out),
        'selected_hit_all': sum(row['selected_hit_all'] for row in out),
        'selected_cited_turns_reached': sum(
            row['selected_cited_turns_reached'] for row in out),
        'zero_reach_with_citation_in_pool': sum(
            row['selected_cited_turns_reached'] == 0 and
            row['pool_cited_turns_reached'] > 0 for row in out),
        'partial_reach_with_all_citations_in_pool': sum(
            row['selected_cited_turns_reached'] < row['cited_turns'] and
            row['pool_hit_all'] for row in out)}
    return {'schema_version': 'are.g03-beam-500k-r7-pool-diagnosis/v1',
        'status': 'actual-600-char-development-pool-audited',
        'input_sha256': {path.name: expected for path, expected in PINS.items()},
        'summary': summary, 'per_question': sorted(out,
            key=lambda row: row['probe_id']),
        'evaluator_answer_or_rubric_fields_read': False,
        'reserved_100k_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed-development citation-pool diagnosis only; no answer quality, independent holdout or superiority',
        'open_questions': ['Should the next source-only mechanism target candidate-pool recall or rerank-and-pack diversity?']}


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
