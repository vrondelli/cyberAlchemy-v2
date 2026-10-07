#!/usr/bin/env python3
"""Gold-blind exact API-reference closure on already exposed G02 source tasks."""

import hashlib
import json
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
R7 = ARCHIVE / 'g02-r7-qualified-source-20261001'
R8 = ARCHIVE / 'g02-r8-qualified-source-20261001'
R8_ATTEMPT = ARCHIVE / 'g02-product-replication-r8-20261001/pairs/01-pr8-mixed-01/raw'
OUTPUT = ARCHIVE / 'g02-api-consumer-exposed-20261001/SOURCE-SEAL.json'
EXTENSIONS = ('*.py', '*.js', '*.jsx', '*.ts', '*.tsx', '*.go', '*.rs', '*.java',
              '*.c', '*.cc', '*.cpp', '*.h')
GENERIC = {'TypeError', 'ValueError', 'AttributeError', 'NotImplemented',
           'NotImplementedError', 'FutureWarning', 'GitHub', 'CentOS',
           'OpenVZ', 'ControlMaster', 'ControlPersist'}
CLASS = re.compile(r'\b[A-Z][a-z]+(?:[A-Z][A-Za-z0-9]+)+\b')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, why):
    if not ok:
        raise ValueError('api-consumer-closure.' + why)


def command(*args):
    return subprocess.run(args, capture_output=True, text=True, timeout=120)


def production(path):
    parts = path.split('/')
    return not any(part in ('test', 'tests', 'testing', 'docs', 'examples', 'fixtures')
                   for part in parts) and not Path(path).name.startswith('test_') and \
        not Path(path).name.endswith(('.test.js', '.spec.js', '.test.ts', '.spec.ts'))


def select(task, cache, excluded):
    commit = task['base_commit']
    need(cache.is_dir(), 'cache-missing:' + task['instance_id'])
    head = command('git', '-C', str(cache), 'cat-file', '-e', commit + '^{commit}')
    need(head.returncode == 0, 'cache-commit:' + task['instance_id'])
    names = list(dict.fromkeys(CLASS.findall(task['problem_statement'])))
    names = [name for name in names if name not in GENERIC and len(name) >= 8][:12]
    documents = defaultdict(dict)
    accepted = []
    for symbol in names:
        result = command('git', '-C', str(cache), 'grep', '-n', '-F', symbol,
                         commit, '--', *EXTENSIONS)
        need(result.returncode in (0, 1), 'git-grep:' + symbol)
        need(len(result.stdout) <= 2_000_000, 'unbounded-grep:' + symbol)
        counts = Counter()
        for line in result.stdout.splitlines():
            parts = line.split(':', 3)
            if len(parts) >= 4 and production(parts[1]):
                counts[parts[1]] += 1
        df = len(counts)
        if not 2 <= df <= 15:
            continue
        accepted.append({'symbol': symbol, 'production_file_count': df})
        for path, count in counts.items():
            documents[path][symbol] = min(count, 3)
    df_by_name = {r['symbol']: r['production_file_count'] for r in accepted}
    ranking = []
    for path, counts in documents.items():
        score_units = sum(1000 * count // df_by_name[symbol]
                          for symbol, count in counts.items())
        ranking.append({'path': path, 'score_units': score_units,
                        'matched_symbols': sorted(counts)})
    ranking.sort(key=lambda row: (-row['score_units'], row['path']))
    selected = [row for row in ranking if row['path'] not in excluded][:2]
    return {'instance_id': task['instance_id'], 'base_commit': commit,
            'issue_sha256': hashlib.sha256(task['problem_statement'].encode()).hexdigest(),
            'cache_leaf': cache.name, 'excluded_delivered_or_selected_paths': sorted(excluded),
            'symbols_considered': names, 'symbols_accepted': accepted,
            'ranking': ranking, 'proposed_new_reads': selected}


def main():
    need(not OUTPUT.exists(), 'output-exists')
    r7_candidate = read(R7 / 'receipts/CANDIDATE.json')
    r7_cache = {r['ordinal']: r for r in read(R7 / 'receipts/TASK-CACHE-HYDRATION.json')['results']}
    need(len(r7_candidate['ordered_tasks']) == len(r7_cache) == 24, 'r7-shape')
    rows = []
    for task in r7_candidate['ordered_tasks']:
        ordinal = task['ordinal']
        root = R7 / f'preflights/g02-cross-layer-pr7-mixed-pf-{ordinal:02d}'
        task_path = root / 'tasks' / (task['instance_id'] + '.json')
        issue = read(task_path)
        need(issue['instance_id'] == task['instance_id'] and
             issue['base_commit'] == task['base_commit'], 'r7-task-binding')
        cache = R7 / 'caches/cache' / r7_cache[ordinal]['cache_leaf']
        rows.append({'cohort': 'r7-exposed-source-population', 'ordinal': ordinal,
                     **select(issue, cache, set())})
    r8_task_path = R8_ATTEMPT / 'tasks/SWE-Bench-Pro__python__maintenance__bugfix__ba13492e.json'
    r8_task = read(r8_task_path)
    r8_cache = read(R8 / 'receipts/TASK-CACHE-HYDRATION.json')['results'][0]
    need(r8_task['instance_id'] == r8_cache['instance_id'] and
         r8_task['base_commit'] == r8_cache['base_commit'], 'r8-task-binding')
    prediction = read(R8_ATTEMPT / 'evidence/run/prediction.json')['traj_data']
    delivered = {path for step in prediction['pred_steps'] for path in step['files']}
    delivered.update(prediction['pred_files'])
    rows.append({'cohort': 'r8-exposed-failed-pair', 'ordinal': 1,
                 **select(r8_task, R8 / 'caches/cache' / r8_cache['cache_leaf'], delivered)})
    payload = {'schema_version': 'are.g02-api-consumer-closure-source-seal/v1',
               'posture': 'source-only-exposed-development-no-gold-no-score-no-model',
               'rule': 'CamelCase issue names, excluding generic names; exact pinned-base references in 2..15 production files; rank by capped occurrence/inverse file frequency; propose at most two not already delivered or selected.',
               'script_sha256': sha(__file__),
               'r7_candidate_sha256': sha(R7 / 'receipts/CANDIDATE.json'),
               'r7_hydration_sha256': sha(R7 / 'receipts/TASK-CACHE-HYDRATION.json'),
               'r8_task_sha256': sha(r8_task_path),
               'r8_prediction_sha256': sha(R8_ATTEMPT / 'evidence/run/prediction.json'),
               'task_count': len(rows), 'rows': rows,
               'claim_ceiling': 'Proposed source reads only; no delivered receipt, final selection, native score, or superiority.',
               'open_questions': ['How many proposed files are actual native references on exposed tasks?',
                                  'Will receipt-backed live reads and final selection improve native quality?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    OUTPUT.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'sealed-before-labels', 'sha256': sha(OUTPUT),
                      'tasks': len(rows),
                      'tasks_with_proposals': sum(bool(r['proposed_new_reads']) for r in rows),
                      'proposals': sum(len(r['proposed_new_reads']) for r in rows)}))


if __name__ == '__main__':
    main()
