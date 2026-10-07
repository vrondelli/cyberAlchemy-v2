#!/usr/bin/env python3
"""Independent, read-only receipt and metric audit of G02 grounded r3.

Only already exposed development packets are covered. No native score is
rewritten, and this audit cannot qualify an unexposed DSH holdout.
"""

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
RUN = BASE / 'g02-r4-grounded-reviewer-development-r3'
PACKETS = BASE / 'g02-r4-reviewer-packets-r1'
ROOT = BASE / 'g02-r4-grounded-reviewer-score-r3'
SCORE_SCRIPT = BASE / 'g02-grounded-score-code-r3/score-grounded-review-r3.py'
NATIVE_SCORER = (BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/repo/'
                 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py')
FREEZE_SHA = '9323343bdcae45abdc9f5cb119029e54bdcc133bdc6bf89bfb2d1a7ff503170d'
PACKET_SEAL_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
EXPECTED_PAIRS = {'r2': 23, 'r3': 9}


def require(condition, reason):
    if not condition:
        raise ValueError(f'g02-grounded-audit-r3.{reason}')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def f1(metric):
    precision, coverage = metric['precision'], metric['coverage']
    return 2 * precision * coverage / (precision + coverage) if precision + coverage else 0.0


def quoted(value, source):
    return (isinstance(value, str) and 8 <= len(value) <= 240 and
            '\n' not in value and value in source)


def audit():
    seal_path, result_path = ROOT / 'PRE-SCORE-SEAL.json', ROOT / 'RESULT.json'
    freeze_path, run_path = RUN / 'FREEZE.json', RUN / 'RUN-RESULT.json'
    packet_seal_path = PACKETS / 'SEAL.json'
    require(sha(freeze_path) == FREEZE_SHA and sha(packet_seal_path) == PACKET_SEAL_SHA,
            'frozen-input-drift')
    seal, result, freeze, run, packet_seal = (read(p) for p in
        (seal_path, result_path, freeze_path, run_path, packet_seal_path))
    require(seal['schema_version'] == 'are.g02-grounded-prescore-seal/v3' and
            result['schema_version'] == 'are.g02-grounded-reviewer-exposed-result/v3' and
            seal['posture'] == result['posture'] == 'exposed-development-only' and
            result['seal_sha256'] == sha(seal_path) and
            seal['run_result_sha256'] == sha(run_path) and
            seal['review_freeze_sha256'] == FREEZE_SHA and
            seal['packet_seal_sha256'] == PACKET_SEAL_SHA, 'seal-binding')
    require(run['status'] == 'completed-exposed-diagnostic' and run['completed'] == 32 and
            len(seal['rows']) == len(result['rows']) == len(freeze['ordered_pairs']) ==
            len(packet_seal['packets']) == len(run['response_paths']) == 32, 'denominator')
    require(seal['script_sha256'] == sha(SCORE_SCRIPT) and
            seal['scorer_sha256'] == sha(NATIVE_SCORER), 'scorer-code-drift')
    counts, changed, total_usage, elapsed = Counter(), [], 0, 0
    by_group = defaultdict(list)
    for index, (binding, row) in enumerate(zip(seal['rows'], result['rows'])):
        cohort, pair = binding['cohort'], binding['pair']
        require((cohort, pair, binding['repo']) ==
                (row['cohort'], row['pair'], row['repo']), 'pair-binding')
        require((cohort, pair) == (freeze['ordered_pairs'][index]['cohort'],
                                   freeze['ordered_pairs'][index]['pair']) and
                freeze['ordered_pairs'][index] == packet_seal['packets'][index],
                'frozen-order')
        require(Path(binding['packet']) == Path(freeze['ordered_pairs'][index]['path']) and
                binding['packet_sha256'] == freeze['ordered_pairs'][index]['sha256'] and
                Path(binding['response']) == Path(run['response_paths'][index]), 'packet-order')
        for key in ('packet', 'response', 'started', 'source_prediction', 'are_score',
                    'dsh_score', 'prediction'):
            require(sha(binding[key]) == binding[key + '_sha256'], f'{pair}:{key}-drift')
        packet, response, started = (read(binding[key]) for key in ('packet', 'response', 'started'))
        require((response['cohort'], response['pair'], response['packet_sha256']) ==
                (cohort, pair, binding['packet_sha256']) and
                (started['cohort'], started['pair'], started['packet_sha256'],
                 started['request_sha256']) ==
                (cohort, pair, binding['packet_sha256'], response['request_sha256']),
                f'{pair}:attempt-binding')
        require(packet['prediction_sha256'] == binding['source_prediction_sha256'],
                f'{pair}:source-binding')
        source, prediction = read(binding['source_prediction']), read(binding['prediction'])
        require(source['traj_data']['pred_steps'] == prediction['traj_data']['pred_steps'],
                f'{pair}:steps')
        review = response['review']
        if response['status'] == 'invalid':
            require(review is None and binding['posture'] == row['posture'] == 'invalid-preserved' and
                    prediction == source, f'{pair}:invalid-preservation')
        else:
            require(response['status'] == 'valid' and response['http_status'] == 200 and
                    response['finish_reason'] == 'stop' and isinstance(review, dict),
                    f'{pair}:valid-response')
            raw = json.loads(response['content'])
            require(set(raw) == {'add', 'drop'} and review['citations'] == raw and
                    review['add_read_indexes'] == [a['read_index'] for a in raw['add']] and
                    review['drop_files'] == [d['file'] for d in raw['drop']] and
                    review['abstained'] == (not raw['add'] and not raw['drop']),
                    f'{pair}:citations-binding')
            handles = {h['index']: h for h in packet['delivered_reads']}
            require(len(handles) == len(packet['delivered_reads']), f'{pair}:handles')
            added_paths = set()
            for item in raw['add']:
                h = handles[item['read_index']]
                require(h['path'] not in packet['current_selected_files'] and
                        quoted(item['requirement_quote'], packet['issue']) and
                        quoted(item['evidence_quote'], h['snippet']),
                        f'{pair}:add-citation')
                added_paths.add(h['path'])
            for item in raw['drop']:
                own, replacement = handles[item['own_read_index']], handles[item['replacement_read_index']]
                require(item['file'] in packet['current_selected_files'] and
                        own['path'] == item['file'] and replacement['path'] != item['file'] and
                        replacement['path'] not in review['drop_files'] and
                        (replacement['path'] in packet['current_selected_files'] or
                         replacement['path'] in added_paths) and
                        quoted(item['requirement_quote'], packet['issue']) and
                        quoted(item['own_evidence_quote'], own['snippet']) and
                        quoted(item['replacement_evidence_quote'], replacement['snippet']),
                        f'{pair}:drop-citation')
            expected_files = [p for p in source['traj_data']['pred_files']
                              if p not in review['drop_files']]
            expected_spans = {p: list(source['traj_data']['pred_spans'][p])
                              for p in expected_files}
            for handle_index in review['add_read_indexes']:
                h = handles[handle_index]
                span = {'start': h['start'], 'end': h['end']}
                if h['path'] not in expected_files:
                    expected_files.append(h['path'])
                    expected_spans[h['path']] = []
                if span not in expected_spans[h['path']]:
                    expected_spans[h['path']].append(span)
            posture = 'valid-abstained' if review['abstained'] else 'valid-transformed'
            require(binding['posture'] == row['posture'] == posture and
                    prediction['traj_data']['pred_files'] == expected_files and
                    prediction['traj_data']['pred_spans'] == expected_spans,
                    f'{pair}:transformation')
        native_path = Path(binding['prediction']).with_name('native-score.json')
        require(sha(native_path) == row['score_sha256'], f'{pair}:score-hash')
        for prefix, path in (('', native_path), ('base_', binding['are_score']),
                             ('dsh_', binding['dsh_score'])):
            native = read(path)['native']['final']
            for metric in ('span', 'file'):
                require(abs(f1(native[metric]) - row[prefix + metric + '_f1']) < 1e-12,
                        f'{pair}:{prefix}{metric}-metric')
        require(row['usage'] == binding['usage'] == response['usage'] and
                row['elapsed_ms'] == binding['elapsed_ms'] == response['elapsed_ms'],
                f'{pair}:usage-binding')
        require(isinstance(row['usage'].get('total_tokens'), int), f'{pair}:unknown-usage')
        total_usage += row['usage']['total_tokens']
        elapsed += row['elapsed_ms']
        counts[cohort] += 1
        by_group[f'cohort:{cohort}'].append(row)
        by_group[f'repository:{cohort}:{row["repo"]}'].append(row)
        if row['posture'] == 'valid-transformed':
            changed.append({'cohort': cohort, 'pair': pair,
                            'file_f1_change': row['file_f1'] - row['base_file_f1'],
                            'span_f1_change': row['span_f1'] - row['base_span_f1']})
    require(dict(counts) == EXPECTED_PAIRS, 'cohort-counts')
    for key, members in by_group.items():
        original = result['summary'][key]
        size = len(members)
        for field, expression in (
            ('mean_file_f1', lambda r: r['file_f1']),
            ('mean_base_file_f1', lambda r: r['base_file_f1']),
            ('mean_dsh_file_f1', lambda r: r['dsh_file_f1']),
            ('mean_file_f1_change', lambda r: r['file_f1'] - r['base_file_f1']),
            ('mean_span_f1_change', lambda r: r['span_f1'] - r['base_span_f1'])):
            require(abs(sum(expression(r) for r in members) / size - original[field]) < 1e-12,
                    f'{key}:{field}-summary')
        require(original['pairs'] == size and
                original['reviewer_total_tokens_known'] == sum(r['usage']['total_tokens'] for r in members) and
                original['reviewer_elapsed_ms'] == sum(r['elapsed_ms'] for r in members),
                f'{key}:usage-summary')
    return {'status': 'passed', 'posture': 'exposed-development-only',
            'audit_script_sha256': sha(__file__),
            'pairs': dict(counts), 'seal_sha256': sha(seal_path),
            'result_sha256': sha(result_path), 'run_result_sha256': sha(run_path),
            'reviewer_tokens': total_usage, 'reviewer_elapsed_ms': elapsed,
            'valid_edits': changed, 'claim_ceiling': 'No unexposed G02 or superiority claim.'}


if __name__ == '__main__':
    import sys
    require(sys.argv[1:] in (['audit'], ['seal']), 'usage:audit|seal')
    result = audit()
    if sys.argv[1:] == ['seal']:
        output = ROOT / 'HASH-AUDIT.json'
        with output.open('x') as stream:
            json.dump(result, stream, sort_keys=True, indent=2)
            stream.write('\n')
        output.chmod(0o600)
        print(json.dumps({'status': result['status'], 'path': str(output),
                          'sha256': sha(output), 'pairs': result['pairs']}))
    else:
        print(json.dumps(result, sort_keys=True))
