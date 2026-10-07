#!/usr/bin/env python3
"""Source-only MiniLM cross-encoder reranking of BM25-top-300 BEAM IE fragments."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import time

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
MODEL = ROOT / 'minilm-model-233902d'
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
OLD = ROOT / 'IE-PAIRED-SELECTIONS.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    OLD: 'fa82830ff3e6d3e9eb386404901c76a3d610768324aa326d7ac9ee4925c0e2f0',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
    MODEL / 'model_quint8_avx2.onnx': 'c80a8b34256ea453093d612e3ac48d3d965a0c0a48c7906709af8b8e28461bf9',
    MODEL / 'tokenizer.json': 'd241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66',
    MODEL / 'config.json': '380e02c93f431831be65d99a4e7e5f67c133985bf2e77d9d4eba46847190bacc',
}
TOP_POOL = 300
MAX_TOKENS = 256
BATCH = 8


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-cross-r5.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def bm25_pool(probe, units, bm25, candidate):
    corpora = [Counter(bm25.tokens(unit['content'], candidate.STOP))
        for unit in units]
    lengths = [sum(freq.values()) for freq in corpora]
    average = sum(lengths) / len(lengths) if lengths else 1
    df = Counter(term for corpus in corpora for term in corpus)
    query = set(bm25.tokens(probe['question'], candidate.STOP))
    scored = []
    for index, corpus in enumerate(corpora):
        score = 0.0
        for term in query:
            freq = corpus.get(term, 0)
            if freq:
                idf = math.log(1 + (len(units) - df[term] + 0.5) /
                    (df[term] + 0.5))
                score += idf * freq * (bm25.K1 + 1) / (freq + bm25.K1 *
                    (1 - bm25.B + bm25.B * lengths[index] / average))
        unit = units[index]
        scored.append((-score, unit['role'] != 'user',
            -unit['source_turn'], -unit['part_index'], index))
    scored.sort()
    return [item[4] for item in scored[:TOP_POOL]]


def score_pool(probe, pool, units, tokenizer, session):
    scores = np.empty(len(pool), dtype=np.float32)
    truncated = 0
    tokens = 0
    for start in range(0, len(pool), BATCH):
        indices = pool[start:start + BATCH]
        encoded = [tokenizer.encode(probe['question'],
            units[index]['content'], add_special_tokens=True) for index in indices]
        width = max(len(item.ids) for item in encoded)
        ids = np.zeros((len(encoded), width), dtype=np.int64)
        mask = np.zeros_like(ids)
        types = np.zeros_like(ids)
        for position, item in enumerate(encoded):
            length = len(item.ids)
            ids[position, :length] = item.ids
            mask[position, :length] = item.attention_mask
            types[position, :length] = item.type_ids
            truncated += length == MAX_TOKENS
            tokens += length
        logits = session.run(['logits'], {'input_ids': ids,
            'attention_mask': mask, 'token_type_ids': types})[0]
        need(np.all(np.isfinite(logits)), 'invalid-logits')
        scores[start:start + len(indices)] = logits[:, 0]
    return scores, tokens, truncated


def projection(probe, pool, scores, units, candidate):
    ranked = sorted(range(len(pool)), key=lambda position: (
        -float(scores[position]), units[pool[position]]['role'] != 'user',
        -units[pool[position]]['source_turn'],
        -units[pool[position]]['part_index']))
    chosen = []
    for position in ranked:
        unit = units[pool[position]]
        if candidate.chars({'archived_evidence': chosen + [unit]}) <= 5000:
            chosen.append(unit)
    chosen.sort(key=lambda unit: (unit['source_turn'], unit['part_index']))
    result = {'archived_evidence': chosen}
    need(chosen and candidate.chars(result) <= 5000,
        'projection-boundary')
    return {'probe_id': probe['id'],
        'selected_fragment_identities': [[unit['source_turn'],
            unit['part_index']] for unit in chosen],
        'projection_sha256': candidate.sha(result),
        'projection_chars': candidate.chars(result)}


def run(limit):
    need(all(sha_file(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    candidate = import_file('beam_candidate_cross_r4', CANDIDATE)
    bm25 = import_file('beam_bm25_cross_r4', BM25)
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=MAX_TOKENS)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL / 'model_quint8_avx2.onnx'),
        sess_options=opts, providers=['CPUExecutionProvider'])
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 30 and 1 <= limit <= 30, 'source-population')
    old = json.loads(OLD.read_text())
    old_by_id = {item['probe_id']: item for item in old['selections']}
    need(len(old_by_id) == 60, 'control-population')
    selections, work = [], Counter()
    started = time.monotonic()
    for row in rows[:limit]:
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ie-quota')
        for probe in probes:
            old_entry = old_by_id[probe['id']]
            key_hash = candidate.sha(row['conversation_key'])
            need(old_entry['conversation_key_sha256'] == key_hash,
                'control-binding')
            control = bm25.rank(probe, units, candidate)
            need(candidate.sha({'archived_evidence': control}) ==
                old_entry['control']['projection_sha256'],
                'control-cross-check')
            pool = bm25_pool(probe, units, bm25, candidate)
            scores, tokens, truncated = score_pool(probe, pool, units,
                tokenizer, session)
            work['scored_pairs'] += len(pool)
            work['pair_tokens_after_truncation'] += tokens
            work['truncated_pairs'] += truncated
            binding = projection(probe, pool, scores, units, candidate)
            binding['conversation_key_sha256'] = key_hash
            selections.append({'probe_id': probe['id'],
                'conversation_key_sha256': key_hash,
                'treatment': binding, 'control': old_entry['control']})
    need(len(selections) == 2 * limit, 'selection-count')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-cross-r5/v1',
        'status': 'sealed-source-only-before-citation-audit',
        'source_only_sha256': PINS[SOURCE],
        'unchanged_control_selections_sha256': PINS[OLD],
        'candidate_code_sha256': PINS[CANDIDATE],
        'bm25_code_sha256': PINS[BM25],
        'model_revision': '233902d25c440f23af6f7d6e94d2946bac0bee0a',
        'model_onnx_sha256': PINS[MODEL / 'model_quint8_avx2.onnx'],
        'tokenizer_sha256': PINS[MODEL / 'tokenizer.json'],
        'policy': 'BM25-top-300-fragments-MiniLM-cross-encoder-rerank',
        'max_pair_tokens': MAX_TOKENS,
        'batch_size': BATCH,
        'projection_utf16_character_ceiling': 5000,
        'conversations': limit, 'information_extraction_questions': len(selections),
        'cross_encoder_work': dict(sorted(work.items())),
        'elapsed_seconds': round(time.monotonic() - started, 3),
        'selections': sorted(selections, key=lambda item: item['probe_id']),
        'evaluator_fields_read': False, 'glm_model_calls': 0,
        'claim_ceiling': 'Source-only cross-encoder development selections; no gold reach, GLM answers, 8K wire, all-in cost parity, holdout, or superiority',
        'open_questions': ['Does cross-encoder reranking improve citation reach over unchanged BM25?',
            'Does the retrieval gain transfer to paired GLM answer quality and overall cost?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--conversations', type=int, default=30)
    args = parser.parse_args()
    need(not args.output.exists(), 'fresh-output-required')
    result = run(args.conversations)
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'conversations': result['conversations'],
        'questions': result['information_extraction_questions'],
        'cross_encoder_work': result['cross_encoder_work'],
        'elapsed_seconds': result['elapsed_seconds'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
