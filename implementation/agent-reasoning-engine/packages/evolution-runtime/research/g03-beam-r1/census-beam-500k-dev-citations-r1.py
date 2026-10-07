#!/usr/bin/env python3
"""Evaluator-only citation-shape census on disjoint-seed BEAM 500K development."""

import argparse
import ast
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path

import pyarrow.parquet as pq


ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
SOURCE = ROOT / 'source/500K-00000-of-00001.parquet'
SOURCE_SHA = 'af05921c979355038e1761b7cde3d2dd713200dd3071b278de0200f6c7f30122'
PREFLIGHT = ROOT / 'SOURCE-PREFLIGHT.json'
PREFLIGHT_SHA = '8c7b401df2ecf33a59229dd0fb711f077ab78fa14ddf9fc96a4e70a23a509049'


def sha_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def digest(value):
    data = json.dumps(value, sort_keys=True, ensure_ascii=False,
        separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-dev-citation-census.' + reason)


def run():
    need(sha_file(SOURCE) == SOURCE_SHA and sha_file(PREFLIGHT) == PREFLIGHT_SHA,
        'pinned-input-drift')
    preflight = json.loads(PREFLIGHT.read_text())
    need(preflight['status'] == 'source-only-development-supply-qualified' and
        preflight['eligible_disjoint_seed_conversations'] == 30 and
        preflight['reserved_seed_overlap'] == 5, 'preflight-shape')
    eligible = set(preflight['eligible_seed_key_hashes'])
    excluded = set(preflight['excluded_overlap_seed_key_hashes'])
    need(len(eligible) == 30 and len(excluded) == 5 and not eligible & excluded,
        'selection-shape')
    rows = pq.read_table(SOURCE, columns=['conversation_seed', 'chat',
        'probing_questions']).to_pylist()
    need(len(rows) == 35, 'row-count')
    by_ability = defaultdict(Counter)
    ie_question_types = Counter()
    selected, excluded_seen = set(), set()
    for row in rows:
        seed = row['conversation_seed']
        key_hash = digest(f"{seed['category']}:{seed['id']}")
        if key_hash in excluded:
            excluded_seen.add(key_hash)
            continue
        need(key_hash in eligible and key_hash not in selected,
            'eligible-seed-binding')
        selected.add(key_hash)
        turns = [message for segment in row['chat'] for message in segment]
        parsed = ast.literal_eval(row['probing_questions'])
        need(set(parsed) == set(preflight['ability_counts']), 'ability-shape')
        for ability, entries in parsed.items():
            need(len(entries) == 2, 'ability-quota')
            for entry in entries:
                counts = by_ability[ability]
                counts['questions'] += 1
                if ability == 'information_extraction':
                    value = entry.get('question_type')
                    ie_question_types[str(value) if value is not None else 'missing'] += 1
                if 'source_chat_ids' not in entry:
                    counts['citation_field_missing'] += 1
                    continue
                cited = entry['source_chat_ids']
                if not isinstance(cited, list):
                    counts['citation_shape_invalid'] += 1
                    continue
                if not cited:
                    counts['citation_list_empty'] += 1
                    continue
                counts['citation_list_nonempty'] += 1
                counts['citation_entries'] += len(cited)
                if len(set(map(str, cited))) != len(cited):
                    counts['duplicate_citation_questions'] += 1
                if any(type(identity) is not int or identity < 0 or
                       identity >= len(turns) for identity in cited):
                    counts['out_of_range_or_noninteger_questions'] += 1
                else:
                    counts['valid_citation_questions'] += 1
                    counts['cited_user_turns'] += sum(
                        turns[identity]['role'] == 'user' for identity in cited)
                    counts['cited_assistant_turns'] += sum(
                        turns[identity]['role'] == 'assistant' for identity in cited)
    need(selected == eligible and excluded_seen == excluded and
        sum(counts['questions'] for counts in by_ability.values()) == 600 and
        all(counts['questions'] == 60 for counts in by_ability.values()),
        'population-accounting')
    return {'schema_version': 'are.g03-beam-500k-dev-citation-census/v1',
        'status': 'evaluator-only-citation-shape-audited',
        'source_sha256': SOURCE_SHA, 'preflight_sha256': PREFLIGHT_SHA,
        'eligible_conversations': len(selected),
        'excluded_reserved_seed_overlap': len(excluded_seen),
        'development_questions': 600,
        'by_ability': {key: dict(sorted(value.items())) for key, value in
                       sorted(by_ability.items())},
        'information_extraction_question_type_counts': dict(sorted(
            ie_question_types.items())),
        'reserved_evaluator_fields_read': False,
        'development_answers_or_rubrics_emitted': False,
        'citation_identities_emitted': False,
        'model_calls': 0,
        'claim_ceiling': 'Citation metadata structure in disjoint-seed 500K development only; not retrieval accuracy, answer quality, native BEAM score, 100K holdout, or superiority',
        'open_questions': [
            'Which development ability/question-type subset has reliable citation labels and an answer-quality scorer?',
            'Can a source-only retrieval treatment outperform a contemporaneous BM25 control without 100K holdout tuning?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': receipt['status'],
        'eligible_conversations': receipt['eligible_conversations'],
        'development_questions': receipt['development_questions'],
        'by_ability': {ability: {key: counts.get(key, 0) for key in
            ['citation_list_nonempty', 'valid_citation_questions',
             'citation_field_missing', 'out_of_range_or_noninteger_questions']}
            for ability, counts in receipt['by_ability'].items()},
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
