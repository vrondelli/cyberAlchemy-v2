#!/usr/bin/env python3
"""Audit r1 terminal lineage and r2 resumed BEAM multi-step judge calls."""

import argparse
import hashlib
import json
import os
import re
from collections import defaultdict
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-dev-multistep-judge-calibration-r1-20261002')
PINS = {
    ROOT / 'WIRES.json': '6b7bba48f602cd02f76e18723c5206a413693f668ef89d2a5f61a90708a7bce3',
    ROOT / 'BLIND-MAP.json': 'a0b861c147a9ab3e7798353bcf6b9e08f3817e3c8cf58f1e316310da3e709326',
    ROOT / 'VPS-RUN' / 'FREEZE.json': '0ce427eada9444103e20f091e8cd5991c3eac8766225abcf7199db112545c607',
    ROOT / 'VPS-RUN' / 'PREFLIGHT.json': 'd88563bc970597508c87563a977b99f1793a2d7e0c55fac6402bd1843c0ab8d6',
    ROOT / 'VPS-RUN' / 'RUN-RESULT.json': '595c027ef6013f2e913c74eb5d66974e658256d7a0eb79c7beb8317e0d5e0edb',
    ROOT / 'VPS-RUN-r2' / 'FREEZE.json': '0a144dce92a43dbec0a791d775dc013c16416b3a6b50628c54048912ac1946e8',
    ROOT / 'VPS-RUN-r2' / 'RUN-RESULT.json': '99b7a4efac007ecc7c94f43607e772dd7f0e978b46fc6561cf7c0b20e2588176',
}
DECIMAL = re.compile(r'^(?:0(?:\.0+)?|0\.5(?:0+)?|1(?:\.0+)?)$')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-multistep-judge-audit-r2.' + reason)


