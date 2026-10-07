#!/usr/bin/env python3
"""Evaluator-only r11 read-coverage diagnostic at fixed model-call cutoffs.

This never proposes an early-stop policy or treats a truncated episode as a
valid prediction. Only aggregate counts leave the evaluator boundary.
"""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ROOT = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002')
SOURCE = Path('/home/vlad_/are-benchmark-archive/g02-r11-retrieval-exposed-r1-20261002/SEAL.json')
PARQUET = Path('/home/vlad_/are-benchmark-archive/g01-r8-eight-task-evaluator-r1/full.parquet')
OUTPUT = Path('/home/vlad_/are-benchmark-archive/g02-r11-call-cutoff-coverage-exposed-r1/AUDIT.json')
SOURCE_SHA = 'eb6295120ed72c227589db7c88920bb8654b170af19f9677c553824919782901'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
CUTOFFS = (5, 8, 10)


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r11-call-cutoff-coverage.' + reason)


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        return path[len('/testbed/'):]
    if path.startswith('/workspace/'):
        parts = path[len('/workspace/'):].split('/', 1)
        return parts[1] if len(parts) == 2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def read_paths(event):
    if event['kind'] == 'initial-source-packet':
        return {normalize(item['path']) for item in event['receipt']}
    if event['kind'] != 'tool-result' or event['output']['ok'] is not True:
        return set()
    if event['tool'] == 'read_file':
        return {normalize(event['output']['output']['path'])}
    if event['tool'] == 'search':
        return {normalize(item['path']) for item in
                event['output']['output']['observations']}
    return set()


def analyze_row(source, native):
    ordinal = source['ordinal']
    raw = ROOT / 'pairs' / f'{ordinal:02d}-pr11-mixed-{ordinal:02d}' / 'raw'
    decision = json.loads((raw / 'PAIR-DECISION.json').read_text())
    ledger = json.loads((raw / 'evidence/run/state/glm-transport-ledger.json').read_text())
    events = [json.loads(line) for line in
              (raw / 'evidence/run/events.jsonl').read_text().splitlines()]
    need(native['base_commit'] == source['base_commit'] and
         decision['instance_id'] == source['instance_id'] == native['instance_id'] and
         decision['task_posture'] == 'source-only development pair, not globally unseen',
         f'identity-{ordinal}')
    receipts = [item for item in ledger['receipts'] if item['kind'] == 'model']
    responses = [item for item in events if item['kind'] == 'model-response']
    need(len(receipts) == ledger['model_calls'] == len(responses) and
         [item['step'] for item in responses] == list(range(len(receipts))) and
         all(item['dispatched'] is True and item['status'] == 200 and
             item['automatic_retries'] == 0 and
             type(item['input_tokens']) is int and
             type(item['output_tokens']) is int for item in receipts),
         f'model-receipts-{ordinal}')
    costs = [item['input_tokens'] + item['output_tokens'] for item in receipts]
    need(sum(costs) == decision['quality']['are']['known_model_tokens'],
         f'model-cost-{ordinal}')
    initial = [item for item in events if item['kind'] == 'initial-source-packet']
    need(len(initial) == 1, f'initial-packet-{ordinal}')
    initial_paths = read_paths(initial[0])
    timed = [(item['step'], read_paths(item)) for item in events
             if item['kind'] == 'tool-result']
    need(all(type(step) is int and 0 <= step < len(receipts)
             for step, _ in timed), f'tool-timing-{ordinal}')
    all_delivered = initial_paths | set().union(*(paths for _, paths in timed))
    need(all_delivered == {normalize(path) for path in source['delivered_paths']},
         f'delivered-parity-{ordinal}')
    gold = {normalize(item['file']) for item in json.loads(native['gold_context'])}
    need(len(gold) > 0 and all(path and '..' not in Path(path).parts
                               for path in gold | all_delivered),
         f'gold-paths-{ordinal}')
    by_cutoff = {}
    for cutoff in CUTOFFS:
        prefix = initial_paths | set().union(
            *(paths for step, paths in timed if step < cutoff))
        by_cutoff[str(cutoff)] = {
            'model_calls_observed': min(cutoff, len(receipts)),
            'observed_model_tokens_through_cutoff': sum(costs[:cutoff]),
            'delivered_files_through_cutoff': len(prefix),
            'gold_files_delivered_through_cutoff': len(prefix & gold),
            'later_new_gold_files': len((all_delivered - prefix) & gold),
            'later_new_non_gold_files': len((all_delivered - prefix) - gold),
        }
    return {'ordinal': ordinal, 'repo': source['repo'],
            'model_calls': len(receipts), 'known_model_tokens': sum(costs),
            'gold_files': len(gold), 'full_delivered_files': len(all_delivered),
            'full_delivered_gold_files': len(all_delivered & gold),
            'cutoffs': by_cutoff}


def main():
    need(not OUTPUT.exists() and sha(SOURCE) == SOURCE_SHA and
         sha(PARQUET) == PARQUET_SHA, 'source-drift-or-output-exists')
    source = json.loads(SOURCE.read_text())
    need(source['schema_version'] == 'g02.r11-retrieval-exposed-seal/v1' and
         [row['ordinal'] for row in source['rows']] == list(range(1, 13)),
         'source-shape')
    table = parquet.read_table(
        PARQUET, columns=['instance_id', 'base_commit', 'gold_context']).to_pylist()
    native = {row['instance_id']: row for row in table}
    need(len(native) == len(table), 'native-duplicate')
    rows = [analyze_row(row, native[row['instance_id']]) for row in source['rows']]
    summary = {'tasks': len(rows),
               'all_model_tokens': sum(row['known_model_tokens'] for row in rows),
               'all_delivered_gold_files': sum(row['full_delivered_gold_files']
                                               for row in rows),
               'cutoffs': {str(cutoff): {
                   'observed_model_tokens_through_cutoff': sum(
                       row['cutoffs'][str(cutoff)]['observed_model_tokens_through_cutoff']
                       for row in rows),
                   'later_new_gold_files': sum(
                       row['cutoffs'][str(cutoff)]['later_new_gold_files']
                       for row in rows),
                   'later_new_non_gold_files': sum(
                       row['cutoffs'][str(cutoff)]['later_new_non_gold_files']
                       for row in rows)} for cutoff in CUTOFFS}}
    packet = {'schema_version': 'g02.r11-call-cutoff-coverage-exposed-audit/v1',
              'posture': 'evaluator-only-exposed-development-no-early-stop-run',
              'source_seal_sha256': SOURCE_SHA,
              'native_gold_parquet_sha256': PARQUET_SHA,
              'script_sha256': sha(Path(__file__)),
              'cutoff_semantics': 'Initial packet plus successful tool observations produced by model steps below K; token sum of first K archived model calls. No forced finalization, quality, or elapsed-time replay.',
              'rows': rows, 'summary': summary,
              'claim_ceiling': 'Observed prefix cost and file delivery only; not a valid early-stop prediction, native score, matched comparison, or superiority.',
              'open_questions': [
                  'Would an actual bounded finalization preserve native quality and reduce total token/time cost?',
                  'Does the behavior transfer beyond exposed r11 tasks?']}
    OUTPUT.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    data = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    with os.fdopen(os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'wb') as stream:
        stream.write(data)
    print(json.dumps({'summary': summary, 'sha256': hashlib.sha256(data).hexdigest()},
                     sort_keys=True))


if __name__ == '__main__':
    main()
