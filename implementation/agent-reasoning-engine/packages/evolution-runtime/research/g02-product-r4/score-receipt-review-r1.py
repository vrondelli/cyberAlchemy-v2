#!/usr/bin/env python3
"""Pre-score seal and native-score the 32 exposed G02 reviewer responses.

This diagnostic cannot qualify a fresh holdout or support a product claim.
"""

import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
RUN = BASE / 'g02-r4-reviewer-development-r2'
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
OUTPUT = BASE / 'g02-r4-reviewer-score-r1'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
UPSTREAM = SCORER_BASE / 'upstream'
CACHE = SCORER_BASE / 'scoring-cache'
PLANS = {
    'r3': BASE / 'g02-product-replication-r3/EXECUTION-PLAN.json',
    'r2': BASE / 'g02-product-replication-execution-r2.json',
}
EXPECTED_FREEZE_SHA = '7e5b762eb749174a8a5566f98be5e92e7b0b5ca29a537e56cf36064682b72039'
EXPECTED_PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def transform(original, packet, response):
    """Only receipt-bound spans may be added; invalid responses retain original."""
    candidate = copy.deepcopy(original)
    require(response['status'] in ('valid', 'invalid'), 'response-status')
    if response['status'] != 'valid':
        require(response['review'] is None, 'invalid-with-review')
        return candidate, 'invalid-preserved', 0, 0
    review = response['review']
    require(isinstance(review, dict) and set(review) == {'add_read_indexes', 'drop_files'}, 'review-shape')
    adds, drops = review['add_read_indexes'], review['drop_files']
    require(isinstance(adds, list) and len(adds) <= 5 and len(set(adds)) == len(adds), 'adds-shape')
    require(isinstance(drops, list) and len(drops) <= 3 and len(set(drops)) == len(drops), 'drops-shape')
    selected = candidate['traj_data']
    require(all(isinstance(x, str) and x in selected['pred_files'] for x in drops), 'drop-not-selected')
    handles = {h['index']: h for h in packet['delivered_reads']}
    require(len(handles) == len(packet['delivered_reads']), 'duplicate-handles')
    require(all(type(i) is int and i in handles for i in adds), 'add-not-delivered')
    require(not any(handles[i]['path'] in drops for i in adds), 'add-drop-conflict')
    for path in drops:
        selected['pred_files'].remove(path)
        selected['pred_spans'].pop(path)
    count = 0
    for index in adds:
        handle = handles[index]
        path = handle['path']
        span = {'start': handle['start'], 'end': handle['end']}
        if path not in selected['pred_files']:
            selected['pred_files'].append(path)
            selected['pred_spans'][path] = []
        if span not in selected['pred_spans'][path]:
            selected['pred_spans'][path].append(span)
            count += 1
    require(set(selected['pred_files']) == set(selected['pred_spans']), 'file-span-mismatch')
    require(len(selected['pred_files']) == len(set(selected['pred_files'])), 'duplicate-files')
    return candidate, 'valid-transformed', count, len(drops)


def bindings():
    require(sha(RUN / 'FREEZE.json') == EXPECTED_FREEZE_SHA, 'review-freeze-drift')
    require(sha(PACKETS / 'SEAL.json') == EXPECTED_PACKET_SEAL_SHA, 'packet-seal-drift')
    freeze, run, packet_seal = read(RUN / 'FREEZE.json'), read(RUN / 'RUN-RESULT.json'), read(PACKETS / 'SEAL.json')
    require(run['status'] == 'completed-exposed-diagnostic' and run['completed'] == 32, 'review-run-incomplete')
    require(len(freeze['ordered_pairs']) == len(run['response_paths']) == len(packet_seal['packets']) == 32, 'pair-count')
    plans = {}
    for cohort, path in PLANS.items():
        plans[cohort] = {p['suffix']: p for p in read(path)['ordered_pairs']}
    rows = []
    for index, item in enumerate(freeze['ordered_pairs']):
        cohort, pair = item['cohort'], item['pair']
        require(cohort in plans and pair in plans[cohort], 'unknown-pair')
        packet_binding = packet_seal['packets'][index]
        require((packet_binding['cohort'], packet_binding['pair']) == (cohort, pair), 'packet-order')
        require(item['path'] == packet_binding['path'] and item['sha256'] == packet_binding['sha256'], 'packet-binding')
        packet_path = Path(item['path'])
        require(sha(packet_path) == item['sha256'], 'packet-drift')
        response_path = Path(run['response_paths'][index])
        require(response_path == RUN / f'{cohort}-{pair}' / 'RESPONSE.json', 'response-path')
        response = read(response_path)
        require((response['cohort'], response['pair'], response['packet_sha256']) == (cohort, pair, item['sha256']), 'response-binding')
        root = Path(plans[cohort][pair]['root'])
        source = root / 'evidence/run/prediction.json'
        are_score = root / 'evidence/run/native-score.json'
        dsh_score = root / 'dsh-export/native-score.json'
        require(all(p.is_file() for p in (source, are_score, dsh_score)), 'original-score-missing')
        packet = read(packet_path)
        require(sha(source) == packet['prediction_sha256'], 'original-prediction-drift')
        candidate, posture, added, dropped = transform(read(source), packet, response)
        require(candidate['traj_data']['pred_steps'] == read(source)['traj_data']['pred_steps'], 'delivered-steps-drift')
        rows.append((cohort, pair, root, packet_path, response_path, source, are_score, dsh_score,
                     candidate, posture, added, dropped))
    require(len({(r[0], r[1]) for r in rows}) == 32, 'duplicate-pair')
    return rows


