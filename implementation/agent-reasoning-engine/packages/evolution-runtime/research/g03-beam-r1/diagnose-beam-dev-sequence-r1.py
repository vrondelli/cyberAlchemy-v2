#!/usr/bin/env python3
"""Locate missed BEAM development event citations relative to r2 selections."""

import argparse
import ast
from collections import Counter
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
PARQUET = ROOT / '100K-00000-of-00001.parquet'
PARQUET_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
R2 = ROOT / 'DEV-SELECTIONS-r2.json'
R2_SHA = '6742812fb55d609326bcca3f2228a321da1c0ca79b21e43dfa5029e0daea019a'
R2_AUDIT = ROOT / 'DEV-EVENT-r2-AUDIT.json'
R2_AUDIT_SHA = '95df22705ccf93595dff1c04ac361b7c73f9c6482272f6917d4391a9f44d2d31'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-sequence.' + reason)


def cited_ids(value):
    groups = value.values() if isinstance(value, dict) else [value]
    need(all(isinstance(group, list) for group in groups), 'citation-groups')
    ids = [item for group in groups for item in group]
    need(ids and all(type(item) is int and item >= 0 for item in ids),
        'citation-values')
    return set(ids)


def run():
    paths = [(SOURCE, SOURCE_SHA), (PARQUET, PARQUET_SHA),
        (SPLIT, SPLIT_SHA), (R2, R2_SHA), (R2_AUDIT, R2_AUDIT_SHA)]
    need(all(sha(path.read_bytes()) == digest for path, digest in paths),
        'input-drift')
    split = json.loads(SPLIT.read_text())
    selection = json.loads(R2.read_text())
    prior = json.loads(R2_AUDIT.read_text())
    dev = set(split['development_conversation_keys'])
    need(len(dev) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev.intersection(split['heldout_conversation_keys']),
        'split-boundary')
    sources = {row['conversation_key']: row for line in SOURCE.read_text().splitlines()
        if (row := json.loads(line))['conversation_key'] in dev}
    need(set(sources) == dev, 'source-development')
    selected = {row['probe_id']: row for row in selection['selections']
        if row['ability'] == 'event_ordering'}
    need(len(selected) == 8, 'selection-count')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
        'conversation_seed']).to_pylist()
    keys_by_id = {row['conversation_id']:
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}"
        for row in metadata}
    dev_ids = [item for item, key in keys_by_id.items() if key in dev]
    need(len(dev_ids) == 4 and len(keys_by_id) == 20,
        'metadata-selection')
    # Evaluator-valued columns enter Python only for the sealed dev IDs.
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(keys_by_id[row['conversation_id']] in dev
        for row in rows), 'filtered-development')
    missed = []
    reached = []
    per_probe = []
    for row in rows:
        key = keys_by_id[row['conversation_id']]
        source = sources[key]
        entries = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(entries) == 2, 'event-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                sha(canonical(entry['question']))]))[:24]
            current = selected.get(probe_id)
            need(current and current['conversation_key'] == key,
                'probe-binding')
            chosen = set(current['selected_turn_ids'])
            cited = cited_ids(entry.get('source_chat_ids'))
            need(chosen and all(item < len(source['turns']) for item in cited),
                'turn-bounds')
            for turn_id in cited:
                turn = source['turns'][turn_id]
                record = {'role': turn['role'],
                    'source_chars': len(turn['content']),
                    'nearest_selected_turn_distance': min(abs(turn_id - item)
                        for item in chosen)}
                (reached if turn_id in chosen else missed).append(record)
            per_probe.append([probe_id, len(cited), len(chosen.intersection(cited)),
                len(chosen)])
    need(len(per_probe) == 8 and len(reached) == prior['r2_reached_cited_turns'] == 11
        and len(reached) + len(missed) == prior['cited_turns'] == 39,
        'prior-audit-reconciliation')
    distances = [row['nearest_selected_turn_distance'] for row in missed]
    lengths = sorted(row['source_chars'] for row in missed)
    return {'schema_version': 'are.g03-beam-dev-sequence-distance/v1',
        'status': 'development-diagnostic-not-native-quality',
        'source_sha256': SOURCE_SHA, 'parquet_sha256': PARQUET_SHA,
        'split_sha256': SPLIT_SHA, 'r2_selection_sha256': R2_SHA,
        'r2_audit_sha256': R2_AUDIT_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'event_ordering_probes': 8,
        'cited_turns': len(reached) + len(missed),
        'reached_cited_turns': len(reached),
        'missed_cited_turns': len(missed),
        'missed_roles': dict(sorted(Counter(row['role'] for row in missed).items())),
        'reached_roles': dict(sorted(Counter(row['role'] for row in reached).items())),
        'missed_within_1_turn': sum(value <= 1 for value in distances),
        'missed_within_2_turns': sum(value <= 2 for value in distances),
        'missed_within_5_turns': sum(value <= 5 for value in distances),
        'missed_within_10_turns': sum(value <= 10 for value in distances),
        'missed_min_distance': min(distances),
        'missed_median_distance': sorted(distances)[len(distances) // 2],
        'missed_max_distance': max(distances),
        'missed_source_chars_min': lengths[0],
        'missed_source_chars_median': lengths[len(lengths) // 2],
        'missed_source_chars_max': lengths[-1],
        'probe_binding_sha256': sha(canonical(sorted(per_probe))),
        'reference_answers_accessed_in_code': False,
        'holdout_evaluator_values_accessed_in_code': False,
        'model_calls': 0, 'native_scores': 0,
        'claim_ceiling': 'Four-conversation development citation distance only; no answer-bearing excerpt proof, native score, independent holdout or superiority',
        'open_questions': ['Are missing cited turns adjacent to selected event anchors or semantically remote?',
            'Can a source-only sequence map recover required events under 8K without adding noise?',
            'Will independently frozen paired answers improve native quality and cost?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'],
        'missed_cited_turns': result['missed_cited_turns'],
        'missed_within_2_turns': result['missed_within_2_turns'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
