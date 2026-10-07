#!/usr/bin/env python3
"""Bind each mixed-source task to its offline-tested shallow cache."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-mixed-source-tools-r2'
OUTPUT = BASE / 'g02-r6-mixed-source-tools-r3'
MANIFEST_SHA = 'e26e242c2f41a730d7f97ce0d686cadeaf8553b41577b0d854c63da290fd3f97'
PREPARE_SHA = 'db7b4d1f565712942a0622f4240139e361714840658cce90cffd0ea8d1102350'
HYDRATION_SHA = 'c86f1e1acd337766719e26a36b8dd2d5a3152dcd8eae3f40a59fb1df16ad9f73'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('g02-r6-mixed-tools-r3.replacement-shape:' + before[:50])
    return source.replace(before, after)


def main():
    hydration = BASE / 'g02-r6-mixed-source-candidate-r1/TASK-CACHE-HYDRATION-R2.json'
    path = SOURCE / 'prepare-prospective.mjs'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS-R2.json') != MANIFEST_SHA or \
            sha(path) != PREPARE_SHA or sha(hydration) != HYDRATION_SHA:
        raise ValueError('g02-r6-mixed-tools-r3.input-or-output-drift')
    rows = json.loads(hydration.read_text())['results']
    if len(rows) != 12 or not all(row['offline_container_checkout'] for row in rows):
        raise ValueError('g02-r6-mixed-tools-r3.cache-evidence-shape')
    source = path.read_text()
    derived = once(source,
        "const cacheBase=['django/django','sveltejs/svelte'].includes(repository)?",
        "const cacheLeaf=['django/django','sveltejs/svelte'].includes(repository)?\n"
        "  cacheName+'-'+task.base_commit.slice(0,8):cacheName;\n"
        "const cacheBase=['django/django','sveltejs/svelte'].includes(repository)?")
    derived = once(derived, "const cache=cacheBase+'/cache/'+cacheName;",
                   "const cache=cacheBase+'/cache/'+cacheLeaf;")
    derived = once(derived, "  cache:cacheName,cache_base:cacheBase,",
                   "  cache:cacheLeaf,cache_base:cacheBase,")
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'prepare-prospective.mjs').write_text(derived)
    payload = {'schema_version': 'are.g02-r6-mixed-source-tools/v3',
               'posture': 'source-only-adapter-not-campaign-freeze',
               'predecessor_manifest_sha256': MANIFEST_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {'prepare-prospective.mjs': {'old_sha256': PREPARE_SHA,
                    'new_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
                    'semantic_delta': 'Bind Verified/Multi rows to per-task shallow offline-tested caches; Pro cache binding unchanged.'}},
               'unchanged_policy': 'No ranker, index setting, deletion classifier, model protocol or scoring change.',
               'claim_ceiling': 'No-model adapter; not a frozen/scored campaign.',
               'open_questions': ['Will all 24 tasks pass native eligibility and whole-arm resource checks?']}
    output = OUTPUT / 'MIXED-SOURCE-TOOLS-R3.json'
    output.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(output),
                      'prepare_sha256': payload['changed_files']['prepare-prospective.mjs']['new_sha256']}))


if __name__ == '__main__':
    main()
