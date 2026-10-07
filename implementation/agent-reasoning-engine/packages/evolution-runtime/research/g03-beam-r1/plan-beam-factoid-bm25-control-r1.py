#!/usr/bin/env python3
"""Source-only BM25 control for first BEAM information-extraction questions."""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / 'SOURCE-ONLY.jsonl'
SPLIT = ROOT / 'DEV-SPLIT.json'
CANDIDATE = HERE / 'plan-beam-treatment-projection-r1.py'
PINS = {
    SOURCE: 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d',
    SPLIT: '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e',
    CANDIDATE: '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087',
}
K1 = 1.2
B = 0.75
PROJECTION_CHARS = 5000


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-factoid-bm25-control.' + reason)


def tokens(value, stop):
    return [term for term in re.findall(r'[a-z0-9]+', value.lower())
            if len(term) > 2 and term not in stop]


def rank(probe, units, candidate):
    corpora = [Counter(tokens(unit['content'], candidate.STOP))
               for unit in units]
    lengths = [sum(freq.values()) for freq in corpora]
    avg_length = sum(lengths) / len(lengths) if lengths else 1
    df = Counter(term for corpus in corpora for term in corpus)
    query = set(tokens(probe['question'], candidate.STOP))
    scored = []
    for index, corpus in enumerate(corpora):
        score = 0.0
        for term in query:
            freq = corpus.get(term, 0)
            if freq:
                idf = math.log(1 + (len(units) - df[term] + 0.5) /
                               (df[term] + 0.5))
                score += idf * freq * (K1 + 1) / (freq + K1 *
                    (1 - B + B * lengths[index] / avg_length))
        unit = units[index]
        scored.append((-score, unit['role'] != 'user',
                       -unit['source_turn'], -unit['part_index'], index))
    scored.sort()
    selected = []
    for item in scored:
        unit = units[item[4]]
        if candidate.chars({'archived_evidence': selected + [unit]}) <= PROJECTION_CHARS:
            selected.append(unit)
    selected.sort(key=lambda unit: (unit['source_turn'], unit['part_index']))
    need(selected and candidate.chars({'archived_evidence': selected}) <=
         PROJECTION_CHARS, 'projection-size')
    return selected


def run():
    need(all(sha(path.read_bytes()) == expected for path, expected in PINS.items()),
         'input-drift')
    spec = importlib.util.spec_from_file_location('beam_candidate_r1', CANDIDATE)
    candidate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(candidate)
    split = json.loads(SPLIT.read_text())
    dev = set(split['development_conversation_keys'])
    holdout = set(split['heldout_conversation_keys'])
    need(len(dev) == 4 and len(holdout) == 16 and not dev & holdout,
         'split-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20 and {row['conversation_key'] for row in rows} ==
         dev | holdout, 'source-rows')
    all_bindings, dev_selections = [], []
    for row in rows:
        key = row['conversation_key']
        probes = [probe for probe in row['probes']
                  if probe['ability'] == 'information_extraction']
        need(len(probes) == 2, 'ability-quota')
        probe = probes[0]
        units = [unit for turn_id, turn in enumerate(row['turns'])
                 for unit in candidate.split_turn(turn, turn_id)]
        selected = rank(probe, units, candidate)
        identities = [(unit['source_turn'], unit['part_index'])
                      for unit in selected]
        binding = {'probe_id': probe['id'],
                   'conversation_key_sha256': sha(key.encode()),
                   'projection_sha256': candidate.sha({'archived_evidence': selected}),
                   'selected_fragment_identities': identities,
                   'projection_chars': candidate.chars({'archived_evidence': selected})}
        all_bindings.append(binding)
        if key in dev:
            dev_selections.append({'probe_id': probe['id'],
                                   'conversation_key': key, **binding})
    need(len(all_bindings) == len({row['probe_id'] for row in all_bindings}) == 20
         and len(dev_selections) == 4, 'selection-count')
    return {'schema_version': 'are.g03-beam-factoid-bm25-control-r1/v1',
            'status': 'source-only-control-sealed-before-development-citation-audit',
            'source_only_sha256': PINS[SOURCE],
            'split_sha256': PINS[SPLIT],
            'shared_fragmenter_code_sha256': PINS[CANDIDATE],
            'policy': 'standard-bm25-on-identical-2500-char-source-fragments',
            'k1': K1, 'b': B, 'projection_utf16_character_ceiling': PROJECTION_CHARS,
            'first_information_extraction_questions': 20,
            'development_conversations': 4,
            'heldout_conversations_not_emitted': 16,
            'all_source_only_binding_root_sha256': sha(canonical(sorted(
                all_bindings, key=lambda row: row['probe_id']))),
            'development_selections': sorted(dev_selections,
                key=lambda row: row['probe_id']),
            'evaluator_fields_read': False, 'model_calls': 0,
            'claim_ceiling': 'Source-only BM25 matched comparator projection; no tokenizer, answer quality, native score, holdout, or superiority',
            'open_questions': ['Does this comparator reach answer-bearing evidence in development?',
                               'Can both arms pass the same 8K answer wire and scorer?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = json.dumps(receipt, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'development_selections':
                      len(receipt['development_selections']),
                      'binding_root_sha256':
                      receipt['all_source_only_binding_root_sha256'],
                      'receipt_sha256': sha(data), 'output': str(args.output)},
                     sort_keys=True))


if __name__ == '__main__':
    main()
