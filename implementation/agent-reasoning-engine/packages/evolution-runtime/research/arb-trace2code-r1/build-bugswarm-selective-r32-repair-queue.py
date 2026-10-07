#!/usr/bin/env python3
"""Seal score-blind source-order replacements for nine unresolved r28 slots."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
ROOT = BASE / 'selective-r28/repair-r32'
OUTPUT = ROOT / 'QUEUE.json'
COHORT = BASE / 'selective-r28/METADATA-CENSUS.json'
R29 = BASE / 'selective-r28/preflight-r29/RESULT.json'
R31 = BASE / 'selective-r28/alternate-client-r31/RESULT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R32-REPAIR-QUEUE-PROTOCOL-2026-10-04.md'
OLD_ATTEMPT_DIR = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
R14_ATTEMPT_DIR = BASE / 'fresh-r11/repair-r14/run'
PINS = {
    'cohort': 'f4aead7a1201f114fe89d6da36226c4aeab5f4712f6114d1165632f9b2f2258a',
    'r29': 'f3d63d9c43467d0e8ba13055e5207206269a6be17978cdd8da58018154460017',
    'r31': '6238f34ef6698dcce62874d19f1177e55e6b8c33f114b154893606fc45d1dbb0',
    'protocol': '1000325ec2ad84dbe9435d49761e4442457578e906b688353e9d2e9ef8cbea4d',
    'eligibility_rule': 'ac7f77088a4256285b0d733c666ab45e161e2fbd364cb0a3bb3c9b14bec3422e',
}
INPUTS = {
    'raw': BASE / '1.3.1-bugswarm.json',
    'order': BASE / 'source-only-r1/ORDERED-CANDIDATES.json',
    'prior': BASE / 'METADATA-CANDIDATE-24-R1.json',
    'dev_a_r1': BASE / 'graph-dev-r1/METADATA-COHORTS-R1.json',
    'dev_a_r2': BASE / 'graph-dev-r2/DEV-METADATA-R2.json',
    'dev_b_r1': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R1.json',
    'dev_b_r2': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json',
    'confirm': BASE / 'graph-confirm-r4/code-only/RESULT.json',
    'fresh_r11': BASE / 'fresh-r11/METADATA-COHORT.json',
    'r14_result': R14_ATTEMPT_DIR / 'RESULT.json',
    'r14_audit': BASE / 'fresh-r11/repair-r14/AUDIT.json',
    'eligibility_rule': HERE / 'select-bugswarm-graph-dev-r1.py',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def manifest_digest(paths: list[Path]) -> str:
    manifest = ''.join(
        f'{sha(path.read_bytes())}  {path.name}\n' for path in paths
    ).encode()
    return sha(manifest)


def main() -> None:
    need(not ROOT.exists(), 'output-exists')
    for name, path in (('cohort', COHORT), ('r29', R29), ('r31', R31),
                       ('protocol', PROTOCOL),
                       ('eligibility_rule', INPUTS['eligibility_rule'])):
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    cohort = json.loads(COHORT.read_bytes())
    r29 = json.loads(R29.read_bytes())
    r31 = json.loads(R31.read_bytes())
    for name, path in INPUTS.items():
        if name == 'eligibility_rule':
            continue
        need(sha(path.read_bytes()) == cohort['input_sha256'][name],
             f'exclusion-input-pin-drift:{name}')

    old_attempt_paths = sorted(OLD_ATTEMPT_DIR.glob('ATTEMPT-*.json'))
    r14_attempt_paths = sorted(R14_ATTEMPT_DIR.glob('*-ATTEMPT.json'))
    need(len(old_attempt_paths) == 35 and len(r14_attempt_paths) == 22,
         'attempt-count-drift')
    need(manifest_digest(old_attempt_paths) == cohort['input_sha256']['old_attempts'],
         'old-attempt-manifest-drift')
    need(manifest_digest(r14_attempt_paths) == cohort['input_sha256']['r14_attempts'],
         'r14-attempt-manifest-drift')

    data = {
        name: json.loads(path.read_bytes())
        for name, path in INPUTS.items()
        if name != 'eligibility_rule'
    }
    spec = importlib.util.spec_from_file_location(
        'g01_r32_eligibility', INPUTS['eligibility_rule'])
    need(spec is not None and spec.loader is not None, 'eligibility-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    raw = data['raw']
    by_tag = {row['image_tag']: row for row in raw}
    need(len(raw) == len(by_tag) == 4388, 'raw-population-drift')

    excluded: set[str] = set()

    def add(rows: list[dict]) -> None:
        repos = {row['repo'].lower() for row in rows}
        need(all('/' in repo for repo in repos), 'repo-shape')
        excluded.update(repos)

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
    add([json.loads(path.read_bytes()) for path in old_attempt_paths])
    add(data['fresh_r11']['selected'])
    add([json.loads(path.read_bytes()) for path in r14_attempt_paths])
    need(len(excluded) == cohort['excluded_repositories'] == 180,
         'r28-exclusion-replay-drift')
    selected = cohort['selected']
    selected_repos = {row['repo'].lower() for row in selected}
    need(len(selected) == len(selected_repos) == 24 and
         not selected_repos.intersection(excluded), 'r28-selected-overlap')
    excluded.update(selected_repos)
    need(len(excluded) == 204, 'replacement-exclusion-count-drift')

    admitted = {row['ordinal'] for row in r29['rows'] if row['admitted']}
    repaired = {row['ordinal'] for row in r31['rows'] if row['repaired']}
    retained = admitted | repaired
    need(len(admitted) == 14 and repaired == {10} and len(retained) == 15,
         'retained-slot-drift')
    failed = {'Python': [], 'Java': []}
    for case in selected:
        if case['ordinal'] not in retained:
            failed[case['language']].append(case['ordinal'])
    need(failed == {'Python': [5, 6, 7, 12],
                    'Java': [15, 18, 19, 21, 22]},
         'failed-slot-drift')

    queues: dict[str, list[dict]] = {}
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
            queue.append({
                'queue_index': len(queue) + 1,
                'source_order_position': position,
                **candidate,
            })
            seen.add(repo)
        queues[language] = queue

    sufficient = all(
        len(queues[language]) >= len(failed[language])
        for language in ('Python', 'Java')
    )
    result = {
        'schema_version': 'are.g01-selective-r32-repair-queue/v1',
        'status': ('source-only-score-blind-queue-sealed' if sufficient else
                   'terminal-metadata-shortage'),
        'input_sha256': {**PINS, **cohort['input_sha256']},
        'builder_sha256': sha(Path(__file__).read_bytes()),
        'original_24': selected,
        'retained_ordinals': sorted(retained),
        'failed_ordinals_by_language': failed,
        'source_order_floor': cohort['screened_source_positions'],
        'excluded_repositories': len(excluded),
        'queues': queues,
        'gold_opened': False,
        'logs_opened': False,
        'network_calls': 0,
        'model_calls': 0,
        'claim_ceiling': (
            'Source-only replacement queue; no availability admission, '
            'ranking, score, efficiency, or superiority result.'
        ),
    }
    ROOT.mkdir(parents=True, mode=0o700)
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({
        'status': result['status'],
        'failed_slots': failed,
        'queue_lengths': {key: len(value) for key, value in queues.items()},
        'excluded_repositories': len(excluded),
        'queue_sha256': sha(encoded),
    }, sort_keys=True))
    if not sufficient:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
