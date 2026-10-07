#!/usr/bin/env python3
"""Bind r9 source caches and prospective 2M DSH cap after exposed qualification."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-dsh2m-dev-tools-r1'
OUTPUT = BASE / 'g02-r9-mixed-source-tools-r1'
ROOT = BASE / 'g02-r9-source-successor-r1'
SOURCE_SHA = {
    'DSH2M-DEV-TOOLS.json': '472d5ac9579e708aadff2e3fdc883a40d706e7645b82227d2769e60e5b59bb83',
    'MIXED-SOURCE-TOOLS.json': 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa',
    'prepare-prospective.mjs': 'cc982102b3e3f12de682e57eeff4f99ea5bce6f69a8ee873c4bc446103b5ebd7',
    'project-g02-r4-selected-pruning-r1.py': '5f283e3be3c2d63d2f6463c2821da441cf4f713d7f1024fb441d962d33bf6fb0',
    'product-replication-gitconfig': '38884b748e74f09c4d9a78c26d19b911ab02a62c4276b38be822767a94faaf37',
    'run_dsh_control.py': 'e8294c041f42c37bc21433ccc0f556a5c2394541b87341c79a28f00e797aed79',
}
CANDIDATE_SHA = '87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10'
CACHE_SHA = '89591dbec004a998ce5252d674bc2e146a570eed7f7413d8ca71e20c0a3f7104'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(content, before, after):
    if content.count(before) != 1:
        raise ValueError('g02-r9-tools.replacement-shape:' + before[:30])
    return content.replace(before, after)


def main():
    if OUTPUT.exists() or any(sha(SOURCE / name) != digest
                              for name, digest in SOURCE_SHA.items()) or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != CACHE_SHA:
        raise ValueError('g02-r9-tools.input-or-output-drift')
    candidate = json.loads((ROOT / 'CANDIDATE.json').read_text())
    hydration = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())
    rows = hydration['results']
    if len(candidate['ordered_tasks']) != len(rows) or len(rows) != 24 or \
            len({r['cache_leaf'] for r in rows}) != 24:
        raise ValueError('g02-r9-tools.cohort-shape')
    for task, row in zip(candidate['ordered_tasks'], rows):
        if task['ordinal'] != row['ordinal'] or task['base_commit'] != row['base_commit']:
            raise ValueError('g02-r9-tools.cache-binding')
    shutil.copytree(SOURCE, OUTPUT)
    prepare = 'prepare-prospective.mjs'
    projector = 'project-g02-r4-selected-pruning-r1.py'
    config = 'product-replication-gitconfig'
    (OUTPUT / prepare).write_text(once((SOURCE / prepare).read_text(),
        "const cacheBase='/tmp/are-g02-r8-source-caches-r1';",
        "const cacheBase='/tmp/are-g02-r9-source-caches-r1';"))
    (OUTPUT / projector).write_text(once((SOURCE / projector).read_text(),
        "root.name.startswith('g02-cross-layer-pr8-mixed-')",
        "root.name.startswith('g02-cross-layer-pr9-mixed-')"))
    old_config = (SOURCE / config).read_text()
    begin = old_config.find(' directory = /cache/ansible-cd64e0b0\n')
    if begin < 0 or old_config[begin:].count(' directory = /cache/') != 24:
        raise ValueError('g02-r9-tools.gitconfig-shape')
    new_config = old_config[:begin] + ''.join(
        ' directory = /cache/' + row['cache_leaf'] + '\n' for row in rows)
    (OUTPUT / config).write_text(new_config)
    payload = {'schema_version': 'are.g02-r9-mixed-source-tools/v1',
               'posture': 'candidate-after-exposed-DSH-2M-qualification',
               'predecessor_sha256': SOURCE_SHA,
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': CACHE_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {name: {'old_sha256': SOURCE_SHA[name],
                                        'new_sha256': sha(OUTPUT / name)}
                                 for name in (prepare, projector, config)},
               'dsh_runner_sha256': SOURCE_SHA['run_dsh_control.py'],
               'git_safe_directories': ['/cache/' + row['cache_leaf'] for row in rows],
               'changed_comparator_setting_from_r8': {'dsh_total_episode_token_budget': [1000000, 2000000]},
               'unchanged': '64 MiB ARE source index, r2-trained deletion-only policy, DSH 1M request context, DSH 16K output cap, model, transport and native scorer.',
               'claim_ceiling': 'Prospective r9 source adapter only; no campaign freeze, score or superiority.',
               'open_questions': ['Will the exposed 2M comparator finish?',
                                  'Will exact r9 non-root cache and full arms pass?']}
    manifest = OUTPUT / 'MIXED-SOURCE-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(manifest),
                      'safe_directories': len(rows),
                      'dsh_runner_sha256': SOURCE_SHA['run_dsh_control.py']}))


if __name__ == '__main__':
    main()
