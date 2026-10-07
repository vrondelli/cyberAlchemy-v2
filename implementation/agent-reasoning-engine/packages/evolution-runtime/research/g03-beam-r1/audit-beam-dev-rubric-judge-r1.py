#!/usr/bin/env python3
"""Independently reconcile the exposed BEAM GLM rubric-judge calibration."""

import argparse
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-judge-calibration-r1-20261002')
PINS = {
    ROOT / 'WIRES-r2.json': '66ee7f2e5d382c64db9e68f98b63677d281354c929217b4656c8847d2e307907',
    ROOT / 'BLIND-MAP-r2.json': 'dbfd019c61ee7c38004a807ee63e4ae411cdb3786576aa42285761a5a82900c0',
    ROOT / 'VPS-RUN' / 'FREEZE.json': '1eb2335262c6180600bedb1164205029eb632b084202c616d75dfe321281bde4',
    ROOT / 'VPS-RUN' / 'PREFLIGHT.json': 'c22efa39f2a77b4645075bd72c79a6c1b8a489724f7185e08d45bcc2056b83fc',
    ROOT / 'VPS-RUN' / 'RUN-RESULT.json': '097ea8b11e64ad55d0f7ca277997c7b56caf5662288566b8fb8f13e6f94d8340',
}
SPRINT_PROBE = '5aa2fe813e77b93bcf3c8b9f'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-rubric-judge-audit-r1.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    need(all(path.is_file() and sha(path.read_bytes()) == expected
             for path, expected in PINS.items()), 'pinned-input-drift')
    wire = json.loads((ROOT / 'WIRES-r2.json').read_text())
    mapping = json.loads((ROOT / 'BLIND-MAP-r2.json').read_text())
    run = ROOT / 'VPS-RUN'
    freeze = json.loads((run / 'FREEZE.json').read_text())
    preflight = json.loads((run / 'PREFLIGHT.json').read_text())
    result = json.loads((run / 'RUN-RESULT.json').read_text())
    wire_rows = {row['blind_id']: row for row in wire['wires']}
    map_rows = {row['blind_id']: row for row in mapping['rows']}
    need(len(wire_rows) == len(map_rows) == 10 and
         set(wire_rows) == set(map_rows) and
         mapping['wire_sha256'] == PINS[ROOT / 'WIRES-r2.json'] and
         wire['judge_variant'] == 'official-content-whitespace-normalized-glm' and
         wire['heldout_evaluator_values_accessed_in_code'] is False and
         freeze['wire_sha256'] == mapping['wire_sha256'] and
         freeze['ordered_blind_ids'] == [row['blind_id'] for row in wire['wires']] and
         freeze['maximum_generation_calls'] == 20 and
         freeze['automatic_retries'] == 0 and
         preflight['status'] == 'passed' and
         preflight['freeze_sha256'] == PINS[run / 'FREEZE.json'] and
         preflight['tokenizer_requests'] == 10 and
         all(row['admitted_8k'] and row['prompt_tokens'] + 256 <= 8192
             for row in preflight['rows']) and
         result['status'] == 'completed-calibration' and
         result['wire_sha256'] == mapping['wire_sha256'] and
         result['freeze_sha256'] == PINS[run / 'FREEZE.json'] and
         result['preflight_sha256'] == PINS[run / 'PREFLIGHT.json'] and
         result['attempted'] == result['valid'] == 20 and
         result['automatic_retries'] == 0, 'run-chain')
    scores = defaultdict(dict)
    prompt_tokens = completion_tokens = 0
    for ordinal, row in enumerate(result['rows'], 1):
        need(row['ordinal'] == ordinal and row['valid'] and
             row['blind_id'] in map_rows and row['repeat'] in (1, 2) and
             row['score'] in (0, 0.5, 1) and
             row['prompt_tokens'] + row['completion_tokens'] <= 8192,
             'score-row')
        need(row['repeat'] not in scores[row['blind_id']], 'duplicate-repeat')
        raw_path = run / f'ATTEMPT-{ordinal:02d}.json'
        raw_bytes = raw_path.read_bytes()
        raw = json.loads(raw_bytes)
        answer = raw['response']['payload']['choices'][0]['message']['content']
        parsed = json.loads(answer)
        need(sha(raw_bytes) == row['raw_sha256'] and
             raw['blind_id'] == row['blind_id'] and
             raw['repeat'] == row['repeat'] and
             raw['ordinal'] == ordinal and
             raw['response']['status'] == row['status'] == 200 and
             parsed['score'] == row['score'] and
             isinstance(parsed['reason'], str) and parsed['reason'].strip() and
             row['prompt_tokens'] == raw['response']['payload']['usage']['prompt_tokens'] and
             row['completion_tokens'] == raw['response']['payload']['usage']['completion_tokens'],
             'raw-attempt-binding')
        scores[row['blind_id']][row['repeat']] = row['score']
        prompt_tokens += row['prompt_tokens']
        completion_tokens += row['completion_tokens']
    need(len(scores) == 10 and all(set(repeats) == {1, 2}
                                 for repeats in scores.values()) and
         prompt_tokens == result['known_prompt_tokens'] and
         completion_tokens == result['known_completion_tokens'],
         'totals-and-repeats')
    exact_agreement = sum(repeats[1] == repeats[2] for repeats in scores.values())
    per_pair = defaultdict(lambda: defaultdict(list))
    for blind_id, repeats in scores.items():
        row = map_rows[blind_id]
        per_pair[row['probe_id']][row['arm']].append(repeats[1])
    pair_rows = []
    for probe_id, arms in sorted(per_pair.items()):
        need(set(arms) == {'treatment', 'bm25-control'} and
             len(arms['treatment']) == len(arms['bm25-control']),
             'paired-rubric-count')
        treatment = sum(arms['treatment']) / len(arms['treatment'])
        control = sum(arms['bm25-control']) / len(arms['bm25-control'])
        pair_rows.append({'probe_id': probe_id,
                          'rubric_item_count': len(arms['treatment']),
                          'treatment_mean': treatment,
                          'bm25_control_mean': control,
                          'difference': treatment - control,
                          'known_source_ambiguity': probe_id == SPRINT_PROBE})
    need(len(pair_rows) == 4 and sum(row['rubric_item_count']
                                    for row in pair_rows) == 5,
         'pair-count')
    output = {
        'schema_version': 'are.g03-beam-dev-rubric-judge-audit-r1/v1',
        'status': 'passed-exposed-development-calibration',
        'pinned_input_sha256': {str(path): digest for path, digest in PINS.items()},
        'pairs': pair_rows,
        'summary': {'development_pairs': 4, 'rubric_items_per_arm': 5,
                    'judge_calls': 20, 'valid_calls': 20,
                    'exact_repeat_agreement': exact_agreement,
                    'exact_repeat_agreement_denominator': 10,
                    'treatment_mean': sum(row['treatment_mean'] for row in pair_rows) / 4,
                    'bm25_control_mean': sum(row['bm25_control_mean'] for row in pair_rows) / 4,
                    'treatment_favoring_pairs': sum(row['difference'] > 0 for row in pair_rows),
                    'tied_pairs': sum(row['difference'] == 0 for row in pair_rows),
                    'control_favoring_pairs': sum(row['difference'] < 0 for row in pair_rows),
                    'known_source_ambiguity_pairs': sum(row['known_source_ambiguity']
                                                        for row in pair_rows),
                    'known_prompt_tokens': prompt_tokens,
                    'known_completion_tokens': completion_tokens},
        'claim_ceiling': 'GLM-adapted rubric scorer on four exposed dev pairs. One source-ambiguous discordance; no native BEAM, holdout, or superiority claim.',
        'heldout_evaluator_values_accessed_in_code': False,
    }
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': output['summary'],
                      'audit_sha256': sha(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
