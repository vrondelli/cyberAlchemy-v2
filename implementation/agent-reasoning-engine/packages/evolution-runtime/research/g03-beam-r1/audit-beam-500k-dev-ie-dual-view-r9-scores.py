#!/usr/bin/env python3
"""Audit complete two-pass blinded r9 rubric scores and paired development CI."""

import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path
import random


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
MAP = ROOT / 'DUAL-VIEW-R9-JUDGE-MAP.json'
WIRE = ROOT / 'DUAL-VIEW-R9-JUDGE-WIRES.json'
RUN = ROOT / 'DUAL-VIEW-R9-JUDGE-RUN'
RESULT = RUN / 'RUN-RESULT.json'
MAP_SHA = '915835c97235f81432b1d1a22d0b149a539c4d22c561e89fd667d405c443e775'
WIRE_SHA = 'fad197b4c2eab80e6de3d2f4086b5c70fa7b411d005b61d7dd7a3b19b5a87ac8'
BOOTSTRAP_REPETITIONS = 20000


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-dual-view-r9-scores.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--judge-result-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(len(args.judge_result_sha256) == 64 and
        all(char in '0123456789abcdef' for char in
            args.judge_result_sha256) and not args.output.exists(),
        'arguments')
    need(sha_file(MAP) == MAP_SHA and sha_file(WIRE) == WIRE_SHA and
        sha_file(RESULT) == args.judge_result_sha256,
        'pinned-input-drift')
    mapping = json.loads(MAP.read_text())
    wire = json.loads(WIRE.read_text())
    result = json.loads(RESULT.read_text())
    need(mapping['status'] == 'private-evaluator-only-arm-map' and
        mapping['judge_wire_sha256'] == WIRE_SHA and
        wire['schema_version'] ==
        'are.g03-beam-500k-ie-dual-view-r9-judge-wires/v1' and
        result['schema_version'] ==
        'are.g03-beam-500k-ie-dual-view-r9-judge-result/v1' and
        result['status'] == 'completed-60-development-pairs-two-pass' and
        result['wire_sha256'] == WIRE_SHA and
        result['attempted'] == result['valid'] == 424 and
        len(result['rows']) == 424 and len(wire['wires']) == 212 and
        len(mapping['rows']) == 212, 'completed-judge-seal')
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    need(len(by_blind) == 212 and
        set(by_blind) == {row['blind_id'] for row in wire['wires']},
        'blind-binding')
    scores = defaultdict(dict)
    for row in result['rows']:
        path = RUN / f"ATTEMPT-{row['ordinal']:03}.json"
        need(sha_file(path) == row['raw_sha256'] and row['valid'] is True and
            row['repeat'] in (1, 2) and row['score'] in (0, 0.5, 1) and
            row['blind_id'] in by_blind, 'attempt-binding')
        attempt = json.loads(path.read_text())
        need(attempt['blind_id'] == row['blind_id'] and
            attempt['repeat'] == row['repeat'] and
            attempt['ordinal'] == row['ordinal'], 'attempt-identity')
        need(row['repeat'] not in scores[row['blind_id']], 'duplicate-score')
        scores[row['blind_id']][row['repeat']] = row['score']
    need(len(scores) == 212 and all(set(repeats) == {1, 2}
        for repeats in scores.values()), 'repeat-completeness')
    by_probe = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    disagreements = 0
    for blind_id, bound in by_blind.items():
        pair = scores[blind_id]
        disagreements += pair[1] != pair[2]
        for repeat in (1, 2):
            by_probe[bound['probe_id']][bound['arm']][repeat][
                bound['rubric_item_index']] = pair[repeat]
    need(len(by_probe) == 60, 'paired-population')
    pairs = []
    for probe_id in sorted(by_probe):
        arms = by_probe[probe_id]
        need(set(arms) == {'treatment', 'control'}, 'arm-count')
        arm_scores = {}
        for arm in ('treatment', 'control'):
            need(set(arms[arm]) == {1, 2} and
                set(arms[arm][1]) == set(arms[arm][2]) and
                len(arms[arm][1]) > 0 and
                set(arms[arm][1]) == set(range(len(arms[arm][1]))),
                'criterion-completeness')
            arm_scores[arm] = {str(repeat):
                sum(arms[arm][repeat].values()) / len(arms[arm][repeat])
                for repeat in (1, 2)}
            arm_scores[arm]['mean'] = (
                arm_scores[arm]['1'] + arm_scores[arm]['2']) / 2
        delta = arm_scores['treatment']['mean'] - arm_scores['control']['mean']
        pairs.append({'probe_id': probe_id,
            'rubric_items': len(arms['treatment'][1]),
            'treatment': arm_scores['treatment'],
            'control': arm_scores['control'], 'paired_delta': delta})
    need(len(pairs) == 60 and sum(row['rubric_items'] for row in pairs) == 106,
        'rubric-count')
    deltas = [row['paired_delta'] for row in pairs]
    rng = random.Random(int(WIRE_SHA[:8], 16))
    boot = sorted(sum(deltas[rng.randrange(len(deltas))]
        for _ in deltas) / len(deltas)
        for _ in range(BOOTSTRAP_REPETITIONS))
    low = boot[int(0.025 * BOOTSTRAP_REPETITIONS)]
    high = boot[int(0.975 * BOOTSTRAP_REPETITIONS)]
    mean_delta = sum(deltas) / len(deltas)
    summary = {'questions': 60, 'rubric_items': 106,
        'judge_wires': 212, 'judge_attempts': 424,
        'criterion_repeat_disagreements': disagreements,
        'treatment_mean_question_score': sum(
            row['treatment']['mean'] for row in pairs) / 60,
        'control_mean_question_score': sum(
            row['control']['mean'] for row in pairs) / 60,
        'mean_paired_question_delta': mean_delta,
        'paired_bootstrap_95_interval': [low, high],
        'bootstrap_repetitions': BOOTSTRAP_REPETITIONS,
        'bootstrap_seed_hex': WIRE_SHA[:8],
        'treatment_wins': sum(delta > 0 for delta in deltas),
        'control_wins': sum(delta < 0 for delta in deltas),
        'ties': sum(delta == 0 for delta in deltas),
        'development_advancement_gate': mean_delta >= 0.10 and low > 0}
    output = {'schema_version':
        'are.g03-beam-500k-ie-dual-view-r9-score-audit/v1',
        'status': 'audited-full-exposed-development',
        'judge_result_sha256': args.judge_result_sha256,
        'judge_map_sha256': MAP_SHA, 'judge_wire_sha256': WIRE_SHA,
        'pairs': pairs, 'summary': summary,
        'claim_ceiling': 'GLM-adapted rubric scores on 60 exposed BEAM 500K IE development questions only; no native BEAM score, independent confirmation, cost-adjusted or product superiority',
        'open_questions': ['Do independent source reviewers agree on any measured answer gains and ambiguities?',
            'Can a frozen untouched population reproduce the result at acceptable all-in cost?']}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'status': output['status'],
        'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()},
        sort_keys=True))


if __name__ == '__main__':
    main()
