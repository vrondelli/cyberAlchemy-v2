#!/usr/bin/env python3
"""Evaluator-only actual-index reachability for r9's one new task."""

import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r9-source-successor-r1'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PARQUET = UPSTREAM / 'data/full.parquet'
INDEX_AUDITOR = BASE / 'g02-r4-cohort-code-r1/audit-g02-r8-worktree-reachability-r1.py'
SCRATCH = Path('/tmp/are-g02-r9-evaluator-worktree-r1')
OUTPUT = ROOT / 'REPLACEMENT-INDEX-REACHABILITY.json'
PREFLIGHT_SHA = 'ed2fac9d1391566441b5c189490a52d6aee59d8f2d04fee04d4c28053f58c61a'
INDEX_AUDITOR_SHA = '7e0e16ff17d7a29c8cc45790c4362e61896fdef77ef7883192584f25000439f2'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, why):
    if not ok:
        raise ValueError('g02-r9-replacement-reachability.' + why)


def main():
    need(not OUTPUT.exists() and not SCRATCH.exists() and
         sha(ROOT / 'SELECTION-ONLY-PREFLIGHT.json') == PREFLIGHT_SHA and
         sha(INDEX_AUDITOR) == INDEX_AUDITOR_SHA and
         sha(PARQUET) == PARQUET_SHA, 'input-or-output-drift')
    preflight = json.loads((ROOT / 'SELECTION-ONLY-PREFLIGHT.json').read_text())
    task = json.loads((ROOT / 'CANDIDATE.json').read_text())['ordered_tasks'][0]
    cache = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())['results'][0]
    expected = preflight['rows'][0]['index']
    need(task['instance_id'] == cache['instance_id'] and
         task['base_commit'] == cache['base_commit'], 'task-binding')
    need(shutil.disk_usage('/tmp').free >= 2 * 1024**3, 'scratch-reserve')
    SCRATCH.mkdir(mode=0o700)
    command = ('git clone --no-local --no-checkout /cache/' + cache['cache_leaf'] +
               ' /out/work && git -C /out/work checkout --detach ' + task['base_commit'])
    cloned = subprocess.run(['docker', 'run', '--rm', '--network', 'none',
                             '--memory', '1g', '--cpus', '1',
                             '-v', '/tmp/are-g02-r9-source-caches-r1/cache:/cache:ro',
                             '-v', str(SCRATCH) + ':/out', IMAGE, 'sh', '-c', command],
                            capture_output=True, text=True, timeout=300)
    need(cloned.returncode == 0, 'checkout:' + cloned.stderr[-250:])
    spec = importlib.util.spec_from_file_location('r8_index_auditor', INDEX_AUDITOR)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    indexed, used, tracked, omitted = module.indexed_paths(SCRATCH / 'work')
    agreement = len(indexed) == expected['indexed_files'] and \
        used == expected['indexed_bytes']
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    gold = set(GoldLoader(str(PARQUET)).get(task['instance_id']).files())
    need(gold and agreement, 'index-or-gold')
    payload = {
        'schema_version': 'are.g02-r9-replacement-index-reachability/v1',
        'posture': 'evaluator-only-no-gold-path-export-no-model-no-score',
        'preflight_sha256': PREFLIGHT_SHA, 'parquet_sha256': PARQUET_SHA,
        'index_auditor_sha256': INDEX_AUDITOR_SHA, 'script_sha256': sha(__file__),
        'instance_id': task['instance_id'], 'base_commit': task['base_commit'],
        'tracked_count': tracked, 'indexed_count': len(indexed),
        'indexed_bytes': used, 'index_total_agreement': agreement,
        'gold_files': len(gold), 'gold_indexed': len(gold & indexed),
        'gold_not_indexed': len(gold - indexed),
        'other_omissions': dict(sorted(omitted.items())),
        'claim_ceiling': 'Evaluator-only index reachability for replacement; not agent acquisition, model, score or superiority.',
        'open_questions': ['Will the agent acquire and select the reachable references?'],
    }
    shutil.rmtree(SCRATCH / 'work')
    SCRATCH.rmdir()
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'audited', 'sha256': sha(OUTPUT),
                      'gold_indexed': payload['gold_indexed'],
                      'gold_files': payload['gold_files']}))


if __name__ == '__main__':
    main()
