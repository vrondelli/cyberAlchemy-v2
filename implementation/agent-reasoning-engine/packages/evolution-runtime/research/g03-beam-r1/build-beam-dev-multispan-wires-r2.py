#!/usr/bin/env python3
"""Build four source-only multi-span BEAM development answer wires."""

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
SELECTIONS = ROOT / 'DEV-MULTISPAN-SELECTIONS-r2.json'
PREVIOUS = ROOT / 'DEV-MOSAIC-PAIRED-WIRES-r1.json'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    SELECTIONS: 'f8bcd45ea56c4896a0c5d55cec48351bf44618b1ec93678d53689d6f141b45f3',
    PREVIOUS: '30e1a92645f1fb254d2505a9bb53cf9a46bc0e38442536323d0222b089c89562',
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-multispan-wires-r2.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    split = json.loads(SPLIT.read_text())
    sealed = json.loads(SELECTIONS.read_text())
    previous = json.loads(PREVIOUS.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout and
         sealed['evaluator_fields_read'] is False and
         previous['evaluator_fields_read'] is False and
         sealed['utf16_character_ceiling'] == 5000,
         'source-boundary')
    projections = {row['probe_id']: row for row in sealed['projections']}
    old_mosaic = {row['probe_id']: row for row in previous['wires']
                  if row['arm'] == 'mosaic'}
    need(len(projections) == len(old_mosaic) == 4 and
         set(projections) == set(old_mosaic), 'pair-binding')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20 and {row['conversation_key'] for row in rows} ==
         dev | holdout, 'source-population')
    wires = []
    for row in rows:
        key = row['conversation_key']
        if key not in dev:
            continue
        probes = [probe for probe in row['probes']
                  if probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ability-quota')
        probe = probes[1]
        bound = projections[probe['id']]
        old = old_mosaic[probe['id']]
        need(bound['conversation_key'] == key and
             old['conversation_key_sha256'] == sha(key.encode()) and
             sha(canonical(bound['projection'])) ==
             bound['projection_sha256'] and
             bound['projection_utf16_chars'] <= 5000,
             'projection-binding')
        user = ('Current question:\n' + probe['question'] +
                '\n\nArchived conversation evidence:\n' +
                json.dumps(bound['projection'], ensure_ascii=False,
                           separators=(',', ':')))
        request = {'model': old['request']['model'],
                   'messages': [{'role': 'system',
                                 'content': old['request']['messages'][0]['content']},
                                {'role': 'user', 'content': user}],
                   'thinking': old['request']['thinking'],
                   'reasoning_effort': old['request']['reasoning_effort'],
                   'max_tokens': old['request']['max_tokens'],
                   'stream': old['request']['stream']}
        need(request['model'] == 'glm-5.3-flash' and
             request['max_tokens'] == 1024 and
             request['reasoning_effort'] == 'low' and
             request['thinking'] == {'type': 'enabled'} and
             request['stream'] is False, 'request-parameters')
        wires.append({'probe_id': probe['id'], 'arm': 'multispan',
                      'conversation_key_sha256': sha(key.encode()),
                      'projection_sha256': bound['projection_sha256'],
                      'request_sha256': sha(canonical(request)),
                      'request': request})
    need(len(wires) == 4 and len({row['probe_id'] for row in wires}) == 4,
         'wire-count')
    return {
        'schema_version': 'are.g03-beam-dev-multispan-wires-r2/v1',
        'status': 'source-only-development-wires-not-token-qualified',
        'source_only_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'selection_sha256': PINS[SELECTIONS],
        'comparison_wire_sha256': PINS[PREVIOUS],
        'comparison_control': 'archived exact r1 BM25 answer arm; not concurrent',
        'development_conversations': 4,
        'reserved_conversations_not_emitted': 16,
        'context_window_tokens': 8192,
        'answer_output_reserve_tokens': 1024,
        'maximum_generation_calls': 4, 'automatic_retries': 0,
        'wires': sorted(wires, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'model_calls': 0,
        'claim_ceiling': 'Four exposed development treatment answers against archived BM25 control; no concurrent replication, native score, holdout, or superiority',
        'open_questions': ['Do all four exact wires pass GLM 8K admission?',
                           'Does multi-span extraction preserve the reference-required steps?'],
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
