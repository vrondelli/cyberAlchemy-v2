#!/usr/bin/env python3
"""Uniform exposed G02 formatting recovery; no new model calls or fresh tasks."""

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
ORIGINAL_SCRIPT = BASE / 'g02-grounded-score-code-r3/score-grounded-review-r3.py'
ORIGINAL_SCORE = BASE / 'g02-r4-grounded-reviewer-score-r3'
OUTPUT = BASE / 'g02-r4-grounded-reviewer-recovery-r1'
RUN = BASE / 'g02-r4-grounded-reviewer-development-r3'
EXPECTED_ORIGINAL_SCRIPT_SHA = '7811a63fe52d70beadc7cd19cbfa6d2cb76aa11811193f430d817dbb70b75fbe'
EXPECTED_RUN_SHA = '326964283da12e204da1b5affd32091dc584eb2996f3e72e685fe3d965d500bb'
EXPECTED_ORIGINAL_RESULT_SHA = 'b04cd4cf303710d2f44d3d7623a145a19f3791976f176ed725148d84460b27af'
EXPECTED_INVALID = 5


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-format-recovery.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def original_module():
    need(sha(ORIGINAL_SCRIPT) == EXPECTED_ORIGINAL_SCRIPT_SHA and
         sha(RUN / 'RUN-RESULT.json') == EXPECTED_RUN_SHA and
         sha(ORIGINAL_SCORE / 'RESULT.json') == EXPECTED_ORIGINAL_RESULT_SHA,
         'original-input-drift')
    spec = importlib.util.spec_from_file_location('g02_original_grounded_score', ORIGINAL_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_recoverable(response):
    need(response['status'] == 'invalid' and response['review'] is None and
         response['http_status'] == 200 and response['finish_reason'] == 'stop',
         'invalid-response-shape')
    text = response['content']
    need(isinstance(text, str) and len(text) <= 8192, 'content-shape')
    fenced = re.fullmatch(r'```(?:json)?\s*\n([\s\S]*?)\n```\s*', text)
    normalized = fenced.group(1) if fenced else text
    parsed = json.loads(normalized)
    need(isinstance(parsed, dict) and set(parsed) == {'add', 'drop'}, 'parsed-shape')
    return parsed, bool(fenced)


def prepare():
    need(not OUTPUT.exists(), 'output-exists')
    original = original_module()
    rows = original.bindings()
    freeze = read(RUN / 'FREEZE.json')
    need(len(rows) == len(freeze['ordered_pairs']) == 32, 'denominator')
    # The only relaxed semantic field is the explanation length; all exact
    # issue/source quotes, handles, replacement rules and edit limits remain.
    original.role = lambda value: (isinstance(value, str) and
                                   12 <= len(value.strip()) and len(value) <= 512)
    sealed, recovered = [], 0
    for index, row in enumerate(rows):
        binding = freeze['ordered_pairs'][index]
        need((row['cohort'], row['pair']) == (binding['cohort'], binding['pair']),
             'pair-order')
        packet_path = Path(binding['path'])
        packet = read(packet_path)
        response_path = RUN / f"{row['cohort']}-{row['pair']}" / 'RESPONSE.json'
        response = read(response_path)
        source_path = Path(row['source_prediction'])
        source = read(source_path)
        candidate = row.pop('candidate')
        posture, fenced = row['posture'], False
        if response['status'] == 'invalid':
            parsed, fenced = parse_recoverable(response)
            normalized = original.normalize(parsed, packet)
            synthetic = {**response, 'status': 'valid',
                         'content': json.dumps(parsed), 'review': normalized}
            candidate, posture, _, _ = original.transform(source, packet, synthetic)
            need(posture == 'valid-transformed' and candidate != source,
                 'recovery-no-edit')
            recovered += 1
        elif response['status'] == 'valid':
            need(posture in ('valid-abstained', 'valid-transformed'), 'valid-posture')
        else:
            raise ValueError('g02-format-recovery.unknown-response')
        prediction_path = OUTPUT / f"{row['cohort']}-{row['pair']}" / 'prediction.json'
        write_once(prediction_path, candidate)
        old_prediction = ORIGINAL_SCORE / f"{row['cohort']}-{row['pair']}" / 'prediction.json'
        if response['status'] == 'valid':
            need(sha(prediction_path) == sha(old_prediction), 'unchanged-prediction-drift')
        sealed.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                       'source_prediction': str(source_path),
                       'source_prediction_sha256': sha(source_path),
                       'packet': str(packet_path), 'packet_sha256': sha(packet_path),
                       'response': str(response_path), 'response_sha256': sha(response_path),
                       'old_prediction': str(old_prediction),
                       'old_prediction_sha256': sha(old_prediction),
                       'prediction': str(prediction_path),
                       'prediction_sha256': sha(prediction_path),
                       'old_score': str(ORIGINAL_SCORE / f"{row['cohort']}-{row['pair']}" /
                                        'native-score.json'),
                       'old_score_sha256': sha(ORIGINAL_SCORE /
                                               f"{row['cohort']}-{row['pair']}" /
                                               'native-score.json'),
                       'are_score': str(row['are_score']),
                       'are_score_sha256': sha(row['are_score']),
                       'dsh_score': str(row['dsh_score']),
                       'dsh_score_sha256': sha(row['dsh_score']),
                       'posture': posture, 'recovered': response['status'] == 'invalid',
                       'fenced_json': fenced, 'usage': row['usage'],
                       'elapsed_ms': row['elapsed_ms']})
    need(recovered == EXPECTED_INVALID and sum(x['fenced_json'] for x in sealed) == 1,
         'recovery-count')
    seal = {'schema_version': 'are.g02-grounded-format-recovery-seal/v1',
            'posture': 'post-hoc-exposed-development-only',
            'rule': 'single JSON fence allowed; causal_role max 512 instead of 240 characters; all exact citations unchanged',
            'score_or_gold_access_at_prepare': 'original score hashes only; no metric or gold reads',
            'model_calls_added': 0, 'rows': sealed, 'recovered': recovered,
            'original_script_sha256': EXPECTED_ORIGINAL_SCRIPT_SHA,
            'original_run_sha256': EXPECTED_RUN_SHA,
            'original_result_sha256': EXPECTED_ORIGINAL_RESULT_SHA,
            'script_sha256': sha(__file__), 'native_scorer_sha256': sha(original.SCORER),
            'claim_ceiling': 'Post-hoc formatting recovery on exposed G02 packets; no fresh superiority claim'}
    write_once(OUTPUT / 'PRE-SCORE-SEAL.json', seal)
    print(json.dumps({'status': 'sealed-before-recovery-scoring',
                      'seal_sha256': sha(OUTPUT / 'PRE-SCORE-SEAL.json'),
                      'rows': len(sealed), 'recovered': recovered}))


