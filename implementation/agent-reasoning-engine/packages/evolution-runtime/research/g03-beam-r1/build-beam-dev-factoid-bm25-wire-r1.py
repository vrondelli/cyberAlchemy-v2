#!/usr/bin/env python3
"""Use identical factoid prompts with sealed BM25 development evidence."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
BM25 = ROOT / 'DEV-FACTOID-BM25-CONTROL-r1.json'
TREATMENT_WIRE = ROOT / 'DEV-FACTOID-WIRES-r1.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    BM25: 'fe543210a8e29a4ad5d3742d3046775d6aba2551ea747e18f32b1ef49b75ac89',
    TREATMENT_WIRE: '5d667fc5a53cba25a735077fc326a5f53ae7b7c4d71b7852f9c6cb4c635a654e',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
}
SEPARATOR = '\n\nArchived conversation evidence:\n'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-factoid-bm25-wire.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    spec = importlib.util.spec_from_file_location('beam_candidate_r1', CANDIDATE)
    candidate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(candidate)
    bm25 = json.loads(BM25.read_text())
    treatment = json.loads(TREATMENT_WIRE.read_text())
    need(bm25['evaluator_fields_read'] is False and
         len(bm25['development_selections']) == 4 and
         treatment['evaluator_fields_read'] is False and
         len(treatment['wires']) == 4, 'source-boundary')
    source_rows = {row['conversation_key']: row for line in SOURCE.read_text().splitlines()
                   if (row := json.loads(line))['conversation_key'] in
                   {selection['conversation_key']
                    for selection in bm25['development_selections']}}
    need(len(source_rows) == 4, 'development-source')
    controls = {row['probe_id']: row for row in bm25['development_selections']}
    wires = []
    for old in treatment['wires']:
        selection = controls[old['probe_id']]
        key = selection['conversation_key']
        need(sha(key.encode()) == old['conversation_key_sha256'],
             'conversation-binding')
        source = source_rows[key]
        units = [unit for turn_id, turn in enumerate(source['turns'])
                 for unit in candidate.split_turn(turn, turn_id)]
        by_id = {(unit['source_turn'], unit['part_index']): unit for unit in units}
        selected = [by_id[tuple(identity)] for identity in
                    selection['selected_fragment_identities']]
        need(candidate.sha({'archived_evidence': selected}) ==
             selection['projection_sha256'] and
             candidate.chars({'archived_evidence': selected}) <= 5000,
             'projection-binding')
        request = json.loads(json.dumps(old['request']))
        old_user = request['messages'][1]['content']
        need(old_user.count(SEPARATOR) == 1 and
             request['messages'][0]['content'] and
             request['max_tokens'] == 512, 'common-prompt')
        question_prefix = old_user.split(SEPARATOR)[0]
        request['messages'][1]['content'] = question_prefix + SEPARATOR + \
            json.dumps({'archived_evidence': selected},
                       ensure_ascii=False, separators=(',', ':'))
        wires.append({'probe_id': old['probe_id'],
                      'conversation_key_sha256': old['conversation_key_sha256'],
                      'projection_sha256': selection['projection_sha256'],
                      'selected_fragment_identities':
                          selection['selected_fragment_identities'],
                      'request_sha256': sha(canonical(request)),
                      'request': request})
    need(len(wires) == 4 and len({row['probe_id'] for row in wires}) == 4,
         'wire-count')
    return {'schema_version': 'are.g03-beam-dev-factoid-wires-r1/v1',
            'status': 'source-only-development-wires-not-token-qualified',
            'arm': 'bm25-control',
            'source_only_sha256': PINS[SOURCE],
            'selections_sha256': PINS[BM25],
            'candidate_code_sha256': PINS[CANDIDATE],
            'comparison_treatment_wire_sha256': PINS[TREATMENT_WIRE],
            'system_sha256': treatment['system_sha256'],
            'development_conversations': 4,
            'heldout_conversations_not_emitted': 16,
            'selection_rule': 'first information_extraction probe per conversation; BM25 on identical source fragments',
            'context_window_tokens': 8192,
            'answer_output_reserve_tokens': 512,
            'maximum_generation_calls': 4,
            'automatic_retries': 0,
            'wires': wires,
            'evaluator_fields_read': False, 'model_calls': 0,
            'claim_ceiling': 'Four exposed development BM25 control wires only; no tokenizer, answer quality, holdout, or superiority',
            'open_questions': ['Do all four exact control wires fit 8K?',
                               'Does BM25 answer quality match treatment under the common prompt?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    packet = run()
    data = json.dumps(packet, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'wires': len(packet['wires']),
                      'receipt_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
