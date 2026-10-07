#!/usr/bin/env python3
"""Bind source-only r3 projections to the prior exact BEAM answer wire."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SELECTIONS = ROOT / 'DEV-COMPLETE-STEPS-SELECTIONS-r3.json'
PREVIOUS = ROOT / 'DEV-MULTISPAN-WIRES-r2.json'
PINS = {
    SELECTIONS: 'a379e7f3c36aa007b9eb7c95a928bebf60ddffa3723f596fe3e990d5b5b55514',
    PREVIOUS: 'da5c94b5123bfd204180feeffadb8f97ba9aeabe9da85cc356553cbcfa61a127',
}
SEPARATOR = '\n\nArchived conversation evidence:\n'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-complete-steps-wires-r3.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    selection = json.loads(SELECTIONS.read_text())
    previous = json.loads(PREVIOUS.read_text())
    need(selection['status'] == 'source-only-sealed-before-evaluator-audit' and
         selection['evaluator_fields_read'] is False and
         selection['utf16_character_ceiling'] == 5000 and
         previous['evaluator_fields_read'] is False and
         previous['wires'] and len(previous['wires']) == 4,
         'source-boundary')
    projections = {row['probe_id']: row for row in selection['projections']}
    need(len(projections) == 4 and
         set(projections) == {row['probe_id'] for row in previous['wires']},
         'pair-binding')
    wires = []
    for old in previous['wires']:
        bound = projections[old['probe_id']]
        request = json.loads(json.dumps(old['request']))
        need(old['arm'] == 'multispan' and
             request['model'] == 'glm-5.3-flash' and
             request['max_tokens'] == 1024 and
             request['reasoning_effort'] == 'low' and
             request['thinking'] == {'type': 'enabled'} and
             request['stream'] is False and
             len(request['messages']) == 2 and
             request['messages'][1]['content'].count(SEPARATOR) == 1 and
             bound['projection_utf16_chars'] <= 5000 and
             sha(canonical(bound['projection'])) ==
             bound['projection_sha256'], 'wire-binding')
        prefix = request['messages'][1]['content'].split(SEPARATOR)[0]
        need(prefix.startswith('Current question:\n') and
             old['conversation_key_sha256'] ==
             sha(bound['conversation_key'].encode()), 'question-binding')
        request['messages'][1]['content'] = (prefix + SEPARATOR +
            json.dumps(bound['projection'], ensure_ascii=False,
                       separators=(',', ':')))
        wires.append({'probe_id': old['probe_id'], 'arm': 'complete-steps',
                      'conversation_key_sha256': old['conversation_key_sha256'],
                      'projection_sha256': bound['projection_sha256'],
                      'request_sha256': sha(canonical(request)),
                      'request': request})
    return {
        'schema_version': 'are.g03-beam-dev-complete-steps-wires-r3/v1',
        'status': 'source-only-development-wires-not-token-qualified',
        'selection_sha256': PINS[SELECTIONS],
        'prior_wire_sha256': PINS[PREVIOUS],
        'comparison_control': 'archived exact r1 BM25 arm; not concurrent',
        'development_conversations': 4,
        'reserved_conversations_not_emitted': 16,
        'context_window_tokens': 8192,
        'answer_output_reserve_tokens': 1024,
        'maximum_generation_calls': 4, 'automatic_retries': 0,
        'wires': sorted(wires, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Four exposed development treatment answers against archived BM25 control; no native score, holdout, or superiority',
        'open_questions': ['Do all four exact wires pass GLM 8K admission?',
                           'Does complete-step selection preserve the reference-required sequence?'],
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
    print(json.dumps({'wires': len(result['wires']),
                      'receipt_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
