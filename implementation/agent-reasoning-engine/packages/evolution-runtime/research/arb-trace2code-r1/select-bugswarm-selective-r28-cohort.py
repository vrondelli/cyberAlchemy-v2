#!/usr/bin/env python3
"""Select a repository-disjoint G01 selective-GLM transfer census."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path


HERE = Path(__file__).resolve().parent
BASE = Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004')
OUTPUT = BASE / 'selective-r28/METADATA-CENSUS.json'
PROTOCOL = HERE.parents[1] / 'evidence/G01-BUGSWARM-SELECTIVE-R28-COHORT-PROTOCOL-2026-10-04.md'
OLD_ATTEMPT_DIR = BASE / 'graph-confirm-r1/source-only/g01-bugswarm-graph-confirm-r2-repair'
R14_ATTEMPT_DIR = BASE / 'fresh-r11/repair-r14/run'
PINS = {
    'raw': 'c952d8f7080e798cc66d903906d645c6dfc21f88789b1977e0d3e2d0f7c2192d',
    'order': '63783b5ead385c94234faed3551ee1d08866fa564d2edc301575c78b682ca91c',
    'prior': 'fc099fb28ec789d23ff0dd19ba3bc560e81ae1335d57d3da659f202b4f7a259d',
    'dev_a_r1': '6630be1c012aa027f3b525ffa3b1382e7f5ab751b84c8547eb9c679a16d68a85',
    'dev_a_r2': 'c8fd7c57f75243cf613cfd22c23ec7c025582981d9d7ec4115c4a3efb0f43332',
    'dev_b_r1': 'd3f1dbef2443752290cfe917f75d15a229f4a176d2708c2764fcf7886df25b92',
    'dev_b_r2': '53df9fa74a732090fa23c65373b0f656cf73b0b9a92a6e1c81ca534b97bb16b8',
    'confirm': '3eea3878d6769be39a88c98473cfc7eb0c019e4e33f82b665b7b18271dda4e4a',
    'old_attempts': 'b9822c54c62c86a82edcb14fb164a418f0ec74ab92e1376a5fcd04d21260b8a0',
    'eligibility_rule': 'ac7f77088a4256285b0d733c666ab45e161e2fbd364cb0a3bb3c9b14bec3422e',
    'fresh_r11_selector': '2369939272dee89b3af4425952da70e3fe43a279a1eefe38234e9ba2cce5efb0',
    'fresh_r11': '67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd',
    'r14_attempts': '59a1f8c65fd023b194ce43558ab8ebe38915da95864410018f874891f319d56b',
    'r14_result': '2f266bba198a1a72f2fdf55418c0ad284cb02a06f8e262f0dcd6d5a21e4ebcc1',
    'r14_audit': '7ffa068558092b0be67c997f86266806a34199ea0710c5bae562609e32008696',
    'protocol': '8d170a7177e10ef184c0f0b240898bf84a81fdac6466840e9a23e30b3aa777c9',
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
        'fresh_r11_selector': HERE / 'select-bugswarm-fresh-r11-cohort.py',
        'fresh_r11': BASE / 'fresh-r11/METADATA-COHORT.json',
        'r14_result': R14_ATTEMPT_DIR / 'RESULT.json',
        'r14_audit': BASE / 'fresh-r11/repair-r14/AUDIT.json',
        'protocol': PROTOCOL,
    }
    need(not OUTPUT.exists(), 'output-exists')
    for name, path in paths.items():
        need(sha(path.read_bytes()) == PINS[name], f'input-pin-drift:{name}')

    old_attempt_paths = sorted(OLD_ATTEMPT_DIR.glob('ATTEMPT-*.json'))
    r14_attempt_paths = sorted(R14_ATTEMPT_DIR.glob('*-ATTEMPT.json'))
    need(len(old_attempt_paths) == 35, 'old-attempt-count-drift')
    need(len(r14_attempt_paths) == 22, 'r14-attempt-count-drift')
    need(manifest_digest(old_attempt_paths) == PINS['old_attempts'],
         'old-attempt-manifest-drift')
    need(manifest_digest(r14_attempt_paths) == PINS['r14_attempts'],
         'r14-attempt-manifest-drift')

    spec = importlib.util.spec_from_file_location(
        'g01_r28_eligibility', paths['eligibility_rule'])
    need(spec is not None and spec.loader is not None, 'eligibility-unavailable')
    rule = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rule)

    data = {
        name: json.loads(path.read_bytes())
        for name, path in paths.items()
        if name not in ('eligibility_rule', 'fresh_r11_selector', 'protocol')
    }
    raw = data['raw']
    by_tag = {row['image_tag']: row for row in raw}
    need(len(raw) == len(by_tag) == 4388, 'raw-population-drift')
    need(data['fresh_r11']['selected_repositories'] == 24 and
         len(data['fresh_r11']['selected']) == 24 and
         data['fresh_r11']['gold_opened'] is False and
         data['fresh_r11']['model_calls'] == 0,
         'fresh-r11-lineage-drift')
    need(data['r14_result']['replacement_attempts'] == 22 and
         data['r14_result']['filled_slots'] == 24 and
         data['r14_result']['gold_opened'] is False and
         data['r14_result']['model_calls'] == 0,
         'r14-result-lineage-drift')
    need(data['r14_audit']['attempts'] == 22 and
         data['r14_audit']['slots'] == 24 and
         data['r14_audit']['gold_opened'] is False and
         data['r14_audit']['model_calls'] == 0,
         'r14-audit-lineage-drift')

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
            add(f'dev_a_r1_{cohort}_{language}',
                data['dev_a_r1']['cohorts'][cohort][language])
    add('dev_a_r2_development', data['dev_a_r2']['development'])
    add('dev_a_r2_attempts', data['dev_a_r2']['attempts'])
    add('dev_b_r1', data['dev_b_r1']['selected'])
    add('dev_b_r2_development', data['dev_b_r2']['development'])
    add('dev_b_r2_attempts', data['dev_b_r2']['attempts'])
    add('r8_r10_confirm', data['confirm']['records'])
    add('r2_repair_attempts',
        [json.loads(path.read_bytes()) for path in old_attempt_paths])
    prior_excluded = len(excluded)
    need(prior_excluded == data['fresh_r11']['excluded_repositories'] == 134,
         'fresh-r11-exclusion-replay-drift')
    add('fresh_r11_selected', data['fresh_r11']['selected'])
    add('fresh_r14_repair_attempts',
        [json.loads(path.read_bytes()) for path in r14_attempt_paths])

    selected: list[dict] = []
    screened: dict[str, int] = {}
    selected_repos: set[str] = set()
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
            selected.append({
                'ordinal': len(selected) + 1,
                'language_ordinal': chosen + 1,
                'source_order_position': position,
                **candidate,
            })
            selected_repos.add(repo)
            chosen += 1
            if chosen == 12:
                screened[language] = position
                break
        need(chosen == 12, f'insufficient-disjoint-candidates:{language}')

    need(len(selected) == len(selected_repos) == 24 and
         not selected_repos.intersection(excluded),
         'cohort-overlap-or-denominator-drift')
    result = {
        'schema_version': 'are.g01-bugswarm-selective-r28-metadata-census/v1',
        'status': 'metadata-census-only-not-source-log-label-or-model-admitted',
        'input_sha256': PINS,
        'script_sha256': sha(Path(__file__).read_bytes()),
        'rule': (
            'First 12 eligible Python and first 12 eligible Java distinct '
            'repositories in pinned failure-side source order after all prior '
            'selected and attempted repository exclusions; no scores or labels'
        ),
        'selected': selected,
        'selected_repositories': 24,
        'prior_excluded_repositories': prior_excluded,
        'excluded_repositories': len(excluded),
        'exclusion_source_counts': counts,
        'screened_source_positions': screened,
        'gold_opened': False,
        'logs_opened': False,
        'network_calls': 0,
        'model_calls': 0,
        'claim_ceiling': (
            'Untouched metadata census only; no source/log admission, benchmark '
            'score, selective-routing result, or superiority claim.'
        ),
    }
    OUTPUT.parent.mkdir(parents=True, mode=0o700, exist_ok=True)
    encoded = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(encoded)
    print(json.dumps({
        'selected': 24,
        'excluded_repositories': len(excluded),
        'screened_source_positions': screened,
        'cohort_sha256': sha(encoded),
    }, sort_keys=True))


if __name__ == '__main__':
    main()
