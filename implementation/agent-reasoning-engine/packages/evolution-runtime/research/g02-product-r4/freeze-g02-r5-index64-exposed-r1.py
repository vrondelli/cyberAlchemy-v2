#!/usr/bin/env python3
"""Freeze one evaluator-exposed 64 MiB G02 development pair before dispatch."""

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g02-r5-fresh-cohort-candidate-r1/CANDIDATE.json'
INDEX_AUDIT = BASE / 'g02-r5-fresh-cohort-candidate-r1/INDEX-BUDGET-AUDIT.json'
TOOLS = BASE / 'g02-r5-index64-development-tools-r2'
SOURCE_MANIFEST = TOOLS / 'INDEX64-DEV-SOURCE-R2.json'
READY = BASE / 'g01-r8-provider-readiness/probe_20261001_g02_r5_index64/READY.json'
OUTPUT = BASE / 'g02-r5-index64-exposed-ans-2464eadb-r1/FREEZE.json'
PAIR_ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr5-index64-ans-2464eadb')
CANDIDATE_SHA = 'a6bfe7c3ed6f4f87e70e6f30bf67790e3edfc26f7f9322c18aa129f3b61488c0'
INDEX_AUDIT_SHA = '137df8750a6e6f6e7f6a97b9442a0d8a29bca5aacf8c66a5bc99097f5d7ba78a'
SOURCE_MANIFEST_SHA = '52324ded43509fed03e5b29578dff6b426c88697086dcacdce385bb82d5ff5ad'
READY_SHA = '1ed1f6d219b5decbf78e46fa1fb082cbc90b61cbeff04c2f0abeb76d0b405fe3'
TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__2464eadb'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r5-index64-freeze.{reason}')


def main():
    need(not OUTPUT.exists() and not PAIR_ROOT.exists() and
         sha(CANDIDATE) == CANDIDATE_SHA and sha(INDEX_AUDIT) == INDEX_AUDIT_SHA and
         sha(SOURCE_MANIFEST) == SOURCE_MANIFEST_SHA and sha(READY) == READY_SHA,
         'source-or-output-drift')
    need(os.path.ismount(PAIR_ROOT.parent) and
         shutil.disk_usage(PAIR_ROOT.parent).free >= 8 * 1024**3 and
         shutil.disk_usage('/').free >= 500 * 1024**2, 'storage-floor')
    cohort = json.loads(CANDIDATE.read_text())
    pair = next(p for p in cohort['ordered_pairs'] if p['instance_id'] == TASK_ID)
    need(pair['repo'] == 'ansible/ansible' and pair['base_commit'] ==
         'db2d5b09eff918e981c9e10787a5f2c500d1784f', 'task-identity')
    cache = Path(pair['cache_base']) / 'cache' / pair['cache_name']
    need(subprocess.run(['git', '-C', str(cache), 'cat-file', '-e',
                         pair['base_commit'] + '^{commit}'], capture_output=True).returncode == 0,
         'commit-missing')
    ready = json.loads(READY.read_text())
    need(ready['status'] == 'ready' and ready['tokenizer']['status'] == 200 and
         ready['tiny_generation']['status'] == 200, 'provider-not-ready')
    source_files = sorted(p for p in TOOLS.iterdir() if p.is_file() and
                          p.suffix in ('.mjs', '.py'))
    tool_hashes = {p.name: sha(p) for p in source_files}
    need(len(tool_hashes) >= 11 and
         all(name in tool_hashes for name in ('prepare-prospective.mjs',
                                               'build-own-expansions-base.mjs',
                                               'run-and-score-pair.mjs',
                                               'run_dsh_control.py')), 'tools-shape')
    payload = {'schema_version': 'are.g02-index64-exposed-pair-freeze/v1',
               'status': 'frozen-before-model-dispatch',
               'posture': 'evaluator-exposed-development-not-replication',
               'instance_id': TASK_ID, 'repo': pair['repo'],
               'base_commit': pair['base_commit'],
               'suffix': 'pr5-index64-ans-2464eadb', 'root': str(PAIR_ROOT),
               'candidate_sha256': CANDIDATE_SHA,
               'index_audit_sha256': INDEX_AUDIT_SHA,
               'freeze_script_sha256': sha(__file__),
               'source_manifest_sha256': SOURCE_MANIFEST_SHA,
               'readiness_sha256': READY_SHA,
               'tools_root': str(TOOLS), 'tool_source_sha256': tool_hashes,
               'environment': {'G02_TOOLS_ROOT': str(TOOLS), 'G02_REPO': pair['repo'],
                               'G02_OWN_EXPANSIONS': '1', 'G02_GO_PACKET': '0',
                               'G02_RETENTION': '0', 'G02_SELECTIVE_RETENTION': '0',
                               'G02_EXPOSED': '1', 'G02_RETRY_CONTROL': '0'},
               'changed_candidate_setting': {'source_index_budget_mib': [32, 64]},
               'comparator_setting': {'dsh_default_max_tokens': 16384,
                                      'dsh_model_max_tokens': 16384},
               'arm_limits': {'model': 'glm-5.3-flash', 'request_window_tokens': 8192,
                              'are_known_token_cap': 650000,
                              'dsh_known_token_cap': 1000000,
                              'automatic_model_retries': 0},
               'objective': 'Observe whether a larger source index yields a valid, useful ARE selection on an evaluator-exposed Ansible task with one reference file outside the 32 MiB index.',
               'validity': 'One paired attempt; seal predictions and costs before native scoring; preserve every failed arm and no adaptive retry.',
               'claim_ceiling': 'One exposed development pair only; no attribution to index budget without matched 32 MiB ARE run and no superiority claim.',
               'open_questions': ['Will ARE select the newly index-reachable file?',
                                  'Will both arms settle and score under 1 GiB container and 16K DSH output cap?']}
    OUTPUT.parent.mkdir(parents=True, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'task': TASK_ID, 'tools': len(tool_hashes)}))


if __name__ == '__main__':
    main()
