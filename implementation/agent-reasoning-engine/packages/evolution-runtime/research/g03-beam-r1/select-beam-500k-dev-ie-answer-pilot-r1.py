#!/usr/bin/env python3
"""Choose 12 distinct 500K IE development questions without evaluator labels."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SELECTIONS = ROOT / 'CROSS-R4-ALL-SELECTIONS.json'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    SELECTIONS: '21563d67cd378171d9e21e3778ee92a4a56dfd0dfe2566e3ce810d58341e8f02',
}


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def digest(value):
    data = json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-answer-pilot-select.' + reason)


def run():
    need(all(sha_file(path) == value for path, value in PINS.items()),
        'pinned-input-drift')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    selection = json.loads(SELECTIONS.read_text())
    need(len(rows) == 30 and selection['conversations'] == 30 and
        selection['information_extraction_questions'] == 60 and
        selection['evaluator_fields_read'] is False, 'population-boundary')
    sealed_ids = {item['probe_id'] for item in selection['selections']}
    need(len(sealed_ids) == 60, 'sealed-probe-count')
    candidates = []
    for row in rows:
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2 and all(probe['id'] in sealed_ids
            for probe in probes), 'ie-probe-binding')
        chosen = min(probes, key=lambda probe: digest(probe['id']))
        candidates.append({'conversation_key_hash': digest(row['conversation_key']),
            'probe_id': chosen['id'],
            'conversation_order_hash': digest(['pilot-conversation-r1',
                row['conversation_key']])})
    candidates.sort(key=lambda item: (item['conversation_order_hash'],
        item['probe_id']))
    pilot = candidates[:12]
    need(len(pilot) == len({item['conversation_key_hash'] for item in pilot}) ==
        len({item['probe_id'] for item in pilot}) == 12, 'sample-count')
    return {'schema_version': 'are.g03-beam-500k-ie-answer-pilot-selection/v1',
        'status': 'source-only-score-blind-development-sample',
        'source_only_sha256': PINS[SOURCE],
        'cross_r4_selections_sha256': PINS[SELECTIONS],
        'population_conversations': 30, 'population_questions': 60,
        'sample_conversations': 12, 'sample_questions': 12,
        'selection_rule': 'sort 30 conversations by SHA256 canonical [pilot-conversation-r1,key]; take first 12; choose one of two IE probes by minimum SHA256 canonical probe ID',
        'sample': pilot,
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Exposed development answer pilot selection only; no independent cohort, answer quality, or superiority',
        'open_questions': ['Can all 24 exact arm wires pass the GLM 8K tokenizer?',
            'What fixed ability-specific scorer is reliable for these 12 questions?']}


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
        'sample_questions': result['sample_questions'],
        'sample_conversations': result['sample_conversations'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
