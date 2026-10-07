#!/usr/bin/env python3
"""Bind prospective mixed-source tools to r11's fresh JSON cohort and caches."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import shutil


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
SOURCE = ARCHIVE / 'g02-r10-tools-dev-candidate-r3-20261002'
OUTPUT = ARCHIVE / 'g02-r11-tools-dev-candidate-r1-20261002'
CANDIDATE = ARCHIVE / 'g02-r11-dev-pool-r1-20261002/CANDIDATE.json'
CACHES = ARCHIVE / 'g02-r11-task-caches-r1-20261002/TASK-CACHE-CLONE-PREFLIGHT-R1.json'
PROJECTOR = Path(__file__).with_name('project-g02-r11-mixed-pruning-r1.py')
PINS = {
    SOURCE / 'R10-TOOLS-CANDIDATE.json': '358f6519583370b1cfb967c3271c56bcae48749815449bc5aad1005390dfddf7',
    SOURCE / 'prepare-prospective.mjs': 'dc42ce45d5df39f89e485f5f94d75eb0fdb076cf4f944b6258b1dd02aacfca66',
    SOURCE / 'product-replication-gitconfig': 'de8dbd8416ca69e5c036724f00d6d918c6d0f5d19f6416c991a9b3eb4ea4e902',
    SOURCE / 'run-and-score-pair.mjs': '49cd5d5a877ff42493dbdbe46ac439a291c01901b839fecad33285f958386282',
    SOURCE / 'project-g02-r10-mixed-pruning-r1.py': '846dde045ec4c7bf533207d0a03f23f823eb1db39edaba0392d88d80c0030e5a',
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    PROJECTOR: '843ecb33048e13117d7bde337f3b54d7a1fc1717b8cd0cd36d5371064a7c08c3',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-tool-binding.' + reason)


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
    need(len(rows) == 30, 'source-file-count')
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
             'sympy/sympy': 6, 'nlohmann/json': 6},
         'cohort-shape')
    for task, cache in zip(candidate, caches):
        need(task['ordinal'] == cache['ordinal'] and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             cache['cache_path'] ==
             '/tmp/are-g02-r11-task-caches-r1/cache/' + cache['cache_leaf'] and
             cache['cache_leaf'].endswith(task['base_commit'][:12]) and
             len(cache['clones']) == 2,
             'cache-binding')
    source_tree = source_tree_digest(SOURCE)
    shutil.copytree(SOURCE, OUTPUT, ignore=shutil.ignore_patterns('__pycache__'))
    prepare = (SOURCE / 'prepare-prospective.mjs').read_text()
    prepare = replace_once(prepare,
                           "  'sveltejs/svelte':'svelte',",
                           "  'sveltejs/svelte':'svelte',\n  'nlohmann/json':'nlohmann-json',")
    prepare = replace_once(prepare,
                           "'sympy/sympy':'Verified','sveltejs/svelte':'Multi'",
                           "'sympy/sympy':'Verified','sveltejs/svelte':'Multi','nlohmann/json':'Multi'")
    prepare = replace_once(prepare,
                           "const cacheBase='/tmp/are-g02-r10-task-caches-r3';",
                           "const cacheBase='/tmp/are-g02-r11-task-caches-r1';")
    (OUTPUT / 'prepare-prospective.mjs').write_text(prepare)
    config = (SOURCE / 'product-replication-gitconfig').read_text()
    start = config.find(' directory = /cache/ansible-d79b23910a1a\n')
    need(start >= 0 and config[start:].count(' directory = /cache/') == 24 and
         all(not line.strip() or line.startswith(' directory = /cache/')
             for line in config[start:].splitlines()), 'gitconfig-tail-shape')
    new_config = config[:start] + ''.join(
        ' directory = /cache/' + row['cache_leaf'] + '\n' for row in caches)
    (OUTPUT / 'product-replication-gitconfig').write_text(new_config)
    driver = (SOURCE / 'run-and-score-pair.mjs').read_text()
    driver = replace_once(driver, 'project-g02-r10-mixed-pruning-r1.py',
                          'project-g02-r11-mixed-pruning-r1.py')
    (OUTPUT / 'run-and-score-pair.mjs').write_text(driver)
    shutil.copy2(PROJECTOR, OUTPUT / PROJECTOR.name)
    manifest = {
        'schema_version': 'are.g02-r11-development-tools-candidate/v1',
        'status': 'source-only-tools-not-frozen-or-dispatched',
        'source_tree_sha256': source_tree,
        'source_pins': {str(path): digest for path, digest in PINS.items()},
        'candidate_sha256': PINS[CANDIDATE],
        'task_cache_receipt_sha256': PINS[CACHES],
        'changed_files': {
            name: {'old_sha256': PINS[SOURCE / name],
                   'new_sha256': sha(OUTPUT / name)}
            for name in ('prepare-prospective.mjs', 'product-replication-gitconfig',
                         'run-and-score-pair.mjs')},
        'prospective_projector_sha256': PINS[PROJECTOR],
        'safe_directories': ['/cache/' + row['cache_leaf'] for row in caches],
        'script_sha256': sha(__file__), 'model_calls': 0,
        'claim_ceiling': 'Tool-source candidate only; no full driver preflight, fresh freeze, paired score, or superiority.',
        'open_questions': ['Does no-model preparation pass for all 24 exact tasks?',
                           'Can the post-arm driver/projection/scoring path be exercised without model dispatch?'],
    }
    path = OUTPUT / 'R11-TOOLS-CANDIDATE.json'
    path.write_text(json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': manifest['status'], 'manifest_sha256': sha(path),
                      'prepare_sha256': sha(OUTPUT / 'prepare-prospective.mjs'),
                      'driver_sha256': sha(OUTPUT / 'run-and-score-pair.mjs'),
                      'safe_directories': len(caches)}, sort_keys=True))


if __name__ == '__main__':
    main()
