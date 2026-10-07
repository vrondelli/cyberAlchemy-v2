#!/usr/bin/env python3
"""Build 120 matched source-only GLM answer wires for sealed r9 dual views."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SELECTIONS = ROOT / 'DUAL-VIEW-R9-ALL-SELECTIONS.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
R6_BUILDER = HERE / 'build-beam-500k-dev-ie-cross-r6-wires.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    R6_BUILDER: '91eae789f0d6f6400885f026f8222b0c2721ff1666d9661b382101918421d2a0',
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-dual-view-r9-wires.' + reason)


def run(selection_sha):
    need(all(sha(path) == expected for path, expected in PINS.items()) and
        sha(SELECTIONS) == selection_sha, 'pinned-input-drift')
    candidate = import_file('beam_ie_r9_wire_fragmenter', CANDIDATE)
    r6 = import_file('beam_ie_r9_wire_prompt', R6_BUILDER)
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] == 'are.g03-beam-500k-dev-ie-dual-view-r9/v1'
        and sealed['status'] == 'sealed-source-only-before-citation-audit'
        and sealed['information_extraction_questions'] == 60
        and sealed['development_conversations'] == 30
        and sealed['evaluator_fields_read'] is False
        and sealed['glm_model_calls'] == 0
        and len(sealed['selections']) == 60, 'source-only-seal')
    by_id = {row['probe_id']: row for row in sealed['selections']}
    need(len(by_id) == 60, 'unique-probes')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 30, 'source-population')
    wires = []
    for row in rows:
        key_hash = candidate.sha(row['conversation_key'])
        candidate.UNIT_CHARS = 2500
        control_units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        candidate.UNIT_CHARS = 600
        treatment_units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        control_by_id = {(unit['source_turn'], unit['part_index']): unit
            for unit in control_units}
        treatment_by_id = {(unit['source_turn'], unit['part_index']): unit
            for unit in treatment_units}
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ie-quota')
        for probe in probes:
            bindings = by_id[probe['id']]
            need(bindings['conversation_key_sha256'] == key_hash,
                'conversation-binding')
            control = bindings['control']
            control_projection = {'archived_evidence': [control_by_id[
                tuple(identity)] for identity in
                control['selected_fragment_identities']]}
            treatment = bindings['treatment']
            semantic = [treatment_by_id[tuple(identity)] for identity in
                treatment['semantic_fragment_identities']]
            lexical = [treatment_by_id[tuple(identity)] for identity in
                treatment['lexical_fragment_identities']]
            treatment_projection = {'semantic_evidence': semantic,
                'lexical_evidence': lexical}
            all_ids = sorted([*treatment['semantic_fragment_identities'],
                *treatment['lexical_fragment_identities']])
            need(all_ids == treatment['selected_fragment_identities'] and
                len(all_ids) == len({tuple(identity) for identity in all_ids})
                and candidate.chars({'semantic_evidence': semantic}) <= 2500,
                'treatment-view-binding')
            for arm, binding, projection in (
                    ('control', control, control_projection),
                    ('treatment', treatment, treatment_projection)):
                need(binding['probe_id'] == probe['id'] and
                    binding['conversation_key_sha256'] == key_hash and
                    candidate.sha(projection) == binding['projection_sha256']
                    and candidate.chars(projection) == binding['projection_chars']
                    and candidate.chars(projection) <= 5000,
                    'projection-binding')
                user = ('Current question:\n' + probe['question'] +
                    '\n\nArchived conversation evidence:\n' +
                    json.dumps(projection, ensure_ascii=False,
                        separators=(',', ':')))
                request = {'model': 'glm-5.3-flash',
                    'messages': [{'role': 'system', 'content': r6.SYSTEM},
                        {'role': 'user', 'content': user}],
                    'thinking': {'type': 'enabled'},
                    'reasoning_effort': 'low', 'max_tokens': 512,
                    'stream': False}
                wires.append({'probe_id': probe['id'], 'arm': arm,
                    'conversation_key_sha256': key_hash,
                    'projection_sha256': binding['projection_sha256'],
                    'request_sha256': r6.digest(request),
                    'request': request})
    need(len(wires) == 120 and
        len({(row['probe_id'], row['arm']) for row in wires}) == 120 and
        {row['probe_id'] for row in wires} == set(by_id), 'matched-wires')
    return {'schema_version': 'are.g03-beam-500k-ie-dual-view-r9-answer-wires/v1',
        'status': 'source-only-development-wires-not-token-qualified',
        'source_sha256': PINS[SOURCE],
        'selections_sha256': selection_sha,
        'fragmenter_sha256': PINS[CANDIDATE],
        'system_prompt_sha256': r6.digest(r6.SYSTEM.encode()),
        'development_conversations': 30, 'development_questions': 60,
        'matched_wires': 120, 'maximum_generation_calls': 120,
        'automatic_retries': 0, 'context_window_tokens': 8192,
        'answer_output_reserve_tokens': 512,
        'evaluator_fields_read': False, 'model_calls': 0,
        'wires': sorted(wires, key=lambda row: (row['probe_id'], row['arm'])),
        'claim_ceiling': 'Source-only r9 matched development answer wires; no tokenizer admission, answers, scorer, holdout or superiority',
        'open_questions': ['Do all 120 wires pass exact same-account 8K tokenizer admission?',
            'Does dual-view source evidence improve full-population paired answer quality?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(len(args.selection_sha256) == 64 and
        all(char in '0123456789abcdef' for char in args.selection_sha256)
        and not args.output.exists(), 'arguments')
    result = run(args.selection_sha256)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'], 'wires': len(result['wires']),
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
