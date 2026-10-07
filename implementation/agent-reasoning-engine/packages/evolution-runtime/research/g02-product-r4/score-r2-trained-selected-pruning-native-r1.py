#!/usr/bin/env python3
"""Preseal and native-score fixed r2-trained pruning on exposed G02 pairs."""

import hashlib
import json
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
INPUT = BASE / 'g02-r2-trained-selected-pruning-r1/SEAL.json'
FILE_AUDIT = BASE / 'g02-r2-trained-selected-pruning-file-audit-r1/RESULT.json'
OUTPUT = BASE / 'g02-r2-trained-selected-pruning-native-r1'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
UPSTREAM = SCORER_BASE / 'upstream'
CACHE = SCORER_BASE / 'scoring-cache'
INPUT_SHA = '4fd240425fdba4f216a378e6ca6c27d48627484e07261095cbaffe348f267ddc'
FILE_AUDIT_SHA = 'a57ffd798874349e0bfb3cc2cad9a86bf5210c8dc180ac280a772e54b746c6de'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-r2-trained-pruning-native-r1.{reason}')


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def prepare():
    need(not OUTPUT.exists(), 'output-exists')
    need(sha(INPUT) == INPUT_SHA and sha(FILE_AUDIT) == FILE_AUDIT_SHA and
         SCORER.is_file(), 'frozen-input-drift')
    seal, audit = read(INPUT), read(FILE_AUDIT)
    need(len(seal['rows']) == 32 and audit['prediction_seal_sha256'] == INPUT_SHA,
         'input-denominator')
    rows = []
    for row in seal['rows']:
        for name in ('source_prediction', 'packet', 'prediction'):
            need(sha(row[name]) == row[name + '_sha256'], f'input-hash:{name}')
        prediction, source = read(row['prediction']), read(row['source_prediction'])
        need(prediction['instance_id'] == source['instance_id'] and
             prediction['traj_data']['pred_steps'] == source['traj_data']['pred_steps'] and
             set(prediction['traj_data']['pred_files']) <= set(source['traj_data']['pred_files']),
             'prediction-shape')
        rows.append({**row, 'are_score_sha256': sha(row['are_score']),
                     'dsh_score_sha256': sha(row['dsh_score'])})
    need(sum(row['cohort'] == 'r2' for row in rows) == 23 and
         sum(row['cohort'] == 'r3' for row in rows) == 9, 'cohorts')
    preseal = {'schema_version': 'are.g02-r2-trained-pruning-prescore/v1',
               'posture': 'exposed-development-predictions-sealed-before-native-score',
               'prediction_seal_sha256': INPUT_SHA, 'file_audit_sha256': FILE_AUDIT_SHA,
               'scorer_sha256': sha(SCORER), 'script_sha256': sha(__file__),
               'rows': rows,
               'claim_ceiling': 'Exposed r2-trained/r3-transfer native scoring; fresh matched cohort still required.',
               'open_questions': ['Does Span-F1 improve in both cohorts?',
                                  'Can File-F1 exceed DSH on a fresh paired campaign?']}
    write_once(OUTPUT / 'PRE-SCORE-SEAL.json', preseal)
    print(json.dumps({'status': 'presealed', 'pairs': len(rows),
                      'sha256': sha(OUTPUT / 'PRE-SCORE-SEAL.json')}))


def summarize(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[f"cohort:{row['cohort']}"].append(row)
        groups[f"repository:{row['cohort']}:{row['repo']}"].append(row)
    summaries = {}
    for key, members in sorted(groups.items()):
        n = len(members)
        summaries[key] = {'pairs': n,
                          'mean_file_f1': sum(r['file_f1'] for r in members) / n,
                          'mean_base_file_f1': sum(r['base_file_f1'] for r in members) / n,
                          'mean_dsh_file_f1': sum(r['dsh_file_f1'] for r in members) / n,
                          'mean_file_f1_gain': sum(r['file_f1'] - r['base_file_f1'] for r in members) / n,
                          'mean_span_f1': sum(r['span_f1'] for r in members) / n,
                          'mean_base_span_f1': sum(r['base_span_f1'] for r in members) / n,
                          'mean_dsh_span_f1': sum(r['dsh_span_f1'] for r in members) / n,
                          'mean_span_f1_gain': sum(r['span_f1'] - r['base_span_f1'] for r in members) / n,
                          'changed': sum(r['dropped_files'] > 0 for r in members)}
    return summaries


def score():
    preseal_path = OUTPUT / 'PRE-SCORE-SEAL.json'
    preseal = read(preseal_path)
    need(len(preseal['rows']) == 32 and sha(INPUT) == preseal['prediction_seal_sha256'] and
         sha(FILE_AUDIT) == preseal['file_audit_sha256'] and
         sha(SCORER) == preseal['scorer_sha256'] and
         sha(__file__) == preseal['script_sha256'], 'preseal-drift')
    for row in preseal['rows']:
        for name in ('source_prediction', 'packet', 'prediction', 'are_score', 'dsh_score'):
            need(sha(row[name]) == row[name + '_sha256'], f'bound-drift:{name}')
    results = []
    for row in preseal['rows']:
        target = OUTPUT / f"{row['cohort']}-{row['pair']}" / 'native-score.json'
        need(not target.exists(), 'score-exists')
        target.parent.mkdir(parents=True, exist_ok=True)
        cmd = ['python3', str(SCORER), '--upstream', str(UPSTREAM),
               '--gold', str(UPSTREAM / 'data/full.parquet'), '--pred', row['prediction'],
               '--cache', str(CACHE), '--out', str(target)]
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=300,
                                   env=os.environ)
        need(completed.returncode == 0 and target.is_file(),
             f'score-failed:{row["pair"]}:{completed.stderr[-300:]}')
        new, old, dsh = (read(path)['native']['final'] for path in
                         (target, row['are_score'], row['dsh_score']))
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                        'dropped_files': row['dropped_files'], 'score_sha256': sha(target),
                        'file_f1': f1(new['file']), 'base_file_f1': f1(old['file']),
                        'dsh_file_f1': f1(dsh['file']),
                        'span_f1': f1(new['span']), 'base_span_f1': f1(old['span']),
                        'dsh_span_f1': f1(dsh['span'])})
        print(json.dumps({'scored': len(results), 'pair': row['pair']}), flush=True)
    summary = summarize(results)
    write_once(OUTPUT / 'RESULT.json', {'schema_version': 'are.g02-r2-trained-pruning-native-result/v1',
                                       'posture': 'exposed-development-only',
                                       'preseal_sha256': sha(preseal_path),
                                       'rows': results, 'summary': summary,
                                       'claim_ceiling': preseal['claim_ceiling'],
                                       'open_questions': preseal['open_questions']})
    print(json.dumps({'status': 'scored', 'pairs': len(results),
                      'sha256': sha(OUTPUT / 'RESULT.json'),
                      'cohorts': {key: value for key, value in summary.items()
                                  if key.startswith('cohort:')}}))


if __name__ == '__main__':
    need(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'),
         'usage: score-r2-trained-selected-pruning-native-r1.py prepare|score')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
