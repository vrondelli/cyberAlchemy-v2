#!/usr/bin/env python3
"""No-model preparation of all 24 r7 mixed-source task roots."""

import hashlib
import json
import os
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-screening-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
TOOLS = BASE / 'g02-r7-mixed-source-tools-r1'
BINDING = ROOT / 'SOURCE-BINDING-PREFLIGHT.json'
OUTPUT = ROOT / 'PREPARE-PREFLIGHT.json'
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
TOOLS_SHA = 'ebd522264e431e8b68016ca22607c059dc9e7d188d06ca043c0f52963b2d5973'
BINDING_SHA = '57d20a80685f08f94d4676ff91e049f480b9eb2548ce509bb06348d8f69b6217'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'
RUN_ROOT = Path('/tmp/are-g02-r4-runs')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r7-prepare-preflight.' + reason)


def main():
    need(not OUTPUT.exists() and sha(CANDIDATE) == CANDIDATE_SHA and
         sha(TOOLS / 'MIXED-SOURCE-TOOLS.json') == TOOLS_SHA and
         sha(BINDING) == BINDING_SHA and
         json.loads(BINDING.read_text())['admissible_count'] == 24,
         'input-or-output-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    need(len(tasks) == 24, 'denominator')
    rows = []
    status = 'passed'
    for task in tasks:
        ordinal = task['ordinal']
        suffix = 'pr7-mixed-pf-' + str(ordinal).zfill(2)
        run_root = RUN_ROOT / ('g02-cross-layer-' + suffix)
        need(not run_root.exists(), 'root-collision:' + str(ordinal))
        env = {**os.environ, 'G02_PAIR_SUFFIX': suffix,
               'G02_INSTANCE': task['instance_id'], 'G02_REPO': task['repo'],
               'G02_TOOLS_ROOT': str(TOOLS), 'G02_OWN_EXPANSIONS': '1',
               'G02_EXPOSED': '0', 'G02_RETENTION': '0',
               'G02_SELECTIVE_RETENTION': '0', 'G02_GO_PACKET': '0'}
        result = subprocess.run([NODE, str(TOOLS / 'prepare-prospective.mjs')],
                                env=env, capture_output=True, text=True, timeout=180)
        row = {'ordinal': ordinal, 'instance_id': task['instance_id'],
               'repo': task['repo'], 'suffix': suffix,
               'root': str(run_root), 'prepare_exit': result.returncode}
        if result.returncode:
            row['error_tail'] = result.stderr[-500:]
            rows.append(row)
            status = 'failed'
            print(json.dumps({'ordinal': ordinal, 'status': status,
                              'error_tail': row['error_tail']}), flush=True)
            break
        prepared = json.loads(result.stdout)
        freeze = json.loads((run_root / 'FREEZE.json').read_text())
        task_binding = json.loads((run_root / 'tasks/binding.json').read_text())
        need(prepared['root'] == str(run_root) and
             freeze['status'] == 'frozen-before-model-dispatch' and
             freeze['instance_id'] == task['instance_id'] and
             task_binding['instance_id'] == task['instance_id'] and
             task_binding['base_commit'] == task['base_commit'] and
             task_binding['cache_base'] == '/tmp/are-g02-r7-source-caches-r1' and
             task_binding['cache'].endswith(task['base_commit'][:8]),
             'prepared-binding:' + str(ordinal))
        row.update({'freeze_sha256': sha(run_root / 'FREEZE.json'),
                    'task_binding_sha256': sha(run_root / 'tasks/binding.json'),
                    'task_sha256': task_binding['task_sha256'],
                    'cache_leaf': task_binding['cache'],
                    'ranker_sha256': prepared['ranker_sha256']})
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'status': 'prepared-no-model',
                          'repo': task['repo']}), flush=True)
    payload = {'schema_version': 'are.g02-r7-prepare-preflight/v1',
               'status': status, 'posture': 'no-model-no-gold-path-no-score',
               'candidate_sha256': CANDIDATE_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'source_binding_preflight_sha256': BINDING_SHA,
               'script_sha256': sha(__file__), 'attempted_count': len(rows),
               'prepared_count': sum(row['prepare_exit'] == 0 for row in rows),
               'rows': rows,
               'claim_ceiling': 'Task preparation only; these preflight roots are not a frozen campaign or model attempts.',
               'open_questions': ['Does evaluator-only fixed-index reference reachability pass?',
                                  'Can whole-arm resource rehearsal and matched 24/24 run complete?']}
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': status, 'sha256': sha(OUTPUT),
                      'prepared': payload['prepared_count']}))


if __name__ == '__main__':
    main()