def prepare():
    require(not OUTPUT.exists(), 'output-exists')
    rows = bindings()  # all inputs must pass before any output exists
    sealed = []
    for cohort, pair, root, packet, response, source, are_score, dsh_score, candidate, posture, added, dropped in rows:
        path = OUTPUT / f'{cohort}-{pair}' / 'prediction.json'
        write_once(path, candidate)
        sealed.append({'cohort': cohort, 'pair': pair, 'root': str(root), 'packet': str(packet),
                       'packet_sha256': sha(packet), 'response': str(response), 'response_sha256': sha(response),
                       'source_prediction': str(source), 'source_prediction_sha256': sha(source),
                       'are_score': str(are_score), 'are_score_sha256': sha(are_score),
                       'dsh_score': str(dsh_score), 'dsh_score_sha256': sha(dsh_score),
                       'prediction': str(path), 'prediction_sha256': sha(path),
                       'posture': posture, 'added_spans': added, 'dropped_files': dropped})
    seal = {'schema_version': 'are.g02-reviewer-prescore-seal/v1', 'posture': 'exposed-development-only',
            'run_result_sha256': sha(RUN / 'RUN-RESULT.json'), 'review_freeze_sha256': EXPECTED_FREEZE_SHA,
            'packet_seal_sha256': EXPECTED_PACKET_SEAL_SHA, 'script_sha256': sha(Path(__file__)),
            'scorer_sha256': sha(SCORER), 'plan_sha256': {k: sha(v) for k, v in PLANS.items()},
            'rows': sealed, 'claim_ceiling': 'Exposed development only; no fresh superiority claim.'}
    write_once(OUTPUT / 'PRE-SCORE-SEAL.json', seal)
    print(json.dumps({'sealed': len(sealed), 'valid': sum(x['posture'] == 'valid-transformed' for x in sealed),
                      'seal_sha256': sha(OUTPUT / 'PRE-SCORE-SEAL.json')}))


def score():
    seal_path = OUTPUT / 'PRE-SCORE-SEAL.json'
    seal = read(seal_path)
    require(len(seal['rows']) == 32, 'seal-pair-count')
    require(sha(Path(__file__)) == seal['script_sha256'] and sha(SCORER) == seal['scorer_sha256'], 'code-drift')
    require(sha(RUN / 'FREEZE.json') == seal['review_freeze_sha256'], 'review-freeze-drift')
    require(sha(RUN / 'RUN-RESULT.json') == seal['run_result_sha256'], 'review-result-drift')
    require(sha(PACKETS / 'SEAL.json') == seal['packet_seal_sha256'], 'packet-seal-drift')
    for cohort, path in PLANS.items():
        require(sha(path) == seal['plan_sha256'][cohort], 'plan-drift')
    for row in seal['rows']:
        for key in ('packet', 'response', 'source_prediction', 'are_score', 'dsh_score', 'prediction'):
            require(sha(Path(row[key])) == row[key + '_sha256'], f'drift:{row["pair"]}:{key}')
    results = []
    for row in seal['rows']:
        score_path = Path(row['prediction']).with_name('native-score.json')
        require(not score_path.exists(), 'score-exists')
        cmd = ['python3', str(SCORER), '--upstream', str(UPSTREAM), '--gold', str(UPSTREAM / 'data/full.parquet'),
               '--pred', row['prediction'], '--cache', str(CACHE), '--out', str(score_path)]
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        require(completed.returncode == 0 and score_path.is_file(), f'score-failed:{row["pair"]}:{completed.stderr[-300:]}')
        new = read(score_path)['native']['final']
        old = read(Path(row['are_score']))['native']['final']
        dsh = read(Path(row['dsh_score']))['native']['final']
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'posture': row['posture'],
                        'added_spans': row['added_spans'], 'dropped_files': row['dropped_files'],
                        'score_sha256': sha(score_path), 'span_f1': f1(new['span']),
                        'base_span_f1': f1(old['span']), 'dsh_span_f1': f1(dsh['span']),
                        'file_f1': f1(new['file']), 'base_file_f1': f1(old['file']),
                        'dsh_file_f1': f1(dsh['file'])})
    result = {'schema_version': 'are.g02-reviewer-exposed-result/v1', 'posture': 'exposed-development-only',
              'seal_sha256': sha(seal_path), 'rows': results, 'claim_ceiling': seal['claim_ceiling']}
    write_once(OUTPUT / 'RESULT.json', result)
    print(json.dumps({'scored': len(results), 'result_sha256': sha(OUTPUT / 'RESULT.json')}))


if __name__ == '__main__':
    require(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'),
            'usage: score-receipt-review-r1.py prepare|score')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
