#!/usr/bin/env python3
"""Freeze one previously attempted r7 ID as an exposed reliability diagnostic."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r7-screening-pool-r1'
TOOLS = BASE / 'g02-r7-cache-access-dev-tools-r1'
OUTPUT = BASE / 'g02-r7-cache-access-dev-pair-r1/FREEZE.json'
PAIR_ROOT = Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr7-mixed-devfix-01')
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
HYDRATION_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'
TOOLS_SHA = '200ab60f18f3e8ec831b987fbbd9ff59ee5112003ca2501c30a81b88d73a8fc1'
READY = BASE / 'g01-r8-provider-readiness/probe_20261001_g02_r8_before_freeze/READY.json'
READY_SHA = '08ab8a2aefa5ce196bd218eac2e1cd03b4fb5c312331ebb36151afa2877f289d'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or PAIR_ROOT.exists() or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != HYDRATION_SHA or \
            sha(TOOLS / 'CACHE-ACCESS-DEV-TOOLS.json') != TOOLS_SHA or \
            sha(READY) != READY_SHA:
        raise ValueError('g02-r7-cache-dev-freeze.input-or-output-drift')
    task = json.loads((ROOT / 'CANDIDATE.json').read_text())['ordered_tasks'][0]
    cache = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())['results'][0]
    if task['ordinal'] != 1 or cache['ordinal'] != 1 or \
            task['instance_id'] != cache['instance_id'] or \
            task['base_commit'] != cache['base_commit']:
        raise ValueError('g02-r7-cache-dev-freeze.task-binding')
    tool_hashes = {p.name: sha(p) for p in TOOLS.iterdir() if p.is_file() and
                   (p.suffix in ('.mjs', '.py') or
                    p.name == 'product-replication-gitconfig')}
    payload = {'schema_version': 'are.g02-r7-cache-access-dev-pair-freeze/v1',
               'status': 'frozen-before-model-dispatch',
               'posture': 'evaluator-exposed-reliability-diagnostic-after-terminal-r7',
               'instance_id': task['instance_id'], 'repo': task['repo'],
               'base_commit': task['base_commit'], 'cache_leaf': cache['cache_leaf'],
               'suffix': 'pr7-mixed-devfix-01', 'pair_root': str(PAIR_ROOT),
               'candidate_sha256': CANDIDATE_SHA,
               'hydration_sha256': HYDRATION_SHA,
               'tools_manifest_sha256': TOOLS_SHA,
               'readiness_sha256': READY_SHA,
               'tool_source_sha256': tool_hashes,
               'freeze_script_sha256': sha(__file__),
               'one_attempt_no_retry': True,
               'claim_ceiling': 'Exposed infrastructure qualification only; does not alter r7 terminal failure, create an untouched pair, or support superiority.',
               'open_questions': ['Will both arms complete and seal under repaired cache access?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'instance_id': task['instance_id']}))


if __name__ == '__main__':
    main()
