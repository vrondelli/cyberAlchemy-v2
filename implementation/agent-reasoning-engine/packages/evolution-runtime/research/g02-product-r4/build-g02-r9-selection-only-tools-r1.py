#!/usr/bin/env python3
"""Bind r9 caches and the exposed selection-only DSH protocol."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-selection-only-dev-tools-r1'
OUTPUT = BASE / 'g02-r9-selection-only-tools-r1'
ROOT = BASE / 'g02-r9-source-successor-r1'
SOURCE_SHA = {
    'SELECTION-ONLY-DEV-TOOLS.json': 'e501ab831365dd4bc3e090462f5cb0f1c8a5aa9e1e4b336c81b4c8905af96c9f',
    'prepare-prospective.mjs': 'cc982102b3e3f12de682e57eeff4f99ea5bce6f69a8ee873c4bc446103b5ebd7',
    'project-g02-r4-selected-pruning-r1.py': '5f283e3be3c2d63d2f6463c2821da441cf4f713d7f1024fb441d962d33bf6fb0',
    'product-replication-gitconfig': '38884b748e74f09c4d9a78c26d19b911ab02a62c4276b38be822767a94faaf37',
    'run_dsh_control.py': 'caf6b643fd62e477d3216fcd05ff65e3dd59b9673fa9aae873a6737e4fa5402d',
}
CANDIDATE_SHA = '87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10'
CACHE_SHA = '89591dbec004a998ce5252d674bc2e146a570eed7f7413d8ca71e20c0a3f7104'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(content, before, after):
    if content.count(before) != 1:
        raise ValueError('g02-r9-selection-only.replacement-shape:' + before[:30])
    return content.replace(before, after)


def main():
    if OUTPUT.exists() or any(sha(SOURCE / name) != digest
                              for name, digest in SOURCE_SHA.items()) or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != CACHE_SHA:
        raise ValueError('g02-r9-selection-only.input-or-output-drift')
    candidate = json.loads((ROOT / 'CANDIDATE.json').read_text())
    hydration = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())
    rows = hydration['results']
    if len(candidate['ordered_tasks']) != len(rows) or len(rows) != 24 or \
            len({r['cache_leaf'] for r in rows}) != 24:
        raise ValueError('g02-r9-selection-only.cohort-shape')
    for task, row in zip(candidate['ordered_tasks'], rows):
        if task['ordinal'] != row['ordinal'] or task['base_commit'] != row['base_commit']:
            raise ValueError('g02-r9-selection-only.cache-binding')
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
        raise ValueError('g02-r9-selection-only.gitconfig-shape')
    new_config = old_config[:begin] + ''.join(
        ' directory = /cache/' + row['cache_leaf'] + '\n' for row in rows)
    (OUTPUT / config).write_text(new_config)
    payload = {
        'schema_version': 'are.g02-r9-selection-only-tools/v1',
        'posture': 'prospective-candidate-after-exposed-comparator-diagnostic',
        'predecessor_sha256': SOURCE_SHA,
        'candidate_sha256': CANDIDATE_SHA,
        'task_cache_hydration_sha256': CACHE_SHA,
        'builder_sha256': sha(__file__),
        'changed_files': {name: {'old_sha256': SOURCE_SHA[name],
                                 'new_sha256': sha(OUTPUT / name)}
                          for name in (prepare, projector, config)},
        'dsh_runner_sha256': SOURCE_SHA['run_dsh_control.py'],
        'git_safe_directories': ['/cache/' + row['cache_leaf'] for row in rows],
        'comparator_protocol_change_from_r8': 'Read/search-only source selection; no patch attempt or edit calls.',
        'unchanged': '1M DSH episode and request budgets, 16K output cap, model/transport, 64 MiB ARE index, r2-trained deletion-only policy, native scorer.',
        'claim_ceiling': 'Prospective r9 adapter candidate only; no campaign freeze, score, or superiority.',
        'open_questions': ['Will r9 source, non-root, and no-model preflights pass 24/24?',
                           'Will all paired DSH selection-only episodes finish without edits?'],
    }
    manifest = OUTPUT / 'SELECTION-ONLY-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(manifest),
                      'safe_directories': len(rows),
                      'dsh_runner_sha256': SOURCE_SHA['run_dsh_control.py']}))


if __name__ == '__main__':
    main()
