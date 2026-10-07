#!/usr/bin/env python3
"""Bind r8 exact caches and Git trust without changing G02 selection policy."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r7-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r8-mixed-source-tools-r1'
ROOT = BASE / 'g02-r8-screening-pool-r1'
SOURCE_SHA = {
    'MIXED-SOURCE-TOOLS.json': 'ebd522264e431e8b68016ca22607c059dc9e7d188d06ca043c0f52963b2d5973',
    'prepare-prospective.mjs': '78d8feae60d8b213166c0861f85d1f736ac54dd2fbc1e72f9c35739262ba8ac0',
    'project-g02-r4-selected-pruning-r1.py': '52efd5e04f70a9905257af3b5fb4d9afd9a79e1c111edd7137d3b1b303cf56a7',
    'product-replication-gitconfig': '8cb8fd0057dc7e9b9901da99a225bcfbdfa374a39bb90cd23d9e33627dedd83a',
}
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
CACHE_SHA = '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(content, before, after):
    if content.count(before) != 1:
        raise ValueError('g02-r8-tools.replacement-shape:' + before[:30])
    return content.replace(before, after)


def main():
    if OUTPUT.exists() or any(sha(SOURCE / name) != digest
                              for name, digest in SOURCE_SHA.items()) or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != CACHE_SHA:
        raise ValueError('g02-r8-tools.input-or-output-drift')
    candidate = json.loads((ROOT / 'CANDIDATE.json').read_text())
    hydration = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())
    leaves = [row['cache_leaf'] for row in hydration['results']]
    if len(candidate['ordered_tasks']) != 24 or len(leaves) != 24 or \
            len(set(leaves)) != 24:
        raise ValueError('g02-r8-tools.cohort-shape')
    for task, row in zip(candidate['ordered_tasks'], hydration['results']):
        if task['ordinal'] != row['ordinal'] or task['base_commit'] != row['base_commit']:
            raise ValueError('g02-r8-tools.cache-binding')
    shutil.copytree(SOURCE, OUTPUT)
    prepare = 'prepare-prospective.mjs'
    projector = 'project-g02-r4-selected-pruning-r1.py'
    gitconfig = 'product-replication-gitconfig'
    (OUTPUT / prepare).write_text(once((SOURCE / prepare).read_text(),
        "const cacheBase='/tmp/are-g02-r7-source-caches-r1';",
        "const cacheBase='/tmp/are-g02-r8-source-caches-r1';"))
    (OUTPUT / projector).write_text(once((SOURCE / projector).read_text(),
        "root.name.startswith('g02-cross-layer-pr7-mixed-')",
        "root.name.startswith('g02-cross-layer-pr8-mixed-')"))
    trust = (SOURCE / gitconfig).read_text()
    if not trust.endswith('\n'):
        raise ValueError('g02-r8-tools.gitconfig-shape')
    trust += ''.join(' directory = /cache/' + leaf + '\n' for leaf in leaves)
    (OUTPUT / gitconfig).write_text(trust)
    payload = {'schema_version': 'are.g02-r8-mixed-source-tools/v1',
               'posture': 'pre-dispatch-infrastructure-repair-no-model-policy-change',
               'predecessor_manifest_sha256': SOURCE_SHA['MIXED-SOURCE-TOOLS.json'],
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': CACHE_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {name: {'old_sha256': SOURCE_SHA[name],
                                        'new_sha256': sha(OUTPUT / name)}
                                 for name in (prepare, projector, gitconfig)},
               'git_safe_directories': ['/cache/' + leaf for leaf in leaves],
               'unchanged_policy': 'Fixed 64 MiB source index, r2-trained deletion-only projector, 16K-output DSH, model and native scorer unchanged.',
               'repair': 'Bind selected r8 cache root, fresh pair-root prefix, and exact non-root Git safe.directory entries; no wildcard trust.',
               'claim_ceiling': 'Infrastructure adapter only; no model, score or superiority.',
               'open_questions': ['Will UID 65532 read all exact cache leaves in the pinned image?',
                                  'Will no-model prepares and complete arms settle?']}
    manifest = OUTPUT / 'MIXED-SOURCE-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(manifest),
                      'trust_entries': len(leaves),
                      'prepare_sha256': sha(OUTPUT / prepare),
                      'projector_sha256': sha(OUTPUT / projector),
                      'gitconfig_sha256': sha(OUTPUT / gitconfig)}))


if __name__ == '__main__':
    main()
