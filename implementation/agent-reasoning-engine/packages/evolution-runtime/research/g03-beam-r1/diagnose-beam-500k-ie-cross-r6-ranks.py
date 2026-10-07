#!/usr/bin/env python3
"""Re-score only r6 development zero-reach, pool-available misses to inspect ranking."""

import argparse
import hashlib
import json
from pathlib import Path

import onnxruntime as ort
from tokenizers import Tokenizer


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
PLANNER = HERE / 'plan-beam-500k-dev-ie-cross-r6.py'
DIAGNOSIS = ROOT / 'CROSS-R6-MISS-DIAGNOSIS-r2.json'
SELECTIONS = ROOT / 'CROSS-R6-ALL-SELECTIONS.json'
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
PINS = {
    PLANNER: 'b0f4793d5aa1c0932074c17b39db5a576a874026c5f3dafd5781e4f9b120344a',
    DIAGNOSIS: 'cf628870f613a62aa48b8bea9ea53ca74ae3314d65efb64bdee19ac7d28949a3',
    SELECTIONS: '228a8fe577266d705cc5708db58facd04cdbf0bcebecdc6d9f7b8c976f4f7e68',
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
}


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-r6-rank-diagnosis.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and
        all(sha(path) == expected for path, expected in PINS.items()),
        'output-or-input-drift')
    import importlib.util
    spec = importlib.util.spec_from_file_location('r6_rank_planner', PLANNER)
    planner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(planner)
    candidate = planner.import_file('r6_rank_candidate', planner.CANDIDATE)
    bm25 = planner.import_file('r6_rank_bm25', planner.BM25)
    candidate.UNIT_CHARS = 900
    tokenizer = Tokenizer.from_file(str(planner.MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=planner.MAX_TOKENS)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(planner.MODEL / 'model_quint8_avx2.onnx'),
        sess_options=opts, providers=['CPUExecutionProvider'])
    diagnosis = json.loads(DIAGNOSIS.read_text())
    targets = {row['probe_id']: row for row in diagnosis['per_question']
        if row['cited_turns_in_actual_900_char_top300'] > 0}
    need(len(targets) == 8, 'target-count')
    selected = {row['probe_id']: row for row in
        json.loads(SELECTIONS.read_text())['selections']}
    results = []
    for row in (json.loads(line) for line in SOURCE.read_text().splitlines()):
        probes = [probe for probe in row['probes'] if probe['id'] in targets]
        if not probes:
            continue
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        for probe in probes:
            pool = planner.bm25_pool(probe, units, bm25, candidate)
            scores, tokens, truncated = planner.score_pool(probe, pool,
                units, tokenizer, session)
            projection = planner.projection(probe, pool, scores, units,
                candidate)
            need(projection['selected_fragment_identities'] ==
                selected[probe['id']]['treatment'][
                    'selected_fragment_identities'] and
                projection['projection_sha256'] == selected[probe['id']][
                    'treatment']['projection_sha256'], 'selection-reproduction')
            ranked = sorted(range(len(pool)), key=lambda position: (
                -float(scores[position]),
                units[pool[position]]['role'] != 'user',
                -units[pool[position]]['source_turn'],
                -units[pool[position]]['part_index']))
            cited = set(targets[probe['id']]['cited_source_turns'])
            cited_ranks = [rank + 1 for rank, position in enumerate(ranked)
                if units[pool[position]]['source_turn'] in cited]
            need(cited_ranks and len(projection[
                'selected_fragment_identities']) > 0, 'reached-pool')
            results.append({'probe_id': probe['id'],
                'cited_turns': len(cited),
                'cited_fragment_rerank_positions': cited_ranks,
                'best_cited_fragment_rerank_position': min(cited_ranks),
                'selected_fragments': len(projection[
                    'selected_fragment_identities']),
                'pair_tokens_after_truncation': tokens,
                'pairs_at_token_cap': truncated})
    need(len(results) == 8, 'complete-diagnosis')
    result = {'schema_version': 'are.g03-beam-500k-r6-rank-diagnosis/v1',
        'status': 'development-miss-ranks-diagnosed',
        'input_sha256': {path.name: expected for path, expected in PINS.items()},
        'questions': len(results),
        'scored_pairs': len(results) * 300,
        'per_question': sorted(results, key=lambda row: row['probe_id']),
        'reserved_100k_fields_read': False,
        'development_answer_or_rubric_fields_read': False,
        'glm_calls': 0,
        'claim_ceiling': 'Post-hoc exposed-development rank diagnosis only; no answer quality, independent holdout, or superiority',
        'open_questions': ['Can a source-only reranking or packing policy improve answer quality at acceptable cost?']}
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'questions': result['questions'],
        'scored_pairs': result['scored_pairs'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
