#!/usr/bin/env python3
"""Emit pinned BEAM history/questions without evaluator fields, once, privately."""

import argparse
import ast
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
SOURCE_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
PREFLIGHT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-PREFLIGHT.json')
PREFLIGHT_SHA = '9b90855f33c62a81679f671f3871da2cbfb30ec3bc4cd7161af96b043205d735'
ROW_KEYS = {'conversation_key', 'turns', 'probes'}
TURN_KEYS = {'role', 'content', 'time_anchor'}
PROBE_KEYS = {'id', 'ability', 'question'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode('utf-8')


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-source-extract.' + reason)


def extract():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(PREFLIGHT.read_bytes()) == PREFLIGHT_SHA, 'input-drift')
    preflight = json.loads(PREFLIGHT.read_text())
    need(preflight['status'] == 'passed-source-only-no-generation' and
        preflight['conversations'] == 20 and preflight['questions'] == 400,
        'preflight-shape')
    rows = pq.read_table(SOURCE).to_pylist()
    need(len(rows) == 20, 'row-count')
    emitted, keys, ids = [], set(), set()
    for row in rows:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        need(key not in keys, 'duplicate-conversation')
        keys.add(key)
        turns = [{name: message[name] for name in ('role', 'content', 'time_anchor')}
            for segment in row['chat'] for message in segment]
        need(turns and all(set(turn) == TURN_KEYS for turn in turns), 'turn-allowlist')
        parsed = ast.literal_eval(row['probing_questions'])
        need(set(parsed) == set(preflight['ability_counts']), 'ability-drift')
        probes = []
        for ability in sorted(parsed):
            need(len(parsed[ability]) == 2, 'probe-quota')
            for ordinal, entry in enumerate(parsed[ability]):
                question = entry['question']
                need(isinstance(question, str) and question.strip(), 'question')
                question_sha = sha(canonical(question))
                probe_id = sha(canonical([key, ability, ordinal, question_sha]))[:24]
                need(probe_id not in ids, 'probe-id-collision')
                ids.add(probe_id)
                probe = {'id': probe_id, 'ability': ability, 'question': question}
                need(set(probe) == PROBE_KEYS, 'probe-allowlist')
                probes.append(probe)
        projection = {'conversation_key': key, 'turns': turns, 'probes': probes}
        need(set(projection) == ROW_KEYS and len(probes) == 20, 'row-allowlist')
        emitted.append(projection)
    need(len(keys) == 20 and len(ids) == 400 and
        sum(len(row['turns']) for row in emitted) == 5732, 'population-drift')
    return emitted


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--receipt', type=Path, required=True)
    args = parser.parse_args()
    need(args.output != args.receipt and not args.output.exists() and
        not args.receipt.exists(), 'output-exists')
    rows = extract()
    data = b''.join(canonical(row) + b'\n' for row in rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    receipt = {'schema_version': 'are.g03-beam-source-only-extract/v1',
        'status': 'source-only-private', 'input_source_sha256': SOURCE_SHA,
        'input_preflight_sha256': PREFLIGHT_SHA,
        'output_path': str(args.output), 'output_sha256': sha(data),
        'output_bytes': len(data), 'conversations': len(rows),
        'turns': sum(len(row['turns']) for row in rows),
        'probes': sum(len(row['probes']) for row in rows),
        'row_keys': sorted(ROW_KEYS), 'turn_keys': sorted(TURN_KEYS),
        'probe_keys': sorted(PROBE_KEYS),
        'evaluator_fields_emitted': False, 'model_calls': 0,
        'cohort_selected': False,
        'claim_ceiling': 'Private source-only staging; not a frozen cohort, 8K request, score, or superiority',
        'open_questions': ['Can the staged history support a bounded prospective treatment projection?',
            'Will actual provider tokenizer admission and evaluator-only judging pass?']}
    receipt_bytes = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    with args.receipt.open('xb') as handle:
        handle.write(receipt_bytes)
    print(json.dumps({'status': receipt['status'], 'output_sha256': sha(data),
        'receipt_sha256': sha(receipt_bytes), 'conversations': len(rows),
        'probes': receipt['probes']}, sort_keys=True))


if __name__ == '__main__':
    main()
