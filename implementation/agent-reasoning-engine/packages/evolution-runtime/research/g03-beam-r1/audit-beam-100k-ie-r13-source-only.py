#!/usr/bin/env python3
"""Independently rebuild r13 selected source views without evaluator fields."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
DEV500K = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/SOURCE-ONLY.jsonl')
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    DEV500K: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
}


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-100k-ie-r13-source-audit.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--selections', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and sha_file(args.selections) ==
         args.selection_sha256 and all(sha_file(path) == digest
         for path, digest in PINS.items()), 'input-drift')
    candidate = import_file('beam_r13_audit_candidate', CANDIDATE)
    bm25 = import_file('beam_r13_audit_bm25', BM25)
    packet = json.loads(args.selections.read_text())
    split = json.loads(SPLIT.read_text())
    source = {row['conversation_key']: row for row in
        (json.loads(line) for line in SOURCE.read_text().splitlines())}
    dev_keys = {json.loads(line)['conversation_key'] for line in
        DEV500K.read_text().splitlines()}
    heldout = set(split['heldout_conversation_keys'])
    need(len(heldout) == 16 and not (heldout & dev_keys) and
         packet['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-selections/v1' and
         packet['status'] == 'sealed-source-only-before-evaluator-or-glm' and
         packet['evaluator_fields_read'] is False and
         packet['glm_model_calls'] == 0 and
         packet['source_sha256'] == PINS[SOURCE] and
         packet['split_sha256'] == PINS[SPLIT] and
         len(packet['selections']) == 32, 'population-boundary')
    by_probe = {row['probe_id']: row for row in packet['selections']}
    need(len(by_probe) == 32, 'duplicate-probe')
    counts = {'control_projections_verified': 0,
              'treatment_projections_verified': 0,
              'question_hashes_verified': 0,
              'conversation_keys_disjoint_from_500k_development': 16}
    for key in sorted(heldout):
        row = source[key]
        candidate.UNIT_CHARS = 2500
        control_units = [u for turn_id, turn in enumerate(row['turns'])
            for u in candidate.split_turn(turn, turn_id)]
        candidate.UNIT_CHARS = 600
        treatment_units = [u for turn_id, turn in enumerate(row['turns'])
            for u in candidate.split_turn(turn, turn_id)]
        control_by_id = {(u['source_turn'], u['part_index']): u
            for u in control_units}
        treatment_by_id = {(u['source_turn'], u['part_index']): u
            for u in treatment_units}
        for probe in (p for p in row['probes'] if
                      p['ability'] == 'information_extraction'):
            bound = by_probe[probe['id']]
            need(bound['conversation_key_sha256'] == candidate.sha(key) and
                 bound['question_sha256'] == candidate.sha(probe['question']),
                 'question-binding')
            counts['question_hashes_verified'] += 1
            control = bound['control']
            c_ids = [tuple(value) for value in
                     control['selected_fragment_identities']]
            need(len(set(c_ids)) == len(c_ids) and
                 all(identity in control_by_id for identity in c_ids),
                 'control-identities')
            c_projection = {'archived_evidence': [control_by_id[i]
                for i in c_ids]}
            ranked = bm25.rank(probe, control_units, candidate)
            need(c_projection['archived_evidence'] == ranked and
                 candidate.sha(c_projection) == control['projection_sha256']
                 and candidate.chars(c_projection) ==
                 control['projection_chars'] <= 5000, 'control-reconstruction')
            counts['control_projections_verified'] += 1
            treatment = bound['treatment']
            semantic_ids = [tuple(value) for value in
                treatment['semantic_fragment_identities']]
            lexical_ids = [tuple(value) for value in
                treatment['lexical_fragment_identities']]
            all_ids = semantic_ids + lexical_ids
            need(semantic_ids and lexical_ids and len(set(all_ids)) ==
                 len(all_ids) and all(identity in treatment_by_id
                 for identity in all_ids), 'treatment-identities')
            projection = {'semantic_evidence': [treatment_by_id[i]
                for i in semantic_ids], 'lexical_evidence': [treatment_by_id[i]
                for i in lexical_ids]}
            need(candidate.chars({'semantic_evidence':
                 projection['semantic_evidence']}) <= 2500 and
                 candidate.chars(projection) ==
                 treatment['projection_chars'] <= 5000 and
                 candidate.sha(projection) == treatment['projection_sha256'],
                 'treatment-reconstruction')
            counts['treatment_projections_verified'] += 1
    need(all(counts[name] == 32 for name in
         ('control_projections_verified', 'treatment_projections_verified',
          'question_hashes_verified')), 'complete-audit')
    result = {'schema_version': 'are.g03-beam-100k-ie-r13-source-audit/v1',
        'status': 'passed-source-only-reconstruction',
        'selection_sha256': args.selection_sha256,
        'source_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'development_source_sha256': PINS[DEV500K],
        'counts': counts, 'evaluator_fields_read': False,
        'glm_model_calls': 0,
        'claim_ceiling': 'Source-only reconstruction only; no 8K admission, answer, score, or superiority',
        'open_questions': ['Do matched answer wires pass same-account 8K admission?',
                           'Do the reference labels pass answer-blind integrity review?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'], 'counts': counts,
        'audit_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
