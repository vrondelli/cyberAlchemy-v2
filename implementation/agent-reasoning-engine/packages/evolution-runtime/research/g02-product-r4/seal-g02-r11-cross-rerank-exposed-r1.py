#!/usr/bin/env python3
"""Gold-blind local cross-encoder selection from sealed G02 r11 multi-view top 24."""

import hashlib
import json
import os
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
PACKETS = ARCHIVE / 'g02-r11-search-packets-exposed-r1-20261004/PACKETS.json'
SOURCE = ARCHIVE / 'g02-r11-multiview-file-card-exposed-r1-20261004/SOURCE-SEAL.json'
MODEL = ARCHIVE / 'g03-beam-500k-dev-r1/minilm-model-233902d'
OUTPUT = ARCHIVE / 'g02-r11-cross-rerank-exposed-r1-20261005/SOURCE-SEAL.json'
PINS = {
    PACKETS: '2c10c75d0e9ddf495210db994bc34b63c4cb3cec0cf46079ef4a630c5a6cfb6b',
    SOURCE: '2f01525c5e58f35755a3943462d9d90fcac23c1386587ea02aae4620592cd8fb',
    MODEL / 'model_quint8_avx2.onnx': 'c80a8b34256ea453093d612e3ac48d3d965a0c0a48c7906709af8b8e28461bf9',
    MODEL / 'tokenizer.json': 'd241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66',
    MODEL / 'config.json': '380e02c93f431831be65d99a4e7e5f67c133985bf2e77d9d4eba46847190bacc',
}
POOL = 24
SELECT = 3
MAX_TOKENS = 256
BATCH = 8


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def card(path, body):
    """Bounded path and source-side preview, without labels or comparator traces."""
    lines = body.splitlines()
    structural = [line.strip()[:220] for line in lines if any(
        token in line for token in ('class ', 'def ', 'function ', 'struct ',
                                    'interface ', 'import ', 'from ', '#include',
                                    'module ', 'require(', 'test_'))][:18]
    return f'Path: {path}\nSource preview:\n' + '\n'.join(
        [line[:220] for line in lines[:25]] + structural)[:1800]


def main():
    if OUTPUT.exists():
        raise SystemExit('output-exists')
    for path, expected in PINS.items():
        if sha(path) != expected:
            raise SystemExit(f'input-drift:{path.name}')
    packets = json.loads(PACKETS.read_text())['ordered_packets']
    rows = json.loads(SOURCE.read_text())['rows']
    if len(packets) != 12 or len(rows) != 12:
        raise SystemExit('cohort-shape')
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=MAX_TOKENS)
    options = ort.SessionOptions()
    options.intra_op_num_threads = 4
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL / 'model_quint8_avx2.onnx'),
                                   sess_options=options, providers=['CPUExecutionProvider'])
    output_rows = []
    for packet, row in zip(packets, rows):
        ordinal = packet['ordinal']
        if (row['ordinal'] != ordinal or row['instance_id'] != packet['instance_id']
                or row['issue_sha256'] != hashlib.sha256(packet['issue'].encode()).hexdigest()):
            raise SystemExit(f'packet-drift:{ordinal}')
        base = (ARCHIVE / 'g02-product-replication-r11-20261002/pairs' /
                f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base')
        head = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C',
                                        str(base), 'rev-parse', 'HEAD']).decode().strip()
        if head != row['base_commit'] or head != packet['base_commit']:
            raise SystemExit(f'commit-drift:{ordinal}')
        if subprocess.run(['git', '-c', f'safe.directory={base}', '-C', str(base),
                           'diff', '--quiet', 'HEAD'], check=False).returncode:
            raise SystemExit(f'worktree-drift:{ordinal}')
        pool = row['ranked'][:POOL]
        scores = []
        token_count = 0
        for start in range(0, len(pool), BATCH):
            batch = pool[start:start + BATCH]
            encoded = []
            for item in batch:
                relative = item['path']
                path = base / relative
                if path.is_symlink() or not path.is_file() or path.stat().st_size > 262144:
                    raise SystemExit(f'file-policy-drift:{ordinal}')
                body = path.read_text(encoding='utf-8')
                encoded.append(tokenizer.encode(packet['issue'][:1800], card(relative, body),
                                                add_special_tokens=True))
            width = max(len(item.ids) for item in encoded)
            ids = np.zeros((len(encoded), width), dtype=np.int64)
            mask = np.zeros_like(ids)
            types = np.zeros_like(ids)
            for index, item in enumerate(encoded):
                size = len(item.ids)
                token_count += size
                ids[index, :size] = item.ids
                mask[index, :size] = item.attention_mask
                types[index, :size] = item.type_ids
            logits = session.run(['logits'], {'input_ids': ids,
                'attention_mask': mask, 'token_type_ids': types})[0][:, 0]
            if not np.all(np.isfinite(logits)):
                raise SystemExit(f'nonfinite:{ordinal}')
            scores.extend(float(score) for score in logits)
        order = sorted(range(len(pool)), key=lambda index: (-scores[index], index))
        chosen = [pool[index]['path'] for index in order[:SELECT]]
        if len(chosen) != SELECT or len(set(chosen)) != SELECT or set(chosen) & set(packet['delivered_paths']):
            raise SystemExit(f'choice-invalid:{ordinal}')
        output_rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                            'selected_paths': chosen, 'pool_paths': [item['path'] for item in pool],
                            'tokens': token_count})
        print(json.dumps({'ordinal': ordinal, 'tokens': token_count, 'selected': len(chosen)}), flush=True)
    result = {'schema_version': 'g02.r11-cross-rerank-exposed-r1/v1',
              'posture': 'gold-blind-source-only-exposed-development-no-dsh-or-score',
              'input_sha256': {str(path): expected for path, expected in PINS.items()},
              'script_sha256': sha(Path(__file__)),
              'policy': {'pool': 'sealed multi-view top 24', 'selection': 'cross-encoder score top 3',
                         'issue_chars': 1800, 'card_chars': 1800, 'max_tokens': MAX_TOKENS,
                         'file_policy': 'exact base commit, tracked regular UTF-8 <=262144 bytes'},
              'rows': output_rows,
              'claim_ceiling': 'Exposed counterfactual selections only; no actual reads, independent transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'tasks': len(output_rows), 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
