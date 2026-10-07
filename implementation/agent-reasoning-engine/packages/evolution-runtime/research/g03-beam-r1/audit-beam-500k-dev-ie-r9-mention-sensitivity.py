#!/usr/bin/env python3
"""Post-hoc, non-primary r9 sensitivity to questionable rubric mention credit."""

import hashlib
import json
from pathlib import Path
import random


SCORE = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/DUAL-VIEW-R9-SCORE-AUDIT.json')
SCORE_SHA = 'ccb1434e29275c49dd135a725777605bbbc334c2d9507651c12983cf111ae6b8'
SEED = int('fad197b4', 16)
REPETITIONS = 20000

# These are post-score review diagnostics, not changes to the sealed scorer.
MENTION_ONLY = {
    '2fd0d30178793a0cd56f2104',  # address explicitly not established as home
    '3d7e15378c0d2f17cf3f0ce3',  # reference pair only in list of alternatives
    '8548b293d6ed7c817d251d6d',  # "not stated" plus related preparation terms
    'b070f906084d70d3f914175c',  # "not stated" plus generic related advice
}
POSSIBLE_TARGET_MISMATCH = {
    '9700f2daabea96e23a75d246',  # answer pivots to other functions; partial rule match
}


def interval(deltas):
    rng = random.Random(SEED)
    values = sorted(sum(deltas[rng.randrange(len(deltas))]
                        for _ in deltas) / len(deltas)
                    for _ in range(REPETITIONS))
    return [values[int(0.025 * REPETITIONS)],
            values[int(0.975 * REPETITIONS)]]


def main():
    raw = SCORE.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SCORE_SHA:
        raise ValueError('r9-score-drift')
    score = json.loads(raw)
    pairs = score['pairs']
    if len(pairs) != 60 or not (MENTION_ONLY | POSSIBLE_TARGET_MISMATCH) <= {
            pair['probe_id'] for pair in pairs}:
        raise ValueError('r9-population-drift')
    scenarios = {}
    for name, excluded in (
            ('sealed_primary', set()),
            ('four_clear_mention_credit_gains_set_to_tie', MENTION_ONLY),
            ('five_mismatch_sensitive_gains_set_to_tie',
             MENTION_ONLY | POSSIBLE_TARGET_MISMATCH)):
        deltas = [0 if pair['probe_id'] in excluded else pair['paired_delta']
                  for pair in pairs]
        paired_interval = interval(deltas)
        mean_delta = sum(deltas) / len(deltas)
        scenarios[name] = {
            'mean_paired_delta': mean_delta,
            'paired_bootstrap_95_interval': paired_interval,
            'treatment_wins': sum(delta > 0 for delta in deltas),
            'control_wins': sum(delta < 0 for delta in deltas),
            'ties': sum(delta == 0 for delta in deltas),
            'predeclared_numeric_threshold_still_met':
                mean_delta >= 0.10 and paired_interval[0] > 0,
        }
    print(json.dumps({
        'status': 'post-hoc-sensitivity-not-primary',
        'score_sha256': SCORE_SHA,
        'bootstrap_repetitions': REPETITIONS,
        'bootstrap_seed_hex': 'fad197b4',
        'four_clear_case_ids': sorted(MENTION_ONLY),
        'additional_mismatch_sensitive_case_ids': sorted(POSSIBLE_TARGET_MISMATCH),
        'scenarios': scenarios,
        'claim_ceiling': 'Diagnostic only; not a preregistered score or independent confirmation',
    }, sort_keys=True))


if __name__ == '__main__':
    main()
