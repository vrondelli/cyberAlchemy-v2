#!/usr/bin/env python3
"""Seal BM25 source-only selections for second BEAM dev factoids, no labels."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
HERE = Path(__file__).resolve().parent
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
FIRST_BM25 = ROOT / 'DEV-FACTOID-BM25-CONTROL-r1.json'
TREATMENT = ROOT / 'DEV-SELECTIONS.json'
RANKER = HERE / 'plan-beam-factoid-bm25-control-r1.py'
FRAGMENTER = HERE / 'plan-beam-treatment-projection-r1.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    FIRST_BM25: 'fe543210a8e29a4ad5d3742d3046775d6aba2551ea747e18f32b1ef49b75ac89',
    TREATMENT: '129082c45b21f6fa826dfb6fad78a9c418ea3f6a864ecbff4dfd781160a7f20a',
    RANKER: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
    FRAGMENTER: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-second-factoid-plan.' + reason)


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    split = json.loads(SPLIT.read_text())
    first = json.loads(FIRST_BM25.read_text())
    treatment = json.loads(TREATMENT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout and
         first['evaluator_fields_read'] is False and
         treatment['evaluator_fields_read'] is False, 'split-boundary')
    first_by_id = {row['probe_id']: row for row in first['development_selections']}
    treatment_by_id = {row['probe_id']: row for row in treatment['selections']
                       if row['ability'] == 'information_extraction'}
    need(len(first_by_id) == 4 and len(treatment_by_id) == 8,
         'existing-selection-count')
    bm25 = module('beam_bm25_r1', RANKER)
    fragmenter = module('beam_fragmenter_r1', FRAGMENTER)
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(source) == 20 and {row['conversation_key'] for row in source} ==
         dev | holdout, 'source-population')
    selections = []
    for row in source:
        key = row['conversation_key']
        if key not in dev:
            continue
        probes = [probe for probe in row['probes']
                  if probe['ability'] == 'information_extraction']
        need(len(probes) == 2 and probes[0]['id'] in first_by_id,
             'probe-order')
        units = [unit for turn_id, turn in enumerate(row['turns'])
                 for unit in fragmenter.split_turn(turn, turn_id)]
        for ordinal, probe in enumerate(probes):
            selected = bm25.rank(probe, units, fragmenter)
            identities = [[unit['source_turn'], unit['part_index']]
                          for unit in selected]
            projection = {'archived_evidence': selected}
            if ordinal == 0:
                existing = first_by_id[probe['id']]
                need(existing['selected_fragment_identities'] == identities and
                     existing['projection_sha256'] == fragmenter.sha(projection),
                     'first-probe-ranker-regression')
                continue
            treatment_selection = treatment_by_id.get(probe['id'])
            need(treatment_selection is not None and
                 treatment_selection['conversation_key'] == key,
                 'treatment-second-probe-binding')
            selections.append({
                'probe_id': probe['id'], 'conversation_key': key,
                'bm25_selected_fragment_identities': identities,
                'bm25_projection_sha256': fragmenter.sha(projection),
                'bm25_projection_chars': fragmenter.chars(projection),
                'treatment_selected_fragment_identities':
                    treatment_selection['selected_fragment_identities'],
                'treatment_projection_sha256':
                    treatment_selection['projection_sha256'],
            })
    need(len(selections) == 4 and len({row['probe_id'] for row in selections}) == 4,
         'second-probe-count')
    return {
        'schema_version': 'are.g03-beam-dev-second-factoid-selections-r1/v1',
        'status': 'source-only-sealed-before-evaluator-audit',
        'source_only_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'treatment_selections_sha256': PINS[TREATMENT],
        'bm25_first_selections_sha256': PINS[FIRST_BM25],
        'bm25_code_sha256': PINS[RANKER],
        'fragmenter_code_sha256': PINS[FRAGMENTER],
        'development_conversations': 4, 'reserved_conversations_not_emitted': 16,
        'selections': sorted(selections, key=lambda item: item['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Four second-question exposed-development source-only projections; no citation audit, answer score, holdout, or superiority',
        'open_questions': ['Do either ranker’s selected fragments reach the cited source turns?',
                           'Does citation reach predict answer-bearing evidence?'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'selections': len(result['selections']),
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
