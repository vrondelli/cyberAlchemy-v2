#!/usr/bin/env python3
"""Gold-blind balanced-budget MiniLM selector for exposed G02 r11 tasks."""

import hashlib
import importlib.util
import json
import os
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


HERE = Path(__file__).resolve().parent
R1 = HERE / 'seal-g02-r11-cross-rerank-exposed-r1.py'
R1_SHA = '8285e374a4ad83afafbf4d4ea41b9ef26f463e7cbe5733564d85e306730a8cc8'
ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
OUTPUT = ARCHIVE / 'g02-r11-cross-rerank-exposed-r2-20261005/SOURCE-SEAL.json'
QUERY_TOKENS = 96
PAIR_TOKENS = 256
THRESHOLD = 0.0


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if OUTPUT.exists() or sha(R1) != R1_SHA:
        raise SystemExit('output-exists-or-r1-drift')
    spec = importlib.util.spec_from_file_location('g02_cross_r1_source', R1)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    for path, expected in prior.PINS.items():
        if sha(path) != expected:
            raise SystemExit(f'input-drift:{path.name}')
    packets = json.loads(prior.PACKETS.read_text())['ordered_packets']
    rows = json.loads(prior.SOURCE.read_text())['rows']
    if len(packets) != 12 or len(rows) != 12:
        raise SystemExit('cohort-shape')
    tokenizer = Tokenizer.from_file(str(prior.MODEL / 'tokenizer.json'))
    query_prefixes = [tokenizer.encode(packet['issue'], add_special_tokens=False).ids[:QUERY_TOKENS]
                      for packet in packets]
    tokenizer.enable_truncation(max_length=PAIR_TOKENS, strategy='only_second')
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(prior.MODEL / 'model_quint8_avx2.onnx'),
                                   sess_options=opts, providers=['CPUExecutionProvider'])
    output_rows = []
    for packet, row, query_ids in zip(packets, rows, query_prefixes):
        ordinal = packet['ordinal']
        if (ordinal != row['ordinal'] or packet['instance_id'] != row['instance_id']
                or hashlib.sha256(packet['issue'].encode()).hexdigest() != row['issue_sha256']):
            raise SystemExit(f'packet-drift:{ordinal}')
        base = (ARCHIVE / 'g02-product-replication-r11-20261002/pairs' /
                f'{ordinal:02d}-pr11-mixed-{ordinal:02d}/raw/sources/session/base')
        head = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C',
                                        str(base), 'rev-parse', 'HEAD']).decode().strip()
        if head != packet['base_commit'] or head != row['base_commit']:
            raise SystemExit(f'commit-drift:{ordinal}')
        if subprocess.run(['git', '-c', f'safe.directory={base}', '-C', str(base),
                           'diff', '--quiet', 'HEAD'], check=False).returncode:
            raise SystemExit(f'worktree-drift:{ordinal}')
        query = tokenizer.decode(query_ids)
        pool = row['ranked'][:prior.POOL]
        scores = []
        lengths = []
        for start in range(0, len(pool), prior.BATCH):
            batch = pool[start:start + prior.BATCH]
            encoded = []
            for item in batch:
                relative = item['path']
                path = base / relative
                if path.is_symlink() or not path.is_file() or path.stat().st_size > 262144:
                    raise SystemExit(f'file-policy-drift:{ordinal}')
                body = path.read_text(encoding='utf-8')
                encoded.append(tokenizer.encode(query, prior.card(relative, body),
                                                add_special_tokens=True))
            width = max(len(item.ids) for item in encoded)
            ids = np.zeros((len(encoded), width), dtype=np.int64)
            mask = np.zeros_like(ids)
            types = np.zeros_like(ids)
            for index, item in enumerate(encoded):
                size = len(item.ids)
                lengths.append(size)
                ids[index, :size] = item.ids
                mask[index, :size] = item.attention_mask
                types[index, :size] = item.type_ids
            logits = session.run(['logits'], {'input_ids': ids,
                'attention_mask': mask, 'token_type_ids': types})[0][:, 0]
            if not np.all(np.isfinite(logits)):
                raise SystemExit(f'nonfinite:{ordinal}')
            scores.extend(float(score) for score in logits)
        order = sorted(range(len(pool)), key=lambda index: (-scores[index], index))
        selected = [pool[order[0]]['path']] if scores[order[0]] > THRESHOLD else []
        if set(selected) & set(packet['delivered_paths']):
            raise SystemExit(f'choice-invalid:{ordinal}')
        output_rows.append({'ordinal': ordinal, 'instance_id': packet['instance_id'],
                            'selected_paths': selected,
                            'pool_paths': [item['path'] for item in pool],
                            'query_tokens': len(query_ids),
                            'total_pair_tokens': sum(lengths),
                            'positive_score_candidates': sum(score > THRESHOLD for score in scores)})
        print(json.dumps({'ordinal': ordinal, 'selected': len(selected),
                          'positive_score_candidates': output_rows[-1]['positive_score_candidates']}), flush=True)
    result = {'schema_version': 'g02.r11-cross-rerank-exposed-r2/v1',
              'posture': 'gold-blind-source-only-exposed-development-no-dsh-or-score',
              'input_sha256': {**{str(path): value for path, value in prior.PINS.items()},
                               str(R1): R1_SHA}, 'script_sha256': sha(Path(__file__)),
              'policy': {'pool': 'sealed multi-view top 24',
                         'query_tokens_max': QUERY_TOKENS, 'pair_tokens_max': PAIR_TOKENS,
                         'truncation': 'only_second; query retained before card truncation',
                         'selection': 'top one iff MiniLM relevance logit > 0; otherwise abstain',
                         'card': 'unchanged r1 path plus source preview',
                         'advancement_gate': {'new_gold_hits_min': 3,
                                              'repositories_with_hit_min': 2,
                                              'precision_min': 0.5,
                                              'mean_file_f1_delta_min': 0.0}},
              'rows': output_rows,
              'claim_ceiling': 'Exposed counterfactual only; no actual reads, transfer, or superiority.'}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
    print(json.dumps({'tasks': len(output_rows), 'sha256': hashlib.sha256(data).hexdigest()}))


if __name__ == '__main__':
    main()
