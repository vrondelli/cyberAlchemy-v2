#!/usr/bin/env python3
"""Replay two exposed r9 questions with r13's environment before transfer."""

import hashlib
import importlib.util
import json
from pathlib import Path

import onnxruntime as ort
from tokenizers import Tokenizer


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
R9_RESULT = ROOT / 'DUAL-VIEW-R9-ALL-SELECTIONS.json'
MODEL = ROOT / 'minilm-model-233902d'


def sha_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def import_file(name, filename):
    spec = importlib.util.spec_from_file_location(name, HERE / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-r13-r9-replay.' + reason)


def main():
    need(sha_file(SOURCE) ==
         '0370dd91d1227f9e59632881354d79a0569ed7a7ec852acfd70588fd469cc5b0',
         'source-drift')
    candidate = import_file('r13_replay_candidate',
        'plan-beam-treatment-projection-r1.py')
    bm25 = import_file('r13_replay_bm25',
        'plan-beam-factoid-bm25-control-r1.py')
    r6 = import_file('r13_replay_r6', 'plan-beam-500k-dev-ie-cross-r6.py')
    r9 = import_file('r13_replay_r9', 'plan-beam-500k-dev-ie-dual-view-r9.py')
    tokenizer = Tokenizer.from_file(str(MODEL / 'tokenizer.json'))
    tokenizer.enable_truncation(max_length=r6.MAX_TOKENS)
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 4
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(MODEL / 'model_quint8_avx2.onnx'),
        sess_options=opts, providers=['CPUExecutionProvider'])
    source = json.loads(SOURCE.open().readline())
    prior = json.loads(R9_RESULT.read_text())
    by_id = {row['probe_id']: row for row in prior['selections']}
    candidate.UNIT_CHARS = 2500
    control_units = [unit for turn_id, turn in enumerate(source['turns'])
        for unit in candidate.split_turn(turn, turn_id)]
    candidate.UNIT_CHARS = 600
    treatment_units = [unit for turn_id, turn in enumerate(source['turns'])
        for unit in candidate.split_turn(turn, turn_id)]
    verified = []
    for probe in (p for p in source['probes'] if
                  p['ability'] == 'information_extraction'):
        known = by_id[probe['id']]
        control = bm25.rank(probe, control_units, candidate)
        control_sha = candidate.sha({'archived_evidence': control})
        pool = r6.bm25_pool(probe, treatment_units, bm25, candidate)
        scores, _, _ = r6.score_pool(probe, pool, treatment_units,
            tokenizer, session)
        r7_selection = r6.projection(probe, pool, scores, treatment_units,
            candidate)
        treatment, _ = r9.choose(probe, treatment_units,
            {'treatment': r7_selection}, r6, candidate, bm25, tokenizer,
            session)
        need(control_sha == known['control']['projection_sha256'] and
             treatment['projection_sha256'] ==
             known['treatment']['projection_sha256'] and
             treatment['selected_fragment_identities'] ==
             known['treatment']['selected_fragment_identities'],
             'historical-selection-parity')
        verified.append(probe['id'])
    need(len(verified) == 2, 'two-question-replay')
    print(json.dumps({'status': 'passed-exposed-r9-selector-parity',
        'replayed_questions': len(verified),
        'probe_id_sha256': hashlib.sha256(json.dumps(sorted(verified))
            .encode()).hexdigest(),
        'evaluator_fields_read': False, 'glm_model_calls': 0},
        sort_keys=True))


if __name__ == '__main__':
    main()
