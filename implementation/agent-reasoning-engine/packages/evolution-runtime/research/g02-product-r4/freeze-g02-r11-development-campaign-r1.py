#!/usr/bin/env python3
"""Freeze the qualified G02 r11 development-only matched cohort."""

import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r11-dev-pool-r1'
TOOLS = BASE / 'g02-r11-selection-only-tools-r1'
OUTPUT = BASE / 'g02-product-replication-r11/DEFINITION.json'
READY = BASE / 'g01-r8-provider-readiness/probe_20261002_g02_r11_before_freeze/READY.json'
PROTOCOL = BASE / 'g02-r11-protocol-r1/G02-R11-DEVELOPMENT-PROTOCOL.md'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')
ARCHIVE = '/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002'
INPUT_SHA = {
    'POOL.json': '99801b07c14fbb53a27e9d89cbba6648e12e64514bb904d4e5b7c59608878d8b',
    'NATIVE-NONEMPTY.json': 'c96816e366399395f89edb854c084e1f92c19ce9bb25db254aea2e84b8fb4214',
    'CANDIDATE.json': '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    'TASK-CACHE-CLONE-PREFLIGHT-R1.json': '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    'SOURCE-INDEX-PREFLIGHT-R2.json': '53ab7d90825df5c0f9e41b316b1d14787e6315e5ca88c66def742aa57ecfab70',
    'SOURCE-INDEX-PREFLIGHT-R2-BINDING.json': '2e4153efa778036228d48332dbb0eedef5acc9e93ed52061ccdca45448f861bc',
    'WORKTREE-INDEX-REACHABILITY-R1.json': 'cc844396e78ed89eb7d0642a72268c84319a34ceae8612f5e3c2a4eef96bd94b',
    'WORKTREE-INDEX-REACHABILITY-R1-BINDING.json': 'c22353df94211569b59a0d84ae102b7d20677d8d52003e16c22aab64c99c6421',
    'BASE-REFERENCE-CLASSIFICATION-R1.json': '35a85e1b0cfcb92c900ecf859dbada4f832cf3ece092b6dd8cc854368b2c2325',
    'PREPARE-PREFLIGHT-R1.json': 'dd277fd9ff2b022eb5764002f438b7203f41e67934fe0ec7b586f7b07776bf70',
    'SOURCE-BINDING-PREFLIGHT-R1.json': '0b9a9aa0cd22c1772d2a89f0777581d2918d5f7758261e10af1f1e6a28071497',
    'STORAGE-REHEARSAL-R1.json': '92b0ce1cd846745e5910f652c0aa04f0158875b636380c034b9943879d301e0e',
}
TOOLS_SHA = '63f51bd80ea791697821bcf4a0091100c7ca9f5e9ffa9f4fdafd1a3a7abc2501'
READY_SHA = '7cbbbc7b3c2ddf381a48ff699fa51dda29541da71e8fc82f17ebb06272fba0db'
PROTOCOL_SHA = '35436c818140d6e26ae5d52d1391ce270c86a70a3098251fbacd19539c5e8128'
REPOS = {'ansible/ansible': ('Pro', 6), 'django/django': ('Verified', 6),
         'sympy/sympy': ('Verified', 6), 'nlohmann/json': ('Multi', 6)}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-development-freeze.' + reason)


def git(cache, *args):
    return subprocess.run(['git', '-C', str(cache), *args], capture_output=True, text=True)


