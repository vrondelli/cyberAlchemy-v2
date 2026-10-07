#!/usr/bin/env python3
"""Incremental no-model r9 qualification: 23 inherited tasks plus one replacement."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r9-source-successor-r1'
R8 = BASE / 'g02-r8-screening-pool-r1'
TOOLS = BASE / 'g02-r9-selection-only-tools-r1'
CACHE = Path('/tmp/are-g02-r9-source-caches-r1/cache')
SCRATCH = Path('/tmp/are-g02-r8-source-index-check-r1')
PROBE = BASE / 'g02-r4-cohort-code-r1/probe-g02-r8-index-capacity-r1.mjs'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
OUTPUT = ROOT / 'SELECTION-ONLY-PREFLIGHT.json'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'
CANDIDATE_SHA = '87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10'
HYDRATION_SHA = '89591dbec004a998ce5252d674bc2e146a570eed7f7413d8ca71e20c0a3f7104'
TOOLS_SHA = 'cf371c480949974e2589e99d84e89476b29e487c60037a3840a373b864f2f659'
R8_CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
R8_INDEX_SHA = 'c760036ea1910437d1d4da39a54f891f4bd819bfe322191de04e585fcb295376'
R8_BINDING_SHA = 'de0d0ddc07dab1e24e793f9752ce866b84e8dfafd2f7618b9ea3b47865c0e68c'
R8_PREPARE_SHA = '80f1a1cb19ba836140466278b29a225b50e0bad5de211a6534047df1b043a127'
R8_NONROOT_SHA = '834c1da21fc8177b3033fb2151558499f71d3d46dae1acebae9b9a0ce1d705d1'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, why):
    if not ok:
        raise ValueError('g02-r9-selection-only-preflight.' + why)


def run(*args, timeout=180, env=None):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, env=env)


def main():
    expected = {
        ROOT / 'CANDIDATE.json': CANDIDATE_SHA,
        ROOT / 'TASK-CACHE-HYDRATION.json': HYDRATION_SHA,
        TOOLS / 'SELECTION-ONLY-TOOLS.json': TOOLS_SHA,
        R8 / 'CANDIDATE.json': R8_CANDIDATE_SHA,
        R8 / 'SOURCE-INDEX-PREFLIGHT.json': R8_INDEX_SHA,
        R8 / 'SOURCE-BINDING-PREFLIGHT.json': R8_BINDING_SHA,
        R8 / 'PREPARE-PREFLIGHT.json': R8_PREPARE_SHA,
        R8 / 'NONROOT-CACHE-PREFLIGHT.json': R8_NONROOT_SHA,
        PARQUET: PARQUET_SHA,
    }
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         all(path.is_file() and sha(path) == digest for path, digest in expected.items()) and
         CACHE.is_dir() and os.stat(CACHE).st_mode & 0o005 == 0o005,
         'input-or-output-drift')
    tasks = read(ROOT / 'CANDIDATE.json')['ordered_tasks']
    caches = read(ROOT / 'TASK-CACHE-HYDRATION.json')['results']
    inherited = read(R8 / 'CANDIDATE.json')['ordered_tasks'][1:]
    manifest = read(TOOLS / 'SELECTION-ONLY-TOOLS.json')
    need(len(tasks) == len(caches) == len(manifest['git_safe_directories']) == 24 and
         len(inherited) == 23, 'denominator')
    for new, old in zip(tasks[1:], inherited):
        need(all(new[k] == old[k] for k in ('ordinal', 'instance_id', 'base_commit', 'repo')),
             'inherited-drift')
    for name in ('SOURCE-INDEX-PREFLIGHT.json', 'SOURCE-BINDING-PREFLIGHT.json',
                 'PREPARE-PREFLIGHT.json', 'NONROOT-CACHE-PREFLIGHT.json'):
        prior = read(R8 / name)
        need(prior.get('status', 'passed') == 'passed' and
             prior.get('passed_count', 24) == 24 and
             prior.get('admissible_count', 24) == 24 and
             prior.get('prepared_count', 24) == 24, 'prior-preflight:' + name)
    named = {r['instance_id']: r['problem_statement'] for r in
             pq.read_table(PARQUET, columns=['instance_id', 'problem_statement']).to_pylist()
             if r['instance_id'] == tasks[0]['instance_id']}
    need(len(named) == 1, 'replacement-issue')
    names = list(dict.fromkeys(re.findall(r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b',
                                        next(iter(named.values())))))[:12]
    found = 0
    for name in names:
        result = run('git', '-C', caches[0]['cache_path'], 'grep', '-q', '-F', name,
                     tasks[0]['base_commit'], '--')
        need(result.returncode in (0, 1), 'replacement-source-grep')
        found += result.returncode == 0
    need(len(names) < 2 or found > 0, 'replacement-source-binding')
    rows = []
    for task, cache in zip(tasks, caches):
        ordinal, leaf, commit = task['ordinal'], cache['cache_leaf'], task['base_commit']
        need(cache['ordinal'] == ordinal and cache['base_commit'] == commit and
             cache['cache_path'] == str(CACHE / leaf) and
             manifest['git_safe_directories'][ordinal - 1] == '/cache/' + leaf,
             'cache-binding:' + str(ordinal))
        checked = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                      '--cpus', '1', '--user', '65532:65532',
                      '-e', 'GIT_CONFIG_GLOBAL=/run/are-product-replication-gitconfig',
                      '-v', str(CACHE) + ':/cache:ro',
                      '-v', str(TOOLS / 'product-replication-gitconfig') +
                            ':/run/are-product-replication-gitconfig:ro',
                      IMAGE, 'git', '-C', '/cache/' + leaf, 'cat-file', '-e',
                      commit + '^{commit}', timeout=120)
        need(checked.returncode == 0, 'nonroot-cache:' + str(ordinal))
        suffix = f'pr9-mixed-pf-{ordinal:02d}'
        prepared_root = Path('/tmp/are-g02-r4-runs/g02-cross-layer-' + suffix)
        if ordinal == 1:
            need(prepared_root.is_dir(), 'replacement-prepared-root')
        else:
            need(not prepared_root.exists(), 'prepared-root-collision')
            env = {**os.environ, 'G02_PAIR_SUFFIX': suffix,
                   'G02_INSTANCE': task['instance_id'], 'G02_REPO': task['repo'],
                   'G02_TOOLS_ROOT': str(TOOLS), 'G02_OWN_EXPANSIONS': '1',
                   'G02_EXPOSED': '0', 'G02_RETENTION': '0',
                   'G02_SELECTIVE_RETENTION': '0', 'G02_GO_PACKET': '0'}
            prepared = run(NODE, str(TOOLS / 'prepare-prospective.mjs'), env=env)
            need(prepared.returncode == 0, 'prepare:' + str(ordinal) + ':' + prepared.stderr[-250:])
        binding = read(prepared_root / 'tasks/binding.json')
        freeze = read(prepared_root / 'FREEZE.json')
        need(binding['instance_id'] == task['instance_id'] and
             binding['base_commit'] == commit and binding['cache_base'] ==
             '/tmp/are-g02-r9-source-caches-r1' and
             freeze['status'] == 'frozen-before-model-dispatch' and
             freeze['source_hashes']['code/run_dsh_control.py'] ==
             manifest['dsh_runner_sha256'], 'prepared-binding:' + str(ordinal))
        rows.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                     'cache_leaf': leaf, 'nonroot_exact_commit_read': True,
                     'prepare_freeze_sha256': sha(prepared_root / 'FREEZE.json'),
                     'binding_sha256': sha(prepared_root / 'tasks/binding.json'),
                     'index_posture': 'new-replacement-pending' if ordinal == 1 else
                                      'inherited-r8-exact-commit-and-code'})
        print(json.dumps({'ordinal': ordinal, 'nonroot': 'passed',
                          'prepare': 'passed'}), flush=True)
    need(shutil.disk_usage('/tmp').free >= 2 * 1024**3, 'scratch-reserve')
    SCRATCH.mkdir(mode=0o700)
    replacement = tasks[0]
    clone = run('docker', 'run', '--rm', '--network', 'none', '--memory', '1g',
                '--cpus', '1', '-v', str(CACHE) + ':/cache:ro',
                '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c',
                'git clone --no-local --no-checkout /cache/' + caches[0]['cache_leaf'] +
                ' /out/work && git -C /out/work checkout --detach ' + replacement['base_commit'])
    need(clone.returncode == 0, 'replacement-checkout:' + clone.stderr[-250:])
    probe = run(NODE, '--max-old-space-size=768', str(PROBE),
                str(SCRATCH / 'work'), replacement['base_commit'])
    need(probe.returncode == 0, 'replacement-index:' + probe.stderr[-250:])
    index = json.loads(probe.stdout)
    rows[0]['index_posture'] = 'new-replacement-checked'
    rows[0]['index'] = index
    shutil.rmtree(SCRATCH / 'work')
    SCRATCH.rmdir()
    payload = {
        'schema_version': 'are.g02-r9-selection-only-preflight/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold-path-no-score',
        'candidate_sha256': CANDIDATE_SHA,
        'hydration_sha256': HYDRATION_SHA,
        'tools_manifest_sha256': TOOLS_SHA,
        'r8_inherited_receipts_sha256': {str(p.relative_to(R8)): digest for p, digest
                                        in expected.items() if p.parent == R8},
        'parquet_sha256': PARQUET_SHA,
        'script_sha256': sha(__file__), 'probe_sha256': sha(PROBE),
        'replacement_named_identifiers': len(names),
        'replacement_names_found_in_base': found,
        'task_count': len(rows), 'nonroot_passed': len(rows),
        'prepared_passed': len(rows), 'new_index_passed': 1,
        'inherited_index_passed': 23, 'rows': rows,
        'claim_ceiling': 'r9 no-model preflight only; no arm reliability, native quality, or superiority.',
        'open_questions': ['Will evaluator-only replacement reference reachability pass?',
                           'Will a separately frozen 24/24 matched campaign pass?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'nonroot': len(rows), 'prepared': len(rows),
                      'replacement_index_bytes': index['indexed_bytes']}))


if __name__ == '__main__':
    main()
