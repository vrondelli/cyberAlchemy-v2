#!/usr/bin/env python3
"""Freeze the untouched G02 r4 paired cohort and its fixed pruning policy."""

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
INPUT = BASE / 'g02-r4-fresh-cohort-candidate-r1'
TOOLS = BASE / 'g02-product-replication-tools-r4-policy-time-r1'
MODEL = BASE / 'g02-delivered-file-transfer-r1/RESULT.json'
PREFLIGHT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/FREEZE.json')
OUTPUT = BASE / 'g02-product-replication-r4/DEFINITION.json'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
COLD_ROOT = '/home/vlad_/are-benchmark-archive/g02-product-replication-r4-20261001'
INPUT_SHA = {
    'CANDIDATE.json': 'e4408a93c501bfe0ea57d8ef412155bb3db7f969aefb646392b1a6ff7bed5f08',
    'HYDRATION.json': '12c77ddbc23330b1ca7e68cdfc85f9f87871cfb592e79f7a1e9102e0cf1932eb',
    'REF-BINDING.json': 'aa2c25d1d44f67c6f6b2dcaebcde5818bf58a4cacde1ab5fac1407a8a4098761',
    'CACHE-ORIGINS.json': 'af8a6cf1e63099fa32621c693eb8e4aa43a7397b41b2330971c3cbbb6ef60c29',
    'NATIVE-ELIGIBILITY.json': '65633683a656c430b26029f1784a3f2444e6f31917ef2d4efd43f01e17a4fcf0',
}
TIME_SOURCE_SHA = 'dc00bac6dc9173105ed2c0d1c59e1ae25e35f7cb7ae5f114b660b1567f81c455'
MODEL_SHA = 'cafa966fa81eeba126a99a9234a85b2206ac3f90f8736b7bad736e5b2d60d4c2'
PREFLIGHT_SHA = '1a4b0630663d075ed822d0cd0beb25187d3b79abfb8af299ec3f9ee346409796'
FLOOR = 8 * 1024**3


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-campaign-freeze.{reason}')


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and all(sha(INPUT / name) == digest
         for name, digest in INPUT_SHA.items()), 'input-drift')
    need(sha(TOOLS / 'TIME-SOURCE.json') == TIME_SOURCE_SHA and
         sha(MODEL) == MODEL_SHA and sha(PREFLIGHT) == PREFLIGHT_SHA,
         'tool-model-or-preflight-drift')
    need(os.path.ismount(RUN_ROOT) and os.statvfs(RUN_ROOT).f_bavail *
         os.statvfs(RUN_ROOT).f_frsize >= FLOOR, 'dedicated-scratch-reserve')
    cohort = json.loads((INPUT / 'CANDIDATE.json').read_text())
    eligibility = json.loads((INPUT / 'NATIVE-ELIGIBILITY.json').read_text())
    preflight = json.loads(PREFLIGHT.read_text())
    tasks = cohort['ordered_tasks']
    need(cohort['status'] == 'source-only-candidate-not-frozen' and
         eligibility['eligible_count'] == len(tasks) == 24 and
         preflight['own_expansions_fix'] is True and
         len({task['instance_id'] for task in tasks}) == 24 and
         not any(task['instance_id'] in cohort['smoke_test_exclusions'] for task in tasks),
         'cohort-or-preflight-shape')
    pairs = []
    for ordinal, task in enumerate(tasks):
        cache = Path(task['cache_base']) / 'cache' / task['cache_name']
        commit = task['base_commit']
        need(re.fullmatch(r'[0-9a-f]{40}', commit) and
             git(cache, 'cat-file', '-e', commit + '^{commit}').returncode == 0,
             f'commit-unavailable:{ordinal}')
        if task['repo'] in ('ansible/ansible', 'future-architect/vuls'):
            ref = 'refs/heads/are-g02-r4-' + commit
            result = git(cache, 'rev-parse', '--verify', ref)
            need(result.returncode == 0 and result.stdout.strip() == commit,
                 f'clone-ref-unavailable:{ordinal}')
            origin = git(cache, 'remote', 'get-url', 'origin')
            need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
                 f'origin-drift:{ordinal}')
        suffix = task['suffix']
        need(re.fullmatch(r'pr4-[a-z0-9-]+', suffix) is not None,
             f'suffix-shape:{ordinal}')
        pairs.append({'ordinal': ordinal + 1, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'language': task['language'],
                      'base_commit': commit, 'suffix': suffix,
                      'root': str(RUN_ROOT / ('g02-cross-layer-' + suffix)),
                      'cache_name': task['cache_name'],
                      'cache_base': task['cache_base']})
    need(len({pair['suffix'] for pair in pairs}) == 24 and
         len({pair['root'] for pair in pairs}) == 24 and
         not any(Path(pair['root']).exists() for pair in pairs),
         'pair-path-collision')
    source_files = sorted(path for path in TOOLS.iterdir()
                          if path.is_file() and path.suffix in ('.mjs', '.py') or
                          path.is_file() and path.name == 'product-replication-gitconfig')
    source_hashes = {path.name: sha(path) for path in source_files}
    need(len(source_hashes) >= 12 and
         all(name in source_hashes for name in
             ('prepare-prospective.mjs', 'run-and-score-pair.mjs',
              'project-g02-r4-selected-pruning-r1.py', 'product-replication-gitconfig')),
         'source-binding')
    payload = {'schema_version': 'are.g02-product-replication-definition/v4',
               'status': 'frozen-before-model-dispatch',
               'campaign_id': 'g02-product-replication-r4',
               'objective': 'Evaluate fixed r2-trained deletion-only selection on 24 cross-branch-unmanifested SWE-Bench-Pro tasks against matched DSH at the large-window G02 setting.',
               'source_only_candidate_sha256': INPUT_SHA['CANDIDATE.json'],
               'hydration_sha256': INPUT_SHA['HYDRATION.json'],
               'ref_binding_sha256': INPUT_SHA['REF-BINDING.json'],
               'cache_origins_sha256': INPUT_SHA['CACHE-ORIGINS.json'],
               'native_eligibility_sha256': INPUT_SHA['NATIVE-ELIGIBILITY.json'],
               'own_expansions_source_preflight_sha256': PREFLIGHT_SHA,
               'model_sha256': MODEL_SHA, 'time_source_sha256': TIME_SOURCE_SHA,
               'freeze_script_sha256': sha(__file__),
               'tools_root': str(TOOLS), 'tool_source_sha256': source_hashes,
               'ordered_pairs': pairs,
               'environment': {'G02_TOOLS_ROOT': str(TOOLS),
                               'G02_OWN_EXPANSIONS': '1', 'G02_GO_PACKET': '0',
                               'G02_RETENTION': '0', 'G02_SELECTIVE_RETENTION': '0',
                               'G02_EXPOSED': '0', 'G02_RETRY_CONTROL': '0'},
               'arm_limits': {'model': 'glm-5.3-flash', 'request_window_tokens': 8192,
                              'are_known_token_cap': 650000, 'dsh_known_token_cap': 1000000,
                              'automatic_model_retries': 0},
               'validity': 'Exactly the 24 ordered tasks attempted once, no adaptive replacement; all 24 matched pairs must yield sealed predictions, native scores, known usage and time for a directional claim.',
               'primary_quality': ['paired native Span-F1 difference ARE minus DSH',
                                   'paired native File-F1 difference ARE minus DSH'],
               'efficiency': ['total known model-token ratio ARE/DSH',
                              'summed arm-time ratio ARE/DSH including ARE-only policy projection time'],
               'analysis': {'unit': 'task', 'resampling': 'paired stratified bootstrap by repository',
                            'resamples': 20000, 'seed': 'first eight hex digits of this frozen definition SHA-256',
                            'interval': '2.5th/97.5th percentile'},
               'directional_claim_gate': 'All 24 valid; both paired quality 95% intervals wholly above zero; token and arm-time ratio 95% intervals wholly below one; independent receipt and score audit passed; no unresolved label-integrity issue.',
               'run_policy': 'Serial order; one dispatch per task; preserve invalid attempts; no task replacement or retries; stop on provider-account, unknown-usage, or storage safety failure; per-pair archive and verified cold copy before exact scratch reclaim.',
               'scratch_root': str(RUN_ROOT), 'scratch_start_floor_bytes': FLOOR,
               'private_cold_archive_root': COLD_ROOT,
               'claim_ceiling': 'Private frozen campaign definition only; no superiority claim until complete, audited result and separate Vlad/Dave page review.',
               'open_questions': ['Will all 24 pairs settle and score under the frozen protocol?',
                                  'Will quality gains generalize and all-in time improve across repositories?']}
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'pairs': len(pairs), 'tools': len(source_hashes)}))


if __name__ == '__main__':
    main()
