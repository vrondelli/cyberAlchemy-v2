#!/usr/bin/env python3
"""Source-field-only LongMemEval-S supply after all r1-r6 selections."""
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import sys

BASE = Path('/opt/are/evolution-runtime')
DATA = Path('/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f')
SOURCE = DATA / 'longmemeval_s_cleaned.json'
SELECTOR = BASE / 'g03-product-replication-tools-r4/select-product-replication.py'
QUEUE = DATA / 'projection-v1/candidate-queue.json'
PILOT = DATA / 'fast-cohort-16-v1/manifest.json'
FIRST = DATA / 'unexposed-live-v1/source-v1/manifest.json'
OUTPUT = BASE / 'g03-post-r6-source-supply-r1/CENSUS.json'
SOURCE_SHA = 'd6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442'
TYPES = ('single-session-preference', 'single-session-assistant', 'single-session-user',
         'knowledge-update', 'multi-session', 'temporal-reasoning')


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def id_sha(ids):
    return hashlib.sha256(('\n'.join(sorted(ids)) + '\n').encode()).hexdigest()


def main():
    if OUTPUT.exists() or OUTPUT.parent.exists() or sha(SOURCE) != SOURCE_SHA:
        raise ValueError('source-drift-or-output-exists')
    sys.path.insert(0, str(SELECTOR.parent))
    spec = importlib.util.spec_from_file_location('g03_post_r6_selector', SELECTOR)
    selector = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(selector)
    rows = selector.scan(SOURCE)
    if len(rows) != 500 or len({row['question_id'] for row in rows}) != 500:
        raise ValueError('source-shape')
    queue, pilot, first = (json.loads(path.read_text()) for path in (QUEUE, PILOT, FIRST))
    seen = set(queue['exposed_ids']) | set(pilot['question_ids'])
    seen.update(row['question_id'] for row in first['rows'])
    selections = []
    for index in range(1, 7):
        path = BASE / f'g03-product-replication-r{index}/SELECTION.json'
        selection = json.loads(path.read_text())
        ids = {row['question_id'] for row in selection['ordered_questions']}
        if len(ids) != len(selection['ordered_questions']):
            raise ValueError('selection-duplicate')
        seen.update(ids)
        if index == 4:
            seen.update(selection['prior_four_question_ids'])
            seen.update(selection['r2_assigned_question_ids'])
            seen.update(selection['r3_assigned_question_ids'])
        selections.append({'round': index, 'sha256': sha(path), 'selected': len(ids)})
    remaining = [row for row in rows if row['question_id'] not in seen]
    by_type = Counter(row['question_type'] for row in remaining)
    if set(by_type) - set(TYPES):
        raise ValueError('unknown-question-type')
    counts = {kind: by_type[kind] for kind in TYPES}
    if len(seen) != 364 or len(remaining) != 136 or counts != {
            'single-session-preference': 0, 'single-session-assistant': 0,
            'single-session-user': 7, 'knowledge-update': 11,
            'multi-session': 57, 'temporal-reasoning': 61}:
        raise ValueError('exposure-or-supply-drift')
    result = {'schema_version': 'are.g03-post-r6-source-supply/v1',
              'status': 'source-only-census-not-selected',
              'source_sha256': SOURCE_SHA, 'selector_sha256': sha(SELECTOR),
              'queue_sha256': sha(QUEUE), 'pilot_sha256': sha(PILOT),
              'first_sha256': sha(FIRST), 'selection_receipts': selections,
              'excluded_distinct_question_ids': len(seen),
              'excluded_id_set_sha256': id_sha(seen),
              'remaining_total': len(remaining), 'remaining_by_type': counts,
              'remaining_id_set_sha256': id_sha(row['question_id'] for row in remaining),
              'script_sha256': sha(__file__), 'reference_fields_read': False,
              'provider_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'LongMemEval-S source-only supply; no fresh five/six-type cohort, score, or superiority result',
              'open_questions': ['Can a separate source population support five/six-type replication without repeated question IDs?',
                                 'Would a narrower four-type S replication add enough evidence to justify its cost?']}
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': result['status'], 'remaining_total': len(remaining),
                      'remaining_by_type': counts, 'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
