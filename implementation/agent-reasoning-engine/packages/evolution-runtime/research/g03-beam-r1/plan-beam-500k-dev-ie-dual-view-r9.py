#!/usr/bin/env python3
"""Seal source-only semantic/lexical dual-view BEAM 500K IE selections."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
PARENT = HERE / 'plan-beam-500k-dev-ie-hybrid-r8.py'
PARENT_SHA = '385534e87254d10592c1dabf0925b3068e119bb756de067382683a36389f5b90'
SEMANTIC_VIEW_CHARS = 2500
COMBINED_CHARS = 5000


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-dual-view-r9.' + reason)


def choose(probe, units, prior, parent, candidate, bm25, tokenizer, session):
    by_identity = {(unit['source_turn'], unit['part_index']): index
        for index, unit in enumerate(units)}
    need(len(by_identity) == len(units), 'unique-fragment-identities')
    pool = parent.bm25_pool(probe, units, bm25, candidate)
    pool_set = set(pool)
    old = prior['treatment']['selected_fragment_identities']
    prior_indices = [by_identity[tuple(identity)] for identity in old]
    need(len(prior_indices) == len(set(prior_indices)) and
        set(prior_indices) <= pool_set, 'r7-selection-in-pool')
    scores, tokens, at_cap = parent.score_pool(probe, prior_indices, units,
        tokenizer, session)
    ranked = sorted(range(len(prior_indices)), key=lambda position: (
        -float(scores[position]), units[prior_indices[position]]['role'] != 'user',
        -units[prior_indices[position]]['source_turn'],
        -units[prior_indices[position]]['part_index']))
    semantic = []
    for position in ranked:
        index = prior_indices[position]
        proposed = {'semantic_evidence': [units[item] for item in
            semantic + [index]]}
        if candidate.chars(proposed) <= SEMANTIC_VIEW_CHARS:
            semantic.append(index)
    semantic_turns = {units[index]['source_turn'] for index in semantic}
    lexical = []
    for index in pool:
        if units[index]['source_turn'] in semantic_turns:
            continue
        proposed = {'semantic_evidence': [units[item] for item in semantic],
            'lexical_evidence': [units[item] for item in lexical + [index]]}
        if candidate.chars(proposed) <= COMBINED_CHARS:
            lexical.append(index)
    need(semantic and lexical and not set(semantic) & set(lexical),
        'two-views-and-unique-fragments')
    semantic_units = sorted((units[index] for index in semantic),
        key=lambda unit: (unit['source_turn'], unit['part_index']))
    lexical_units = sorted((units[index] for index in lexical),
        key=lambda unit: (unit['source_turn'], unit['part_index']))
    projection = {'semantic_evidence': semantic_units,
        'lexical_evidence': lexical_units}
    need(candidate.chars({'semantic_evidence': semantic_units}) <=
        SEMANTIC_VIEW_CHARS and candidate.chars(projection) <= COMBINED_CHARS,
        'projection-limit')
    all_units = sorted(semantic_units + lexical_units,
        key=lambda unit: (unit['source_turn'], unit['part_index']))
    need(len({(unit['source_turn'], unit['part_index']) for unit in all_units})
        == len(all_units), 'duplicate-evidence')
    identity = lambda unit: [unit['source_turn'], unit['part_index']]
    return {'probe_id': probe['id'],
        'semantic_fragment_identities': [identity(unit) for unit in semantic_units],
        'lexical_fragment_identities': [identity(unit) for unit in lexical_units],
        'selected_fragment_identities': [identity(unit) for unit in all_units],
        'projection_sha256': candidate.sha(projection),
        'projection_chars': candidate.chars(projection)}, {
        'scored_pairs': len(prior_indices),
        'pair_tokens_after_truncation': tokens,
        'pairs_at_token_cap': at_cap,
        'semantic_fragments': len(semantic_units),
        'lexical_fragments': len(lexical_units),
        'lexical_source_turns_new_to_semantic': len({
            unit['source_turn'] for unit in lexical_units}),
        'selected_fragments': len(all_units),
        'selected_distinct_turns': len({
            unit['source_turn'] for unit in all_units})}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and hashlib.sha256(PARENT.read_bytes()).hexdigest()
        == PARENT_SHA, 'output-or-parent-drift')
    spec = importlib.util.spec_from_file_location('beam_ie_dual_view_r9_parent',
        PARENT)
    parent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parent)
    parent.choose = choose
    result = parent.run()
    need(result['evaluator_fields_read'] is False and
        result['glm_model_calls'] == 0 and
        result['information_extraction_questions'] == 60 and
        all(len(row['treatment']['semantic_fragment_identities']) > 0 and
            len(row['treatment']['lexical_fragment_identities']) > 0 and
            row['treatment']['projection_chars'] <= COMBINED_CHARS
            for row in result['selections']), 'source-only-seal-boundary')
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-dual-view-r9/v1'
    result['policy'] = '2500-char-cross-scored-semantic-view-plus-novel-turn-BM25-lexical-view'
    result['parent_selector_sha256'] = PARENT_SHA
    result['semantic_view_utf16_character_ceiling'] = SEMANTIC_VIEW_CHARS
    result['projection_utf16_character_ceiling'] = COMBINED_CHARS
    result['claim_ceiling'] = ('Exposed-development source-only dual-view '
        'selections; no GLM answer quality, native score, holdout or superiority')
    result['open_questions'] = [
        'Do exact matched 8K answer wires pass the same-account VPS tokenizer?',
        'Does the dual-view treatment improve paired answer quality on all 60 development questions?']
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'questions': result['information_extraction_questions'],
        'work': result['work'], 'elapsed_seconds': result['elapsed_seconds'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