def main():
    need(not OUTPUT.exists() and not OUTPUT.parent.exists() and
         all(sha(SOURCE / name) == value for name, value in INPUT_SHA.items()) and
         sha(TOOLS / 'R11-TOOLS-CANDIDATE.json') == TOOLS_SHA and
         sha(READY) == READY_SHA and sha(PROTOCOL) == PROTOCOL_SHA,
         'input-or-output-drift')
    need(os.path.ismount(RUN_ROOT) and shutil.disk_usage(RUN_ROOT).free >= 2 * 1024**3
         and shutil.disk_usage('/').free >= 500 * 1024**2,
         'resource-floor')
    pool, screen, candidate = (read(SOURCE / name) for name in
                               ('POOL.json', 'NATIVE-NONEMPTY.json', 'CANDIDATE.json'))
    caches = read(SOURCE / 'TASK-CACHE-CLONE-PREFLIGHT-R1.json')
    indexed = read(SOURCE / 'SOURCE-INDEX-PREFLIGHT-R2.json')
    reach = read(SOURCE / 'WORKTREE-INDEX-REACHABILITY-R1.json')
    missing = read(SOURCE / 'BASE-REFERENCE-CLASSIFICATION-R1.json')
    prepare = read(SOURCE / 'PREPARE-PREFLIGHT-R1.json')
    binding = read(SOURCE / 'SOURCE-BINDING-PREFLIGHT-R1.json')
    storage = read(SOURCE / 'STORAGE-REHEARSAL-R1.json')
    ready = read(READY)
    tools = read(TOOLS / 'R11-TOOLS-CANDIDATE.json')
    need(pool['status'] == 'source-only-pool-not-screened-frozen-or-dispatched' and
         pool['reserved_confirmation_excluded'] == 233 and
         len(pool['ordered_pool']) == 32 and
         screen['pool_sha256'] == INPUT_SHA['POOL.json'] and
         screen['screened_count'] == 32 and
         candidate['status'] == 'eligibility-screened-candidate-not-qualified-frozen-or-dispatched' and
         candidate['selected_count'] == 24 and
         len({t['instance_id'] for t in candidate['ordered_tasks']}) == 24 and
         candidate['selected_by_repo'] == {k: n for k, (_, n) in REPOS.items()} and
         caches['status'] == 'passed' and caches['verified_count'] == 24 and
         caches['clone_count'] == 48 and
         caches['candidate_sha256'] == INPUT_SHA['CANDIDATE.json'] and
         indexed['status'] == 'passed' and indexed['tested_count'] == 24 and
         indexed['nonroot_passed'] == indexed['checkout_passed'] == indexed['index_passed'] == 24 and
         reach['status'] == 'audited' and reach['task_count'] == 24 and
         reach['reachability_valid'] is True and
         reach['totals'] == {'gold_files': 93, 'gold_indexed': 90,
                             'gold_not_indexed': 3, 'index_total_agreements': 24} and
         missing['reasons'] == {'base-present-not-indexed': 0, 'not-in-base': 3} and
         missing['missing_reference_count'] == 3 and
         prepare['status'] == 'passed' and prepare['prepared_count'] == 24 and
         prepare['candidate_sha256'] == INPUT_SHA['CANDIDATE.json'] and
         prepare['cache_receipt_sha256'] == INPUT_SHA['TASK-CACHE-CLONE-PREFLIGHT-R1.json'] and
         prepare['tools_manifest_sha256'] == TOOLS_SHA and
         binding['status'] == 'passed' and binding['task_count'] == 24 and
         binding['dispositions'] == {'admissible': 24} and
         storage['status'] == 'passed' and len(storage['rows']) == 4 and
         storage['tmp_free_after'] >= storage['minimum_after_bytes'] and
         tools['candidate_sha256'] == INPUT_SHA['CANDIDATE.json'] and
         tools['task_cache_receipt_sha256'] == INPUT_SHA['TASK-CACHE-CLONE-PREFLIGHT-R1.json'] and
         ready['status'] == 'ready' and ready['tokenizer']['status'] == 200 and
         ready['tiny_generation']['status'] == 200,
         'qualification-shape')
    pairs = []
    for task, cache in zip(candidate['ordered_tasks'], caches['results']):
        ordinal = len(pairs) + 1
        cache_path = Path(cache['cache_path'])
        need(task['ordinal'] == cache['ordinal'] == ordinal and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             task['repo'] == cache['repo'] and task['repo'] in REPOS and
             task['source'] == REPOS[task['repo']][0] and
             re.fullmatch('[0-9a-f]{40}', task['base_commit']) and
             cache_path == Path('/tmp/are-g02-r11-task-caches-r1/cache') / cache['cache_leaf'] and
             git(cache_path, 'cat-file', '-e', task['base_commit'] + '^{commit}').returncode == 0 and
             git(cache_path, 'rev-parse', '--verify', 'HEAD').stdout.strip() == task['base_commit'],
             'cache-or-task:' + str(ordinal))
        origin = git(cache_path, 'remote', 'get-url', 'origin')
        need(origin.returncode == 0 and origin.stdout.strip() == task['repo_url'],
             'origin:' + str(ordinal))
        suffix = f'pr11-mixed-{ordinal:02d}'
        root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not root.exists(), 'root-exists:' + str(ordinal))
        pairs.append({'ordinal': ordinal, 'instance_id': task['instance_id'],
                      'repo': task['repo'], 'source': task['source'],
                      'language': task['language'], 'base_commit': task['base_commit'],
                      'suffix': suffix, 'root': str(root),
                      'cache_name': cache['cache_leaf'],
                      'cache_base': '/tmp/are-g02-r11-task-caches-r1'})
    tool_files = sorted(p for p in TOOLS.iterdir() if p.is_file() and
                        (p.suffix in ('.mjs', '.py') or p.name == 'product-replication-gitconfig'))
    hashes = {p.name: sha(p) for p in tool_files}
    need(all(name in hashes for name in ('prepare-prospective.mjs', 'run-and-score-pair.mjs',
         'run_dsh_control.py', 'project-g02-r11-mixed-pruning-r1.py',
         'product-replication-gitconfig')), 'tools-shape')
    payload = {
        'schema_version': 'are.g02-product-replication-definition/v11',
        'status': 'frozen-before-model-dispatch',
        'campaign_id': 'g02-product-replication-r11',
        'objective': 'Development-only matched native File-/Span-F1 and all-in efficiency comparison: fixed ARE 64 MiB source index plus deletion-only policy versus read/search-only DSH.',
        'population': 'Six each: Ansible Pro, Django Verified, Sympy Verified, nlohmann JSON Multi; evaluator-only eligibility and base-reference counts inspected; no model scores used.',
        'ordered_pairs': pairs, 'source_receipt_sha256': INPUT_SHA,
        'protocol_sha256': PROTOCOL_SHA, 'tools_manifest_sha256': TOOLS_SHA,
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
        'validity': 'Exactly 24 ordered one-attempt pairs; all 24 require sealed predictions, native scores, complete known usage and duration. No replacement, adaptive retry, or mixed invalid subset.',
        'primary_quality': ['paired native Span-F1 ARE minus DSH',
                            'paired native File-F1 ARE minus DSH'],
        'efficiency': ['total known model-token ratio ARE/DSH',
                       'summed arm-time ratio ARE/DSH including policy projection'],
        'analysis': {'unit': 'task', 'resampling': 'paired stratified bootstrap by repository',
                     'resamples': 20000,
                     'seed': 'first eight hex digits of this definition SHA-256',
                     'interval': '2.5th/97.5th percentile'},
        'directional_claim_gate': 'All 24 valid; native Span- and File-F1 paired 95% intervals wholly above zero; known-token and arm-time ratio 95% intervals wholly below one; independent audit and no unresolved label-integrity issue.',
        'run_policy': 'Serial fixed order, one dispatch each, preserve failures, no replacement or automatic retry, stop on unknown provider usage or storage safety failure; per-pair verified WSL cold copy before exact scratch reclaim.',
        'scratch_root': str(RUN_ROOT), 'scratch_start_floor_bytes': 2 * 1024**3,
        'private_cold_archive_root': ARCHIVE,
        'claim_ceiling': 'Development-only freeze; no original ContextBench, general G02, or product-page superiority claim from this changed population.',
        'open_questions': ['Will all 24 matched pairs settle under fixed limits?',
                           'Will all four directional intervals pass?',
                           'Does the first live pair expose a post-arm integration defect missed by no-model component checks?'],
    }
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'pairs': len(pairs), 'tools': len(hashes)}))


if __name__ == '__main__':
    main()
