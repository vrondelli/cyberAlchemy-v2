#!/usr/bin/env python3
"""Freeze exposed-development questions with differential cited-turn reach."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SELECTIONS = ROOT / 'CROSS-R4-ALL-SELECTIONS.json'
AUDIT = ROOT / 'CROSS-R4-CITATION-AUDIT.json'
PINS = {SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    SELECTIONS: '21563d67cd378171d9e21e3778ee92a4a56dfd0dfe2566e3ce810d58341e8f02',
    AUDIT: '4ae69ed08a8e21c500e7eda23ddd84bc768921e4cfb6ce85d3aaeb53aa234c6f'}


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
        raise ValueError('g03-beam-500k-ie-discordant-r2.' + reason)


def run():
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    selections = json.loads(SELECTIONS.read_text())
    audit = json.loads(AUDIT.read_text())
    need(len(source) == 30 and len(selections['selections']) == 60 and
        len(audit['per_question']) == 60, 'population-boundary')
    source_ids = {probe['id']: digest(row['conversation_key'])
        for row in source for probe in row['probes']
        if probe['ability'] == 'information_extraction'}
    selection_ids = {row['probe_id'] for row in selections['selections']}
    need(len(source_ids) == len(selection_ids) == 60 and
        set(source_ids) == selection_ids, 'source-binding')
    sample = []
    for row in audit['per_question']:
        left = row['treatment']['cited_turns_reached']
        right = row['control']['cited_turns_reached']
        if left == right:
            continue
        probe_id = row['probe_id']
        need(probe_id in source_ids and row['cited_turns'] > 0,
            'discordant-binding')
        sample.append({'probe_id': probe_id,
            'conversation_key_hash': source_ids[probe_id],
            'citation_direction': 'treatment' if left > right else 'control',
            'treatment_cited_turns_reached': left,
            'control_cited_turns_reached': right,
            'cited_turns': row['cited_turns']})
    sample.sort(key=lambda row: row['probe_id'])
    need(len(sample) == 8 and
        len({row['conversation_key_hash'] for row in sample}) == 7 and
        sum(row['citation_direction'] == 'treatment' for row in sample) == 7 and
        sum(row['citation_direction'] == 'control' for row in sample) == 1,
        'expected-eight')
    return {'schema_version': 'are.g03-beam-500k-ie-discordant-sample-r2/v1',
        'status': 'evaluator-citation-conditioned-exposed-development-only',
        'input_sha256': {path.name: sha for path, sha in PINS.items()},
        'selection_rule': 'all and only the eight 60-question development probes whose sealed r4 and BM25 selected cited-turn counts differ',
        'sample': sample, 'questions': 8, 'conversations': 7,
        'evaluator_citation_fields_read': True,
        'evaluator_answer_and_rubric_fields_read': False,
        'generation_wires_must_exclude_evaluator_fields': True,
        'model_calls': 0,
        'claim_ceiling': 'Citation-conditioned exposed-development mechanism triage only; not a random sample, native BEAM score, independent holdout, or superiority',
        'open_questions': ['Does r4 citation reach correspond to answer-bearing evidence?',
            'Does the matched GLM answer quality follow the same direction?']}


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
    print(json.dumps({'status': result['status'], 'questions': 8,
        'conversations': 7, 'receipt_sha256': hashlib.sha256(data).hexdigest()},
        sort_keys=True))


if __name__ == '__main__':
    main()
