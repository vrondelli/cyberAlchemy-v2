#!/usr/bin/env python3
"""Diagnose frozen BEAM event-ordering retrieval on sealed development rows only."""

import argparse
import ast
from collections import Counter
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
CODE = Path(__file__).with_name('plan-beam-treatment-projection-r1.py')
CODE_SHA = '221774a91d1533b2183814b5e98df38358b08c14986ca5ad5d5a07990fe07087'
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
PARQUET_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
SELECTIONS_SHA = '129082c45b21f6fa826dfb6fad78a9c418ea3f6a864ecbff4dfd781160a7f20a'
AUDIT_SHA = '5854319b0abeb445023f877868ac5f5a2899997f76c4ce9ef74120de087534a0'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-rank.' + reason)


def load_code():
    need(sha(CODE.read_bytes()) == CODE_SHA, 'ranker-code-drift')
    spec = importlib.util.spec_from_file_location('beam_ranker_r1', CODE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run():
    paths = {'source': ROOT / 'SOURCE-ONLY.jsonl',
        'parquet': ROOT / '100K-00000-of-00001.parquet',
        'split': ROOT / 'DEV-SPLIT.json',
        'selections': ROOT / 'DEV-SELECTIONS.json',
        'audit': ROOT / 'DEV-CITATION-AUDIT.json'}
    expected = {'source': SOURCE_SHA, 'parquet': PARQUET_SHA,
        'split': SPLIT_SHA, 'selections': SELECTIONS_SHA, 'audit': AUDIT_SHA}
    need(all(sha(path.read_bytes()) == expected[name] for name, path in paths.items()),
        'input-drift')
    ranker = load_code()
    split = json.loads(paths['split'].read_text())
    sealed = json.loads(paths['selections'].read_text())
    prior = json.loads(paths['audit'].read_text())
    dev_keys = set(split['development_conversation_keys'])
    need(len(dev_keys) == 4 and len(split['heldout_conversation_keys']) == 16
        and not dev_keys.intersection(split['heldout_conversation_keys']), 'split-boundary')
    need(prior['per_ability']['event_ordering']['cited_turns'] == 39
        and prior['per_ability']['event_ordering']['reached_cited_turns'] == 0,
        'prior-audit')
    source_rows = {row['conversation_key']: row for line in paths['source'].read_text().splitlines()
        if (row := json.loads(line))['conversation_key'] in dev_keys}
    need(set(source_rows) == dev_keys, 'source-development')
    selected = {row['probe_id']: row for row in sealed['selections']
        if row['ability'] == 'event_ordering'}
    need(len(selected) == 8, 'selected-probes')

    # All-row read is metadata only. Evaluator-bearing columns are materialized
    # exclusively from the four conversation IDs sealed before label access.
    metadata = pq.read_table(paths['parquet'], columns=['conversation_id',
        'conversation_seed']).to_pylist()
    ids = {row['conversation_id'] for row in metadata if
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}" in dev_keys}
    need(len(ids) == 4, 'development-ids')
    evaluator_rows = ds.dataset(paths['parquet'], format='parquet').to_table(
        columns=['conversation_id', 'conversation_seed', 'probing_questions'],
        filter=pc.field('conversation_id').isin(ids)).to_pylist()
    need(len(evaluator_rows) == 4, 'filtered-development')

    ranks = []
    overlap_ranks = []
    per_probe = []
    for row in evaluator_rows:
        key = f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}"
        source = source_rows[key]
        units = [unit for turn_id, turn in enumerate(source['turns'])
            for unit in ranker.split_turn(turn, turn_id)]
        token_sets = [ranker.terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        source_probes = {probe['id']: probe for probe in source['probes']}
        evaluator = ast.literal_eval(row['probing_questions'])['event_ordering']
        need(len(evaluator) == 2, 'event-quota')
        for ordinal, entry in enumerate(evaluator):
            question_sha = sha(canonical(entry['question']))
            probe_id = sha(canonical([key, 'event_ordering', ordinal,
                question_sha]))[:24]
            probe = source_probes.get(probe_id)
            selection = selected.get(probe_id)
            need(probe and selection and probe['question'] == entry['question']
                and selection['conversation_key'] == key, 'probe-binding')
            citations = entry.get('source_chat_ids')
            groups = citations.values() if isinstance(citations, dict) else [citations]
            cited = {item for group in groups for item in group}
            need(cited and all(type(item) is int and 0 <= item < len(source['turns'])
                for item in cited), 'citation-bounds')
            need(not cited.intersection(selection['selected_turn_ids']),
                'selected-citation-disagrees-with-prior')
            question_terms = ranker.terms(probe['question'])
            scores = []
            for index, unit in enumerate(units):
                overlap = question_terms.intersection(token_sets[index])
                relevance = sum(idf[term] for term in overlap)
                scores.append((-relevance, unit['role'] != 'user',
                    -unit['source_turn'], -unit['part_index'], index, bool(overlap)))
            scores.sort()
            best = {}
            best_overlap = {}
            for rank, item in enumerate(scores, 1):
                turn = units[item[4]]['source_turn']
                if turn not in cited:
                    continue
                best.setdefault(turn, rank)
                if item[5]:
                    best_overlap.setdefault(turn, rank)
            need(set(best) == cited, 'citation-rank-coverage')
            ranks.extend(best.values())
            overlap_ranks.extend(best_overlap.values())
            per_probe.append({'probe_id': probe_id,
                'cited_turns': len(cited),
                'cited_turns_with_question_term_overlap': len(best_overlap),
                'cited_turns_in_top_10_fragments': sum(value <= 10 for value in best.values()),
                'cited_turns_in_top_50_fragments': sum(value <= 50 for value in best.values()),
                'cited_turns_in_top_100_fragments': sum(value <= 100 for value in best.values()),
                'best_cited_fragment_rank': min(best.values()),
                'best_overlapping_cited_fragment_rank': min(best_overlap.values())
                    if best_overlap else None,
                'source_fragments': len(units),
                'selected_fragments': len(selection['selected_fragment_identities'])})
    need(len(per_probe) == 8 and sum(row['cited_turns'] for row in per_probe) == 39,
        'final-counts')
    return {'schema_version': 'are.g03-beam-dev-rank-diagnosis/v1',
        'status': 'development-diagnostic-not-native-quality',
        'ranker_sha256': CODE_SHA, 'source_sha256': SOURCE_SHA,
        'parquet_sha256': PARQUET_SHA, 'split_sha256': SPLIT_SHA,
        'selections_sha256': SELECTIONS_SHA, 'prior_audit_sha256': AUDIT_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'event_ordering_probes': len(per_probe), 'cited_turns': len(ranks),
        'cited_turns_with_question_term_overlap': len(overlap_ranks),
        'cited_turns_in_top_10_fragments': sum(rank <= 10 for rank in ranks),
        'cited_turns_in_top_50_fragments': sum(rank <= 50 for rank in ranks),
        'cited_turns_in_top_100_fragments': sum(rank <= 100 for rank in ranks),
        'probes_with_any_cited_turn_in_top_10': sum(
            row['cited_turns_in_top_10_fragments'] > 0 for row in per_probe),
        'probes_with_any_cited_turn_in_top_50': sum(
            row['cited_turns_in_top_50_fragments'] > 0 for row in per_probe),
        'best_cited_fragment_rank_min': min(ranks),
        'best_cited_fragment_rank_max': max(ranks),
        'best_cited_fragment_rank_median': sorted(ranks)[len(ranks) // 2],
        'probe_binding_sha256': sha(canonical(sorted(per_probe,
            key=lambda item: item['probe_id']))),
        'reference_answers_accessed_in_code': False,
        'holdout_evaluator_values_accessed_in_code': False,
        'model_calls': 0, 'native_scores': 0,
        'claim_ceiling': 'Four-conversation development citation-rank diagnosis only; citations are not answer proof, and top-K is not a 5K projection or native score',
        'open_questions': ['Can a source-only multi-event retriever lift citation coverage without harming other abilities?',
            'Do its selected fragments contain answer-bearing evidence?',
            'Can a frozen independent BEAM campaign satisfy native quality and cost gates?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'],
        'cited_turns': result['cited_turns'],
        'cited_turns_with_question_term_overlap': result['cited_turns_with_question_term_overlap'],
        'cited_turns_in_top_100_fragments': result['cited_turns_in_top_100_fragments'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
