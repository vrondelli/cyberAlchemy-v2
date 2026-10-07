#!/usr/bin/env python3
"""Freeze the source-qualified G02 r9 matched selection-only campaign."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r9-source-successor-r1'
TOOLS = BASE / 'g02-r9-selection-only-tools-r1'
OUTPUT = BASE / 'g02-product-replication-r9/DEFINITION.json'
READY = BASE / 'g01-r8-provider-readiness/probe_20261002_g02_r9_before_freeze/READY.json'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
ARCHIVE = '/home/vlad_/are-benchmark-archive/g02-product-replication-r9-20261002'
INPUT_SHA = {
    'CANDIDATE.json': '87527bcef71cdd6d4b99fd008b67379a846f592798e8e658d1ec27cf13ef9c10',
    'TASK-CACHE-HYDRATION.json': '89591dbec004a998ce5252d674bc2e146a570eed7f7413d8ca71e20c0a3f7104',
    'SELECTION-ONLY-PREFLIGHT.json': 'ed2fac9d1391566441b5c189490a52d6aee59d8f2d04fee04d4c28053f58c61a',
    'REPLACEMENT-INDEX-REACHABILITY.json': '515ef2b95eb04422331eb996a9fe76119e5595f5182e52289942e980d9dff230',
}
TOOLS_SHA = 'cf371c480949974e2589e99d84e89476b29e487c60037a3840a373b864f2f659'
READY_SHA = 'aa8f62d64e9cb2f6f0ce30828bbd2d6228b491f714cc26c7a998fb45b81aad37'
R8_CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
REPOS = {'ansible/ansible': ('Pro', 6), 'django/django': ('Verified', 6),
         'astropy/astropy': ('Verified', 6), 'sveltejs/svelte': ('Multi', 6)}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r9-selection-only-freeze.' + reason)


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and all(sha(SOURCE / name) == value for name, value in INPUT_SHA.items())
         and sha(TOOLS / 'SELECTION-ONLY-TOOLS.json') == TOOLS_SHA
         and sha(READY) == READY_SHA, 'input-or-output-drift')
    need(os.path.ismount(RUN_ROOT) and shutil.disk_usage(RUN_ROOT).free >= 2 * 1024**3
         and shutil.disk_usage('/').free >= 500 * 1024**2, 'resource-floor')
    candidate = read(SOURCE / 'CANDIDATE.json')
    hydration = read(SOURCE / 'TASK-CACHE-HYDRATION.json')
    preflight = read(SOURCE / 'SELECTION-ONLY-PREFLIGHT.json')
    reachability = read(SOURCE / 'REPLACEMENT-INDEX-REACHABILITY.json')
    ready = read(READY)
    r8_path = BASE / 'g02-r8-screening-pool-r1/CANDIDATE.json'
    need(sha(r8_path) == R8_CANDIDATE_SHA, 'r8-lineage-drift')
    r8_tasks = read(r8_path)['ordered_tasks']
    need(candidate['status'] == 'source-only-candidate-not-frozen-or-dispatched'
         and len(candidate['ordered_tasks']) == 24
         and len({t['instance_id'] for t in candidate['ordered_tasks']}) == 24
         and candidate['selected_by_repo'] == {k: n for k, (_, n) in REPOS.items()}
         and hydration['verified_count'] == 24 and len(hydration['results']) == 24
         and preflight['status'] == 'passed' and preflight['task_count'] == 24
         and preflight['inherited_index_passed'] == 23 and preflight['new_index_passed'] == 1
         and preflight['nonroot_passed'] == preflight['prepared_passed'] == 24
         and preflight['candidate_sha256'] == INPUT_SHA['CANDIDATE.json']
         and preflight['hydration_sha256'] == INPUT_SHA['TASK-CACHE-HYDRATION.json']
         and preflight['tools_manifest_sha256'] == TOOLS_SHA
         and reachability['index_total_agreement'] is True
         and reachability['gold_indexed'] == reachability['gold_files'] == 3
         and ready['status'] == 'ready' and ready['tokenizer']['status'] == 200
         and ready['tiny_generation']['status'] == 200, 'qualification-shape')
    need(len(r8_tasks) == 24 and
         [row['instance_id'] for row in candidate['ordered_tasks'][1:]] ==
         [row['instance_id'] for row in r8_tasks[1:]] and
         candidate['ordered_tasks'][0]['instance_id'] not in
         {row['instance_id'] for row in r8_tasks}, 'successor-exposure-lineage')
    pairs = []
    for task, row in zip(candidate['ordered_tasks'], hydration['results']):
        ordinal = len(pairs) + 1
        cache = Path(row['cache_path'])
        need(task['ordinal'] == row['ordinal'] == ordinal
             and task['instance_id'] == row['instance_id']
             and task['base_commit'] == row['base_commit']
             and task['repo'] == row['repo'] and task['repo'] in REPOS
             and task['source'] == REPOS[task['repo']][0]
             and re.fullmatch('[0-9a-f]{40}', task['base_commit'])
             and row['offline_container_checkout'] is True
             and cache == Path('/tmp/are-g02-r9-source-caches-r1/cache') / row['cache_leaf']
             and git(cache, 'cat-file', '-e', task['base_commit'] + '^{commit}').returncode == 0,
             f'cache-or-task:{ordinal}')
        origin = git(cache, 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             f'origin:{ordinal}')
        suffix = f'pr9-mixed-{ordinal:02d}'
        root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not root.exists(), f'root-exists:{ordinal}')
        pairs.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'source': task['source'],
                      'language': task['language'], 'base_commit': task['base_commit'],
                      'suffix': suffix, 'root': str(root), 'cache_name': row['cache_leaf'],
                      'cache_base': '/tmp/are-g02-r9-source-caches-r1'})
    source_files = sorted(p for p in TOOLS.iterdir() if p.is_file() and
                          (p.suffix in ('.mjs', '.py') or p.name == 'product-replication-gitconfig'))
    hashes = {p.name: sha(p) for p in source_files}
    need(all(name in hashes for name in ('prepare-prospective.mjs', 'run-and-score-pair.mjs',
         'run_dsh_control.py', 'project-g02-r4-selected-pruning-r1.py',
         'product-replication-gitconfig')), 'tools-shape')
    payload = {
        'schema_version': 'are.g02-product-replication-definition/v9',
        'status': 'frozen-before-model-dispatch',
        'campaign_id': 'g02-product-replication-r9',
        'objective': 'Matched native File-/Span-F1 and all-in efficiency comparison: fixed ARE 64 MiB index plus deletion-only policy versus read/search-only DSH source selection.',
        'population': 'Six each: Ansible Pro, Django Verified, Astropy Verified, Svelte Multi; not Pro-only ContextBench.',
        'ordered_pairs': pairs, 'source_receipt_sha256': INPUT_SHA,
        'predecessor_r8_candidate_sha256': R8_CANDIDATE_SHA,
        'tools_manifest_sha256': TOOLS_SHA, 'readiness_sha256': READY_SHA,
        'freeze_script_sha256': sha(__file__), 'tools_root': str(TOOLS),
        'tool_source_sha256': hashes,
        'model_sha256': 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2',
        'environment': {'G02_TOOLS_ROOT': str(TOOLS), 'G02_OWN_EXPANSIONS': '1',
                        'G02_GO_PACKET': '0', 'G02_RETENTION': '0',
                        'G02_SELECTIVE_RETENTION': '0', 'G02_EXPOSED': '0',
                        'G02_RETRY_CONTROL': '0'},
        'arm_limits': {'model': 'glm-5.3-flash', 'request_window_tokens': 8192,
                       'are_known_token_cap': 650000, 'dsh_known_token_cap': 1000000,
                       'automatic_model_retries': 0, 'dsh_default_max_tokens': 16384,
                       'dsh_model_max_tokens': 16384},
        'validity': 'Exactly 24 ordered one-attempt pairs; all 24 must have sealed predictions, native scores, complete known usage and duration for a directional claim. No replacement, adaptive retry, or mixed invalid subset.',
        'primary_quality': ['paired native Span-F1 ARE minus DSH',
                            'paired native File-F1 ARE minus DSH'],
        'efficiency': ['total known model-token ratio ARE/DSH',
                       'summed arm-time ratio ARE/DSH including policy projection'],
        'analysis': {'unit': 'task', 'resampling': 'paired stratified bootstrap by repository',
                     'resamples': 20000, 'seed': 'first eight hex digits of this definition SHA-256',
                     'interval': '2.5th/97.5th percentile'},
        'directional_claim_gate': 'All 24 valid; native Span- and File-F1 paired 95% intervals wholly above zero; known-token and arm-time ratio 95% intervals wholly below one; independent audit and no unresolved label-integrity issue.',
        'run_policy': 'Serial fixed order, one dispatch each, preserve failures, no replacement or automatic retry, stop on unknown provider usage or storage safety failure; per-pair verified WSL cold copy before exact scratch reclaim.',
        'scratch_root': str(RUN_ROOT), 'scratch_start_floor_bytes': 2 * 1024**3,
        'private_cold_archive_root': ARCHIVE,
        'claim_ceiling': 'Private campaign freeze only; no superiority or product-page claim without 24/24 completed audited pairs, intervals, and Vlad/Dave review.',
        'open_questions': ['Will all 24 matched pairs settle under fixed limits?',
                           'Will all four directional intervals pass?'],
    }
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'pairs': len(pairs), 'tools': len(hashes)}))


if __name__ == '__main__':
    main()
