#!/usr/bin/env python3
"""Audit sealed 500K development selections against citation metadata only."""

import argparse
import ast
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
PREFLIGHT = ROOT / 'SOURCE-PREFLIGHT.json'
SELECTIONS = ROOT / 'IE-PAIRED-SELECTIONS.json'
PINS = {
    SOURCE: 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122',
    PREFLIGHT: '8c7b401df2ecf33a59229dd0fb711f077ab78fa14ddf9fc96a4e70a23a509049',
}


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode()


def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else
        canonical(value)).hexdigest()


def sha_file(path):
    hashed = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            hashed.update(block)
    return hashed.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-citation-audit.' + reason)


def tally(entries):
    summary = Counter()
    for entry in entries:
        summary['questions'] += 1
        for arm in ('treatment', 'control'):
            summary[arm + '_any'] += entry[arm]['hit_any']
            summary[arm + '_all'] += entry[arm]['hit_all']
            summary[arm + '_cited_turns_reached'] += entry[arm]['cited_turns_reached']
        summary['cited_turns'] += entry['cited_turns']
        left = entry['treatment']['cited_turns_reached']
        right = entry['control']['cited_turns_reached']
        summary['treatment_win'] += left > right
        summary['control_win'] += right > left
        summary['tie'] += left == right
    return dict(sorted(summary.items()))


def run():
    need(all(sha_file(path) == value for path, value in PINS.items()),
        'pinned-input-drift')
    need(SELECTIONS.is_file(), 'missing-sealed-selections')
    selection_sha = sha_file(SELECTIONS)
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['status'] == 'sealed-source-only-before-citation-audit' and
        sealed['evaluator_fields_read'] is False and
        sealed['information_extraction_questions'] == 60 and
        len(sealed['selections']) == 60, 'selection-boundary')
    by_id = {entry['probe_id']: entry for entry in sealed['selections']}
    need(len(by_id) == 60, 'unique-probes')
    preflight = json.loads(PREFLIGHT.read_text())
    eligible = set(preflight['eligible_seed_key_hashes'])
    excluded = set(preflight['excluded_overlap_seed_key_hashes'])
    need(len(eligible) == 30 and len(excluded) == 5 and
        not eligible & excluded, 'population-binding')
    rows = pq.read_table(SOURCE, columns=['conversation_seed', 'chat',
        'probing_questions']).to_pylist()
    need(len(rows) == 35, 'source-row-count')
    observed, excluded_seen, results = set(), set(), []
    by_type = defaultdict(list)
    for row in rows:
        seed = row['conversation_seed']
        key = f"{seed['category']}:{seed['id']}"
        key_hash = digest(key)
        if key_hash in excluded:
            excluded_seen.add(key_hash)
            continue
        need(key_hash in eligible, 'eligible-key')
        turns = [message for segment in row['chat'] for message in segment]
        probes = ast.literal_eval(row['probing_questions'])['information_extraction']
        need(len(probes) == 2, 'ie-quota')
        for ordinal, probe in enumerate(probes):
            question = probe['question']
            probe_id = digest([key, 'information_extraction', ordinal,
                digest(question)])[:24]
            need(probe_id in by_id and probe_id not in observed,
                'probe-binding')
            observed.add(probe_id)
            selection = by_id[probe_id]
            need(selection['conversation_key_sha256'] == key_hash,
                'conversation-binding')
            citations = probe['source_chat_ids']
            need(isinstance(citations, list) and citations and all(
                type(identity) is int and 0 <= identity < len(turns)
                for identity in citations), 'valid-citations')
            cited = set(citations)
            result = {'probe_id': probe_id, 'cited_turns': len(cited)}
            for arm in ('treatment', 'control'):
                binding = selection[arm]
                need(binding['probe_id'] == probe_id and
                    binding['conversation_key_sha256'] == key_hash and
                    binding['projection_chars'] <= 5000,
                    'arm-binding')
                selected = {identity[0] for identity in
                    binding['selected_fragment_identities']}
                reached = len(cited & selected)
                result[arm] = {'hit_any': int(reached > 0),
                    'hit_all': int(reached == len(cited)),
                    'cited_turns_reached': reached}
            results.append(result)
            by_type[str(probe.get('question_type', 'missing'))].append(result)
    need(observed == set(by_id) and excluded_seen == excluded and
        len(results) == 60, 'population-accounting')
    return {'schema_version': 'are.g03-beam-500k-dev-ie-citation-audit/v1',
        'status': 'development-citation-reach-audited',
        'source_sha256': PINS[SOURCE],
        'preflight_sha256': PINS[PREFLIGHT],
        'sealed_selections_sha256': selection_sha,
        'aggregate': tally(results),
        'by_question_type': {kind: tally(entries) for kind, entries in
            sorted(by_type.items())},
        'per_question': sorted(results, key=lambda x: x['probe_id']),
        'reserved_100k_evaluator_fields_read': False,
        'development_answers_or_rubrics_emitted': False,
        'model_calls': 0,
        'claim_ceiling': 'BEAM 500K disjoint-seed development citation reach only; citation labels are not answer quality, native score, reserved holdout, or superiority',
        'open_questions': ['Which source-grounded mechanism improves citation reach?',
            'Does better source reach improve answer correctness under matched 8K GLM requests?']}


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
    print(json.dumps({'status': result['status'],
        'aggregate': result['aggregate'],
        'receipt_sha256': digest(data)}, sort_keys=True))


if __name__ == '__main__':
    main()
