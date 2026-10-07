#!/usr/bin/env python3
"""Audit two-pass blinded GLM-adapted rubric scores for eight citation-discordant 500K IE pairs."""

import argparse
from collections import defaultdict
import hashlib
import json
import os
from pathlib import Path


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SAMPLE = ROOT / 'IE-DISCORDANT-SAMPLE-r2.json'
MAP = ROOT / 'IE-DISCORDANT-JUDGE-MAP-r2.json'
WIRE = ROOT / 'IE-DISCORDANT-JUDGE-WIRES-r2.json'
RUN = ROOT / 'IE-DISCORDANT-JUDGE-RUN-r3'
RESULT = RUN / 'RUN-RESULT.json'
MAP_SHA = '1ea5dbcbaef1849b048f4784386bd59f12f0501461824f1e2e09b195f766e982'
WIRE_SHA = '5f88bb2e13fb15bef76377011dfd289de1192b1af873780b86794cdc56b249df'
SAMPLE_SHA = '8a41f5a0e84bc7dc9557303a3b305d693e95291a02eec213078ca9cdf93a587e'


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-discordant-scores.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(len(args.result_sha256) == 64 and
        all(c in '0123456789abcdef' for c in args.result_sha256) and
        not args.output.exists(), 'arguments')
    need(sha_file(SAMPLE) == SAMPLE_SHA and sha_file(MAP) == MAP_SHA and
        sha_file(WIRE) == WIRE_SHA and
        sha_file(RESULT) == args.result_sha256, 'pinned-input-drift')
    sample = json.loads(SAMPLE.read_text())
    direction = {row['probe_id']: row['citation_direction']
        for row in sample['sample']}
    need(len(direction) == 8 and
        sum(value == 'treatment' for value in direction.values()) == 7 and
        sum(value == 'control' for value in direction.values()) == 1,
        'sample-direction-binding')
    mapping = json.loads(MAP.read_text())
    wire = json.loads(WIRE.read_text())
    result = json.loads(RESULT.read_text())
    need(mapping['status'] == 'private-evaluator-only-arm-map' and
        mapping['judge_wire_sha256'] == WIRE_SHA and
        result['status'] == 'completed-eight-discordant-pairs-r3' and
        result['wire_sha256'] == WIRE_SHA and
        result['attempted'] == result['valid'] == 48 and
        len(result['rows']) == 48 and len(wire['wires']) == 24 and
        len(mapping['rows']) == 24, 'completed-judge-seal')
    by_blind = {row['blind_id']: row for row in mapping['rows']}
    need(len(by_blind) == 24 and
        set(by_blind) == {row['blind_id'] for row in wire['wires']},
        'blind-binding')
    scores = defaultdict(dict)
    for row in result['rows']:
        path = RUN / f"ATTEMPT-{row['ordinal']:02}.json"
        need(sha_file(path) == row['raw_sha256'] and row['valid'] is True and
            row['repeat'] in (1, 2) and row['score'] in (0, 0.5, 1) and
            row['blind_id'] in by_blind, 'attempt-binding')
        attempt = json.loads(path.read_text())
        need(attempt['blind_id'] == row['blind_id'] and
            attempt['repeat'] == row['repeat'] and
            attempt['ordinal'] == row['ordinal'], 'attempt-identity')
        need(row['repeat'] not in scores[row['blind_id']], 'duplicate-score')
        scores[row['blind_id']][row['repeat']] = row['score']
    need(len(scores) == 24 and all(set(repeats) == {1, 2}
        for repeats in scores.values()), 'repeat-completeness')
    by_probe = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    disagreements = 0
    for blind_id, bound in by_blind.items():
        pair = scores[blind_id]
        disagreements += pair[1] != pair[2]
        for repeat in (1, 2):
            by_probe[bound['probe_id']][bound['arm']][repeat].append(pair[repeat])
    need(len(by_probe) == 8 and set(by_probe) == set(direction), 'pair-count')
    pairs = []
    for probe_id in sorted(by_probe):
        arms = by_probe[probe_id]
        need(set(arms) == {'treatment', 'control'}, 'arm-count')
        arm_scores = {}
        for arm in ('treatment', 'control'):
            need(set(arms[arm]) == {1, 2} and
                len(arms[arm][1]) == len(arms[arm][2]),
                'criterion-count')
            arm_scores[arm] = {str(repeat):
                sum(arms[arm][repeat]) / len(arms[arm][repeat])
                for repeat in (1, 2)}
            arm_scores[arm]['mean'] = (
                arm_scores[arm]['1'] + arm_scores[arm]['2']) / 2
        delta = arm_scores['treatment']['mean'] - arm_scores['control']['mean']
        pairs.append({'probe_id': probe_id,
            'citation_direction': direction[probe_id],
            'rubric_items': len(arms['treatment'][1]),
            'treatment': arm_scores['treatment'],
            'control': arm_scores['control'], 'paired_delta': delta})
    mean_delta = sum(row['paired_delta'] for row in pairs) / len(pairs)
    output = {'schema_version': 'are.g03-beam-500k-ie-discordant-score-audit-r3/v1',
        'status': 'audited-citation-conditioned-development',
        'judge_result_sha256': args.result_sha256,
        'citation_conditioned_sample_sha256': SAMPLE_SHA,
        'judge_map_sha256': MAP_SHA, 'judge_wire_sha256': WIRE_SHA,
        'pairs': pairs, 'summary': {
            'questions': 8, 'judge_wires': 24, 'judge_attempts': 48,
            'criterion_repeat_disagreements': disagreements,
            'treatment_mean_question_score': sum(
                row['treatment']['mean'] for row in pairs) / 8,
            'control_mean_question_score': sum(
                row['control']['mean'] for row in pairs) / 8,
            'mean_paired_question_delta': mean_delta,
            'treatment_wins': sum(row['paired_delta'] > 0 for row in pairs),
            'control_wins': sum(row['paired_delta'] < 0 for row in pairs),
            'ties': sum(row['paired_delta'] == 0 for row in pairs),
            'treatment_citation_gain_case_mean_delta': sum(
                row['paired_delta'] for row in pairs
                if row['citation_direction'] == 'treatment') / 7,
            'treatment_citation_gain_case_wins': sum(
                row['paired_delta'] > 0 for row in pairs
                if row['citation_direction'] == 'treatment'),
            'control_citation_gain_case_delta': next(
                row['paired_delta'] for row in pairs
                if row['citation_direction'] == 'control')},
        'claim_ceiling': 'GLM-adapted rubric scores on eight citation-conditioned exposed BEAM 500K IE development questions; no native BEAM score, independent cohort, or superiority',
        'open_questions': ['Are discordant judge scores or rubric/source ambiguities material?',
            'Does the gain justify costed VPS reproduction and a frozen independent cohort?']}
    data = (json.dumps(output, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(args.output, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'status': output['status'],
        'summary': output['summary'], 'receipt_sha256':
        hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
