#!/usr/bin/env python3
"""Seal equal-evidence-budget BM25 selections on exposed 500K IE development."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
R9 = ROOT / 'DUAL-VIEW-R9-ALL-SELECTIONS.json'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
    R9: '5d9107da49b1fa90016f1e84d9a99a36f839af9cae7aeb053b9348e7363a8e6a',
}


def file_sha(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-bm25-5k-r10.' + reason)


def imported(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and
         all(file_sha(path) == digest for path, digest in PINS.items()),
         'input-drift')
    candidate = imported('beam_projection_bm25_5k_r10', CANDIDATE)
    bm25 = imported('beam_bm25_5k_r10', BM25)
    candidate.UNIT_CHARS = 2500
    bm25.PROJECTION_CHARS = 5000
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    prior = json.loads(R9.read_text())
    old = {row['probe_id']: row for row in prior['selections']}
    need(len(source) == 30 and len(old) == 60, 'population')
    selections = []
    for row in source:
        units = [unit for turn_index, turn in enumerate(row['turns'])
                 for unit in candidate.split_turn(turn, turn_index)]
        probes = [probe for probe in row['probes']
                  if probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'question-quota')
        for probe in probes:
            old_row = old[probe['id']]
            need(old_row['conversation_key_sha256'] ==
                 candidate.sha(row['conversation_key']), 'prior-binding')
            selected = bm25.rank(probe, units, candidate)
            projection = {'archived_evidence': selected}
            identities = [[unit['source_turn'], unit['part_index']]
                          for unit in selected]
            need(len(identities) == len({tuple(item) for item in identities}) and
                 candidate.chars(projection) <= 5000, 'selection-boundary')
            selections.append({
                'probe_id': probe['id'],
                'conversation_key_sha256': old_row['conversation_key_sha256'],
                'selected_fragment_identities': identities,
                'projection_sha256': candidate.sha(projection),
                'projection_chars': candidate.chars(projection),
                'previous_bm25_2k5_projection_sha256':
                    old_row['control']['projection_sha256'],
            })
    need(len(selections) == 60 and
         len({item['probe_id'] for item in selections}) == 60,
         'selection-completeness')
    packet = {
        'schema_version': 'are.g03-beam-500k-dev-ie-bm25-5k-r10/v1',
        'status': 'source-only-equal-budget-development-selections',
        'source_sha256': PINS[SOURCE],
        'prior_r9_selections_sha256': PINS[R9],
        'candidate_code_sha256': PINS[CANDIDATE],
        'bm25_code_sha256': PINS[BM25],
        'control_unit_utf16_character_ceiling': 2500,
        'projection_utf16_character_ceiling': 5000,
        'questions': 60,
        'selections': sorted(selections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False,
        'model_calls': 0,
        'claim_ceiling': 'Exposed-development source-only equal-5K BM25; no answer quality, holdout or superiority',
        'open_questions': ['Does equal-5K BM25 close the source-evidence reach gap?',
                           'Does dual-view retain a direct-answer advantage over this comparator?'],
    }
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(raw)
    print(json.dumps({'status': packet['status'], 'questions': len(selections),
                      'receipt_sha256': hashlib.sha256(raw).hexdigest()},
                     sort_keys=True))


if __name__ == '__main__':
    main()
