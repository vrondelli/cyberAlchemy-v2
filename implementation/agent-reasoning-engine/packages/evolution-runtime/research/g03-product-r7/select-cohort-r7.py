#!/usr/bin/env python3
"""Freeze 28 source-only LongMemEval-S questions, seven per available type."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path('/opt/are/evolution-runtime')
DATA = Path('/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f')
SOURCE = DATA / 'longmemeval_s_cleaned.json'
SELECTOR = ROOT / 'g03-product-replication-tools-r4/select-product-replication.py'
PROJECTOR = ROOT / 'g03-product-replication-tools-r4/project_stream.py'
OUTPUT = ROOT / 'g03-product-replication-r7'
SOURCE_SHA = 'd6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442'
TYPES = ('knowledge-update', 'multi-session', 'single-session-user', 'temporal-reasoning')
SEED = b'are-product-replication-g03-r7\0'


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def load_module(path, name):
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    if OUTPUT.exists() or digest(SOURCE) != SOURCE_SHA:
        raise ValueError('source drift or output root exists')
    queue_path = DATA / 'projection-v1/candidate-queue.json'
    pilot_path = DATA / 'fast-cohort-16-v1/manifest.json'
    first_path = DATA / 'unexposed-live-v1/source-v1/manifest.json'
    queue, pilot, first = (json.loads(path.read_text()) for path in (queue_path, pilot_path, first_path))
    selections = [json.loads((ROOT / f'g03-product-replication-r{i}/SELECTION.json').read_text()) for i in range(1, 7)]
    prior = set(queue['exposed_ids']) | set(pilot['question_ids'])
    prior.update(row['question_id'] for row in first['rows'])
    for selection in selections:
        prior.update(row['question_id'] for row in selection['ordered_questions'])
    prior.update(selections[3]['prior_four_question_ids'])
    prior.update(selections[3]['r2_assigned_question_ids'])
    prior.update(selections[3]['r3_assigned_question_ids'])
    selector = load_module(SELECTOR, 'g03_r7_source_selector')
    rows = selector.scan(SOURCE)
    if len(rows) != 500 or len({row['question_id'] for row in rows}) != 500 or len(prior) != 364:
        raise ValueError('source shape or exposure drift')
    available = {kind: sorted((row for row in rows if row['question_type'] == kind and row['question_id'] not in prior),
                              key=lambda row: hashlib.sha256(SEED + row['question_id'].encode()).hexdigest()) for kind in TYPES}
    counts = {kind: len(bucket) for kind, bucket in available.items()}
    if counts != {'knowledge-update': 11, 'multi-session': 57, 'single-session-user': 7, 'temporal-reasoning': 61}:
        raise ValueError(f'post-r6 source-only census drift: {counts}')
    selected = [available[kind][index] for index in range(7) for kind in TYPES]
    ids = [row['question_id'] for row in selected]
    if len(ids) != 28 or len(set(ids)) != 28 or set(ids) & prior:
        raise ValueError('cohort size, uniqueness, or exposure failure')
    OUTPUT.mkdir(mode=0o700)
    selection = {
        'schema_version': 'are.longmemeval-product-replication-selection/v7',
        'status': 'frozen-before-model-dispatch', 'source_revision': DATA.name,
        'source_sha256': SOURCE_SHA, 'source_bytes': SOURCE.stat().st_size, 'source_records': len(rows),
        'source_fields': sorted(selector.SOURCE_FIELDS), 'selector_sha256': digest(__file__),
        'selection_algorithm_sha256': digest(SELECTOR), 'parser_sha256': digest(PROJECTOR),
        'queue_file_sha256': digest(queue_path), 'pilot_file_sha256': digest(pilot_path),
        'first_file_sha256': digest(first_path),
        'prior_selection_sha256': {str(i): digest(ROOT / f'g03-product-replication-r{i}/SELECTION.json') for i in range(1, 7)},
        'exposure_rule': 'Exclude all prior pilot, queue, first, r1-r6, and assigned r2/r3 IDs; no reuse or replacement.',
        'excluded_count': len(prior), 'available_before_draw': counts, 'seed_hex': SEED.hex(),
        'selection_rule': 'SHA-256 seed+question ID within four types; seven per type; round-robin.',
        'type_quotas': {kind: 7 for kind in TYPES},
        'omitted_types': ['single-session-assistant', 'single-session-preference'],
        'ordered_questions': selected, 'reference_fields_read': False, 'evaluator_fields_emitted': False,
        'provider_calls': 0, 'authority_effect': 'none',
    }
    selection_path = OUTPUT / 'SELECTION.json'
    selection_path.write_text(json.dumps(selection, indent=2) + '\n')
    selection_path.chmod(0o600)
    projector = load_module(PROJECTOR, 'g03_r7_source_projector')
    with SOURCE.open('rb') as stream:
        projection = projector.project_stream(stream, OUTPUT / 'source', question_ids=ids,
                                              expected_selection_size=28, output_limit=64 * 1024**2)
    by_id = {row['question_id']: row for row in projection['selected']}
    bindings = []
    for index, row in enumerate(selected):
        source = by_id[row['question_id']]
        if source['question_type'] != row['question_type']:
            raise ValueError('source type drift')
        bindings.append({'index': index, 'question_id': row['question_id'], 'question_type': row['question_type'],
                         'path': source['path'], 'bytes': source['bytes'], 'file_sha256': source['sha256']})
    manifest = {'schema_version': 'are.longmemeval-product-replication-source/v1', 'source_sha256': SOURCE_SHA,
                'selection_file_sha256': digest(selection_path), 'question_ids': ids, 'rows': bindings,
                'evaluator_fields_emitted': False, 'provider_calls': 0, 'authority_effect': 'none'}
    manifest_path = OUTPUT / 'source/manifest.json'
    manifest_path.write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    manifest_path.chmod(0o400)
    print(json.dumps({'selection_sha256': digest(selection_path), 'manifest_sha256': digest(manifest_path),
                      'questions': len(ids), 'types': selection['type_quotas'], 'available_before_draw': counts}))


if __name__ == '__main__':
    main()
