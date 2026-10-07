#!/usr/bin/env python3
"""Counts-only, evaluator-side DSH/ARE reach diagnosis on exposed G02 r11."""

import hashlib
import json
import os
from collections import Counter, defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive')
UNION = ROOT / 'g02-r11-relation-union-exposed-r1-20261003/SOURCE-UNION.json'
PARQUET = ROOT / 'g01-r8-eight-task-evaluator-r1/full.parquet'
OUTPUT = ROOT / 'g02-r11-dsh-search-reach-exposed-r1-20261004/EVALUATOR-AUDIT.json'
PINS = {
    UNION: '7493a1865356df42e1bae584bc196619ee6159636be6250f1ce9895650234291',
    PARQUET: '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        path = parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    if OUTPUT.exists() or any(sha(path) != pin for path, pin in PINS.items()):
        raise SystemExit('output-exists-or-input-pin-drift')
    union = json.loads(UNION.read_text())['rows']
    labels = parquet.read_table(PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    references = {row['instance_id']: row for row in labels}
    if len(union) != 12 or len(references) != len(labels):
        raise SystemExit('cohort-drift')
    rows = []
    by_repo = defaultdict(Counter)
    for source in union:
        ordinal = source['ordinal']
        reference = references[source['instance_id']]
        if reference['base_commit'] != source['base_commit']:
            raise SystemExit(f'base-drift:{ordinal}')
        raw = (ROOT / 'g02-product-replication-r11-20261002/pairs'
               / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw')
        are_path = raw / 'policy-pruning/prediction.json'
        dsh_path = raw / 'dsh-export/prediction.json'
        are = json.loads(are_path.read_text())
        dsh = json.loads(dsh_path.read_text())
        if are['instance_id'] != source['instance_id'] or dsh['instance_id'] != source['instance_id']:
            raise SystemExit(f'prediction-drift:{ordinal}')
        are_files = {normalize(path) for path in are['traj_data']['pred_files']}
        dsh_files = {normalize(path) for path in dsh['traj_data']['pred_files']}
        gold = {normalize(item['file']) for item in json.loads(reference['gold_context'])}
        intents = Counter()
        read_paths = set()
        intent_hashes = []
        tool_root = raw / 'dsh-control/tools'
        for path in sorted(tool_root.glob('*.json')):
            record = json.loads(path.read_text())
            if record.get('kind') != 'tool-intent':
                continue
            function = record['call']['function']
            name = function['name']
            if name not in {'search', 'read_file', 'list_files'}:
                raise SystemExit(f'unknown-tool-intent:{ordinal}')
            args = function['arguments']
            if isinstance(args, str):
                args = json.loads(args)
            intents[name] += 1
            if name == 'read_file' and isinstance(args.get('path'), str):
                read_paths.add(normalize(args['path']))
            intent_hashes.append(sha(path))
        unique_dsh_gold = (dsh_files - are_files) & gold
        unique_are_gold = (are_files - dsh_files) & gold
        row = {
            'ordinal': ordinal, 'repo': source['repo'],
            'are_selected_files': len(are_files), 'dsh_selected_files': len(dsh_files),
            'are_gold_hits': len(are_files & gold), 'dsh_gold_hits': len(dsh_files & gold),
            'dsh_unique_gold': len(unique_dsh_gold), 'are_unique_gold': len(unique_are_gold),
            'dsh_unique_gold_explicitly_read': len(unique_dsh_gold & read_paths),
            'dsh_unique_gold_not_explicitly_read': len(unique_dsh_gold - read_paths),
            'dsh_tool_intents': sum(intents.values()),
            'dsh_searches': intents['search'], 'dsh_reads': intents['read_file'],
            'dsh_lists': intents['list_files'],
            'are_prediction_sha256': sha(are_path), 'dsh_prediction_sha256': sha(dsh_path),
            'dsh_intent_hashes_sha256': hashlib.sha256('\n'.join(intent_hashes).encode()).hexdigest(),
        }
        rows.append(row)
        for key in ('dsh_unique_gold', 'are_unique_gold', 'dsh_unique_gold_explicitly_read',
                    'dsh_tool_intents', 'dsh_searches', 'dsh_reads', 'dsh_lists'):
            by_repo[source['repo']][key] += row[key]
    sum_key = lambda key: sum(row[key] for row in rows)
    summary = {
        'tasks': len(rows),
        'are_selected_files': sum_key('are_selected_files'),
        'dsh_selected_files': sum_key('dsh_selected_files'),
        'dsh_unique_gold': sum_key('dsh_unique_gold'),
        'are_unique_gold': sum_key('are_unique_gold'),
        'dsh_unique_gold_explicitly_read': sum_key('dsh_unique_gold_explicitly_read'),
        'dsh_unique_gold_not_explicitly_read': sum_key('dsh_unique_gold_not_explicitly_read'),
        'dsh_tool_intents': sum_key('dsh_tool_intents'),
        'dsh_searches': sum_key('dsh_searches'), 'dsh_reads': sum_key('dsh_reads'),
        'dsh_lists': sum_key('dsh_lists'),
        'by_repository': {name: dict(counts) for name, counts in sorted(by_repo.items())},
    }
    report = {
        'schema_version': 'g02.r11-dsh-search-reach-exposed-r1/v1',
        'posture': 'evaluator-only-exposed-trajectory-metadata-no-raw-tool-output-in-report',
        'input_sha256': {str(path): pin for path, pin in PINS.items()},
        'script_sha256': sha(Path(__file__)), 'summary': summary, 'rows': rows,
        'claim_ceiling': 'Descriptive trajectory/reach diagnosis only; not causal, deployable, independent or superiority evidence.',
    }
    data = (json.dumps(report, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as target:
        target.write(data)
    print(json.dumps({'summary': summary, 'receipt_sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
