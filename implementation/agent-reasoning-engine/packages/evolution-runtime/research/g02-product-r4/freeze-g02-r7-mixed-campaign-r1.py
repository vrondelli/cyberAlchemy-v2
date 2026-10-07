#!/usr/bin/env python3
"""Freeze the already selected G02 r7 mixed-source cohort before model dispatch."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r7-screening-pool-r1'
TOOLS = BASE / 'g02-r7-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-product-replication-r7/DEFINITION.json'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
ARCHIVE = '/home/vlad_/are-benchmark-archive/g02-product-replication-r7-20261001'
READY = BASE / 'g01-r8-provider-readiness/probe_20261001_g02_r7_secret_refresh/READY.json'
SOURCE_SHA = {
    'CANDIDATE.json': '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d',
    'TASK-CACHE-HYDRATION.json': '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e',
    'SOURCE-INDEX-PREFLIGHT.json': 'fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399',
    'SOURCE-BINDING-PREFLIGHT.json': '57d20a80685f08f94d4676ff91e049f480b9eb2548ce509bb06348d8f69b6217',
    'PREPARE-PREFLIGHT.json': '5cff425338390377fff503b9c7cfc199662627c4892c88380acb9335d7615929',
    'WORKTREE-INDEX-REACHABILITY-R2.json': 'd345af29c6a9684346379904c2f574969327b906a070198f8511115049074c25',
    'FOUR-CHECKOUT-CAPACITY.json': '9f8c802d5c5aa59e22d3ab9ba5aa65cb268208171b23af73d5ad99ea5568317f',
}
TOOLS_SHA = 'ebd522264e431e8b68016ca22607c059dc9e7d188d06ca043c0f52963b2d5973'
READY_SHA = '9e575c51b3508c6f11500dc452b77353efe4b3d39c44882bb95ce8464e6dbf88'
FLOOR = 2 * 1024**3
REPOS = {'ansible/ansible': ('Pro', 6), 'django/django': ('Verified', 6),
         'astropy/astropy': ('Verified', 6), 'sveltejs/svelte': ('Multi', 6)}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-campaign-freeze.' + reason)


def read(path):
    return json.loads(Path(path).read_text())


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args],
                          capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and all(sha(SOURCE / name) == digest
         for name, digest in SOURCE_SHA.items()) and
         sha(TOOLS / 'MIXED-SOURCE-TOOLS.json') == TOOLS_SHA and
         sha(READY) == READY_SHA, 'input-or-output-drift')
    need(os.path.ismount(RUN_ROOT) and
         shutil.disk_usage(RUN_ROOT).free >= FLOOR and
         shutil.disk_usage('/').free >= 500 * 1024**2,
         'resource-floor')
    candidate = read(SOURCE / 'CANDIDATE.json')
    hydrated = read(SOURCE / 'TASK-CACHE-HYDRATION.json')
    indexed = read(SOURCE / 'SOURCE-INDEX-PREFLIGHT.json')
    binding = read(SOURCE / 'SOURCE-BINDING-PREFLIGHT.json')
    prepared = read(SOURCE / 'PREPARE-PREFLIGHT.json')
    reachability = read(SOURCE / 'WORKTREE-INDEX-REACHABILITY-R2.json')
    capacity = read(SOURCE / 'FOUR-CHECKOUT-CAPACITY.json')
    ready = read(READY)
    tasks = candidate['ordered_tasks']
    need(candidate['status'] == 'eligibility-screened-candidate-not-frozen-or-dispatched' and
         len(tasks) == 24 and len({t['instance_id'] for t in tasks}) == 24 and
         hydrated['verified_count'] == indexed['passed_count'] ==
         binding['admissible_count'] == prepared['prepared_count'] == 24 and
         prepared['status'] == 'passed' and
         reachability['reachability_valid'] is True and
         reachability['totals']['index_total_agreements'] == 24 and
         capacity['status'] == 'passed-no-model' and
         ready['status'] == 'ready' and ready['tokenizer']['status'] == 200 and
         ready['tiny_generation']['status'] == 200,
         'qualification-shape')
    cache_rows = {row['ordinal']: row for row in hydrated['results']}
    need(len(cache_rows) == 24, 'cache-row-count')
    pairs = []
    for task in tasks:
        ordinal = task['ordinal']
        need(ordinal == len(pairs) + 1 and task['repo'] in REPOS and
             task['source'] == REPOS[task['repo']][0] and
             re.fullmatch(r'[0-9a-f]{40}', task['base_commit']),
             f'task-identity:{ordinal}')
        row = cache_rows[ordinal]
        cache = Path(row['cache_path'])
        need(row['instance_id'] == task['instance_id'] and
             row['base_commit'] == task['base_commit'] and
             row['repo'] == task['repo'] and row['offline_container_checkout'] is True and
             cache == Path('/tmp/are-g02-r7-source-caches-r1/cache') / row['cache_leaf'] and
             git(cache, 'cat-file', '-e', task['base_commit'] + '^{commit}').returncode == 0,
             f'exact-cache:{ordinal}')
        origin = git(cache, 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             f'cache-origin:{ordinal}')
        suffix = f'pr7-mixed-{ordinal:02d}'
        root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not root.exists(), f'fresh-root:{ordinal}')
        pairs.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'source': task['source'],
                      'language': task['language'], 'base_commit': task['base_commit'],
                      'suffix': suffix, 'root': str(root),
                      'cache_name': row['cache_leaf'],
                      'cache_base': '/tmp/are-g02-r7-source-caches-r1'})
    need({repo: sum(p['repo'] == repo for p in pairs) for repo in REPOS} ==
         {repo: n for repo, (_, n) in REPOS.items()}, 'strata')
    source_files = sorted(p for p in TOOLS.iterdir() if p.is_file() and
                          (p.suffix in ('.mjs', '.py') or
                           p.name == 'product-replication-gitconfig'))
    hashes = {p.name: sha(p) for p in source_files}
    need(len(hashes) >= 12 and all(name in hashes for name in
         ('prepare-prospective.mjs', 'run-and-score-pair.mjs',
          'project-g02-r4-selected-pruning-r1.py', 'product-replication-gitconfig')),
         'tools-shape')
    payload = {'schema_version': 'are.g02-product-replication-definition/v7',
               'status': 'frozen-before-model-dispatch',
               'campaign_id': 'g02-product-replication-r7',
               'objective': 'Matched native File-/Span-F1 and all-in efficiency comparison of the fixed ARE 64 MiB acquisition plus deletion-only projection against DSH on the 24 selected mixed-source tasks.',
               'population': 'Six each: Ansible Pro, Django Verified, Astropy Verified, Svelte Multi; not Pro-only ContextBench.',
               'ordered_pairs': pairs, 'source_receipt_sha256': SOURCE_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'readiness_sha256': READY_SHA,
               'freeze_script_sha256': sha(__file__),
               'tools_root': str(TOOLS), 'tool_source_sha256': hashes,
               'model_sha256': 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2',
               'environment': {'G02_TOOLS_ROOT': str(TOOLS),
                               'G02_OWN_EXPANSIONS': '1', 'G02_GO_PACKET': '0',
                               'G02_RETENTION': '0', 'G02_SELECTIVE_RETENTION': '0',
                               'G02_EXPOSED': '0', 'G02_RETRY_CONTROL': '0'},
               'arm_limits': {'model': 'glm-5.3-flash', 'request_window_tokens': 8192,
                              'are_known_token_cap': 650000,
                              'dsh_known_token_cap': 1000000,
                              'automatic_model_retries': 0,
                              'dsh_default_max_tokens': 16384,
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
               'scratch_root': str(RUN_ROOT), 'scratch_start_floor_bytes': FLOOR,
               'private_cold_archive_root': ARCHIVE,
               'claim_ceiling': 'Private campaign freeze only; no superiority or product-page claim without 24/24 completed audited pairs, intervals, and Vlad/Dave review.',
               'open_questions': ['Will all 24 arms settle under the frozen limits?',
                                  'Will all four directional intervals pass?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'pairs': len(pairs), 'tools': len(hashes)}))


if __name__ == '__main__':
    main()
