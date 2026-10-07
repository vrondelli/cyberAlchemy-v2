#!/usr/bin/env python3
"""Evaluator-only citation reachability for sealed BEAM development selections."""

import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002')
SOURCE = ROOT / '100K-00000-of-00001.parquet'
SOURCE_SHA = 'c0519be25907005ba873c927c50877471d550873039d96c041554d0075a78ace'
SPLIT = ROOT / 'DEV-SPLIT.json'
SPLIT_SHA = '3761dc9b64bdf453a55efa040e0b52d2096d68356d174ee3d141d764259f716e'
SELECTIONS = ROOT / 'DEV-SELECTIONS.json'
SELECTIONS_SHA = '129082c45b21f6fa826dfb6fad78a9c418ea3f6a864ecbff4dfd781160a7f20a'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-dev-citation-audit.' + reason)


def cited_ids(value):
    if value is None:
        return None
    if isinstance(value, dict):
        groups = list(value.values())
    else:
        groups = [value]
    need(all(isinstance(group, list) for group in groups), 'citation-groups')
    ids = [item for group in groups for item in group]
    if not ids:
        return None
    need(all(type(item) is int and item >= 0 for item in ids),
        'citation-values')
    return set(ids)


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(SPLIT.read_bytes()) == SPLIT_SHA and
        sha(SELECTIONS.read_bytes()) == SELECTIONS_SHA, 'input-drift')
    split = json.loads(SPLIT.read_text())
    sealed = json.loads(SELECTIONS.read_text())
    need(split['status'] == 'sealed-source-only-before-citation-audit' and
        sealed['status'] == 'sealed-before-development-label-access' and
        sealed['development_split_sha256'] == SPLIT_SHA, 'seal-shape')
    dev_keys = set(split['development_conversation_keys'])
    heldout_keys = set(split['heldout_conversation_keys'])
    need(len(dev_keys) == 4 and len(heldout_keys) == 16 and
        not dev_keys.intersection(heldout_keys), 'split-shape')
    # Metadata only for all rows; evaluator-valued columns are materialized
    # into Python only from the four preselected conversation IDs.
    metadata = pq.read_table(SOURCE, columns=['conversation_id',
        'conversation_seed']).to_pylist()
    keys_by_id = {row['conversation_id']:
        f"{row['conversation_seed']['category']}:{row['conversation_seed']['id']}"
        for row in metadata}
    dev_ids = [id_ for id_, key in keys_by_id.items() if key in dev_keys]
    need(len(dev_ids) == 4 and len(keys_by_id) == 20, 'metadata-selection')
    table = ds.dataset(SOURCE, format='parquet').to_table(
        columns=['conversation_id', 'chat', 'probing_questions'],
        filter=pc.field('conversation_id').isin(dev_ids))
    rows = table.to_pylist()
    need(len(rows) == 4 and all(keys_by_id[row['conversation_id']] in dev_keys
        for row in rows), 'filtered-development-rows')
    by_probe = {row['probe_id']: row for row in sealed['selections']}
    need(len(by_probe) == 80, 'sealed-probes')
    per_ability = defaultdict(lambda: {'probes': 0, 'with_citations': 0,
        'hit_any': 0, 'hit_all': 0, 'cited_turns': 0,
        'reached_cited_turns': 0, 'selected_turns': 0})
    binding_rows = []
    for row in rows:
        key = keys_by_id[row['conversation_id']]
        turns = [message for segment in row['chat'] for message in segment]
        need([message['id'] for message in turns] == list(range(len(turns))),
            'turn-id-order')
        # Parsing is limited to the four development rows by the Arrow filter.
        import ast
        probes = ast.literal_eval(row['probing_questions'])
        for ability in sorted(probes):
            need(len(probes[ability]) == 2, 'ability-quota')
            for ordinal, entry in enumerate(probes[ability]):
                question_sha = sha(canonical(entry['question']))
                probe_id = sha(canonical([key, ability, ordinal,
                    question_sha]))[:24]
                selection = by_probe.get(probe_id)
                need(selection and selection['conversation_key'] == key and
                    selection['ability'] == ability, 'selection-match')
                selected = set(selection['selected_turn_ids'])
                need(all(type(item) is int and 0 <= item < len(turns)
                    for item in selected), 'selected-turn-bounds')
                citations = cited_ids(entry.get('source_chat_ids'))
                values = per_ability[ability]
                values['probes'] += 1
                values['selected_turns'] += len(selected)
                if citations is not None:
                    need(all(item < len(turns) for item in citations),
                        'citation-bounds')
                    reached = selected.intersection(citations)
                    values['with_citations'] += 1
                    values['cited_turns'] += len(citations)
                    values['reached_cited_turns'] += len(reached)
                    values['hit_any'] += bool(reached)
                    values['hit_all'] += citations.issubset(selected)
                    binding_rows.append([probe_id, ability, len(citations),
                        len(reached), len(selected)])
                else:
                    need(ability in {'abstention', 'summarization'},
                        'missing-citations')
                    binding_rows.append([probe_id, ability, None, None,
                        len(selected)])
    need(len(binding_rows) == 80 and
        all(values['probes'] == 8 for values in per_ability.values()),
        'development-counts')
    totals = {name: sum(values[name] for values in per_ability.values())
        for name in ('probes', 'with_citations', 'hit_any', 'hit_all',
            'cited_turns', 'reached_cited_turns', 'selected_turns')}
    return {'schema_version': 'are.g03-beam-dev-citation-reach/v1',
        'status': 'development-diagnostic-not-native-quality',
        'source_sha256': SOURCE_SHA, 'split_sha256': SPLIT_SHA,
        'selections_sha256': SELECTIONS_SHA,
        'development_conversations': 4, 'heldout_conversations': 16,
        'per_ability': dict(sorted(per_ability.items())),
        'totals': totals,
        'citation_binding_sha256': sha(canonical(sorted(binding_rows))),
        'holdout_evaluator_values_accessed_in_code': False,
        'reference_answers_accessed_in_code': False,
        'model_calls': 0, 'native_scores': 0,
        'claim_ceiling': 'Exposed development citation-turn reachability only; citations may be incomplete or insufficient; not answer accuracy, independent holdout, or superiority',
        'open_questions': ['Does the selected fragment actually contain the needed cited evidence?',
            'Can a better source-only candidate improve development reach before one independent holdout?',
            'Will a separately approved and frozen BEAM campaign clear native quality and all-in cost gates?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = run()
    data = json.dumps(result, sort_keys=True, indent=2).encode() + b'\n'
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': result['status'], **result['totals'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
