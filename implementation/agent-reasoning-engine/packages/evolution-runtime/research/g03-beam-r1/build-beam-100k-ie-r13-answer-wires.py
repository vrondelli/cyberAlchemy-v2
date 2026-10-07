#!/usr/bin/env python3
"""Build 64 matched source-only r13 answer wires from sealed selections."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-ONLY.jsonl')
SELECTIONS = ROOT / 'SELECTIONS.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
PROMPT = HERE / 'build-beam-500k-dev-ie-cross-r6-wires.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    PROMPT: '91eae789f0d6f6400885f026f8222b0c2721ff1666d9661b382101918421d2a0',
}


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-100k-ie-r13-answer-wires.' + reason)


def run(selection_sha):
    need(all(sha_file(path) == digest for path, digest in PINS.items()) and
         sha_file(SELECTIONS) == selection_sha, 'input-drift')
    candidate = import_file('beam_r13_wires_candidate', CANDIDATE)
    prompt = import_file('beam_r13_wires_prompt', PROMPT)
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-selections/v1' and
         sealed['status'] == 'sealed-source-only-before-evaluator-or-glm' and
         sealed['information_extraction_questions'] == 32 and
         sealed['reserved_conversations'] == 16 and
         sealed['evaluator_fields_read'] is False and
         sealed['glm_model_calls'] == 0, 'selection-boundary')
    by_probe = {item['probe_id']: item for item in sealed['selections']}
    need(len(by_probe) == 32, 'selection-uniqueness')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    wires = []
    for row in rows:
        probes = [p for p in row['probes'] if p['id'] in by_probe]
        if not probes:
            continue
        need(len(probes) == 2 and all(p['ability'] ==
             'information_extraction' for p in probes), 'reserved-ie-quota')
        key_hash = candidate.sha(row['conversation_key'])
        candidate.UNIT_CHARS = 2500
        control_units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        candidate.UNIT_CHARS = 600
        treatment_units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        control_by_id = {(u['source_turn'], u['part_index']): u
            for u in control_units}
        treatment_by_id = {(u['source_turn'], u['part_index']): u
            for u in treatment_units}
        for probe in probes:
            bound = by_probe[probe['id']]
            need(bound['conversation_key_sha256'] == key_hash and
                 bound['question_sha256'] == candidate.sha(probe['question']),
                 'question-binding')
            for arm in ('control', 'treatment'):
                selection = bound[arm]
                if arm == 'control':
                    chosen = [control_by_id[tuple(identity)] for identity in
                        selection['selected_fragment_identities']]
                    projection = {'archived_evidence': chosen}
                else:
                    semantic = [treatment_by_id[tuple(identity)] for identity in
                        selection['semantic_fragment_identities']]
                    lexical = [treatment_by_id[tuple(identity)] for identity in
                        selection['lexical_fragment_identities']]
                    projection = {'semantic_evidence': semantic,
                        'lexical_evidence': lexical}
                    need(candidate.chars({'semantic_evidence': semantic}) <=
                         2500, 'semantic-cap')
                need(candidate.sha(projection) ==
                     selection['projection_sha256'] and
                     candidate.chars(projection) ==
                     selection['projection_chars'] <= 5000,
                     'projection-binding')
                user = ('Current question:\n' + probe['question'] +
                    '\n\nArchived conversation evidence:\n' +
                    json.dumps(projection, ensure_ascii=False,
                        separators=(',', ':')))
                request = {'model': 'glm-5.3-flash',
                    'messages': [{'role': 'system', 'content': prompt.SYSTEM},
                        {'role': 'user', 'content': user}],
                    'thinking': {'type': 'enabled'},
                    'reasoning_effort': 'low', 'max_tokens': 512,
                    'stream': False}
                wires.append({'probe_id': probe['id'], 'arm': arm,
                    'conversation_key_sha256': key_hash,
                    'projection_sha256': selection['projection_sha256'],
                    'request_sha256': prompt.digest(request),
                    'request': request})
    need(len(wires) == 64 and len({(row['probe_id'], row['arm']) for row
         in wires}) == 64 and {row['probe_id'] for row in wires} ==
         set(by_probe), 'matched-64-wires')
    return {'schema_version': 'are.g03-beam-100k-ie-r13-answer-wires/v1',
        'status': 'source-only-reserved-wires-not-token-qualified',
        'source_sha256': PINS[SOURCE], 'selections_sha256': selection_sha,
        'fragmenter_sha256': PINS[CANDIDATE],
        'system_prompt_sha256': prompt.digest(prompt.SYSTEM.encode()),
        'reserved_conversations': 16, 'reserved_questions': 32,
        'matched_wires': 64, 'maximum_generation_calls': 64,
        'automatic_retries': 0, 'context_window_tokens': 8192,
        'answer_output_reserve_tokens': 512,
        'evaluator_fields_read': False, 'model_calls': 0,
        'wires': sorted(wires, key=lambda row: (row['probe_id'], row['arm'])),
        'claim_ceiling': 'Source-only reserved answer wires; no tokenizer admission, answer, label integrity, score, or superiority',
        'open_questions': ['Do all 64 requests pass same-account 8K token admission?',
                           'Does the frozen answer stage complete 32 matched pairs?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and len(args.selection_sha256) == 64,
         'arguments')
    result = run(args.selection_sha256)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'], 'wires': len(result['wires']),
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
