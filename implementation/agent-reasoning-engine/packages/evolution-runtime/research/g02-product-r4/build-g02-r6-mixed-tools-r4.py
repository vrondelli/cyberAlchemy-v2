#!/usr/bin/env python3
"""Bind the uniform 24-task offline cache layout to the mixed adapter."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r6-mixed-source-tools-r3'
OUTPUT = BASE / 'g02-r6-mixed-source-tools-r4'
MANIFEST_SHA = '83be9f679483370b4f4fcb5353aa36a57f3c6411f0d6d22fbe1d6debeea35062'
PREPARE_SHA = '641c262a9c2ab1529051a832977bdeebe824688919dc342e4e31e91146e4d54b'
PRO_HYDRATION_SHA = '4595094905baa565b8605196d2e882b604330dc628f1d14864eb5f39e0ad130c'
MIXED_HYDRATION_SHA = 'c86f1e1acd337766719e26a36b8dd2d5a3152dcd8eae3f40a59fb1df16ad9f73'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('g02-r6-mixed-tools-r4.replacement-shape')
    return source.replace(before, after)


def main():
    candidate = BASE / 'g02-r6-mixed-source-candidate-r1'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS-R3.json') != MANIFEST_SHA or \
            sha(SOURCE / 'prepare-prospective.mjs') != PREPARE_SHA or \
            sha(candidate / 'PRO-TASK-CACHE-HYDRATION-R2.json') != PRO_HYDRATION_SHA or \
            sha(candidate / 'TASK-CACHE-HYDRATION-R2.json') != MIXED_HYDRATION_SHA:
        raise ValueError('g02-r6-mixed-tools-r4.input-or-output-drift')
    prior = (SOURCE / 'prepare-prospective.mjs').read_text()
    derived = once(prior,
        "const cacheLeaf=['django/django','sveltejs/svelte'].includes(repository)?\n"
        "  cacheName+'-'+task.base_commit.slice(0,8):cacheName;",
        "const cacheLeaf=cacheName+'-'+task.base_commit.slice(0,8);")
    derived = once(derived,
        "const cacheBase=['django/django','sveltejs/svelte'].includes(repository)?\n"
        "  '/tmp/are-g02-r6-mixed-source-caches-r1':\n"
        "  ['ansible/ansible','future-architect/vuls'].includes(repository)?\n"
        "  '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929':'/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926';",
        "const cacheBase='/tmp/are-g02-r6-mixed-source-caches-r1';")
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'prepare-prospective.mjs').write_text(derived)
    payload = {'schema_version': 'are.g02-r6-mixed-source-tools/v4',
               'posture': 'source-only-adapter-not-campaign-freeze',
               'predecessor_manifest_sha256': MANIFEST_SHA,
               'mixed_task_cache_hydration_sha256': MIXED_HYDRATION_SHA,
               'pro_task_cache_hydration_sha256': PRO_HYDRATION_SHA,
               'builder_sha256': sha(__file__),
               'changed_files': {'prepare-prospective.mjs': {'old_sha256': PREPARE_SHA,
                    'new_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
                    'semantic_delta': 'Bind all four repositories to exact per-task shallow offline-tested caches.'}},
               'unchanged_policy': 'No ranker, index setting, deletion classifier, model protocol or scoring change.',
               'claim_ceiling': 'No-model adapter; not a frozen/scored campaign.',
               'open_questions': ['Will all 24 source-index and native eligibility checks pass?']}
    output = OUTPUT / 'MIXED-SOURCE-TOOLS-R4.json'
    output.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(output),
                      'prepare_sha256': payload['changed_files']['prepare-prospective.mjs']['new_sha256']}))


if __name__ == '__main__':
    main()
