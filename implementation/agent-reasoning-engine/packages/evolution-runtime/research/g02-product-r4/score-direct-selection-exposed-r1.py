#!/usr/bin/env python3
"""Seal all exposed G02 direct selections before native scoring; no fresh claim."""

import copy
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
RUN = BASE / 'g02-direct-selection-exposed-r1'
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
OUTPUT = BASE / 'g02-direct-selection-score-r1'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
UPSTREAM = SCORER_BASE / 'upstream'
CACHE = SCORER_BASE / 'scoring-cache'
PLANS = {'r3': BASE / 'g02-product-replication-r3/EXECUTION-PLAN.json',
         'r2': BASE / 'g02-product-replication-execution-r2.json'}
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'


def need(value, reason):
    if not value:
        raise ValueError(f'g02-direct-selection-score-r1.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def normalize(content, packet):
    """Recheck selection independently of the Node runner."""
    raw = json.loads(content)
    need(type(raw) is dict and set(raw) == {'decision', 'read_indexes'}, 'output-shape')
    need(raw['decision'] in ('select', 'abstain') and type(raw['read_indexes']) is list and
         len(raw['read_indexes']) <= 12, 'output-decision')
    selected = packet['current_selected_files']
    need(type(selected) is list and len(selected) == len(set(selected)), 'selected-shape')
    handles = {}
    for handle in packet['delivered_reads']:
        index = handle['index']
        need(type(index) is int and index not in handles and type(handle['path']) is str and
             type(handle['snippet']) is str and handle['snippet'], 'handle-shape')
        handles[index] = handle
    if raw['decision'] == 'abstain':
        need(not raw['read_indexes'], 'abstain-indexes')
        return {'decision': 'abstain', 'read_indexes': [], 'files': [], 'changed': False}
    need(bool(raw['read_indexes']), 'empty-selection')
    paths = []
    for index in raw['read_indexes']:
        need(type(index) is int and index in handles and
             handles[index]['path'] not in paths, 'index-or-duplicate-path')
        paths.append(handles[index]['path'])
    need(not selected or bool(set(paths) & set(selected)), 'all-original-files-dropped')
    return {'decision': 'select', 'read_indexes': raw['read_indexes'], 'files': paths,
            'changed': set(paths) != set(selected)}


def transform(original, packet, response):
    candidate = copy.deepcopy(original)
    need(response['status'] in ('valid', 'invalid'), 'response-status')
    if response['status'] == 'invalid':
        need(response['selection'] is None, 'invalid-selection')
        return candidate, 'invalid-preserved'
    need(response['http_status'] == 200 and response['finish_reason'] == 'stop' and
         type(response['content']) is str, 'valid-transport')
    selected = normalize(response['content'], packet)
    need(selected == response['selection'], 'selection-drift')
    original_files = original['traj_data']['pred_files']
    need(set(original_files) == set(packet['current_selected_files']) and
         set(original_files) == set(original['traj_data']['pred_spans']), 'original-drift')
    if selected['decision'] == 'abstain' or not selected['changed']:
        return candidate, 'valid-unchanged'
    handles = {h['index']: h for h in packet['delivered_reads']}
    spans = {}
    for index in selected['read_indexes']:
        h = handles[index]
        path = h['path']
        if path in original_files:
            spans[path] = copy.deepcopy(original['traj_data']['pred_spans'][path])
        else:
            need(type(h['start']) is int and type(h['end']) is int and
                 h['start'] <= h['end'], 'span-range')
            spans[path] = [{'start': h['start'], 'end': h['end']}]
    candidate['traj_data']['pred_files'] = selected['files']
    candidate['traj_data']['pred_spans'] = spans
    need(set(candidate['traj_data']['pred_files']) == set(spans), 'prediction-shape')
    return candidate, 'valid-transformed'


def bindings():
    need(sha(PACKETS / 'SEAL.json') == PACKET_SEAL_SHA, 'packet-seal-drift')
    freeze, run, seal = read(RUN / 'FREEZE.json'), read(RUN / 'RUN-RESULT.json'), read(PACKETS / 'SEAL.json')
    need(freeze['status'] == 'frozen-before-model-dispatch' and
         run['status'] == 'completed-exposed-diagnostic' and run['completed'] == 32 and
         len(freeze['ordered_pairs']) == len(run['response_paths']) == len(seal['packets']) == 32,
         'incomplete-run')
    plans = {cohort: {p['suffix']: p for p in read(path)['ordered_pairs']}
             for cohort, path in PLANS.items()}
    rows = []
    for ordinal, item in enumerate(freeze['ordered_pairs']):
        cohort, pair = item['cohort'], item['pair']
        need(item == seal['packets'][ordinal] and cohort in plans and pair in plans[cohort],
             'pair-binding')
        packet_path = Path(item['path'])
        need(sha(packet_path) == item['sha256'], 'packet-drift')
        packet = read(packet_path)
        response_path = RUN / f'{cohort}-{pair}' / 'RESPONSE.json'
        started_path = response_path.with_name('STARTED.json')
        need(Path(run['response_paths'][ordinal]) == response_path, 'response-path')
        response, started = read(response_path), read(started_path)
        need((response['cohort'], response['pair'], response['packet_sha256']) ==
             (cohort, pair, item['sha256']) and
             (started['cohort'], started['pair'], started['packet_sha256'], started['request_sha256']) ==
             (cohort, pair, item['sha256'], response['request_sha256']), 'response-binding')
        root = Path(plans[cohort][pair]['root'])
        source, are_score, dsh_score = (root / 'evidence/run/prediction.json',
                                        root / 'evidence/run/native-score.json',
                                        root / 'dsh-export/native-score.json')
        need(all(p.is_file() for p in (source, are_score, dsh_score)) and
             sha(source) == packet['prediction_sha256'], 'source-drift')
        original = read(source)
        candidate, posture = transform(original, packet, response)
        need(candidate['traj_data']['pred_steps'] == original['traj_data']['pred_steps'],
             'delivered-steps-drift')
        rows.append({'cohort': cohort, 'pair': pair, 'repo': plans[cohort][pair]['repo'],
                     'posture': posture, 'candidate': candidate,
                     'packet': packet_path, 'response': response_path, 'started': started_path,
                     'source_prediction': source, 'are_score': are_score, 'dsh_score': dsh_score,
                     'usage': response.get('usage'), 'elapsed_ms': response.get('elapsed_ms')})
    need(len({(r['cohort'], r['pair']) for r in rows}) == 32, 'duplicate-pairs')
    return rows


def prepare():
    need(not OUTPUT.exists(), 'output-exists')
    rows = bindings()  # All 32 responses validated before any score is generated.
    sealed = []
    for row in rows:
        prediction = OUTPUT / f"{row['cohort']}-{row['pair']}" / 'prediction.json'
        write_once(prediction, row.pop('candidate'))
        bound = {'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                 'posture': row['posture'], 'usage': row['usage'], 'elapsed_ms': row['elapsed_ms']}
        for name in ('packet', 'response', 'started', 'source_prediction', 'are_score', 'dsh_score'):
            bound[name], bound[name + '_sha256'] = str(row[name]), sha(row[name])
        bound['prediction'], bound['prediction_sha256'] = str(prediction), sha(prediction)
        sealed.append(bound)
    preseal = {'schema_version': 'are.g02-direct-selection-prescore-seal/v1',
               'posture': 'exposed-development-only',
               'run_result_sha256': sha(RUN / 'RUN-RESULT.json'),
               'freeze_sha256': sha(RUN / 'FREEZE.json'),
               'packet_seal_sha256': PACKET_SEAL_SHA, 'script_sha256': sha(__file__),
               'scorer_sha256': sha(SCORER),
               'plan_sha256': {k: sha(v) for k, v in PLANS.items()}, 'rows': sealed,
               'claim_ceiling': freeze_claim()}
    write_once(OUTPUT / 'PRE-SCORE-SEAL.json', preseal)
    print(json.dumps({'sealed': len(sealed), 'seal_sha256': sha(OUTPUT / 'PRE-SCORE-SEAL.json')}))


def freeze_claim():
    return read(RUN / 'FREEZE.json')['claim_ceiling']


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def score():
    preseal_path = OUTPUT / 'PRE-SCORE-SEAL.json'
    preseal = read(preseal_path)
    need(len(preseal['rows']) == 32 and sha(__file__) == preseal['script_sha256'] and
         sha(SCORER) == preseal['scorer_sha256'] and
         sha(RUN / 'FREEZE.json') == preseal['freeze_sha256'] and
         sha(RUN / 'RUN-RESULT.json') == preseal['run_result_sha256'] and
         sha(PACKETS / 'SEAL.json') == preseal['packet_seal_sha256'], 'prescore-drift')
    for cohort, plan in PLANS.items():
        need(sha(plan) == preseal['plan_sha256'][cohort], 'plan-drift')
    for row in preseal['rows']:
        for name in ('packet', 'response', 'started', 'source_prediction', 'are_score',
                     'dsh_score', 'prediction'):
            need(sha(row[name]) == row[name + '_sha256'], f'drift:{row["pair"]}:{name}')
    results = []
    for row in preseal['rows']:
        score_path = Path(row['prediction']).with_name('native-score.json')
        need(not score_path.exists(), 'score-exists')
        cmd = ['python3', str(SCORER), '--upstream', str(UPSTREAM),
               '--gold', str(UPSTREAM / 'data/full.parquet'), '--pred', row['prediction'],
               '--cache', str(CACHE), '--out', str(score_path)]
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=300, env=os.environ)
        need(completed.returncode == 0 and score_path.is_file(),
             f'score-failed:{row["pair"]}:{completed.stderr[-300:]}')
        new = read(score_path)['native']['final']
        old = read(row['are_score'])['native']['final']
        dsh = read(row['dsh_score'])['native']['final']
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                        'posture': row['posture'], 'usage': row['usage'],
                        'elapsed_ms': row['elapsed_ms'], 'score_sha256': sha(score_path),
                        'file_f1': f1(new['file']), 'base_file_f1': f1(old['file']),
                        'dsh_file_f1': f1(dsh['file']), 'span_f1': f1(new['span']),
                        'base_span_f1': f1(old['span']), 'dsh_span_f1': f1(dsh['span'])})
        print(json.dumps({'scored': len(results), 'cohort': row['cohort'], 'pair': row['pair']}), flush=True)
    summary = {}
    for key in ('r2', 'r3'):
        members = [r for r in results if r['cohort'] == key]
        need(len(members) == {'r2': 23, 'r3': 9}[key], 'cohort-size')
        summary[key] = {'pairs': len(members),
                        'mean_file_f1': sum(r['file_f1'] for r in members) / len(members),
                        'mean_base_file_f1': sum(r['base_file_f1'] for r in members) / len(members),
                        'mean_dsh_file_f1': sum(r['dsh_file_f1'] for r in members) / len(members),
                        'mean_file_f1_gain': sum(r['file_f1'] - r['base_file_f1'] for r in members) / len(members),
                        'mean_span_f1_gain': sum(r['span_f1'] - r['base_span_f1'] for r in members) / len(members),
                        'changed': sum(r['posture'] == 'valid-transformed' for r in members),
                        'invalid': sum(r['posture'] == 'invalid-preserved' for r in members),
                        'review_tokens_known': sum(r['usage'].get('total_tokens', 0) for r in members
                                                   if type(r['usage']) is dict and
                                                   type(r['usage'].get('total_tokens')) is int),
                        'review_token_usage_missing': sum(type(r['usage']) is not dict or
                                                          type(r['usage'].get('total_tokens')) is not int
                                                          for r in members),
                        'review_elapsed_ms': sum(r['elapsed_ms'] for r in members
                                                 if type(r['elapsed_ms']) is int)}
    write_once(OUTPUT / 'RESULT.json', {'schema_version': 'are.g02-direct-selection-result/v1',
                                       'posture': 'exposed-development-only',
                                       'preseal_sha256': sha(preseal_path), 'rows': results,
                                       'summary': summary, 'claim_ceiling': freeze_claim()})
    print(json.dumps({'scored': len(results), 'result_sha256': sha(OUTPUT / 'RESULT.json')}))


if __name__ == '__main__':
    need(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'),
         'usage: score-direct-selection-exposed-r1.py prepare|score')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
