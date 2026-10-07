#!/usr/bin/env python3
"""No-model replay of the frozen G02 pair driver's named-source admission."""

import hashlib
import json
import re
import subprocess
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
FREEZE = BASE / 'g02-product-replication-r4/DEFINITION.json'
PARQUET = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet'
OUTPUT = BASE / 'g02-product-replication-r4/SOURCE-BINDING-PREFLIGHT.json'
FREEZE_SHA = '0ee5e493a701e5514a33258cb7db0933e821d567875709a4e23ae7f87fb55199'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
NAMED = re.compile(r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r4-source-binding.{reason}')


def main():
    need(sha(FREEZE) == FREEZE_SHA and sha(PARQUET) == PARQUET_SHA and
         not OUTPUT.exists(), 'input-or-output-drift')
    freeze = json.loads(FREEZE.read_text())
    problems = {row['instance_id']: row for row in
                pq.read_table(PARQUET, columns=['instance_id', 'problem_statement']).to_pylist()}
    rows = []
    for task in freeze['ordered_pairs']:
        issue = problems[task['instance_id']]['problem_statement']
        named = list(dict.fromkeys(NAMED.findall(issue)))[:12]
        cache = Path(task['cache_base']) / 'cache' / task['cache_name']
        found = 0
        for value in named:
            result = subprocess.run(['git', '-C', str(cache), 'grep', '-q', '-F',
                                     value, task['base_commit'], '--'], capture_output=True)
            need(result.returncode in (0, 1), f'git-grep:{task["ordinal"]}')
            found += result.returncode == 0
        disposition = 'unbound-named-objective' if len(named) >= 2 and found == 0 else 'admissible'
        rows.append({'ordinal': task['ordinal'], 'instance_id': task['instance_id'],
                     'repo': task['repo'], 'named_identifiers': len(named),
                     'found_in_base': found, 'disposition': disposition})
    need(len(rows) == 24, 'denominator')
    payload = {'schema_version': 'are.g02-r4-source-binding-preflight/v1',
               'status': 'source-only-admission-audited',
               'freeze_sha256': FREEZE_SHA, 'parquet_sha256': PARQUET_SHA,
               'script_sha256': sha(__file__), 'rows': rows,
               'admissible': sum(row['disposition'] == 'admissible' for row in rows),
               'unbound': sum(row['disposition'] == 'unbound-named-objective' for row in rows),
               'claim_ceiling': 'Source-only driver admission preflight; no model, gold, native score, or superiority result.',
               'open_questions': ['Does every valid source-admitted task settle as a paired scored result?',
                                  'Will frozen quality and efficiency intervals support a claim?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'admissible': payload['admissible'], 'unbound': payload['unbound'],
                      'sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