def score():
    original = original_module()
    seal_path = OUTPUT / 'PRE-SCORE-SEAL.json'
    seal = read(seal_path)
    need(seal['script_sha256'] == sha(__file__) and
         seal['native_scorer_sha256'] == sha(original.SCORER) and
         len(seal['rows']) == 32 and seal['recovered'] == EXPECTED_INVALID and
         not (OUTPUT / 'RESULT.json').exists(), 'seal-drift')
    results = []
    for row in seal['rows']:
        for name in ('source_prediction', 'packet', 'response', 'old_prediction',
                     'prediction', 'old_score', 'are_score', 'dsh_score'):
            need(sha(row[name]) == row[name + '_sha256'], f'{row["pair"]}:{name}-drift')
        if row['recovered']:
            score_path = Path(row['prediction']).with_name('native-score.json')
            need(not score_path.exists(), 'recovered-score-exists')
            cmd = ['python3', str(original.SCORER), '--upstream', str(original.UPSTREAM),
                   '--gold', str(original.UPSTREAM / 'data/full.parquet'),
                   '--pred', row['prediction'], '--cache', str(original.CACHE),
                   '--out', str(score_path)]
            run = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            need(run.returncode == 0 and score_path.is_file(),
                 f'{row["pair"]}:native-score:{run.stderr[-240:]}')
        else:
            need(row['prediction_sha256'] == row['old_prediction_sha256'],
                 'unchanged-score-reuse')
            score_path = Path(row['old_score'])
        new = read(score_path)['native']['final']
        old = read(row['are_score'])['native']['final']
        dsh = read(row['dsh_score'])['native']['final']
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                        'recovered': row['recovered'], 'posture': row['posture'],
                        'score_path': str(score_path), 'score_sha256': sha(score_path),
                        'file_f1': original.f1(new['file']),
                        'base_file_f1': original.f1(old['file']),
                        'dsh_file_f1': original.f1(dsh['file']),
                        'span_f1': original.f1(new['span']),
                        'base_span_f1': original.f1(old['span']),
                        'dsh_span_f1': original.f1(dsh['span'])})
    summary = {}
    for cohort in ('r2', 'r3'):
        group = [x for x in results if x['cohort'] == cohort]
        need(len(group) == {'r2': 23, 'r3': 9}[cohort], f'{cohort}-denominator')
        summary[cohort] = {'pairs': len(group),
                           'mean_file_f1': sum(x['file_f1'] for x in group) / len(group),
                           'mean_base_file_f1': sum(x['base_file_f1'] for x in group) / len(group),
                           'mean_dsh_file_f1': sum(x['dsh_file_f1'] for x in group) / len(group),
                           'mean_span_f1': sum(x['span_f1'] for x in group) / len(group),
                           'mean_base_span_f1': sum(x['base_span_f1'] for x in group) / len(group),
                           'recovered': sum(x['recovered'] for x in group)}
    result = {'schema_version': 'are.g02-grounded-format-recovery-result/v1',
              'posture': 'post-hoc-exposed-development-only',
              'seal_sha256': sha(seal_path), 'rows': results, 'summary': summary,
              'model_calls_added': 0, 'native_scores_new': EXPECTED_INVALID,
              'claim_ceiling': seal['claim_ceiling']}
    write_once(OUTPUT / 'RESULT.json', result)
    print(json.dumps({'status': 'scored-exposed-recovery',
                      'result_sha256': sha(OUTPUT / 'RESULT.json'), 'summary': summary}))


if __name__ == '__main__':
    need(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'), 'arguments')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
