#!/usr/bin/env python3
"""Predeclared 32-pair, 16-conversation G03 r13 accuracy analysis."""

from collections import Counter, defaultdict
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import random


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-100k-ie-r13')
SOURCE = ROOT / 'LABEL-REVIEW-INPUT.json'
LABEL = ROOT / 'LABEL-DECISIONS.json'
AUDIT = ROOT / 'JUDGE-AUDIT.json'
ANSWER_RESULT = ROOT / 'ANSWER-RUN/RUN-RESULT.json'
SOURCE_SHA = '74a51190fcf675ca5ad7f1e54121da98a576b05b85333d8dcdd8698b10b45970'
ANSWER_RESULT_SHA = '79a271dbfa27bca7ff855e477199fd46c9b11abe3dd0d47df004a557fb6f0716'
REPETITIONS = 20000


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def file_sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-r13-paired-analysis.' + reason)


def exact_mcnemar(rows, key):
    treatment_only = sum(row[key]['treatment'] and
                         not row[key]['control'] for row in rows)
    control_only = sum(row[key]['control'] and
                       not row[key]['treatment'] for row in rows)
    discordant = treatment_only + control_only
    if not discordant:
        p = 1.0
    else:
        tail = sum(math.comb(discordant, k)
                   for k in range(min(treatment_only, control_only) + 1))
        p = min(1.0, 2 * tail / (2 ** discordant))
    return {'treatment_only': treatment_only,
            'control_only': control_only,
            'two_sided_exact_p': p}


