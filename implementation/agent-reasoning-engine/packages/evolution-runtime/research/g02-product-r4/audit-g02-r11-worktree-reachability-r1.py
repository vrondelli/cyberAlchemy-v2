#!/usr/bin/env python3
"""Bind pinned evaluator-only worktree audit to fresh r11 source receipts."""

import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CORE = BASE / 'g02-r10-dev-pool-code-r1/audit-g02-r10-worktree-reachability-r1.py'
CORE_SHA = '710b25548f917d91a98c4931bd38731b8b506911ec4693b87f2fe9df6f44eee8'
ROOT = BASE / 'g02-r11-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-CLONE-PREFLIGHT-R1.json'
SOURCE = ROOT / 'SOURCE-INDEX-PREFLIGHT-R2.json'
OUTPUT = ROOT / 'WORKTREE-INDEX-REACHABILITY-R1.json'
BINDING = ROOT / 'WORKTREE-INDEX-REACHABILITY-R1-BINDING.json'
SCRATCH = Path('/tmp/are-g02-r11-evaluator-worktree-r1')
CACHE_ROOT = Path('/tmp/are-g02-r11-task-caches-r1/cache')
PINS = {
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    SOURCE: '53ab7d90825df5c0f9e41b316b1d14787e6315e5ca88c66def742aa57ecfab70',
    BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream/data/full.parquet':
        '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    Path('/tmp/are-g02-r4-runs/g02-cross-layer-pr4-own-expansions-preflight-r1/code/base-overlay.mjs'):
        '1389c7a3fbdc096463787614778c4b9087104ef252c54659d542c68874e91c89',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if (sha(CORE) != CORE_SHA or OUTPUT.exists() or BINDING.exists() or
            SCRATCH.exists()):
        raise ValueError('g02-r11-reachability.input-output-or-source-drift')
    spec = importlib.util.spec_from_file_location('g02_r10_reachability_core', CORE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.CANDIDATE = CANDIDATE
    module.CACHES = CACHES
    module.SOURCE = SOURCE
    module.OUTPUT = OUTPUT
    module.SCRATCH = SCRATCH
    module.CACHE_ROOT = CACHE_ROOT
    module.PINS = PINS
    module.main()
    audit = json.loads(OUTPUT.read_text())
    if (audit['status'] != 'audited' or audit['task_count'] != 24 or
            audit['script_sha256'] != CORE_SHA):
        raise ValueError('g02-r11-reachability.core-result-drift')
    payload = {
        'schema_version': 'are.g02-r11-worktree-reachability-binding/v1',
        'status': 'audited', 'core_sha256': CORE_SHA,
        'wrapper_sha256': sha(__file__), 'reachability_sha256': sha(OUTPUT),
        'candidate_sha256': PINS[CANDIDATE],
        'cache_receipt_sha256': PINS[CACHES],
        'source_index_receipt_sha256': PINS[SOURCE],
        'task_count': 24, 'totals': audit['totals'],
        'index_total_agreement': audit['reachability_valid'],
        'model_calls': 0, 'gold_paths_exported': False,
        'claim_ceiling': 'Evaluator-only reference-count reachability; no task-specific gold paths, model result, native score, or superiority.',
        'open_questions': ['Are any missing references absent from exact base commits?',
                           'Will the future live agent acquire and select reachable files?'],
    }
    with BINDING.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    BINDING.chmod(0o600)
    print(json.dumps({'status': 'audited', 'reachability_sha256': sha(OUTPUT),
                      'binding_sha256': sha(BINDING), 'totals': audit['totals']}))


if __name__ == '__main__':
    main()
