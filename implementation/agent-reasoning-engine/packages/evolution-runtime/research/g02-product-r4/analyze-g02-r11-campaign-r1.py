#!/usr/bin/env python3
"""Evaluate the frozen G02 r11 gate from independently audited cold archives."""

import hashlib
import json
import math
import random
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002')
DEFINITION_SHA = '0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf'
OUTPUT = ARCHIVE / 'AGGREGATE-R11.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require(condition, reason):
    if not condition:
        raise ValueError('g02-r11-aggregate.' + reason)


def percentile(values, percentage):
    ordered = sorted(values)
    position = (len(ordered) - 1) * percentage / 100
    lower = math.floor(position)
    upper = math.ceil(position)
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def metric(sample):
    count = len(sample)
    are = [row['quality']['are'] for row in sample]
    dsh = [row['quality']['dsh'] for row in sample]
    return {
        'span_f1_delta': sum(a['span_f1'] - d['span_f1'] for a, d in zip(are, dsh)) / count,
        'file_f1_delta': sum(a['file_f1'] - d['file_f1'] for a, d in zip(are, dsh)) / count,
        'known_token_ratio': sum(a['known_model_tokens'] for a in are) /
                             sum(d['known_model_tokens'] for d in dsh),
        'arm_time_ratio': sum(a['arm_seconds'] for a in are) /
                          sum(d['arm_seconds'] for d in dsh),
    }


def main():
    definition_path = ARCHIVE / 'definition/DEFINITION.json'
    require(sha(definition_path) == DEFINITION_SHA, 'definition-drift')
    definition = json.loads(definition_path.read_text())
    settings = definition['analysis']
    require(definition['status'] == 'frozen-before-model-dispatch' and
            len(definition['ordered_pairs']) == 24 and
            settings['resamples'] == 20000 and
            settings['resampling'] == 'paired stratified bootstrap by repository' and
            settings['interval'] == '2.5th/97.5th percentile' and
            settings['seed'] == 'first eight hex digits of this definition SHA-256',
            'definition-analysis-drift')
    require(not OUTPUT.exists(), 'aggregate-already-exists')

    rows = []
    evidence = []
    for ordinal, pair in enumerate(definition['ordered_pairs'], 1):
        require(pair['ordinal'] == ordinal, 'ordinal-drift')
        root = ARCHIVE / 'pairs' / f"{ordinal:02d}-{pair['suffix']}"
        receipt_path = root / 'ARCHIVE-RECEIPT.json'
        audit_path = root / 'raw/INDEPENDENT-AUDIT.json'
        decision_path = root / 'raw/PAIR-DECISION.json'
        require(receipt_path.is_file() and audit_path.is_file() and decision_path.is_file(),
                f'pair-{ordinal}-incomplete')
        receipt = json.loads(receipt_path.read_text())
        audit = json.loads(audit_path.read_text())
        decision = json.loads(decision_path.read_text())
        row = audit['row']
        require(receipt['audit_exit'] == 0 and receipt['raw_archive_verified'] is True and
                receipt['audit']['status'] == 'valid-scored' and
                receipt['decision_sha256'] == sha(decision_path) and
                receipt['audit_sha256'] == sha(audit_path) and
                audit['status'] == 'independent-audit-passed' and
                audit['definition_sha256'] == DEFINITION_SHA and
                row['ordinal'] == ordinal and row['instance_id'] == pair['instance_id'] and
                row['repo'] == pair['repo'] and row['status'] == 'valid-scored' and
                row['decision_sha256'] == sha(decision_path) and
                row['quality'] == decision['quality'] and
                decision['instance_id'] == pair['instance_id'],
                f'pair-{ordinal}-audit-or-binding-invalid')
        for arm in ('are', 'dsh'):
            q = row['quality'][arm]
            require(all(math.isfinite(q[key]) for key in ('span_f1', 'file_f1',
                                                         'arm_seconds')) and
                    0 <= q['span_f1'] <= 1 and 0 <= q['file_f1'] <= 1 and
                    q['arm_seconds'] > 0 and
                    isinstance(q['known_model_tokens'], int) and
                    q['known_model_tokens'] > 0,
                    f'pair-{ordinal}-{arm}-metric-invalid')
        rows.append(row)
        evidence.append({'ordinal': ordinal, 'repo': pair['repo'],
                         'receipt_sha256': sha(receipt_path),
                         'audit_sha256': sha(audit_path),
                         'decision_sha256': sha(decision_path)})

    groups = {repo: [row for row in rows if row['repo'] == repo]
              for repo in sorted({row['repo'] for row in rows})}
    require(len(groups) == 4 and all(len(group) == 6 for group in groups.values()),
            'stratum-shape')
    seed = int(DEFINITION_SHA[:8], 16)
    generator = random.Random(seed)
    samples = {key: [] for key in ('span_f1_delta', 'file_f1_delta',
                                   'known_token_ratio', 'arm_time_ratio')}
    for _ in range(settings['resamples']):
        sampled = [generator.choice(group) for group in groups.values()
                   for _ in range(len(group))]
        observed = metric(sampled)
        for key, value in observed.items():
            samples[key].append(value)
    point = metric(rows)
    intervals = {key: [percentile(values, 2.5), percentile(values, 97.5)]
                 for key, values in samples.items()}
    gate = (intervals['span_f1_delta'][0] > 0 and
            intervals['file_f1_delta'][0] > 0 and
            intervals['known_token_ratio'][1] < 1 and
            intervals['arm_time_ratio'][1] < 1)
    result = {
        'schema_version': 'are.g02-r11-development-aggregate/v1',
        'status': 'all-24-valid-scored',
        'definition_sha256': DEFINITION_SHA,
        'analysis': {'resamples': settings['resamples'], 'seed': seed,
                     'unit': 'task', 'strata': {key: len(value) for key, value in groups.items()},
                     'estimator': 'mean paired F1 difference; ratio of paired arm totals',
                     'percentile': 'linear interpolation at 2.5 and 97.5 percent'},
        'point': point,
        'interval_95': intervals,
        'directional_gate_passed': gate,
        'claim_ceiling': definition['claim_ceiling'],
        'pair_evidence': evidence,
        'open_questions': ['Vlad and Dave product-page review remains separate.',
                           'This changed development population does not prove full ContextBench or general ARE superiority.'],
    }
    OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': result['status'], 'directional_gate_passed': gate,
                      'point': point, 'interval_95': intervals,
                      'output_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
