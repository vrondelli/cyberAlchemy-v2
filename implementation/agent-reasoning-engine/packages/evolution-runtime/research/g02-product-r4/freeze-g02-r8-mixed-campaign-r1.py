#!/usr/bin/env python3
"""Freeze the already selected G02 r8 mixed-source cohort before model dispatch."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-screening-pool-r1'
TOOLS = BASE / 'g02-r8-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-product-replication-r8/DEFINITION.json'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
ARCHIVE = '/home/vlad_/are-benchmark-archive/g02-product-replication-r8-20261001'
READY = BASE / 'g01-r8-provider-readiness/probe_20261001_g02_r8_before_freeze/READY.json'
R7_CANDIDATE = BASE / 'g02-r7-screening-pool-r1/CANDIDATE.json'
R7_CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
SOURCE_SHA = {
    'CANDIDATE.json': 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196',
    'TASK-CACHE-HYDRATION.json': '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893',
    'SOURCE-INDEX-PREFLIGHT.json': 'c760036ea1910437d1d4da39a54f891f4bd819bfe322191de04e585fcb295376',
    'SOURCE-BINDING-PREFLIGHT.json': 'de0d0ddc07dab1e24e793f9752ce866b84e8dfafd2f7618b9ea3b47865c0e68c',
    'PREPARE-PREFLIGHT.json': '80f1a1cb19ba836140466278b29a225b50e0bad5de211a6534047df1b043a127',
    'WORKTREE-INDEX-REACHABILITY.json': 'a93694f4ab7961f550b4033a06797d1248082361b37d8bd8195ecdda024ca481',
    'NONROOT-CACHE-PREFLIGHT.json': '834c1da21fc8177b3033fb2151558499f71d3d46dae1acebae9b9a0ce1d705d1',
}
TOOLS_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'
READY_SHA = '08ab8a2aefa5ce196bd218eac2e1cd03b4fb5c312331ebb36151afa2877f289d'
FLOOR = 2 * 1024**3
REPOS = {'ansible/ansible': ('Pro', 6), 'django/django': ('Verified', 6),
         'astropy/astropy': ('Verified', 6), 'sveltejs/svelte': ('Multi', 6)}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r8-campaign-freeze.' + reason)


def read(path):
    return json.loads(Path(path).read_text())


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args],
                          capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and all(sha(SOURCE / name) == digest
         for name, digest in SOURCE_SHA.items()) and
         sha(TOOLS / 'MIXED-SOURCE-TOOLS.json') == TOOLS_SHA and
         sha(READY) == READY_SHA and sha(R7_CANDIDATE) == R7_CANDIDATE_SHA,
         'input-or-output-drift')
    need(os.path.ismount(RUN_ROOT) and
         shutil.disk_usage(RUN_ROOT).free >= FLOOR and
         shutil.disk_usage('/').free >= 500 * 1024**2,
         'resource-floor')
    candidate = read(SOURCE / 'CANDIDATE.json')
    hydrated = read(SOURCE / 'TASK-CACHE-HYDRATION.json')
    indexed = read(SOURCE / 'SOURCE-INDEX-PREFLIGHT.json')
    binding = read(SOURCE / 'SOURCE-BINDING-PREFLIGHT.json')
    prepared = read(SOURCE / 'PREPARE-PREFLIGHT.json')
    reachability = read(SOURCE / 'WORKTREE-INDEX-REACHABILITY.json')
    nonroot = read(SOURCE / 'NONROOT-CACHE-PREFLIGHT.json')
    ready = read(READY)
    tasks = candidate['ordered_tasks']
    prior_ids = {row['instance_id'] for row in read(R7_CANDIDATE)['ordered_tasks']}
    need(candidate['status'] == 'eligibility-screened-candidate-not-frozen-or-dispatched' and
         len(tasks) == 24 and len(prior_ids) == 24 and
         len({t['instance_id'] for t in tasks}) == 24 and
         not any(t['instance_id'] in prior_ids for t in tasks) and
         hydrated['verified_count'] == indexed['passed_count'] ==
         binding['admissible_count'] == prepared['prepared_count'] == 24 and
         prepared['status'] == 'passed' and
         reachability['reachability_valid'] is True and
         reachability['totals']['index_total_agreements'] == 24 and
         nonroot['status'] == 'passed' and nonroot['passed_count'] == 24 and
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
             cache == Path('/tmp/are-g02-r8-source-caches-r1/cache') / row['cache_leaf'] and
             git(cache, 'cat-file', '-e', task['base_commit'] + '^{commit}').returncode == 0,
             f'exact-cache:{ordinal}')
        origin = git(cache, 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             f'cache-origin:{ordinal}')
        suffix = f'pr8-mixed-{ordinal:02d}'
        root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not root.exists(), f'fresh-root:{ordinal}')
        pairs.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'source': task['source'],
                      'language': task['language'], 'base_commit': task['base_commit'],
                      'suffix': suffix, 'root': str(root),
                      'cache_name': row['cache_leaf'],
                      'cache_base': '/tmp/are-g02-r8-source-caches-r1'})
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
    payload = {'schema_version': 'are.g02-product-replication-definition/v8',
               'status': 'frozen-before-model-dispatch',
               'campaign_id': 'g02-product-replication-r8',
               'objective': 'Matched native File-/Span-F1 and all-in efficiency comparison of the fixed ARE 64 MiB acquisition plus deletion-only projection against DSH on the 24 selected mixed-source tasks.',
               'population': 'Six each: Ansible Pro, Django Verified, Astropy Verified, Svelte Multi; not Pro-only ContextBench.',
               'ordered_pairs': pairs, 'source_receipt_sha256': SOURCE_SHA,
               'excluded_r7_candidate_sha256': R7_CANDIDATE_SHA,
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