def analyze(source, label, audit, answer_result, label_sha):
    need(source['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-review-input/v1' and
         len(source['cases']) == 32 and
         label['schema_version'] ==
         'are.g03-beam-100k-ie-r13-label-decisions/v1' and
         label['status'] == 'answer-blind-two-reviewer-labels-sealed' and
         label['review_input_sha256'] == SOURCE_SHA and
         label['label_integrity_gate_passed'] is True and
         label['disposition_counts'].get('supported-current', 0) >= 28 and
         label['total_selected_questions'] == 32 and
         audit['schema_version'] ==
         'are.g03-beam-100k-ie-r13-source-judge-audit/v1' and
         audit['status'] == 'audited-64-pairs-two-pass' and
         audit['label_sha256'] == label_sha and
         audit['scorer_transfer_gate_passed'] is True and
         audit['repeat_disagreements'] == 0 and
         audit['raw_attempts_verified'] == 128 and
         len(audit['pairs']) == 32 and
         answer_result['schema_version'] ==
         'are.g03-beam-100k-ie-r13-result/v1' and
         answer_result['status'] == 'completed-64-r13-reserved-answers' and
         answer_result['attempted'] == answer_result['valid'] == 64,
         'inputs-or-gates')
    cases = {row['probe_id']: row for row in source['cases']}
    labels = {row['probe_id']: row for row in label['rows']}
    scores = {row['probe_id']: row for row in audit['pairs']}
    need(len(cases) == len(labels) == len(scores) == 32 and
         set(cases) == set(labels) == set(scores), 'pair-identities')
    clusters = defaultdict(list)
    rows = []
    for probe in sorted(cases):
        case, lab, score = cases[probe], labels[probe], scores[probe]
        disposition = lab['disposition']
        need(disposition in ('supported-current', 'conflicted', 'ambiguous')
             and set(score) == {'probe_id', 'control', 'treatment'} and
             all(set(score[arm]) == {'1', '2'} and
                 type(score[arm]['1']) is bool and
                 type(score[arm]['2']) is bool and
                 score[arm]['1'] == score[arm]['2']
                 for arm in ('control', 'treatment')),
             'score-or-label-row')
        supported = disposition == 'supported-current'
        primary = {'control': score['control']['1'] if supported else False,
                   'treatment': score['treatment']['1'] if supported else False}
        sensitivity = {'control': primary['control'] if supported else True,
                       'treatment': primary['treatment'] if supported else False}
        row = {'probe_id': probe,
               'conversation_key': case['conversation_key'],
               'label_disposition': disposition,
               'primary': primary,
               'control_favoring_sensitivity': sensitivity}
        rows.append(row)
        clusters[case['conversation_key']].append(row)
    need(len(clusters) == 16 and all(len(v) == 2 for v in clusters.values())
         and Counter(row['label_disposition'] for row in rows) ==
         label['disposition_counts'], 'cluster-or-label-counts')
    freeze_sha = answer_result['freeze_sha256']
    need(isinstance(freeze_sha, str) and len(freeze_sha) == 64 and
         set(freeze_sha) <= set('0123456789abcdef'), 'answer-freeze')
    seed = int(freeze_sha[:8], 16)
    rng = random.Random(seed)
    ordered = [clusters[key] for key in sorted(clusters)]
    samples = {'primary': [], 'control_favoring_sensitivity': []}
    for _ in range(REPETITIONS):
        selected = [ordered[rng.randrange(16)] for _ in range(16)]
        for key in samples:
            difference = sum(int(row[key]['treatment']) -
                             int(row[key]['control'])
                             for cluster in selected for row in cluster) / 32
            samples[key].append(difference)
    measures = {}
    for key, values in samples.items():
        values.sort()
        point = sum(int(row[key]['treatment']) -
                    int(row[key]['control']) for row in rows) / 32
        measures[key] = {
            'are_minus_bm25_strict_correct_proportion': point,
            'conversation_cluster_bootstrap_95_interval':
                [values[499], values[19499]],
            'exact_mcnemar': exact_mcnemar(rows, key),
        }
    claim = (measures['primary']['conversation_cluster_bootstrap_95_interval'][0]
             > 0 and
             measures['control_favoring_sensitivity']
             ['conversation_cluster_bootstrap_95_interval'][0] > 0)
    return {'schema_version': 'are.g03-beam-100k-ie-r13-paired-analysis/v1',
            'status': 'audited-bounded-ie-accuracy-analysis',
            'selected_pairs': 32, 'conversation_clusters': 16,
            'label_counts': dict(sorted(label['disposition_counts'].items())),
            'bootstrap': {'repetitions': REPETITIONS,
                          'seed_source': 'first-eight-hex-of-answer-stage-freeze-sha256',
                          'seed_hex': freeze_sha[:8],
                          'prng': 'python-random-mt19937',
                          'percentile_rule':
                              'sorted-20000-ranks-500-and-19500-one-indexed'},
            'measures': measures,
            'bounded_ie_accuracy_directional_gate_passed': claim,
            'rows': rows,
            'claim_ceiling':
                'Only 32-question BEAM 100K information-extraction accuracy against BM25; no full-BEAM, cost, speed, or broad ARE claim',
            'open_questions': [
                'Does independent reviewer inspection confirm every raw and analysis binding?',
                'Are the exact bounded claim and caveats approved for private or public use?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--label-sha256', required=True)
    parser.add_argument('--judge-audit-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(args.output.parent.resolve() == ROOT.resolve() and
         not args.output.exists() and
         all(len(s) == 64 and set(s) <= set('0123456789abcdef')
             for s in (args.label_sha256, args.judge_audit_sha256)),
         'arguments')
    # Labels are checked before score or answer summaries are opened.
    need(LABEL.is_file() and file_sha(LABEL) == args.label_sha256 and
         file_sha(SOURCE) == SOURCE_SHA, 'source-or-label-drift')
    source, label = json.loads(SOURCE.read_text()), json.loads(LABEL.read_text())
    need(label['label_integrity_gate_passed'] is True and
         label['disposition_counts'].get('supported-current', 0) >= 28,
         'label-gate')
    need(file_sha(AUDIT) == args.judge_audit_sha256 and
         file_sha(ANSWER_RESULT) == ANSWER_RESULT_SHA,
         'score-input-drift')
    audit, answer = json.loads(AUDIT.read_text()), json.loads(ANSWER_RESULT.read_text())
    packet = analyze(source, label, audit, answer, args.label_sha256)
    packet.update({'source_sha256': SOURCE_SHA,
                   'label_sha256': args.label_sha256,
                   'judge_audit_sha256': args.judge_audit_sha256,
                   'answer_result_sha256': ANSWER_RESULT_SHA})
    raw = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(args.output, os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                          0o600), 'wb') as stream:
        stream.write(raw)
    print(json.dumps({'status': packet['status'],
                      'bounded_ie_accuracy_directional_gate_passed':
                      packet['bounded_ie_accuracy_directional_gate_passed'],
                      'primary_effect': packet['measures']['primary']
                      ['are_minus_bm25_strict_correct_proportion'],
                      'analysis_sha256': sha(raw)}, sort_keys=True))


if __name__ == '__main__':
    main()
