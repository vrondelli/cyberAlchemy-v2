#!/usr/bin/env python3
"""Seal and score the frozen, already-exposed G02 grounded-reviewer study.

The reviewer never sees native gold or DSH outputs. This scorer must run only
after all 32 response receipts exist; it cannot establish a fresh holdout win.
"""

import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
RUN = BASE / 'g02-r4-grounded-reviewer-development-r3'
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
OUTPUT = BASE / 'g02-r4-grounded-reviewer-score-r3'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
SCORER = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
UPSTREAM = SCORER_BASE / 'upstream'
CACHE = SCORER_BASE / 'scoring-cache'
PLANS = {'r3': BASE / 'g02-product-replication-r3/EXECUTION-PLAN.json',
         'r2': BASE / 'g02-product-replication-execution-r2.json'}
FREEZE_SHA = '9323343bdcae45abdc9f5cb119029e54bdcc133bdc6bf89bfb2d1a7ff503170d'
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-grounded-score-r3.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def write_once(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')


def exact(value, keys):
    return isinstance(value, dict) and set(value) == set(keys)


def quoted(value, source):
    return (isinstance(value, str) and 8 <= len(value) <= 240 and
            '\n' not in value and value in source)


def role(value):
    return isinstance(value, str) and 12 <= len(value.strip()) and len(value) <= 240


def normalize(raw, packet):
    """Independently recheck the JS citation contract's safety-relevant fields."""
    need(exact(raw, ('add', 'drop')) and isinstance(raw['add'], list) and
         isinstance(raw['drop'], list) and len(raw['add']) <= 5 and len(raw['drop']) <= 3,
         'raw-shape')
    selected = packet['current_selected_files']
    need(isinstance(selected, list) and len(selected) == len(set(selected)), 'selected-shape')
    handles = {h['index']: h for h in packet['delivered_reads']}
    need(len(handles) == len(packet['delivered_reads']), 'handles-duplicate')
    adds, drops = [], []
    for item in raw['add']:
        need(exact(item, ('read_index', 'requirement_quote', 'evidence_quote', 'causal_role')), 'add-shape')
        index = item['read_index']
        h = handles.get(index) if type(index) is int else None
        need(h is not None and h['path'] not in selected and index not in adds and
             quoted(item['requirement_quote'], packet['issue']) and
             quoted(item['evidence_quote'], h['snippet']) and role(item['causal_role']),
             'add-citation')
        adds.append(index)
    for item in raw['drop']:
        need(exact(item, ('file', 'own_read_index', 'own_evidence_quote',
                          'replacement_read_index', 'replacement_evidence_quote',
                          'requirement_quote', 'causal_role')), 'drop-shape')
        file = item['file']
        own_index, replacement_index = item['own_read_index'], item['replacement_read_index']
        own = handles.get(own_index) if type(own_index) is int else None
        replacement = handles.get(replacement_index) if type(replacement_index) is int else None
        need(file in selected and file not in drops and own is not None and own['path'] == file and
             replacement is not None and replacement['path'] != file and
             quoted(item['requirement_quote'], packet['issue']) and
             quoted(item['own_evidence_quote'], own['snippet']) and
             quoted(item['replacement_evidence_quote'], replacement['snippet']) and
             role(item['causal_role']), 'drop-citation')
        drops.append(file)
    added_paths = {handles[i]['path'] for i in adds}
    for item in raw['drop']:
        replacement_path = handles[item['replacement_read_index']]['path']
        need(replacement_path not in drops and
             (replacement_path in selected or replacement_path in added_paths),
             'replacement-not-retained')
    return {'add_read_indexes': adds, 'drop_files': drops,
            'citations': raw, 'abstained': not (adds or drops)}


def transform(original, packet, response):
    candidate = copy.deepcopy(original)
    need(response['status'] in ('valid', 'invalid'), 'response-status')
    if response['status'] == 'invalid':
        need(response['review'] is None, 'invalid-review')
        return candidate, 'invalid-preserved', 0, 0
    need(response['http_status'] == 200 and response['finish_reason'] == 'stop', 'valid-transport')
    try:
        normalized = normalize(json.loads(response['content']), packet)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError('g02-grounded-score-r3.valid-content') from error
    need(response['review'] == normalized, 'review-content-drift')
    selected = candidate['traj_data']
    need(set(selected['pred_files']) == set(packet['current_selected_files']), 'selected-packet-drift')
    for path in normalized['drop_files']:
        selected['pred_files'].remove(path)
        selected['pred_spans'].pop(path)
    handles = {h['index']: h for h in packet['delivered_reads']}
    added_spans = 0
    for index in normalized['add_read_indexes']:
        h = handles[index]
        path, span = h['path'], {'start': h['start'], 'end': h['end']}
        if path not in selected['pred_files']:
            selected['pred_files'].append(path)
            selected['pred_spans'][path] = []
        if span not in selected['pred_spans'][path]:
            selected['pred_spans'][path].append(span)
            added_spans += 1
    need(set(selected['pred_files']) == set(selected['pred_spans']) and
         len(selected['pred_files']) == len(set(selected['pred_files'])), 'prediction-shape')
    return candidate, ('valid-abstained' if normalized['abstained'] else 'valid-transformed'), added_spans, len(normalized['drop_files'])


def bindings():
    need(sha(RUN / 'FREEZE.json') == FREEZE_SHA and sha(PACKETS / 'SEAL.json') == PACKET_SEAL_SHA,
         'frozen-input-drift')
    freeze, run, packet_seal = read(RUN / 'FREEZE.json'), read(RUN / 'RUN-RESULT.json'), read(PACKETS / 'SEAL.json')
    need(run['status'] == 'completed-exposed-diagnostic' and run['completed'] == 32 and
         len(freeze['ordered_pairs']) == len(run['response_paths']) == len(packet_seal['packets']) == 32,
         'incomplete-run')
    plans = {cohort: {p['suffix']: p for p in read(path)['ordered_pairs']}
             for cohort, path in PLANS.items()}
    rows = []
    for index, item in enumerate(freeze['ordered_pairs']):
        cohort, pair = item['cohort'], item['pair']
        need(cohort in plans and pair in plans[cohort], 'unknown-pair')
        need(item == packet_seal['packets'][index], 'packet-binding')
        packet_path = Path(item['path'])
        need(sha(packet_path) == item['sha256'], 'packet-drift')
        response_path = RUN / f'{cohort}-{pair}' / 'RESPONSE.json'
        started_path = response_path.with_name('STARTED.json')
        need(Path(run['response_paths'][index]) == response_path, 'response-path')
        response, started, packet = read(response_path), read(started_path), read(packet_path)
        need((response['cohort'], response['pair'], response['packet_sha256']) ==
             (cohort, pair, item['sha256']) and
             (started['cohort'], started['pair'], started['packet_sha256'], started['request_sha256']) ==
             (cohort, pair, item['sha256'], response['request_sha256']), 'attempt-binding')
        root = Path(plans[cohort][pair]['root'])
        source, are_score, dsh_score = (root / 'evidence/run/prediction.json',
                                        root / 'evidence/run/native-score.json',
                                        root / 'dsh-export/native-score.json')
        need(all(p.is_file() for p in (source, are_score, dsh_score)), 'original-score-missing')
        need(sha(source) == packet['prediction_sha256'], 'source-prediction-drift')
        original = read(source)
        candidate, posture, added, dropped = transform(original, packet, response)
        need(candidate['traj_data']['pred_steps'] == original['traj_data']['pred_steps'],
             'delivered-steps-drift')
        rows.append({'cohort': cohort, 'pair': pair, 'repo': plans[cohort][pair]['repo'],
                     'packet': packet_path,
                     'response': response_path, 'started': started_path,
                     'source_prediction': source, 'are_score': are_score, 'dsh_score': dsh_score,
                     'candidate': candidate, 'posture': posture, 'added_spans': added,
                     'dropped_files': dropped, 'usage': response.get('usage'),
                     'elapsed_ms': response.get('elapsed_ms')})
    need(len({(r['cohort'], r['pair']) for r in rows}) == 32, 'duplicate-pairs')
    return rows


def prepare():
    need(not OUTPUT.exists(), 'output-exists')
    rows = bindings()  # All receipts and transformations verified before any score output.
    sealed = []
    for row in rows:
        pred = OUTPUT / f"{row['cohort']}-{row['pair']}" / 'prediction.json'
        write_once(pred, row.pop('candidate'))
        bound = {'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                 'posture': row['posture'],
                 'added_spans': row['added_spans'], 'dropped_files': row['dropped_files'],
                 'usage': row['usage'], 'elapsed_ms': row['elapsed_ms']}
        for name in ('packet', 'response', 'started', 'source_prediction', 'are_score', 'dsh_score'):
            bound[name], bound[name + '_sha256'] = str(row[name]), sha(row[name])
        bound['prediction'], bound['prediction_sha256'] = str(pred), sha(pred)
        sealed.append(bound)
    seal = {'schema_version': 'are.g02-grounded-prescore-seal/v3',
            'posture': 'exposed-development-only', 'run_result_sha256': sha(RUN / 'RUN-RESULT.json'),
            'review_freeze_sha256': FREEZE_SHA, 'packet_seal_sha256': PACKET_SEAL_SHA,
            'script_sha256': sha(__file__), 'scorer_sha256': sha(SCORER),
            'plan_sha256': {k: sha(v) for k, v in PLANS.items()}, 'rows': sealed,
            'claim_ceiling': 'Exposed development only; no fresh G02 superiority claim.'}
    write_once(OUTPUT / 'PRE-SCORE-SEAL.json', seal)
    print(json.dumps({'sealed': len(sealed), 'seal_sha256': sha(OUTPUT / 'PRE-SCORE-SEAL.json')}))


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def summarize(rows):
    """Descriptive exposed-cohort diagnostics, never a prospective claim gate."""
    groups = {}
    for row in rows:
        for key in (f"cohort:{row['cohort']}", f"repository:{row['cohort']}:{row['repo']}"):
            groups.setdefault(key, []).append(row)
    summary = {}
    for key, members in sorted(groups.items()):
        size = len(members)
        summary[key] = {'pairs': size,
            'mean_file_f1': sum(r['file_f1'] for r in members) / size,
            'mean_base_file_f1': sum(r['base_file_f1'] for r in members) / size,
            'mean_dsh_file_f1': sum(r['dsh_file_f1'] for r in members) / size,
            'mean_file_f1_change': sum(r['file_f1'] - r['base_file_f1'] for r in members) / size,
            'mean_span_f1_change': sum(r['span_f1'] - r['base_span_f1'] for r in members) / size,
            'base_wins_lost_to_dsh': sum(r['base_file_f1'] > r['dsh_file_f1'] and
                                         r['file_f1'] <= r['dsh_file_f1'] for r in members),
            'candidate_wins_over_dsh': sum(r['file_f1'] > r['dsh_file_f1'] for r in members),
            'valid_edits': sum(r['posture'] == 'valid-transformed' for r in members),
            'valid_abstentions': sum(r['posture'] == 'valid-abstained' for r in members),
            'invalid_preserved': sum(r['posture'] == 'invalid-preserved' for r in members),
            'reviewer_elapsed_ms': sum(r['elapsed_ms'] for r in members if isinstance(r['elapsed_ms'], int)),
            'reviewer_total_tokens_known': sum(r['usage'].get('total_tokens', 0) for r in members
                                               if isinstance(r['usage'], dict) and
                                               isinstance(r['usage'].get('total_tokens'), int)),
            'reviewer_token_usage_missing': sum(not isinstance(r['usage'], dict) or
                                                not isinstance(r['usage'].get('total_tokens'), int)
                                                for r in members)}
    return summary


def score():
    seal_path = OUTPUT / 'PRE-SCORE-SEAL.json'
    seal = read(seal_path)
    need(len(seal['rows']) == 32 and sha(__file__) == seal['script_sha256'] and
         sha(SCORER) == seal['scorer_sha256'] and
         sha(RUN / 'FREEZE.json') == seal['review_freeze_sha256'] and
         sha(RUN / 'RUN-RESULT.json') == seal['run_result_sha256'] and
         sha(PACKETS / 'SEAL.json') == seal['packet_seal_sha256'], 'prescore-drift')
    for cohort, path in PLANS.items():
        need(sha(path) == seal['plan_sha256'][cohort], 'plan-drift')
    for row in seal['rows']:
        for name in ('packet', 'response', 'started', 'source_prediction', 'are_score', 'dsh_score', 'prediction'):
            need(sha(row[name]) == row[name + '_sha256'], f'drift:{row["pair"]}:{name}')
    results = []
    for row in seal['rows']:
        score_path = Path(row['prediction']).with_name('native-score.json')
        need(not score_path.exists(), 'score-exists')
        cmd = ['python3', str(SCORER), '--upstream', str(UPSTREAM),
               '--gold', str(UPSTREAM / 'data/full.parquet'), '--pred', row['prediction'],
               '--cache', str(CACHE), '--out', str(score_path)]
        completed = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        need(completed.returncode == 0 and score_path.is_file(),
             f'score-failed:{row["pair"]}:{completed.stderr[-300:]}')
        new = read(score_path)['native']['final']
        old = read(row['are_score'])['native']['final']
        dsh = read(row['dsh_score'])['native']['final']
        results.append({'cohort': row['cohort'], 'pair': row['pair'], 'repo': row['repo'],
                        'posture': row['posture'],
                        'added_spans': row['added_spans'], 'dropped_files': row['dropped_files'],
                        'usage': row['usage'], 'elapsed_ms': row['elapsed_ms'],
                        'score_sha256': sha(score_path), 'span_f1': f1(new['span']),
                        'base_span_f1': f1(old['span']), 'dsh_span_f1': f1(dsh['span']),
                        'file_f1': f1(new['file']), 'base_file_f1': f1(old['file']),
                        'dsh_file_f1': f1(dsh['file'])})
    write_once(OUTPUT / 'RESULT.json', {'schema_version': 'are.g02-grounded-reviewer-exposed-result/v3',
               'posture': 'exposed-development-only', 'seal_sha256': sha(seal_path),
               'rows': results, 'summary': summarize(results),
               'claim_ceiling': seal['claim_ceiling']})
    print(json.dumps({'scored': len(results), 'result_sha256': sha(OUTPUT / 'RESULT.json')}))


if __name__ == '__main__':
    need(len(sys.argv) == 2 and sys.argv[1] in ('prepare', 'score'),
         'usage: score-grounded-review-r3.py prepare|score')
    {'prepare': prepare, 'score': score}[sys.argv[1]]()
