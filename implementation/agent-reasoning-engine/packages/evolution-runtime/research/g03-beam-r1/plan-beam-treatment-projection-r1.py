#!/usr/bin/env python3
"""No-generation BEAM treatment candidate over source-only history/questions."""

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re


SOURCE = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-ONLY.jsonl')
SOURCE_SHA = 'bfae354f876ccb0d5b95aebad51cfa734ce82e7c4c8102beeb5a9bd0476bc26d'
SOURCE_RECEIPT = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SOURCE-ONLY-RECEIPT.json')
SOURCE_RECEIPT_SHA = 'd6ded2011d474a655d934ce3ccd8f80bee7472f3c5b39f9bdd3d9fa58c5f3296'
SHARED_PLAN = Path('/home/vlad_/are-benchmark-archive/g03-beam-source-r1-20261002/SHARED-INGESTION-PLAN-r2.json')
SHARED_PLAN_SHA = 'c8b1867df27f0eff76b375ace768f374aa94cfd6f41d8f7b5f3e608530414658'
UNIT_CHARS = 2500
PROJECTION_CHARS = 5000
STOP = {'the', 'and', 'for', 'with', 'have', 'how', 'many', 'there', 'that',
    'this', 'can', 'you', 'are', 'was', 'were', 'has', 'had', 'from', 'been',
    'since', 'what', 'which', 'will', 'would', 'could', 'should', 'about', 'into'}
UNIT_KEYS = {'source_turn', 'part_index', 'part_count', 'role', 'content', 'time_anchor'}


