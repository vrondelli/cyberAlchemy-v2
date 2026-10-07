#!/usr/bin/env python3
"""Bind the pinned r10 driver to the new development-only cohort and caches."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import shutil


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g02-r10-mixed-driver-candidate-r1-20261002'
OUTPUT = ARCHIVE / 'g02-r10-tools-dev-candidate-r1-20261002'
CANDIDATE = ARCHIVE / 'g02-r10-dev-pool-r1-20261002/CANDIDATE.json'
CACHES = ARCHIVE / 'g02-r10-task-caches-r3-20261002/TASK-CACHE-PREFLIGHT-R3.json'
PINS = {
    SOURCE / 'R10-MIXED-DRIVER-SOURCE.json': '38f146ac0486b8c3787fb3a84d128f3f745a4bdae9a000d8ea749f156b3a409d',
    SOURCE / 'prepare-prospective.mjs': 'f0d7982657c29d891719a2338f4ef42f9e2e45028d566289c622eb3ead224778',
    SOURCE / 'product-replication-gitconfig': '88b038bb2e17b7f054d5ef9d77036adfe709737ad3636d536b16130842c9d0bf',
    SOURCE / 'run-and-score-pair.mjs': '49cd5d5a877ff42493dbdbe46ac439a291c01901b839fecad33285f958386282',
    SOURCE / 'project-g02-r10-mixed-pruning-r1.py': '846dde045ec4c7bf533207d0a03f23f823eb1db39edaba0392d88d80c0030e5a',
    CANDIDATE: '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd',
    CACHES: '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r10-tool-binding.' + reason)


def replace_once(content, before, after):
    need(content.count(before) == 1, 'replacement-shape:' + before[:36])
    return content.replace(before, after)


def source_tree_digest(root):
    rows = []
    for path in sorted(root.rglob('*')):
        if '__pycache__' in path.parts:
            continue
        need(not path.is_symlink(), 'source-symlink')
        if path.is_file():
            rows.append((str(path.relative_to(root)), sha(path)))
    need(len(rows) == 29, 'source-file-count')
    return hashlib.sha256(json.dumps(rows, separators=(',', ':')).encode()).hexdigest()


def main():
    need(not OUTPUT.exists() and not OUTPUT.is_symlink(), 'output-exists')
    for path, digest in PINS.items():
        need(path.is_file() and sha(path) == digest, 'pinned-input-drift:' + path.name)
    candidate = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())['results']
    need(len(candidate) == len(caches) == 24 and
         Counter(row['repo'] for row in candidate) == {
             'ansible/ansible': 6, 'django/django': 6,
             'sympy/sympy': 6, 'sveltejs/svelte': 6}, 'cohort-shape')
    for task, cache in zip(candidate, caches):
        need(task['ordinal'] == cache['ordinal'] and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             cache['cache_path'] ==
             '/tmp/are-g02-r10-task-caches-r3/cache/' + cache['cache_leaf'] and
             cache['cache_leaf'].endswith(task['base_commit'][:12]),
             'cache-binding')
    source_tree = source_tree_digest(SOURCE)
    shutil.copytree(SOURCE, OUTPUT, ignore=shutil.ignore_patterns('__pycache__'))
    prepare = (SOURCE / 'prepare-prospective.mjs').read_text()
    prepare = replace_once(prepare,
                           "  'astropy/astropy':'astropy',",
                           "  'astropy/astropy':'astropy',\n  'sympy/sympy':'sympy',")
    prepare = replace_once(prepare,
                           "'astropy/astropy':'Verified','sveltejs/svelte':'Multi'",
                           "'astropy/astropy':'Verified','sympy/sympy':'Verified','sveltejs/svelte':'Multi'")
    prepare = replace_once(prepare, 'task.base_commit.slice(0,8)',
                           'task.base_commit.slice(0,12)')
    prepare = replace_once(prepare,
                           "const cacheBase='/tmp/are-g02-r9-source-caches-r1';",
                           "const cacheBase='/tmp/are-g02-r10-task-caches-r3';")
    (OUTPUT / 'prepare-prospective.mjs').write_text(prepare)
    config = (SOURCE / 'product-replication-gitconfig').read_text()
    start = config.find(' directory = /cache/')
    need(start >= 0 and config[start:].count(' directory = /cache/') == 24 and
         all(not line.strip() or line.startswith(' directory = /cache/')
             for line in config[start:].splitlines()), 'gitconfig-tail-shape')
    new_config = config[:start] + ''.join(
        ' directory = /cache/' + row['cache_leaf'] + '\n' for row in caches)
    (OUTPUT / 'product-replication-gitconfig').write_text(new_config)
    need(sha(OUTPUT / 'run-and-score-pair.mjs') == PINS[SOURCE / 'run-and-score-pair.mjs'] and
         sha(OUTPUT / 'project-g02-r10-mixed-pruning-r1.py') ==
         PINS[SOURCE / 'project-g02-r10-mixed-pruning-r1.py'],
         'driver-or-projector-drift')
    manifest = {
        'schema_version': 'are.g02-r10-development-tools-candidate/v1',
        'status': 'source-only-tools-not-frozen-or-dispatched',
        'source_tree_sha256': source_tree,
        'source_pins': {str(path): digest for path, digest in PINS.items()},
        'candidate_sha256': PINS[CANDIDATE],
        'task_cache_receipt_sha256': PINS[CACHES],
        'changed_files': {
            name: {'old_sha256': PINS[SOURCE / name],
                   'new_sha256': sha(OUTPUT / name)}
            for name in ('prepare-prospective.mjs', 'product-replication-gitconfig')},
        'unchanged_driver_sha256': PINS[SOURCE / 'run-and-score-pair.mjs'],
        'unchanged_mixed_projector_sha256': PINS[SOURCE / 'project-g02-r10-mixed-pruning-r1.py'],
        'safe_directories': ['/cache/' + row['cache_leaf'] for row in caches],
        'script_sha256': sha(__file__), 'model_calls': 0,
        'claim_ceiling': 'Tool-source candidate only; no full driver preflight, fresh freeze, paired score, or superiority.',
        'open_questions': [
            'Does no-model preparation pass for all 24 exact tasks?',
            'Can the post-arm driver/projection/scoring path be exercised without model dispatch?',
        ],
    }
    path = OUTPUT / 'R10-TOOLS-CANDIDATE.json'
    path.write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': manifest['status'], 'manifest_sha256': sha(path),
                      'prepare_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
                      'safe_directories': len(caches)}, sort_keys=True))


if __name__ == '__main__':
    main()
