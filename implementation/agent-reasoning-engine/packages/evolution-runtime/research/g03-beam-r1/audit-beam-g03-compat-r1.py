#!/usr/bin/env python3
"""Source-only BEAM size/runner compatibility census; emits aggregates only."""

import argparse
import hashlib
import json
import math
from pathlib import Path

import pyarrow.parquet as pq


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/100K-00000-of-00001.parquet')
SOURCE_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
PREFLIGHT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-PREFLIGHT.json')
PREFLIGHT_SHA = '9b90855f33c62a81679f671f3871da2cbfb30ec3bc4cd7161af96b043205d735'
CODE = Path('/home/vlad_/are-benchmark-archive/g03-r7-terminal-failure-20261002/g03-product-replication-code-r9/development/agent-reasoning-engine/planning/representation-preferences')
PINS = {
    'adapter': ('dual-benchmark-8k-v2/longmemeval/confirmation-v1/adapter-note-v5.mjs',
        '96f2b29f5a7e64b1c14b7fbc069dba0212ea78d22e51a1ff7d7067e875ca7c44'),
    'runner': ('dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1/replication-cohort-paired-r7.mjs',
        '453784880950168b80ae40d5d7db3520f1f2d1acb64e019667d6894e18b3d245'),
    'chunks': ('benchmark-pilot-v2/execution/longmemeval-sequential-v2/chunks.mjs',
        '5eab803251e35011c6e4f863228af1f45a02fe56184b94095c5ca8753cc36da7'),
}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-compat.' + reason)


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(PREFLIGHT.read_bytes()) == PREFLIGHT_SHA, 'input-drift')
    preflight = json.loads(PREFLIGHT.read_text())
    need(preflight['status'] == 'passed-source-only-no-generation' and
        preflight['conversations'] == 20 and preflight['questions'] == 400, 'preflight-shape')
    code_hashes = {}
    for name, (relative, expected) in PINS.items():
        actual = sha((CODE / relative).read_bytes())
        need(actual == expected, 'code-drift-' + name)
        code_hashes[name] = actual
    rows = pq.read_table(SOURCE).to_pylist()
    need(len(rows) == 20, 'row-count')
    lengths = [[len(message['content']) for segment in row['chat'] for message in segment]
        for row in rows]
    need(sum(map(len, lengths)) == preflight['turns'], 'turn-count-drift')
    total = sum(sum(values) for values in lengths)
    floor = sum(math.ceil(sum(values) / 16000) for values in lengths)
    return {'schema_version': 'are.g03-beam-runner-compat-census/v1',
        'status': 'source-only-compatibility-gap', 'source_sha256': SOURCE_SHA,
        'source_preflight_sha256': PREFLIGHT_SHA, 'pinned_r7_code_sha256': code_hashes,
        'conversations': len(rows), 'questions_per_conversation': 20,
        'turns': sum(map(len, lengths)), 'total_content_characters': total,
        'messages_over_5000_characters': sum(n > 5000 for values in lengths for n in values),
        'conversations_with_message_over_5000': sum(any(n > 5000 for n in values) for values in lengths),
        'messages_over_20000_characters': sum(n > 20000 for values in lengths for n in values),
        'conversations_with_message_over_20000': sum(any(n > 20000 for n in values) for values in lengths),
        'maximum_single_message_characters': max(n for values in lengths for n in values),
        'minimum_16000_character_ingestion_chunks_once_per_conversation': floor,
        'minimum_16000_character_ingestion_chunks_if_repeated_per_probe': floor * 20,
        'chunk_floor_is_tokenizer_qualification': False,
        'model_calls': 0, 'cohort_selected': False,
        'claim_ceiling': 'Source-size and unchanged-r7-runner compatibility diagnostic only; no exact 8K admission, model result, or superiority',
        'open_questions': [
            'Can a prospective lossless within-turn partition admit all histories within 8K and an explicit call budget?',
            'Should the control notes be built once per conversation and shared across its 20 probes?',
            'How should both arms handle historical instructions and preferences under a common BEAM-specific prompt?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'],
        'minimum_chunks_once': receipt['minimum_16000_character_ingestion_chunks_once_per_conversation'],
        'minimum_chunks_repeated': receipt['minimum_16000_character_ingestion_chunks_if_repeated_per_probe'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
