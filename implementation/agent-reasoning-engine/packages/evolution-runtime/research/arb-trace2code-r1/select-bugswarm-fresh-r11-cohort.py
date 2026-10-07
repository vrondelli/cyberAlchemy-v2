#!/usr/bin/env python3
"""Select a new G01 metadata cohort without logs, labels, rankings, or scores."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
OUTPUT = BASE / 'fresh-r11/METADATA-COHORT.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-FRESH-R11-COHORT-PROTOCOL-2026-10-04.md'
ATTEMPT_DIR = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
PINS = {
    'raw': 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
    'order': '63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c',
    'prior': 'fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d',
    'dev_a_r1': '6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85',
    'dev_a_r2': 'c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332',
    'dev_b_r1': 'd3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92',
    'dev_b_r2': '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8',
    'confirm': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'attempts': 'b9822c54c62c86a82edcb14fb164a418f0ec74ab92e1376a5fcd04d21260b8a0',
    'eligibility_rule': 'ac7f77088a4256285b0d733c666ab45e161e2fbd364cb0a3bb3c9b14bec3422e',
    'protocol': '291eb8c6e707f78d1648f852b79ed6fb21d1b5769ebc2a37a353d61fb352a367',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def need(ok: bool, reason: str) -> None:
    if not ok:
        raise SystemExit(reason)


def main() -> None:
    paths = {
        'raw': BASE / '1.3.1-bugswarm.json',
        'order': BASE / 'source-only-r1/ORDERED-CANDIDATES.json',
        'prior': BASE / 'METADATA-CANDIDATE-24-R1.json',
        'dev_a_r1': BASE / 'graph-dev-r1/METADATA-COHORTS-R1.json',
        'dev_a_r2': BASE / 'graph-dev-r2/DEV-METADATA-R2.json',
        'dev_b_r1': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R1.json',
        'dev_b_r2': BASE / 'graph-dev-b-r1/METADATA-COHORT-B-R2.json',
        'confirm': BASE / 'graph-confirm-r4/code-only/RESULT.json',
        'eligibility_rule': HERE / 'select-bugswarm-graph-dev-r1.py',
        'protocol': PROTOCOL,
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')
    attempt_paths = sorted(ATTEMPT_DIR.glob('ATTEMPT-*.json'))
    need(len(attempt_paths) == 35, 'attempt-count-drift')
    manifest = ''.join(f'{sha(path.read_bytes())}  {path.name}\n' for path in attempt_paths).encode()
    need(sha(manifest) == PINS['attempts'], 'attempt-manifest-drift')
    spec = importlib.util.spec_from_file_location('g01_r11_eligibility', paths['eligibility_rule'])
    need(spec is not None and spec.loader is not None, 'eligibility-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)
    data = {name: json.loads(path.read_bytes()) for name, path in paths.items()
            if name not in ('eligibility_rule', 'protocol')}
    raw = data['raw']
    by_tag = {row['image_tag']: row for row in raw}
    need(len(raw) == len(by_tag) == 4388, 'raw-population-drift')
    excluded: set[str] = set()
    counts: dict[str, int] = {}

    def add(name: str, rows: list[dict]) -> None:
        repos = {row['repo'].lower() for row in rows}
        need(all('/' in repo for repo in repos), f'repo-shape:{name}')
        excluded.update(repos)
        counts[name] = len(repos)

    add('prior', data['prior']['selected'])
    for cohort in ('development', 'reserved_confirmation'):
        for language in ('Python', 'Java'):
            add(f'dev_a_r1_{cohort}_{language}', data['dev_a_r1']['cohorts'][cohort][language])
    add('dev_a_r2_development', data['dev_a_r2']['development'])
    add('dev_a_r2_attempts', data['dev_a_r2']['attempts'])
    add('dev_b_r1', data['dev_b_r1']['selected'])
    add('dev_b_r2_development', data['dev_b_r2']['development'])
    add('dev_b_r2_attempts', data['dev_b_r2']['attempts'])
    add('r8_r10_confirm', data['confirm']['records'])
    add('r2_repair_attempts', [json.loads(path.read_bytes()) for path in attempt_paths])
    selected, screened, selected_repos = [], {}, set()
    for language in ('Python', 'Java'):
        chosen = 0
        for position, candidate in enumerate(data['order']['ordered'][language], 1):
            row = by_tag.get(candidate['image_tag'])
            need(row is not None and row['repo'] == candidate['repo'] and
                 row['lang'] == language and
                 row['failed_job']['job_id'] == candidate['failure_job_id'] and
                 row['failed_job']['trigger_sha'] == candidate['failure_commit'],
                 f'order-identity:{language}:{position}')
            repo = candidate['repo'].lower()
            if repo in excluded or repo in selected_repos or not rule.eligible(row):
                continue
            selected.append({'ordinal': len(selected) + 1,
                             'language_ordinal': chosen + 1,
                             'source_order_position': position, **candidate})
            selected_repos.add(repo)
            chosen += 1
            if chosen == 12:
                screened[language] = position
                break
        need(chosen == 12, f'insufficient-disjoint-candidates:{language}')
    need(len(selected) == len(selected_repos) == 24 and
         not selected_repos.intersection(excluded), 'cohort-overlap-or-denominator-drift')
    result = {'schema_version': 'are.g01-bugswarm-fresh-r11-metadata-cohort/v1',
              'status': 'metadata-candidates-only-not-source-log-or-label-admitted',
              'input_sha256': PINS, 'script_sha256': sha(Path(__file__).read_bytes()),
              'rule': 'First 12 eligible Python and first 12 eligible Java distinct repositories in prior failure-side source order after all selected/attempted exclusions; no scores or labels',
              'selected': selected, 'selected_repositories': 24,
              'excluded_repositories': len(excluded),
              'exclusion_source_counts': counts,
              'screened_source_positions': screened,
              'gold_opened': False, 'logs_opened': False, 'model_calls': 0,
              'claim_ceiling': 'Metadata selection only; no benchmark score or superiority claim.'}
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=True)
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({'selected': 24, 'excluded_repositories': len(excluded),
                      'screened_source_positions': screened,
                      'cohort_sha256': sha(encoded)}))


if __name__ == '__main__':
    main()
