#!/usr/bin/env python3
"""Replay the runner's no-model named-objective source-binding guard."""

import hashlib
import json
import re
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r8-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
HYDRATION = ROOT / 'TASK-CACHE-HYDRATION.json'
TOOLS = BASE / 'g02-r8-mixed-source-tools-r1/MIXED-SOURCE-TOOLS.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
OUTPUT = ROOT / 'SOURCE-BINDING-PREFLIGHT.json'
CANDIDATE_SHA = 'da2c3e68c1f62da2198bfbf89c598029af898ea7cacc523f516009e9fa307196'
HYDRATION_SHA = '3c1aa620dbc84c75e3e17fb09b8456ca8c7c25e93cc47e4fe20af2c22f4ef893'
TOOLS_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(CANDIDATE) != CANDIDATE_SHA or \
            sha(HYDRATION) != HYDRATION_SHA or sha(TOOLS) != TOOLS_SHA or \
            sha(PARQUET) != PARQUET_SHA:
        raise ValueError('g02-r8-source-binding.input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = {r['ordinal']: r for r in json.loads(HYDRATION.read_text())['results']}
    ids = {r['instance_id'] for r in tasks}
    issues = {r['instance_id']: r['problem_statement'] for r in
              pq.read_table(PARQUET, columns=['instance_id', 'problem_statement']).to_pylist()
              if r['instance_id'] in ids}
    if len(tasks) != 24 or len(caches) != 24 or len(issues) != 24:
        raise ValueError('g02-r8-source-binding.shape')
    rows = []
    for task in tasks:
        ordinal = task['ordinal']
        cache = caches[ordinal]['cache_path']
        if caches[ordinal]['base_commit'] != task['base_commit']:
            raise ValueError('g02-r8-source-binding.cache-binding')
        names = list(dict.fromkeys(re.findall(
            r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b', issues[task['instance_id']])))[:12]
        found = 0
        for name in names:
            result = subprocess.run(['git', '-C', cache, 'grep', '-q', '-F',
                                     name, task['base_commit'], '--'], capture_output=True)
            if result.returncode not in (0, 1):
                raise ValueError('g02-r8-source-binding.git-grep:' + str(ordinal))
            found += result.returncode == 0
        rows.append({'ordinal': ordinal, 'repo': task['repo'],
                     'named_identifiers': len(names), 'found_in_base': found,
                     'admissible': len(names) < 2 or found > 0})
    payload = {'schema_version': 'are.g02-r8-source-binding-preflight/v1',
               'posture': 'source-only-no-model-no-gold-path-no-score',
               'candidate_sha256': CANDIDATE_SHA,
               'task_cache_hydration_sha256': HYDRATION_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'parquet_sha256': PARQUET_SHA, 'script_sha256': sha(__file__),
               'task_count': len(rows), 'admissible_count': sum(r['admissible'] for r in rows),
               'rows': rows,
               'guard_note': 'Replays run-and-score-pair.mjs named CamelCase source-binding guard before model dispatch; no identifier text exported.',
               'claim_ceiling': 'Source-binding preflight only; no model, score or superiority.',
               'open_questions': ['Will all prepared task roots and full arms complete?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'tasks': len(rows), 'admissible': payload['admissible_count'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