def serial(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'))


def sha(value):
    data = value if isinstance(value, bytes) else serial(value).encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def chars(value):
    return len(serial(value).encode('utf-16-le')) // 2


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-treatment-plan.' + reason)


def terms(value):
    return {term for term in re.findall(r'[a-z0-9]+', value.lower())
        if len(term) > 2 and term not in STOP}


def split_turn(turn, source_turn):
    content = turn['content']
    need(isinstance(content, str) and content, 'turn-content')
    pieces, offset = [], 0
    while offset < len(content):
        low, high, best = 1, len(content) - offset, 0
        while low <= high:
            middle = (low + high) // 2
            candidate = {'source_turn': source_turn, 'part_index': 9999,
                'part_count': 9999, 'role': turn['role'],
                'content': content[offset:offset + middle],
                'time_anchor': turn['time_anchor']}
            if chars(candidate) <= UNIT_CHARS:
                best = middle
                low = middle + 1
            else:
                high = middle - 1
        need(best > 0, 'unit-cannot-fit')
        pieces.append(content[offset:offset + best])
        offset += best
        need(len(pieces) < 10000, 'unit-count-overflow')
    units = [{'source_turn': source_turn, 'part_index': index,
        'part_count': len(pieces), 'role': turn['role'], 'content': part,
        'time_anchor': turn['time_anchor']}
        for index, part in enumerate(pieces)]
    need(all(set(unit) == UNIT_KEYS and chars(unit) <= UNIT_CHARS for unit in units)
        and ''.join(unit['content'] for unit in units) == content, 'unit-loss')
    return units


def project(probe, units, token_sets, idf):
    question_terms = terms(probe['question'])
    scored = []
    for index, unit in enumerate(units):
        overlap = question_terms.intersection(token_sets[index])
        relevance = sum(idf[term] for term in overlap)
        scored.append((-relevance, unit['role'] != 'user', -unit['source_turn'],
            -unit['part_index'], index, len(overlap)))
    scored.sort()
    chosen, overlap_count = [], 0
    for item in scored:
        unit = units[item[4]]
        candidate = chosen + [unit]
        if chars({'archived_evidence': candidate}) <= PROJECTION_CHARS:
            chosen = candidate
            overlap_count += item[5]
    need(chosen, 'empty-projection')
    chronological = sorted(chosen, key=lambda unit: (unit['source_turn'],
        unit['part_index']))
    projection = {'archived_evidence': chronological}
    need(chars(projection) <= PROJECTION_CHARS, 'projection-over-limit')
    return {'projection_sha256': sha(projection), 'projection_chars': chars(projection),
        'selected_units': len(chronological), 'selected_user_units': sum(
            unit['role'] == 'user' for unit in chronological),
        'selected_overlap_terms': overlap_count,
        'question_has_source_term_overlap': any(question_terms.intersection(x)
            for x in token_sets),
        'selected_source_identity_sha256': sha([(unit['source_turn'],
            unit['part_index']) for unit in chronological])}


def run():
    need(sha(SOURCE.read_bytes()) == SOURCE_SHA and
        sha(SOURCE_RECEIPT.read_bytes()) == SOURCE_RECEIPT_SHA and
        sha(SHARED_PLAN.read_bytes()) == SHARED_PLAN_SHA, 'input-drift')
    source_receipt = json.loads(SOURCE_RECEIPT.read_text())
    shared = json.loads(SHARED_PLAN.read_text())
    need(source_receipt['evaluator_fields_emitted'] is False and
        source_receipt['conversations'] == 20 and
        shared['status'] == 'passed-source-only-not-token-qualified',
        'source-boundary')
    rows = [json.loads(line) for line in SOURCE.read_text().splitlines()]
    need(len(rows) == 20, 'row-count')
    shared_by_key = {row['conversation_key_hash']: row
        for row in shared['conversation_summaries']}
    results, ability_counts, total_units = [], Counter(), 0
    for row in rows:
        need(set(row) == {'conversation_key', 'turns', 'probes'} and
            len(row['probes']) == 20, 'row-shape')
        binding = shared_by_key.get(sha(row['conversation_key']))
        need(binding and binding['history_sha256'] == sha(row['turns']),
            'shared-history-binding')
        units = [unit for source_turn, turn in enumerate(row['turns'])
            for unit in split_turn(turn, source_turn)]
        total_units += len(units)
        token_sets = [terms(unit['content']) for unit in units]
        counts = Counter(term for found in token_sets for term in found)
        idf = {term: 1.0 + math.log((len(units) + 1) / (count + 1))
            for term, count in counts.items()}
        for probe in row['probes']:
            need(set(probe) == {'id', 'ability', 'question'}, 'probe-shape')
            result = project(probe, units, token_sets, idf)
            results.append({'probe_id': probe['id'], 'ability': probe['ability'],
                'conversation_key_hash': sha(row['conversation_key']),
                'history_sha256': binding['history_sha256'], **result})
            ability_counts[probe['ability']] += 1
    need(len(results) == 400 and len({row['probe_id'] for row in results}) == 400
        and all(count == 40 for count in ability_counts.values()), 'probe-counts')
    return {'schema_version': 'are.g03-beam-treatment-projection-candidate/v1',
        'status': 'passed-source-only-not-evaluated',
        'source_only_sha256': SOURCE_SHA,
        'source_only_receipt_sha256': SOURCE_RECEIPT_SHA,
        'shared_ingestion_plan_sha256': SHARED_PLAN_SHA,
        'policy': 'rare-query-term-fragment-rank-user-and-recency-tiebreak-r1',
        'unit_utf16_character_ceiling': UNIT_CHARS,
        'projection_utf16_character_ceiling': PROJECTION_CHARS,
        'conversations': len(rows), 'probes': len(results),
        'source_units': total_units,
        'selected_units_total': sum(row['selected_units'] for row in results),
        'selected_units_min': min(row['selected_units'] for row in results),
        'selected_units_max': max(row['selected_units'] for row in results),
        'questions_with_no_source_term_overlap': sum(not row['question_has_source_term_overlap']
            for row in results),
        'questions_with_no_selected_term_overlap': sum(row['selected_overlap_terms'] == 0
            for row in results),
        'maximum_projection_utf16_characters': max(row['projection_chars'] for row in results),
        'ability_counts': dict(sorted(ability_counts.items())),
        'projection_bindings_sha256': sha(sorted(results,
            key=lambda row: row['probe_id'])),
        'model_calls': 0, 'reference_fields_accessed': False,
        'cohort_selected': False, 'native_score': 'not-computed',
        'claim_ceiling': 'Source-only treatment candidate shape; no actual 8K wire, gold relevance, model answer, native score, freeze, or superiority',
        'open_questions': ['Does this source-only retrieval rank relevant evidence on a separate development population?',
            'Can the full answer wire with a common BEAM prompt pass an exact 8K tokenizer check?',
            'Will a frozen independent cohort show a paired quality gain at acceptable all-in cost?']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    receipt = run()
    data = (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as handle:
        handle.write(data)
    print(json.dumps({'status': receipt['status'], 'probes': receipt['probes'],
        'selected_units_min': receipt['selected_units_min'],
        'selected_units_max': receipt['selected_units_max'],
        'questions_with_no_selected_term_overlap': receipt['questions_with_no_selected_term_overlap'],
        'receipt_sha256': sha(data), 'output': str(args.output)}, sort_keys=True))


if __name__ == '__main__':
    main()
