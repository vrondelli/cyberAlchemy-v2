#!/usr/bin/env python3
"""Check two exposed BEAM temporal labels against their cited source dates."""

import argparse
import ast
from datetime import date
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
PARQUET = ROOT / '100K-00000-of-00001.parquet'
SPLIT = ROOT / 'DEV-SPLIT.json'
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
EXPECTED_HASHES = {
    PARQUET: 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
}
CHECKS = {
    '4b7cdc693ea109b7922b70ef': {
        'key': 'Coding:1', 'citation_ids': {'first_event': [2], 'second_event': [0]},
        'source_phrases': {2: ('Jan 15, 2024',), 0: ('March 15, 2024',)},
        'start': date(2024, 1, 15), 'end': date(2024, 3, 15),
        'answer_phrases': ('exactly 4 weeks', 'January 15, 2024', 'March 15, 2024'),
        'finding': 'The answer says exactly four weeks, but the cited dates are 60 days apart (eight weeks and four days).',
    },
    '9b8df8d3b6a02dcd8010dca8': {
        'key': 'Writing Assistant & Learning:15',
        'citation_ids': {'first_event': [88], 'second_event': [218]},
        'source_phrases': {88: ('starting April 2',), 218: ('May 10 to May 25',)},
        'start': date(2024, 4, 2), 'end': date(2024, 5, 25),
        'answer_phrases': ('38 days', 'start of the second'),
        'finding': 'The question asks for completion of the second challenge (May 25), 53 days after April 2; the answer instead computes to its May 10 start (38 days).',
    },
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-dev-temporal-labels.' + reason)


def run():
    need(all(sha(path.read_bytes()) == expected
             for path, expected in EXPECTED_HASHES.items()), 'input-drift')
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout,
         'split-boundary')
    metadata = pq.read_table(PARQUET, columns=['conversation_id',
                             'conversation_seed']).to_pylist()
    ids = {row['conversation_id']: f"{row['conversation_seed']['category']}:"
           f"{row['conversation_seed']['id']}" for row in metadata}
    dev_ids = [row_id for row_id, key in ids.items() if key in dev]
    need(len(ids) == 20 and len(dev_ids) == 4, 'metadata-count')
    rows = ds.dataset(PARQUET, format='parquet').to_table(
        columns=['conversation_id', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids)).to_pylist()
    need(len(rows) == 4 and all(ids[row['conversation_id']] in dev
         for row in rows), 'filtered-development')
    source_rows = {row['conversation_key']: row for line in SOURCE.read_text().splitlines()
                   if (row := json.loads(line))['conversation_key'] in dev}
    need(set(source_rows) == dev, 'source-development')
    found = {}
    all_probes = []
    for row in rows:
        key = ids[row['conversation_id']]
        entries = ast.literal_eval(row['probing_questions'])['temporal_reasoning']
        need(len(entries) == 2, 'temporal-quota')
        for ordinal, entry in enumerate(entries):
            probe_id = sha(canonical([key, 'temporal_reasoning', ordinal,
                            sha(canonical(entry['question']))]))[:24]
            all_probes.append(probe_id)
            if probe_id not in CHECKS:
                continue
            check = CHECKS[probe_id]
            need(key == check['key'] and
                 entry['source_chat_ids'] == check['citation_ids'] and
                 all(phrase in source_rows[key]['turns'][turn_id]['content']
                     for turn_id, phrases in check['source_phrases'].items()
                     for phrase in phrases) and
                 all(phrase in entry['answer'] for phrase in check['answer_phrases']),
                 'check-source-binding')
            days = (check['end'] - check['start']).days
            found[probe_id] = {'probe_id': probe_id,
                'source_chat_ids': entry['source_chat_ids'],
                'question_sha256': sha(entry['question'].encode()),
                'answer_sha256': sha(entry['answer'].encode()),
                'cited_source_content_sha256': {str(turn_id):
                    sha(source_rows[key]['turns'][turn_id]['content'].encode())
                    for turn_id in check['source_phrases']},
                'start_date': check['start'].isoformat(),
                'end_date': check['end'].isoformat(),
                'actual_elapsed_days': days, 'finding': check['finding']}
    need(len(all_probes) == len(set(all_probes)) == 8 and
         set(found) == set(CHECKS), 'case-count')
    return {'schema_version': 'are.g03-beam-dev-temporal-label-audit/v1',
            'status': 'two-confirmed-exposed-development-reference-contradictions',
            'parquet_sha256': EXPECTED_HASHES[PARQUET],
            'split_sha256': EXPECTED_HASHES[SPLIT],
            'source_only_sha256': EXPECTED_HASHES[SOURCE],
            'development_temporal_questions': len(all_probes),
            'manually_selected_checks': len(found),
            'contradictions_confirmed': len(found),
            'other_questions_not_arithmetic_audited': len(all_probes) - len(found),
            'checks': [found[key] for key in sorted(found)],
            'heldout_evaluator_values_accessed_in_code': False,
            'claim_ceiling': 'Two targeted, post-hoc development-label falsifications only; not an exhaustive 8-case audit, model score, holdout, or superiority',
            'open_questions': ['Can a prospective arithmetic-integrity policy qualify an independent population?',
                               'Which BEAM ability has sufficiently reliable labels for a fair paired claim?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'contradictions_confirmed':
                      receipt['contradictions_confirmed'],
                      'receipt_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
