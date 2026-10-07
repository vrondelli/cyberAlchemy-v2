#!/usr/bin/env python3
"""Bind Astropy, r7 caches and fresh-root guard without changing G02 policy."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-mixed-source-tools-r4'
OUTPUT = BASE / 'g02-r7-mixed-source-tools-r1'
ROOT = BASE / 'g02-r7-screening-pool-r1'
SOURCE_MANIFEST_SHA = '7e7186b7273ece0ebf66b86718d17c4c6800dee7f2d3fb2bab4bd40ab9c32e3b'
PREPARE_SHA = 'c90f27b28928985af586bc68c72424feb9f09f66aa556ba544de477f3e5098ad'
PROJECTOR_SHA = 'be731910ab5d001c8a7e193516f40065a3eaa498e4af8af1e00b866590279361'
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
TASK_CACHE_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'
INDEX_PREFLIGHT_SHA = 'fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('g02-r7-mixed-tools.replacement-shape:' + before[:50])
    return source.replace(before, after)


def main():
    prepare = 'prepare-prospective.mjs'
    projector = 'project-g02-r4-selected-pruning-r1.py'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS-R4.json') != SOURCE_MANIFEST_SHA or \
            sha(SOURCE / prepare) != PREPARE_SHA or sha(SOURCE / projector) != PROJECTOR_SHA or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != TASK_CACHE_SHA or \
            sha(ROOT / 'SOURCE-INDEX-PREFLIGHT.json') != INDEX_PREFLIGHT_SHA:
        raise ValueError('g02-r7-mixed-tools.input-or-output-drift')
    original = (SOURCE / prepare).read_text()
    derived = once(original,
        "  'django/django':'django',\n  'sveltejs/svelte':'svelte',",
        "  'django/django':'django',\n  'astropy/astropy':'astropy',\n  'sveltejs/svelte':'svelte',")
    derived = once(derived,
        "const expectedSource=({'django/django':'Verified','sveltejs/svelte':'Multi'}[repository]??'Pro');",
        "const expectedSource=({'django/django':'Verified','astropy/astropy':'Verified','sveltejs/svelte':'Multi'}[repository]??'Pro');")
    derived = once(derived,
        "const cacheBase='/tmp/are-g02-r6-mixed-source-caches-r1';",
        "const cacheBase='/tmp/are-g02-r7-source-caches-r1';")
    old_projector = (SOURCE / projector).read_text()
    new_projector = once(old_projector,
        "root.name.startswith('g02-cross-layer-pr6-mixed-')",
        "root.name.startswith('g02-cross-layer-pr7-mixed-')")
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / prepare).write_text(derived)
    (OUTPUT / projector).write_text(new_projector)
    payload = {'schema_version': 'are.g02-r7-mixed-source-tools/v1',
               'posture': 'no-model-source-adapter-not-campaign-freeze',
               'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': TASK_CACHE_SHA,
               'source_index_preflight_sha256': INDEX_PREFLIGHT_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {prepare: {'old_sha256': PREPARE_SHA,
                    'new_sha256': sha(OUTPUT / prepare),
                    'semantic_delta': 'Admit Astropy Verified source rows and bind exact r7 task caches.'},
                    projector: {'old_sha256': PROJECTOR_SHA,
                    'new_sha256': sha(OUTPUT / projector),
                    'semantic_delta': 'Accept exact pr7-mixed fresh-root prefix in lieu of pr6-mixed.'}},
               'unchanged_policy': '64 MiB ARE index, r2-trained deletion-only projector, 16K-output DSH, model protocol and native scorer unchanged.',
               'claim_ceiling': 'No-model adapter only; no frozen campaign, model, score or superiority.',
               'open_questions': ['Will no-model preparation and source-binding checks pass all selected tasks?',
                                  'Will evaluator-only fixed-index reference reachability be sufficient?']}
    path = OUTPUT / 'MIXED-SOURCE-TOOLS.json'
    path.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(path),
                      'prepare_sha256': payload['changed_files'][prepare]['new_sha256'],
                      'projector_sha256': payload['changed_files'][projector]['new_sha256']}))


if __name__ == '__main__':
    main()
