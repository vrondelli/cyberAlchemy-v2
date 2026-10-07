#!/usr/bin/env python3
"""Isolated native scoring of the already sealed G02 formatting recovery."""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r4-grounded-reviewer-recovery-r1'
ROOT = BASE / 'g02-r4-grounded-reviewer-recovery-score-r2'
SCRATCH = Path('/tmp/are-g02-grounded-recovery-score-r2')
OLD_SCRIPT = BASE / 'g02-grounded-score-code-r3/score-grounded-review-format-recovery-r1.py'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = (SCORER_BASE / 'repo/implementation/agent-reasoning-engine/'
          'benchmarks/contextbench-v1/score_native.py')
UPSTREAM = SCORER_BASE / 'upstream'
CACHE = SCORER_BASE / 'scoring-cache'
SOURCE_SEAL_SHA = '58ac2e212dc6ecb046bd395208c6c6d1656d316448ed13678a288313751a6fcc'
OLD_SCRIPT_SHA = 'b0e537f201211d44806cee9974beb4fc03ac415b10bdd88705ad266fa4ef6c1f'


def need(ok, reason):
    if not ok:
        raise ValueError(f'g02-format-score-r2.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def f1(metric):
    c, p = metric['coverage'], metric['precision']
    return 2 * c * p / (c + p) if c + p else 0.0


def source_rows():
    need(sha(SOURCE / 'PRE-SCORE-SEAL.json') == SOURCE_SEAL_SHA and
         sha(OLD_SCRIPT) == OLD_SCRIPT_SHA, 'source-seal-drift')
    seal = read(SOURCE / 'PRE-SCORE-SEAL.json')
    need(seal['script_sha256'] == OLD_SCRIPT_SHA and len(seal['rows']) == 32 and
         seal['recovered'] == 5, 'source-shape')
    for row in seal['rows']:
        for name in ('source_prediction', 'packet', 'response', 'old_prediction',
                     'prediction', 'old_score', 'are_score', 'dsh_score'):
            need(sha(row[name]) == row[name + '_sha256'], f'{row["pair"]}:{name}-drift')
    return seal['rows']


def prepare():
    need(not ROOT.exists() and not SCRATCH.exists(), 'output-or-scratch-exists')
    rows = source_rows()
    seal = {'schema_version': 'are.g02-grounded-format-recovery-score-seal/v2',
            'posture': 'post-hoc-exposed-development-only',
            'source_prescore_seal_sha256': SOURCE_SEAL_SHA,
            'scorer_sha256': sha(SCORER), 'script_sha256': sha(__file__),
            'scratch_root': str(SCRATCH), 'model_calls_added': 0,
            'recovered': sum(r['recovered'] for r in rows),
            'rows': [{k: row[k] for k in ('cohort', 'pair', 'repo', 'recovered',
                                         'prediction', 'prediction_sha256',
                                         'old_prediction_sha256', 'old_score',
                                         'old_score_sha256', 'are_score',
                                         'are_score_sha256', 'dsh_score',
                                         'dsh_score_sha256')} for row in rows],
            'claim_ceiling': 'Post-hoc exposed G02 formatting recovery; no fresh superiority claim'}
    need(seal['recovered'] == 5, 'recovered-count')
    write_once(ROOT / 'SCORE-SEAL.json', seal)
    print(json.dumps({'status': 'isolated-score-sealed',
                      'seal_sha256': sha(ROOT / 'SCORE-SEAL.json'),
                      'rows': len(rows), 'recovered': seal['recovered']}))


def score():
    rows = source_rows()
    seal_path = ROOT / 'SCORE-SEAL.json'
    seal = read(seal_path)
    need(seal['source_prescore_seal_sha256'] == SOURCE_SEAL_SHA and
         seal['script_sha256'] == sha(__file__) and seal['scorer_sha256'] == sha(SCORER) and
         seal['scratch_root'] == str(SCRATCH) and len(seal['rows']) == len(rows) == 32 and
         not (ROOT / 'RESULT.json').exists(), 'score-seal-drift')
    results = []
    for row, bound in zip(rows, seal['rows']):
        need((row['cohort'], row['pair']) == (bound['cohort'], bound['pair']) and
             sha(row['prediction']) == bound['prediction_sha256'], 'row-binding')
        if row['recovered']:
            score_path = ROOT / f"{row['cohort']}-{row['pair']}" / 'native-score.json'
            if score_path.exists():
                need('final' in read(score_path).get('native', {}), 'existing-score-invalid')
            else:
                score_path.parent.mkdir(parents=True, exist_ok=True)
                cmd = ['python3', str(SCORER), '--upstream', str(UPSTREAM),
                       '--gold', str(UPSTREAM / 'data/full.parquet'),
                       '--pred', row['prediction'], '--cache', str(CACHE),
                       '--out', str(score_path)]
                env = {**os.environ, 'CONTEXTBENCH_TMP_ROOT': str(SCRATCH)}
                run = subprocess.run(cmd, capture_output=True, text=True,
                                     timeout=300, env=env)
                need(run.returncode == 0 and score_path.is_file() and
                     'final' in read(score_path).get('native', {}),
                     f'{row["pair"]}:native-score:{run.stderr[-240:]}')
        else:
            need(row['prediction_sha256'] == row['old_prediction_sha256'],
                 'unchanged-score-reuse')
            score_path = Path(row['old_score'])
        final = read(score_path)['native']['final']
        base = read(row['are_score'])['native']['final']
        dsh = read(row['dsh_score'])['native']['final']
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                        'recovered': row['recovered'], 'score_path': str(score_path),
                        'score_sha256': sha(score_path),
                        'file_f1': f1(final['file']), 'base_file_f1': f1(base['file']),
                        'dsh_file_f1': f1(dsh['file']), 'span_f1': f1(final['span']),
                        'base_span_f1': f1(base['span']), 'dsh_span_f1': f1(dsh['span'])})
    summary = {}
    for cohort, expected in [('r2', 23), ('r3', 9)]:
        group = [r for r in results if r['cohort'] == cohort]
        need(len(group) == expected, 'cohort-denominator')
        summary[cohort] = {'pairs': expected,
                           'recovered': sum(r['recovered'] for r in group),
                           **{f'mean_{key}': sum(r[key] for r in group) / expected
                              for key in ('file_f1', 'base_file_f1', 'dsh_file_f1',
                                          'span_f1', 'base_span_f1', 'dsh_span_f1')}}
    write_once(ROOT / 'RESULT.json',
               {'schema_version': 'are.g02-grounded-format-recovery-result/v2',
                'posture': 'post-hoc-exposed-development-only',
                'seal_sha256': sha(seal_path), 'model_calls_added': 0,
                'rows': results, 'summary': summary,
                'claim_ceiling': seal['claim_ceiling']})
    print(json.dumps({'status': 'isolated-score-complete',
                      'result_sha256': sha(ROOT / 'RESULT.json'),
                      'summary': summary}))


if __name__ == '__main__':
    need(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'), 'arguments')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
