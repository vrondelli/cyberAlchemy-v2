#!/usr/bin/env python3
"""Source-only lexical-reserve plus r7 semantic-selection BEAM IE candidate."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import time

import onnxruntime as ort
from tokenizers import Tokenizer


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
R7 = ROOT / 'CROSS-R7-ALL-SELECTIONS.json'
PARENT = HERE / 'plan-beam-500k-dev-ie-cross-r6.py'
MODEL = ROOT / 'minilm-model-233902d'
PINS = {
    SOURCE: '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
    R7: 'bb1b8ec1695f7913d1dca4773ffd6c8e0c953206c54b1d4f98ceea2103dcaa47',
    PARENT: 'b0f4793d5aa1c0932074c17b39db5a576a874026c5f3dafd5781e4f9b120344a',
    MODEL / 'model_quint8_avx2.onnx': 'c80a8b34256ea453093d612e3ac48d3d965a0c0a48c7906709af8b8e28461bf9',
    MODEL / 'tokenizer.json': 'd241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66',
}
RESERVED_TURNS = 3
TREATMENT_UNIT_CHARS = 600
CONTROL_UNIT_CHARS = 2500
PROJECTION_CHARS = 5000


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-hybrid-r8.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def choose(probe, units, prior, parent, candidate, bm25, tokenizer, session):
    by_identity = {(unit['source_turn'], unit['part_index']): index
        for index, unit in enumerate(units)}
    need(len(by_identity) == len(units), 'unique-fragment-identities')
    pool = parent.bm25_pool(probe, units, bm25, candidate)
    pool_set = set(pool)
    prior_identities = prior['treatment']['selected_fragment_identities']
    prior_indices = [by_identity[tuple(identity)] for identity in prior_identities]
    need(len(prior_indices) == len(set(prior_indices)) and
        set(prior_indices) <= pool_set, 'prior-selection-in-pool')
    scores, tokens, at_cap = parent.score_pool(probe, prior_indices, units,
        tokenizer, session)
    reserve, reserved_turns = [], set()
    for index in pool:
        turn = units[index]['source_turn']
        if turn not in reserved_turns:
            reserve.append(index)
            reserved_turns.add(turn)
        if len(reserve) == RESERVED_TURNS:
            break
    need(len(reserve) == RESERVED_TURNS, 'reserve-count')
    ranked_prior = sorted(range(len(prior_indices)), key=lambda position: (
        -float(scores[position]), units[prior_indices[position]]['role'] != 'user',
        -units[prior_indices[position]]['source_turn'],
        -units[prior_indices[position]]['part_index']))
    selected = list(reserve)
    for position in ranked_prior:
        index = prior_indices[position]
        if index not in selected and candidate.chars({'archived_evidence':
                [units[item] for item in selected + [index]]}) <= PROJECTION_CHARS:
            selected.append(index)
    need(len(selected) >= RESERVED_TURNS and len(selected) == len(set(selected)),
        'selected-count')
    chosen = sorted((units[index] for index in selected),
        key=lambda unit: (unit['source_turn'], unit['part_index']))
    projection = {'archived_evidence': chosen}
    need(candidate.chars(projection) <= PROJECTION_CHARS, 'projection-limit')
    return {'probe_id': probe['id'],
        'selected_fragment_identities': [[unit['source_turn'],
            unit['part_index']] for unit in chosen],
        'projection_sha256': candidate.sha(projection),
        'projection_chars': candidate.chars(projection)}, {
        'scored_pairs': len(prior_indices),
        'pair_tokens_after_truncation': tokens,
        'pairs_at_token_cap': at_cap,
        'reserved_fragment_overlap_with_r7': len(set(reserve) & set(prior_indices)),
        'selected_fragments': len(chosen),
        'selected_distinct_turns': len({unit['source_turn'] for unit in chosen})}


def run():
    need(all(sha(path) == expected for path, expected in PINS.items()),
        'pinned-input-drift')
    parent = import_file('beam_ie_hybrid_r8_parent', PARENT)
    candidate = parent.import_file('beam_ie_hybrid_r8_candidate', parent.CANDIDATE)
    bm25 = parent.import_file('beam_ie_hybrid_r8_bm25', parent.BM25)
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=parent.MAX_TOKENS)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL / 'model_quint8_avx2.onnx'),
        sess_options=opts, providers=['CPUExecutionProvider'])
    source = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    old = json.loads(R7.read_text())
    need(len(source) == 30 and old['schema_version'] ==
        'are.g03-beam-500k-dev-ie-cross-r7/v1' and
        old['evaluator_fields_read'] is False and
        old['information_extraction_questions'] == 60,
        'source-population-and-prior-seal')
    by_id = {row['probe_id']: row for row in old['selections']}
    need(len(by_id) == 60, 'prior-probe-count')
    result_rows, work = [], Counter()
    started = time.monotonic()
    for row in source:
        candidate.UNIT_CHARS = CONTROL_UNIT_CHARS
        control_units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        candidate.UNIT_CHARS = TREATMENT_UNIT_CHARS
        units = [unit for turn_id, turn in enumerate(row['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        probes = [probe for probe in row['probes'] if
            probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ie-quota')
        key_hash = candidate.sha(row['conversation_key'])
        for probe in probes:
            prior = by_id[probe['id']]
            need(prior['conversation_key_sha256'] == key_hash,
                'conversation-binding')
            control = bm25.rank(probe, control_units, candidate)
            need(candidate.sha({'archived_evidence': control}) ==
                prior['control']['projection_sha256'],
                'unchanged-control')
            treatment, counts = choose(probe, units, prior, parent, candidate,
                bm25, tokenizer, session)
            treatment['conversation_key_sha256'] = key_hash
            work.update(counts)
            result_rows.append({'probe_id': probe['id'],
                'conversation_key_sha256': key_hash,
                'treatment': treatment,
                'control': prior['control']})
    need(len(result_rows) == 60 and work['scored_pairs'] > 0,
        'complete-population')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-hybrid-r8/v1',
        'status': 'sealed-source-only-before-citation-audit',
        'source_only_sha256': PINS[SOURCE],
        'r7_selections_sha256': PINS[R7],
        'parent_selector_sha256': PINS[PARENT],
        'model_onnx_sha256': PINS[MODEL / 'model_quint8_avx2.onnx'],
        'tokenizer_sha256': PINS[MODEL / 'tokenizer.json'],
        'policy': 'three-distinct-turn-BM25-reserve-then-r7-cross-score-fill',
        'treatment_unit_utf16_character_ceiling': TREATMENT_UNIT_CHARS,
        'control_unit_utf16_character_ceiling': CONTROL_UNIT_CHARS,
        'projection_utf16_character_ceiling': PROJECTION_CHARS,
        'development_conversations': 30,
        'information_extraction_questions': 60,
        'work': dict(sorted(work.items())),
        'elapsed_seconds': round(time.monotonic() - started, 3),
        'selections': sorted(result_rows, key=lambda row: row['probe_id']),
        'evaluator_fields_read': False, 'glm_model_calls': 0,
        'claim_ceiling': 'BEAM 500K exposed-development source-only hybrid selections; no citation result, answer quality, holdout or superiority',
        'open_questions': ['Does the fixed lexical reserve improve citation reach?',
            'Does any gain transfer to matched answer quality and independent populations?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists(), 'fresh-output-required')
    result = run()
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'questions': result['information_extraction_questions'],
        'work': result['work'], 'elapsed_seconds': result['elapsed_seconds'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
