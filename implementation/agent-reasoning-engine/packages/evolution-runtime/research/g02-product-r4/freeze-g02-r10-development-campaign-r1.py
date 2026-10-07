#!/usr/bin/env python3
"""Freeze the qualified, development-only G02 r10 matched cohort."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r10-dev-pool-r1'
TOOLS = BASE / 'g02-r10-selection-only-tools-r2'
OUTPUT = BASE / 'g02-product-replication-r10/DEFINITION.json'
READY = BASE / 'g01-r8-provider-readiness/probe_20261002_g02_r10_after_secret_update_r2/READY.json'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
ARCHIVE = '/home/vlad_/are-benchmark-archive/g02-product-replication-r10-20261002'
INPUT_SHA = {
    'CANDIDATE.json': '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd',
    'TASK-CACHE-PREFLIGHT-R3.json': '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad',
    'SOURCE-INDEX-PREFLIGHT.json': '5bab09f2e8637ed010dc53e2a0ce2d25d60b88b83beffdea32c35c90131f3a41',
    'WORKTREE-INDEX-REACHABILITY.json': '5dd0be24c5e7c2ba3a0b8af67126d2998755b77ed935fdbb419ac69768af196d',
    'MISSING-REFERENCE-CLASSIFICATION.json': '31531c64802ae8b20c7891a6098016980293b8c085fadc578e85addb096db897',
    'PREPARE-PREFLIGHT-R2.json': 'bb7c5ae3eb2d389751609f5f8c28be48cfb22b34b1716a4af54ce6f85c90ac0c',
}
TOOLS_SHA = '358f6519583370b1cfb967c3271c56bcae48749815449bc5aad1005390dfddf7'
PROJECTOR_QUALIFICATION_SHA = '8a9b1e80b840fae7c3957dc8943b50e1019481da232750b3070b8eb041bbb6b0'
READY_SHA = 'e8dc3d70cfe3a2082b6cafee5b92b6661cad411da965c20c9e01142e6e0a55c6'
REPOS = {'ansible/ansible': ('Pro', 6), 'django/django': ('Verified', 6),
         'sympy/sympy': ('Verified', 6), 'sveltejs/svelte': ('Multi', 6)}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r10-development-freeze.' + reason)


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and all(sha(SOURCE / name) == value for name, value in INPUT_SHA.items())
         and sha(TOOLS / 'R10-TOOLS-CANDIDATE.json') == TOOLS_SHA
         and sha(READY) == READY_SHA, 'input-or-output-drift')
    need(os.path.ismount(RUN_ROOT) and shutil.disk_usage(RUN_ROOT).free >= 2 * 1024**3
         and shutil.disk_usage('/').free >= 500 * 1024**2, 'resource-floor')
    candidate = read(SOURCE / 'CANDIDATE.json')
    cache_receipt = read(SOURCE / 'TASK-CACHE-PREFLIGHT-R3.json')
    source_index = read(SOURCE / 'SOURCE-INDEX-PREFLIGHT.json')
    reachability = read(SOURCE / 'WORKTREE-INDEX-REACHABILITY.json')
    missing = read(SOURCE / 'MISSING-REFERENCE-CLASSIFICATION.json')
    prep = read(SOURCE / 'PREPARE-PREFLIGHT-R2.json')
    ready = read(READY)
    need(candidate['status'] == 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched'
         and candidate['selected_count'] == 24
         and len(candidate['ordered_tasks']) == 24
         and len({t['instance_id'] for t in candidate['ordered_tasks']}) == 24
         and candidate['selected_by_repo'] == {k: n for k, (_, n) in REPOS.items()}
         and cache_receipt['status'] == 'passed' and cache_receipt['verified_count'] == 24
         and cache_receipt['candidate_sha256'] == INPUT_SHA['CANDIDATE.json']
         and source_index['status'] == 'passed' and source_index['tested_count'] == 24
         and source_index['checkout_passed'] == source_index['index_passed'] == source_index['nonroot_passed'] == 24
         and reachability['status'] == 'audited' and reachability['task_count'] == 24
         and reachability['reachability_valid'] is True
         and reachability['totals'] == {'gold_files': 91, 'gold_indexed': 87,
                                       'gold_not_indexed': 4, 'index_total_agreements': 24}
         and missing['missing_reference_count'] == missing['target_count'] == 4
         and missing['reasons'] == {'not-in-base': 4}
         and prep['status'] == 'passed' and prep['prepared_count'] == 24
         and prep['candidate_sha256'] == INPUT_SHA['CANDIDATE.json']
         and prep['cache_receipt_sha256'] == INPUT_SHA['TASK-CACHE-PREFLIGHT-R3.json']
         and prep['tools_manifest_sha256'] == TOOLS_SHA
         and ready['status'] == 'ready' and ready['tokenizer']['status'] == 200
         and ready['tiny_generation']['status'] == 200, 'qualification-shape')
    pairs = []
    for task, cache_row, prep_row in zip(candidate['ordered_tasks'], cache_receipt['results'], prep['rows']):
        ordinal = len(pairs) + 1
        cache = Path(cache_row['cache_path'])
        need(task['ordinal'] == cache_row['ordinal'] == prep_row['ordinal'] == ordinal
             and task['instance_id'] == cache_row['instance_id'] == prep_row['instance_id']
             and task['base_commit'] == cache_row['base_commit']
             and task['repo'] == cache_row['repo'] == prep_row['repo']
             and task['repo'] in REPOS and task['source'] == REPOS[task['repo']][0]
             and re.fullmatch('[0-9a-f]{40}', task['base_commit'])
             and cache == Path('/tmp/are-g02-r10-task-caches-r3/cache') / cache_row['cache_leaf']
             and git(cache, 'cat-file', '-e', task['base_commit'] + '^{commit}').returncode == 0,
             f'cache-or-task:{ordinal}')
        origin = git(cache, 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             f'origin:{ordinal}')
        suffix = f'pr10-mixed-{ordinal:02d}'
        root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not root.exists(), f'root-exists:{ordinal}')
        pairs.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'source': task['source'],
                      'language': task['language'], 'base_commit': task['base_commit'],
                      'suffix': suffix, 'root': str(root), 'cache_name': cache_row['cache_leaf'],
                      'cache_base': '/tmp/are-g02-r10-task-caches-r3/cache'})
    source_files = sorted(p for p in TOOLS.iterdir() if p.is_file() and
                          (p.suffix in ('.mjs', '.py') or p.name == 'product-replication-gitconfig'))
    hashes = {p.name: sha(p) for p in source_files}
    need(all(name in hashes for name in ('prepare-prospective.mjs', 'run-and-score-pair.mjs',
         'run_dsh_control.py', 'project-g02-r10-mixed-pruning-r1.py',
         'product-replication-gitconfig')), 'tools-shape')
    payload = {
        'schema_version': 'are.g02-product-replication-definition/v10',
        'status': 'frozen-before-model-dispatch', 'campaign_id': 'g02-product-replication-r10',
        'objective': 'Development-only matched native File-/Span-F1 and all-in efficiency comparison: fixed ARE 64 MiB source index plus deletion-only policy versus read/search-only DSH.',
        'population': 'Six each: Ansible Pro, Django Verified, Sympy Verified, Svelte Multi; evaluator-only eligibility counts inspected before source-ranked selection; no model scores used.',
        'ordered_pairs': pairs, 'source_receipt_sha256': INPUT_SHA,
        'tools_manifest_sha256': TOOLS_SHA,
        'projector_qualification_sha256': PROJECTOR_QUALIFICATION_SHA,
        'readiness_sha256': READY_SHA, 'freeze_script_sha256': sha(__file__),
        'tools_root': str(TOOLS), 'tool_source_sha256': hashes,
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
        'primary_quality': ['paired native Span-F1 ARE minus DSH', 'paired native File-F1 ARE minus DSH'],
        'efficiency': ['total known model-token ratio ARE/DSH',
                       'summed arm-time ratio ARE/DSH including policy projection'],
        'analysis': {'unit': 'task', 'resampling': 'paired stratified bootstrap by repository',
                     'resamples': 20000, 'seed': 'first eight hex digits of this definition SHA-256',
                     'interval': '2.5th/97.5th percentile'},
        'directional_claim_gate': 'All 24 valid; native Span- and File-F1 paired 95% intervals wholly above zero; known-token and arm-time ratio 95% intervals wholly below one; independent audit and no unresolved label-integrity issue.',
        'run_policy': 'Serial fixed order, one dispatch each, preserve failures, no replacement or automatic retry, stop on unknown provider usage or storage safety failure; per-pair verified WSL cold copy before exact scratch reclaim.',
        'scratch_root': str(RUN_ROOT), 'scratch_start_floor_bytes': 2 * 1024**3,
        'private_cold_archive_root': ARCHIVE,
        'claim_ceiling': 'Development-only freeze; no general G02, ContextBench, or product-page superiority claim from this candidate.',
        'open_questions': ['Will all 24 matched pairs settle under fixed limits?',
                           'Will all four directional intervals pass?',
                           'Does the first live pair reveal a driver integration defect missed by component checks?'],
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
