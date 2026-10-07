#!/usr/bin/env python3
"""Seal matched ARE and BM25 source selections before citation inspection."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
RECEIPT = ROOT / 'SOURCE-ONLY-RECEIPT.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    RECEIPT: '2e63d4a74d57d822c73bc806025acf36d57ab38fed75d0597282366d981f478d',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-paired-source.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def candidate_units(probe, units, token_sets, idf, candidate):
    query = candidate.terms(probe['question'])
    scored = []
    for index, unit in enumerate(units):
        overlap = query.intersection(token_sets[index])
        scored.append((-sum(idf[term] for term in overlap),
            unit['role'] != 'user', -unit['source_turn'],
            -unit['part_index'], index))
    scored.sort()
    selected = []
    for item in scored:
        unit = units[item[4]]
        if candidate.chars({'archived_evidence': selected + [unit]}) <= 5000:
            selected.append(unit)
    selected.sort(key=lambda unit: (unit['source_turn'], unit['part_index']))
    result = candidate.project(probe, units, token_sets, idf)
    need(candidate.sha({'archived_evidence': selected}) ==
        result['projection_sha256'], 'candidate-cross-check')
    return selected


def binding(probe, key, units, candidate):
    identity = [[unit['source_turn'], unit['part_index']] for unit in units]
    return {'probe_id': probe['id'],
        'conversation_key_sha256': candidate.sha(key),
        'selected_fragment_identities': identity,
        'projection_sha256': candidate.sha({'archived_evidence': units}),
        'projection_chars': candidate.chars({'archived_evidence': units})}


def run():
    need(all(sha_file(path) == digest for path, digest in PINS.items()),
        'input-drift')
    source_receipt = json.loads(RECEIPT.read_text())
    need(source_receipt['evaluator_fields_emitted'] is False and
        source_receipt['conversations'] == 30 and
        source_receipt['probes'] == 600, 'source-boundary')
    candidate = import_file('g03_beam_candidate_500k_r1', CANDIDATE)
    bm25 = import_file('g03_beam_bm25_500k_r1', BM25)
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 30, 'row-count')
    selections = []
    total_units = 0
    for row in rows:
        need(set(row) == {'conversation_key', 'turns', 'probes'} and
            len(row['probes']) == 20, 'row-shape')
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ie-quota')
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        total_units += len(units)
        token_sets = [candidate.terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        for probe in probes:
            need(set(probe) == {'id', 'ability', 'question'}, 'probe-shape')
            treatment = candidate_units(probe, units, token_sets, idf,
                candidate)
            control = bm25.rank(probe, units, candidate)
            selections.append({'probe_id': probe['id'],
                'conversation_key_sha256': candidate.sha(row['conversation_key']),
                'treatment': binding(probe, row['conversation_key'],
                    treatment, candidate),
                'control': binding(probe, row['conversation_key'],
                    control, candidate)})
    need(len(selections) == 60 and len({x['probe_id'] for x in selections}) == 60,
        'question-count')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-paired-source/v1',
        'status': 'sealed-source-only-before-citation-audit',
        'source_only_sha256': PINS[SOURCE],
        'source_only_receipt_sha256': PINS[RECEIPT],
        'candidate_code_sha256': PINS[CANDIDATE],
        'bm25_code_sha256': PINS[BM25],
        'conversations': 30, 'information_extraction_questions': 60,
        'source_fragments': total_units,
        'unit_utf16_character_ceiling': 2500,
        'projection_utf16_character_ceiling': 5000,
        'selections': sorted(selections, key=lambda x: x['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Matched source-only development selections; no gold citation audit, answer quality, 8K wire, holdout, or superiority',
        'open_questions': ['Do these selected fragments reach the BEAM-cited turns?',
            'Can a changed mechanism improve retrieval and answer quality?']}


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
        'conversations': result['conversations'],
        'questions': result['information_extraction_questions'],
        'source_fragments': result['source_fragments'],
        'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
