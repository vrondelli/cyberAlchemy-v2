#!/usr/bin/env python3
"""Seal all score-blind source-order candidates for thirteen r13 failed slots."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'fresh-r11/repair-r14'
OUTPUT = ROOT / 'QUEUE.json'
COHORT = BASE / 'fresh-r11/METADATA-COHORT.json'
R13 = BASE / 'fresh-r11/header-r13/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R14-SCORE-BLIND-REPAIR-PROTOCOL-2026-10-04.md'
ATTEMPT_DIR = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
PINS = {'cohort': '67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd',
        'r13': '8359293ecb0b33b1b9bc6a24c686c270eb591134afecd6f1db5e4400fd683569',
        'protocol': '9cb5c8f811fe0c6d2d649317f444846c38fdb7cdf081a42707366d7314b09110'}
INPUTS = {
    'raw': BASE / '1.3.1-bugswarm.json',
    'order': BASE / 'source-only-r1/ORDERED-CANDIDATES.json',
    'prior': BASE / 'METADATA-CANDIDATE-24-R1.json',
    'dev_a_r1': BASE / 'graph-dev-r1/METADATA-COHORTS-R1.json',
    'dev_a_r2': BASE / 'graph-dev-r2/DEV-METADATA-R2.json',
    'dev_b_r1': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R1.json',
    'dev_b_r2': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json',
    'confirm': BASE / 'graph-confirm-r4/code-only/RESULT.json',
    'eligibility_rule': HERE / 'select-bugswarm-graph-dev-r1.py',
    'protocol': HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R11-COHORT-PROTOCOL-2026-10-04.md',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def main() -> None:
    need(not ROOT.exists() and sha(COHORT.read_bytes()) == PINS['cohort'] and
         sha(R13.read_bytes()) == PINS['r13'] and
         sha(PROTOCOL.read_bytes()) == PINS['protocol'], 'output-or-main-pin-drift')
    cohort = json.loads(COHORT.read_bytes())
    r13 = json.loads(R13.read_bytes())
    for name, path in INPUTS.items():
        need(sha(path.read_bytes()) == cohort['input_sha256'][name],
             f'exclusion-input-pin-drift:{name}')
    attempt_paths = sorted(ATTEMPT_DIR.glob('ATTEMPT-*.json'))
    need(len(attempt_paths) == 35, 'prior-attempt-count-drift')
    manifest = ''.join(f'{sha(path.read_bytes())}  {path.name}\n' for path in attempt_paths).encode()
    need(sha(manifest) == cohort['input_sha256']['attempts'], 'prior-attempt-manifest-drift')
    data = {name: json.loads(path.read_bytes()) for name, path in INPUTS.items()
            if name not in ('eligibility_rule', 'protocol')}
    spec = importlib.util.spec_from_file_location('g01_r14_eligibility', INPUTS['eligibility_rule'])
    need(spec is not None and spec.loader is not None, 'eligibility-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    raw = data['raw']
    by_tag = {row['image_tag']: row for row in raw}
    need(len(raw) == len(by_tag) == 4388, 'raw-population-drift')
    excluded: set[str] = set()

    def add(rows: list[dict]) -> None:
        excluded.update(row['repo'].lower() for row in rows)

    add(data['prior']['selected'])
    for partition in ('development', 'reserved_confirmation'):
        for language in ('Python', 'Java'):
            add(data['dev_a_r1']['cohorts'][partition][language])
    add(data['dev_a_r2']['development'])
    add(data['dev_a_r2']['attempts'])
    add(data['dev_b_r1']['selected'])
    add(data['dev_b_r2']['development'])
    add(data['dev_b_r2']['attempts'])
    add(data['confirm']['records'])
    add([json.loads(path.read_bytes()) for path in attempt_paths])
    need(len(excluded) == cohort['excluded_repositories'] == 134, 'exclusion-count-drift')
    selected = cohort['selected']
    need(len(selected) == len(r13['rows']) == 24, 'denominator-drift')
    selected_repos = {row['repo'].lower() for row in selected}
    need(len(selected_repos) == 24 and not selected_repos.intersection(excluded),
         'selected-overlap')
    excluded.update(selected_repos)
    failed = {'Python': [], 'Java': []}
    for case, receipt in zip(selected, r13['rows']):
        need(case['ordinal'] == receipt['ordinal'] and case['repo'] == receipt['repo'],
             'r13-case-identity')
        if not receipt['admitted']:
            failed[case['language']].append(case['ordinal'])
    need(len(failed['Python']) == 5 and len(failed['Java']) == 8,
         'failed-slot-drift')
    queues = {}
    for language in ('Python', 'Java'):
        floor = cohort['screened_source_positions'][language]
        seen = set(excluded)
        queue = []
        for position, candidate in enumerate(data['order']['ordered'][language], 1):
            if position <= floor:
                continue
            row = by_tag.get(candidate['image_tag'])
            need(row is not None and row['repo'] == candidate['repo'] and
                 row['lang'] == language and
                 row['failed_job']['job_id'] == candidate['failure_job_id'] and
                 row['failed_job']['trigger_sha'] == candidate['failure_commit'],
                 f'order-identity:{language}:{position}')
            repo = candidate['repo'].lower()
            if repo in seen or not rule.eligible(row):
                continue
            queue.append({'queue_index': len(queue) + 1,
                          'source_order_position': position, **candidate})
            seen.add(repo)
        queues[language] = queue
    result = {'schema_version': 'are.g01-fresh-r14-repair-queue/v1',
              'status': 'source-only-score-blind-queue-sealed',
              'input_sha256': {**PINS, **cohort['input_sha256']},
              'builder_sha256': sha(Path(__file__).read_bytes()),
              'original_24': selected,
              'retained_ordinals': [row['ordinal'] for row in r13['rows'] if row['admitted']],
              'failed_ordinals_by_language': failed,
              'source_order_floor': cohort['screened_source_positions'],
              'excluded_repositories': len(excluded),
              'queues': queues, 'gold_opened': False, 'model_calls': 0,
              'claim_ceiling': 'Source-only replacement queue; no admission, ranking, score, or superiority.'}
    ROOT.mkdir(parents=True, mode=0o700)
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'failed_slots': failed,
                      'queue_lengths': {k: len(v) for k, v in queues.items()},
                      'excluded_repositories': len(excluded),
                      'queue_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