def score_of(value):
    if type(value) in (int, float):
        return float(value) if value in (0, 0.5, 1) else None
    if isinstance(value, str) and DECIMAL.fullmatch(value.strip()):
        return float(value.strip())
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'output-exists')
    need(all(path.is_file() and sha(path.read_bytes()) == expected
             for path, expected in PINS.items()), 'pinned-input-drift')
    wire = json.loads((ROOT / 'WIRES.json').read_text())
    mapping = json.loads((ROOT / 'BLIND-MAP.json').read_text())
    run1 = ROOT / 'VPS-RUN'
    run2 = ROOT / 'VPS-RUN-r2'
    freeze1 = json.loads((run1 / 'FREEZE.json').read_text())
    preflight1 = json.loads((run1 / 'PREFLIGHT.json').read_text())
    result1 = json.loads((run1 / 'RUN-RESULT.json').read_text())
    freeze2 = json.loads((run2 / 'FREEZE.json').read_text())
    result2 = json.loads((run2 / 'RUN-RESULT.json').read_text())
    wire_by_id = {row['blind_id']: row for row in wire['wires']}
    map_by_id = {row['blind_id']: row for row in mapping['rows']}
    need(len(wire_by_id) == len(map_by_id) == 38 and
         set(wire_by_id) == set(map_by_id) and
         mapping['wire_sha256'] == PINS[ROOT / 'WIRES.json'] and
         wire['maximum_generation_calls'] == 76 and
         wire['comparison_control'] == 'archived noncontemporaneous BM25 answers' and
         wire['heldout_evaluator_values_accessed_in_code'] is False and
         freeze1['wire_sha256'] == mapping['wire_sha256'] and
         preflight1['status'] == 'passed' and
         preflight1['tokenizer_requests'] == 38 and
         all(row['admitted_8k'] and row['prompt_tokens'] + 256 <= 8192
             for row in preflight1['rows']) and
         result1['status'] == 'terminal-incomplete' and
         result1['attempted'] == 22 and result1['valid'] == 21 and
         result1['rows'][-1]['valid'] is False and
         freeze2['prior_freeze_sha256'] == PINS[run1 / 'FREEZE.json'] and
         freeze2['prior_preflight_sha256'] == PINS[run1 / 'PREFLIGHT.json'] and
         freeze2['prior_result_sha256'] == PINS[run1 / 'RUN-RESULT.json'] and
         freeze2['prior_calls_reconciled'] == 22 and
         freeze2['prior_calls_reinterpreted'] == 1 and
         freeze2['new_call_ceiling'] == 54 and
         result2['status'] == 'completed-calibration' and
         result2['freeze_sha256'] == PINS[run2 / 'FREEZE.json'] and
         result2['prior_result_sha256'] == PINS[run1 / 'RUN-RESULT.json'] and
         result2['attempted_total'] == result2['valid_total'] == 76 and
         result2['prior_calls_reused'] == 22 and
         result2['prior_calls_reinterpreted'] == 1 and
         result2['new_calls'] == 54 and
         result2['automatic_retries'] == 0, 'campaign-chain')
    expected_order = ([row['blind_id'] for row in wire['wires']] +
                      [row['blind_id'] for row in reversed(wire['wires'])])
    need(len(result2['rows']) == 76 and
         [row['blind_id'] for row in result2['rows']] == expected_order,
         'blind-order')
    scores = defaultdict(dict)
    prompt_tokens = completion_tokens = string_scores = 0
    for ordinal, row in enumerate(result2['rows'], 1):
        origin = run1 if ordinal <= 22 else run2
        need(row['ordinal'] == ordinal and row['valid'] and
             row['raw_origin'] == ('retained-r1' if ordinal <= 22 else 'new-r2') and
             row['repeat'] == (1 if ordinal <= 38 else 2) and
             row['blind_id'] in map_by_id and
             row['repeat'] not in scores[row['blind_id']], 'result-row')
        raw_path = origin / f'ATTEMPT-{ordinal:02d}.json'
        raw_bytes = raw_path.read_bytes()
        raw = json.loads(raw_bytes)
        response = raw['response']
        answer = response['payload']['choices'][0]['message']['content']
        parsed = json.loads(answer)
        score = score_of(parsed.get('score'))
        usage = response['payload']['usage']
        need(sha(raw_bytes) == row['raw_sha256'] and
             raw['ordinal'] == ordinal and raw['repeat'] == row['repeat'] and
             raw['blind_id'] == row['blind_id'] and response['status'] == 200 and
             response['payload']['choices'][0]['finish_reason'] != 'length' and
             score is not None and score == row['score'] and
             isinstance(parsed.get('reason'), str) and parsed['reason'].strip() and
             row['score_was_numeric_string'] == isinstance(parsed['score'], str) and
             usage['prompt_tokens'] == row['prompt_tokens'] and
             usage['completion_tokens'] == row['completion_tokens'] and
             row['prompt_tokens'] + row['completion_tokens'] <= 8192 and
             row['completion_tokens'] <= 256, 'raw-attempt-binding')
        if ordinal <= 22:
            old = result1['rows'][ordinal - 1]
            need(old['raw_sha256'] == row['raw_sha256'] and
                 old['blind_id'] == row['blind_id'] and
                 (ordinal < 22 or
                  (old['valid'] is False and old['score'] is None and
                   parsed['score'] == '0.0')), 'retained-r1-binding')
        scores[row['blind_id']][row['repeat']] = score
        prompt_tokens += row['prompt_tokens']
        completion_tokens += row['completion_tokens']
        string_scores += isinstance(parsed['score'], str)
    need(len(scores) == 38 and all(set(value) == {1, 2}
                                  for value in scores.values()) and
         prompt_tokens == result2['known_prompt_tokens'] and
         completion_tokens == result2['known_completion_tokens'],
         'totals-and-repeats')
    pair_arms = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for blind_id, repeat_scores in scores.items():
        row = map_by_id[blind_id]
        for repeat, score in repeat_scores.items():
            pair_arms[row['probe_id']][row['arm']][repeat].append(score)
    pair_rows = []
    for probe_id, arms in sorted(pair_arms.items()):
        need(set(arms) == {'complete-steps-r3', 'archived-bm25-control'},
             'pair-arms')
        item_count = len(arms['complete-steps-r3'][1])
        need(item_count == len(arms['archived-bm25-control'][1]) and
             all(len(arms[arm][repeat]) == item_count
                 for arm in arms for repeat in (1, 2)), 'rubric-count')
        means = {arm: {repeat: sum(arms[arm][repeat]) / item_count
                       for repeat in (1, 2)} for arm in arms}
        pair_rows.append({'probe_id': probe_id, 'rubric_item_count': item_count,
                          'complete_steps_mean_pass1': means['complete-steps-r3'][1],
                          'complete_steps_mean_pass2': means['complete-steps-r3'][2],
                          'archived_bm25_mean_pass1': means['archived-bm25-control'][1],
                          'archived_bm25_mean_pass2': means['archived-bm25-control'][2],
                          'difference_pass1': (means['complete-steps-r3'][1] -
                                               means['archived-bm25-control'][1]),
                          'difference_pass2': (means['complete-steps-r3'][2] -
                                               means['archived-bm25-control'][2])})
    need(len(pair_rows) == 4 and sum(row['rubric_item_count']
                                    for row in pair_rows) == 19,
         'four-pair-completeness')
    exact_agreement = sum(value[1] == value[2] for value in scores.values())
    summary = {'pairs': 4, 'rubric_items_per_arm': 19,
               'judge_calls_total': 76, 'retained_r1_calls': 22,
               'new_r2_calls': 54, 'numeric_string_scores': string_scores,
               'exact_repeat_agreement': exact_agreement,
               'exact_repeat_agreement_denominator': 38,
               'treatment_favoring_pass1': sum(row['difference_pass1'] > 0
                                              for row in pair_rows),
               'tied_pass1': sum(row['difference_pass1'] == 0
                                for row in pair_rows),
               'control_favoring_pass1': sum(row['difference_pass1'] < 0
                                            for row in pair_rows),
               'known_prompt_tokens': prompt_tokens,
               'known_completion_tokens': completion_tokens}
    output = {
        'schema_version': 'are.g03-beam-dev-multistep-judge-audit-r2/v1',
        'status': 'passed-exposed-development-calibration',
        'pinned_input_sha256': {str(path): digest for path, digest in PINS.items()},
        'summary': summary, 'pairs': pair_rows,
        'heldout_evaluator_values_accessed_in_code': False,
        'claim_ceiling': 'GLM-adapted rubric judge on four exposed, repeatedly tuned multi-step cases with archived noncontemporaneous BM25 answers; no native BEAM score, independent holdout, or superiority.'}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'audit_sha256': sha(data)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
