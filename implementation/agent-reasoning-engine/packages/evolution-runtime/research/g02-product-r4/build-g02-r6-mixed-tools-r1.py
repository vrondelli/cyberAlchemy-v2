#!/usr/bin/env python3
"""Derive a source-only mixed-partition adapter from fixed r5 index64 tools."""

import hashlib
import json
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r5-index64-development-tools-r3'
OUTPUT = BASE / 'g02-r6-mixed-source-tools-r1'
SOURCE_MANIFEST_SHA = '1848a111ff2068ca6fbaed0d3fc828d6517efe63bbdcb8d789173a66e61a5f91'
PREPARE_SHA = 'e7ae737ebcfe1541a6eba6a338258377c795efaaae7c231ee0414fd6fe7a2c4b'
CANDIDATE_SHA = '6c35ecec67bd0fd7b447c957c497a7465a317f690f4fab36afaad183594e28a3'
READY_SHA = 'ac1b65ebf3d4368801bd5972c59592f254a66f8fc1f30405103ce291c307715e'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def replace_once(source, before, after):
    if source.count(before) != 1:
        raise ValueError('g02-r6-mixed-tools.replacement-shape:' + before[:50])
    return source.replace(before, after)


def main():
    candidate = BASE / 'g02-r6-mixed-source-candidate-r1'
    if OUTPUT.exists() or sha(SOURCE / 'INDEX64-DEV-SOURCE-R3.json') != SOURCE_MANIFEST_SHA or \
            sha(SOURCE / 'prepare-prospective.mjs') != PREPARE_SHA or \
            sha(candidate / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(candidate / 'CACHES-READY.json') != READY_SHA:
        raise ValueError('g02-r6-mixed-tools.input-or-output-drift')
    tasks = json.loads((candidate / 'CANDIDATE.json').read_text())['ordered_tasks']
    cache_base = Path('/tmp/are-g02-r6-mixed-source-caches-r1/cache')
    for task in tasks:
        if task['repo'] not in ('django/django', 'sveltejs/svelte'):
            continue
        name = 'django' if task['repo'] == 'django/django' else 'svelte'
        cache = cache_base / name
        origin = subprocess.run(['git', '-C', str(cache), 'remote', 'get-url', 'origin'],
                                capture_output=True, text=True)
        commit = subprocess.run(['git', '-C', str(cache), 'rev-parse', '--verify',
                                 task['base_commit'] + '^{commit}'],
                                capture_output=True, text=True)
        if origin.returncode or origin.stdout.strip() != task['repo_url'] or \
                commit.returncode or commit.stdout.strip() != task['base_commit']:
            raise ValueError('g02-r6-mixed-tools.current-cache-drift:' + str(task['ordinal']))
    original = (SOURCE / 'prepare-prospective.mjs').read_text()
    derived = replace_once(original,
        "  'future-architect/vuls':'vuls',\n}[repository];",
        "  'future-architect/vuls':'vuls',\n  'django/django':'django',\n  'sveltejs/svelte':'svelte',\n}[repository];")
    derived = replace_once(derived,
        "need(task.repo===repository&&task.source==='Pro'&&task.instance_id===instance,'task-identity');",
        "const expectedSource=({'django/django':'Verified','sveltejs/svelte':'Multi'}[repository]??'Pro');\n"
        "need(task.repo===repository&&task.source===expectedSource&&task.instance_id===instance,'task-identity');")
    derived = replace_once(derived,
        "const cacheBase=['ansible/ansible','future-architect/vuls'].includes(repository)?\n"
        "  '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929':'/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926';",
        "const cacheBase=['django/django','sveltejs/svelte'].includes(repository)?\n"
        "  '/tmp/are-g02-r6-mixed-source-caches-r1':\n"
        "  ['ansible/ansible','future-architect/vuls'].includes(repository)?\n"
        "  '/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929':'/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926';")
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'prepare-prospective.mjs').write_text(derived)
    manifest = {'schema_version': 'are.g02-r6-mixed-source-tools/v1',
                'posture': 'source-only-adapter-not-campaign-freeze',
                'predecessor_manifest_sha256': SOURCE_MANIFEST_SHA,
                'builder_sha256': sha(__file__),
                'candidate_sha256': CANDIDATE_SHA, 'caches_ready_sha256': READY_SHA,
                'current_new_partition_cache_root': str(cache_base),
                'changed_files': {'prepare-prospective.mjs':
                    {'old_sha256': PREPARE_SHA, 'new_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
                     'semantic_delta': 'Admit exact Django Verified and Svelte Multi source rows and bind G02-owned cache paths.'}},
                'unchanged_policy': '64 MiB ARE index, r2-trained deletion-only projector, 16K-output DSH',
                'claim_ceiling': 'No-model source adapter; not a frozen or scored campaign.',
                'open_questions': ['Will prepared tasks and no-model Docker source checkout pass for both new partitions?',
                                   'Will all 24 native eligibility and resource checks pass?']}
    path = OUTPUT / 'MIXED-SOURCE-TOOLS.json'
    path.write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model', 'sha256': sha(path),
                      'prepare_sha256': manifest['changed_files']['prepare-prospective.mjs']['new_sha256']}))


if __name__ == '__main__':
    main()
