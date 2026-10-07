#!/usr/bin/env python3
"""Seal candidate-selected BEAM development source turns before label access."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
TREATMENT = ROOT / 'TREATMENT-PROJECTION-r1.json'
TREATMENT_SHA = '061452525015aa9a274fa70ef87da957b7e2088cf1183b342353ad726528476c'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
CANDIDATE_CODE = Path(__file__).with_name('plan-beam-treatment-projection-r1.py')
CANDIDATE_CODE_SHA = '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-selection-seal.' + reason)


def load_candidate():
    need(sha(CANDIDATE_CODE.read_bytes()) == CANDIDATE_CODE_SHA,
        'candidate-code-drift')
    spec = importlib.util.spec_from_file_location('beam_treatment_candidate',
        CANDIDATE_CODE)
    candidate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(candidate)
    return candidate


def selected(candidate, probe, units, token_sets, idf):
    question_terms = candidate.terms(probe['question'])
    scored = []
    for index, unit in enumerate(units):
        overlap = question_terms.intersection(token_sets[index])
        relevance = sum(idf[term] for term in overlap)
        scored.append((-relevance, unit['role'] != 'user', -unit['source_turn'],
            -unit['part_index'], index, len(overlap)))
    scored.sort()
    chosen = []
    for item in scored:
        unit = units[item[4]]
        if candidate.chars({'archived_evidence': chosen + [unit]}) <= 5000:
            chosen.append(unit)
    chronological = sorted(chosen, key=lambda unit: (unit['source_turn'],
        unit['part_index']))
    need(chronological, 'empty-selection')
    result = candidate.project(probe, units, token_sets, idf)
    need(result['projection_sha256'] == candidate.sha(
        {'archived_evidence': chronological}) and
        result['selected_source_identity_sha256'] == candidate.sha([
            (unit['source_turn'], unit['part_index']) for unit in chronological]),
        'selection-not-candidate-equivalent')
    return result, [(unit['source_turn'], unit['part_index'])
        for unit in chronological]


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(TREATMENT.read_bytes()) == TREATMENT_SHA and
        sha(SPLIT.read_bytes()) == SPLIT_SHA, 'input-drift')
    candidate = load_candidate()
    treatment = json.loads(TREATMENT.read_text())
    split = json.loads(SPLIT.read_text())
    need(split['status'] == 'sealed-source-only-before-citation-audit' and
        split['development_probe_count'] == 80 and
        treatment['status'] == 'passed-source-only-not-evaluated',
        'receipt-shape')
    development = set(split['development_conversation_keys'])
    results, dev_selections = [], []
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20, 'source-rows')
    for row in rows:
        key = row['conversation_key']
        units = [unit for source_turn, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, source_turn)]
        token_sets = [candidate.terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        for probe in row['probes']:
            result, identities = selected(candidate, probe, units, token_sets,
                idf)
            results.append({'probe_id': probe['id'], 'ability': probe['ability'],
                'conversation_key_hash': candidate.sha(key),
                'history_sha256': candidate.sha(row['turns']), **result})
            if key in development:
                dev_selections.append({'conversation_key': key,
                    'probe_id': probe['id'], 'ability': probe['ability'],
                    'selected_fragment_identities': identities,
                    'selected_turn_ids': sorted({source_turn for source_turn, _
                        in identities}),
                    'projection_sha256': result['projection_sha256']})
    need(len(results) == 400 and len(dev_selections) == 80 and
        candidate.sha(sorted(results, key=lambda row: row['probe_id'])) ==
        treatment['projection_bindings_sha256'], 'candidate-root-mismatch')
    return {'schema_version': 'are.g03-beam-dev-source-selections/v1',
        'status': 'sealed-before-development-label-access',
        'source_only_sha256': SOURCE_SHA,
        'treatment_candidate_receipt_sha256': TREATMENT_SHA,
        'treatment_candidate_code_sha256': CANDIDATE_CODE_SHA,
        'development_split_sha256': SPLIT_SHA,
        'candidate_projection_bindings_sha256': treatment['projection_bindings_sha256'],
        'development_conversations': 4, 'development_probes': 80,
        'heldout_conversations_not_emitted': 16,
        'selections': sorted(dev_selections, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Sealed source-only development selections; no label outcome, native score, or superiority',
        'open_questions': ['What fraction of cited source turns appears in this candidate selection?',
            'Do source-turn citations adequately identify evidence for every BEAM ability?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'],
        'development_probes': receipt['development_probes'],
        'receipt_sha256': sha(data), 'output': str(args.output)},
        sort_keys=True))


if __name__ == '__main__':
    main()
