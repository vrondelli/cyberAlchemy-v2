#!/usr/bin/env python3
"""Evaluator-only triage of the sealed one-conversation E5 feasibility run."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PARQUET = ROOT / 'source/500K-00000-of-00001.parquet'
SELECTIONS = ROOT / 'E5-R3-SOURCE-PREFLIGHT-ONE.json'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    PARQUET: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    SELECTIONS: '48928a774a9c3e87d68bf322bd8e6f173d8a41201ad19d17bed402d60d5f7a86',
}


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-e5-one-audit.' + reason)


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    source = json.loads(SOURCE.open().readline())
    key = source['conversation_key']
    selection = json.loads(SELECTIONS.read_text())
    need(selection['status'] == 'sealed-source-only-before-citation-audit' and
        selection['conversations'] == 1 and
        selection['information_extraction_questions'] == 2 and
        selection['evaluator_fields_read'] is False, 'selection-boundary')
    rows = pq.read_table(PARQUET, columns=['conversation_seed',
        'probing_questions']).to_pylist()
    matches = [row for row in rows if
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}" == key]
    need(len(matches) == 1, 'source-binding')
    labels = ast.literal_eval(matches[0]['probing_questions'])['information_extraction']
    by_id = {probe['id']: probe for probe in source['probes'] if
        probe['ability'] == 'information_extraction'}
    need(len(by_id) == len(labels) == 2, 'probe-count')
    results = []
    for item in selection['selections']:
        question = by_id[item['probe_id']]['question']
        matching = [entry for entry in labels if entry['question'] == question]
        need(len(matching) == 1, 'question-binding')
        cited = set(matching[0]['source_chat_ids'])
        need(cited, 'citation-shape')
        result = {'probe_id': item['probe_id'], 'cited_turns': len(cited)}
        for arm in ('treatment', 'control'):
            selected = {identity[0] for identity in
                item[arm]['selected_fragment_identities']}
            result[arm + '_cited_turns_reached'] = len(cited & selected)
        results.append(result)
    need(len(results) == 2, 'result-count')
    return {'schema_version': 'are.g03-beam-500k-ie-e5-one-audit/v1',
        'status': 'exposed-one-conversation-triage-only',
        'sealed_source_only_selection_sha256': PINS[SELECTIONS],
        'evaluator_source_sha256': PINS[PARQUET],
        'pairs': sorted(results, key=lambda item: item['probe_id']),
        'treatment_hit_all': sum(row['treatment_cited_turns_reached'] ==
            row['cited_turns'] for row in results),
        'control_hit_all': sum(row['control_cited_turns_reached'] ==
            row['cited_turns'] for row in results),
        'model_calls': 0,
        'claim_ceiling': 'One exposed development conversation only; no full 500K evaluation, GLM answers, held-out result, or superiority',
        'open_questions': ['Does E5 reranking recover on a broader development slice?',
            'Is the measured CPU cost acceptable relative to any answer-quality gain?']}


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
        'treatment_hit_all': result['treatment_hit_all'],
        'control_hit_all': result['control_hit_all'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
