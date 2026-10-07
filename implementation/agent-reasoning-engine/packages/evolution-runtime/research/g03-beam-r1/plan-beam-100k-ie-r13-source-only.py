#!/usr/bin/env python3
"""Port the frozen r9 dual-view selector to all reserved 100K IE sources."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import platform
import time

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
import tokenizers


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
MODEL = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1/minilm-model-233902d')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
BM25 = HERE / 'plan-beam-factoid-bm25-control-r1.py'
R6 = HERE / 'plan-beam-500k-dev-ie-cross-r6.py'
R9 = HERE / 'plan-beam-500k-dev-ie-dual-view-r9.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
    BM25: '9e2ced11cb80a9de21dce7333534850beeab9aba7ba60803dd360da16b00867e',
    R6: 'b0f4793d5aa1c0932074c17b39db5a576a874026c5f3dafd5781e4f9b120344a',
    R9: '883292d28051abda0295029db6a0efe667f0cc4af77d1f73253c1cf961d79b53',
    MODEL / 'model_quint8_avx2.onnx': 'c80a8b34256ea453093d612e3ac48d3d965a0c0a48c7906709af8b8e28461bf9',
    MODEL / 'tokenizer.json': 'd241a60d5e8f04cc1b2b3e9ef7a4921b27bf526d9f6050ab90f9267a1f9e5c66',
}


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g03-beam-100k-ie-r13-source-only.' + reason)


def import_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and all(sha_file(path) == expected
        for path, expected in PINS.items()), 'output-or-input-drift')
    candidate = import_file('beam_r13_candidate', CANDIDATE)
    bm25 = import_file('beam_r13_bm25', BM25)
    r6 = import_file('beam_r13_r6', R6)
    r9 = import_file('beam_r13_r9', R9)
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=r6.MAX_TOKENS)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL / 'model_quint8_avx2.onnx'),
        sess_options=opts, providers=['CPUExecutionProvider'])
    split = json.loads(SPLIT.read_text())
    need(split['status'] == 'sealed-source-only-before-citation-audit' and
         split['holdout_citation_fields_read'] is False and
         split['heldout_probe_count'] == 320 and
         len(split['heldout_conversation_keys']) == 16 and
         set(split['heldout_conversation_keys']).isdisjoint(
             split['development_conversation_keys']), 'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20 and len({r['conversation_key'] for r in rows}) == 20
         and {r['conversation_key'] for r in rows} == set(
             split['heldout_conversation_keys'] +
             split['development_conversation_keys']), 'source-population')
    selected = [row for row in rows if row['conversation_key'] in
                set(split['heldout_conversation_keys'])]
    need(len(selected) == 16 and all(set(row) ==
         {'conversation_key', 'turns', 'probes'} for row in selected),
         'source-only-allowlist')
    work = Counter()
    selections = []
    started = time.monotonic()
    for source in selected:
        key_hash = candidate.sha(source['conversation_key'])
        candidate.UNIT_CHARS = 2500
        control_units = [unit for turn_id, turn in enumerate(source['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        candidate.UNIT_CHARS = 600
        units = [unit for turn_id, turn in enumerate(source['turns'])
            for unit in candidate.split_turn(turn, turn_id)]
        probes = [probe for probe in source['probes'] if
                  probe['ability'] == 'information_extraction']
        need(len(probes) == 2 and all(set(probe) ==
             {'id', 'ability', 'question'} for probe in probes), 'ie-quota')
        for probe in probes:
            control_units_selected = bm25.rank(probe, control_units, candidate)
            control_projection = {'archived_evidence': control_units_selected}
            need(control_units_selected and candidate.chars(control_projection)
                 <= 5000, 'control-projection')
            pool = r6.bm25_pool(probe, units, bm25, candidate)
            scores, tokens, at_cap = r6.score_pool(probe, pool, units,
                tokenizer, session)
            prior = r6.projection(probe, pool, scores, units, candidate)
            treatment, counts = r9.choose(probe, units,
                {'treatment': prior}, r6, candidate, bm25, tokenizer, session)
            control = {'probe_id': probe['id'],
                'selected_fragment_identities': [[u['source_turn'],
                    u['part_index']] for u in control_units_selected],
                'projection_sha256': candidate.sha(control_projection),
                'projection_chars': candidate.chars(control_projection)}
            need(treatment['projection_chars'] <= 5000 and
                 len(treatment['semantic_fragment_identities']) > 0 and
                 len(treatment['lexical_fragment_identities']) > 0,
                 'treatment-projection')
            work.update(counts)
            work.update({'r7_pool_fragments': len(pool),
                'r7_pair_tokens': tokens, 'r7_pairs_at_cap': at_cap})
            selections.append({'probe_id': probe['id'],
                'question_sha256': candidate.sha(probe['question']),
                'conversation_key_sha256': key_hash,
                'control': control, 'treatment': treatment})
    need(len(selections) == 32 and len({row['probe_id'] for row in selections})
         == 32 and all(row['control']['probe_id'] == row['treatment']['probe_id']
         == row['probe_id'] for row in selections), 'complete-32-pair-seal')
    packet = {
        'schema_version': 'are.g03-beam-100k-ie-r13-source-selections/v1',
        'status': 'sealed-source-only-before-evaluator-or-glm',
        'source_sha256': PINS[SOURCE], 'split_sha256': PINS[SPLIT],
        'code_and_model_sha256': {path.name: digest for path, digest in
            PINS.items() if path not in (SOURCE, SPLIT)},
        'python_version': platform.python_version(),
        'numpy_version': np.__version__, 'onnxruntime_version': ort.__version__,
        'tokenizers_version': tokenizers.__version__,
        'reserved_conversations': 16, 'information_extraction_questions': 32,
        'control_fragment_chars': 2500, 'treatment_fragment_chars': 600,
        'semantic_view_chars': 2500, 'projection_chars': 5000,
        'cross_encoder_candidate_pool': 300,
        'evaluator_fields_read': False, 'glm_model_calls': 0,
        'source_selection_cpu_elapsed_seconds': time.monotonic() - started,
        'work': dict(sorted(work.items())),
        'selections': sorted(selections, key=lambda row: row['probe_id']),
        'claim_ceiling': 'Source-only BEAM 100K IE transfer; no answer, score, label integrity, or superiority',
        'open_questions': ['Do all 64 matched GLM answer wires pass same-account 8K admission?',
                           'Do source labels and a fresh paired result support a bounded claim?'],
    }
    data = (json.dumps(packet, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': packet['status'],
        'questions': len(selections), 'elapsed_seconds':
        packet['source_selection_cpu_elapsed_seconds'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
