#!/usr/bin/env python3
"""Freeze one exposed control-only DSH output-cap diagnostic, without gold."""

import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


INSTANCE = 'SWE-Bench-Pro__python__maintenance__bugfix__58ff6ae6'
COMMIT = '02e00aba3fd7b646a4f6d6af72159c2b366536bf'
ROOT = Path('/tmp/are-g02-r4-runs/g02-dsh-maxout-diag-ans-58ff6ae6')
PARQUET = Path('/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet')
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
TOOLS = Path('/opt/are/evolution-runtime/g02-product-replication-tools-r4-dsh-maxout-r2')
CACHE_BASE = Path('/opt/are-harness-benchmark/g02-fresh-pair-r4-preflight-20260929')
RUNNER_SHA = '9289a7c1df22f934eaded83cf8d24246ed83cbf23f315ec7d918b6c09314292b'
FIXED_SHA = 'b87907d5ad069bcbff24e31fd7c3263405a670293399bae89336c0cb47c55cd5'
TASK_SHA = 'b61c73cf53d9a6527659b5f49f8f06e1cfd49b8076eeeba183f418f033fc1cc6'
SOURCE_SHA = 'a457558786523967da41a0a502c70963e85c390ebb550e27d64b7df39dbcfbe7'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, sort_keys=True, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())


def main():
    if (not ROOT.parent.is_mount() or ROOT.exists() or
            shutil.disk_usage(ROOT.parent).free < 8 * 1024**3 or
            shutil.disk_usage('/').free < 500 * 1024**2):
        raise ValueError('dsh-maxout.preflight-storage-or-reuse')
    for path, expected in ((PARQUET, PARQUET_SHA),
                           (TOOLS / 'run_dsh_control.py', RUNNER_SHA),
                           (TOOLS / 'run_fixed_pair.py', FIXED_SHA),
                           (TOOLS / 'DSH-MAXOUT-SOURCE.json', SOURCE_SHA)):
        if sha(path) != expected:
            raise ValueError(f'dsh-maxout.source-drift:{path}')
    rows = [row for row in pq.read_table(PARQUET,
            columns=['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
                     'base_commit', 'problem_statement', 'source']).to_pylist()
            if row['instance_id'] == INSTANCE]
    if len(rows) != 1 or rows[0]['base_commit'] != COMMIT or rows[0]['repo'] != 'ansible/ansible':
        raise ValueError('dsh-maxout.task-identity')
    task_bytes = (json.dumps(rows[0], indent=2) + '\n').encode()
    if hashlib.sha256(task_bytes).hexdigest() != TASK_SHA:
        raise ValueError('dsh-maxout.task-bytes-drift')
    if subprocess.run(['git', '-C', str(CACHE_BASE / 'cache/ansible'), 'cat-file',
                       '-e', COMMIT + '^{commit}'], capture_output=True).returncode != 0:
        raise ValueError('dsh-maxout.cache-commit-missing')
    ROOT.mkdir(mode=0o700)
    (ROOT / 'tasks').mkdir()
    (ROOT / 'code').mkdir()
    task_path = ROOT / 'tasks' / (INSTANCE + '.json')
    with task_path.open('xb') as stream:
        stream.write(task_bytes)
        stream.flush()
        os.fsync(stream.fileno())
    for name in ('run_fixed_pair.py', 'run_dsh_control.py'):
        shutil.copy2(TOOLS / name, ROOT / 'code' / name)
    binding = {
        'instance_id': INSTANCE,
        'task_file': task_path.name,
        'task_sha256': TASK_SHA,
        'base_commit': COMMIT,
        'cache': 'ansible',
        'cache_base': str(CACHE_BASE),
        'experiment_id': 'g02-dsh-maxout-diag-ans-58ff6ae6',
        'container_name': 'are-g02-dsh-maxout-diag-ans-58ff6ae6',
    }
    write(ROOT / 'tasks/binding.json', binding)
    freeze = {
        'schema_version': 'are.g02-dsh-maxout-exposed-diagnostic/v1',
        'status': 'frozen-before-model-dispatch',
        'posture': 'previously exposed r4 pair-1 task; control-only reliability test',
        'task': INSTANCE,
        'base_commit': COMMIT,
        'source_parquet_sha256': PARQUET_SHA,
        'task_sha256': TASK_SHA,
        'binding_sha256': sha(ROOT / 'tasks/binding.json'),
        'run_fixed_pair_sha256': FIXED_SHA,
        'run_dsh_control_sha256': RUNNER_SHA,
        'source_manifest_sha256': SOURCE_SHA,
        'model': 'glm-5.3-flash',
        'context_window': 1000000,
        'output_cap': 16384,
        'token_budget': 1000000,
        'automatic_retries': 0,
        'gold_posture': 'No gold or scoring accessed in this diagnostic.',
        'success': 'DSH exits 0 and makes a final source selection without max-tokens; transport has known complete usage.',
        'claim_ceiling': 'Reliability qualification only; not a matched quality pair or fresh result.',
    }
    write(ROOT / 'FREEZE.json', freeze)
    print(json.dumps({'root': str(ROOT), 'freeze_sha256': sha(ROOT / 'FREEZE.json'),
                      'binding_sha256': freeze['binding_sha256'], 'status': freeze['status']}))


if __name__ == '__main__':
    main()
