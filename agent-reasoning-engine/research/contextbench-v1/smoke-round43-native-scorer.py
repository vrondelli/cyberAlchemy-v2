#!/usr/bin/env python3
"""Gold-blind, zero-model-call native scorer smoke test for every Round 43 identity."""
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
SELECTION = json.loads((ROOT / 'round43-task-selection.json').read_text())
INVENTORY = json.loads((ROOT / 'round43-repository-inventory.json').read_text())
UPSTREAM = Path.home() / '.local/share/are/contextbench-upstream-117'
GOLD = UPSTREAM / 'data/full.parquet'
SCORER = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py'
PYTHON = Path.home() / '.local/share/are/contextbench-venv-117/bin/python'
CACHE = Path.home() / '.local/share/are/contextbench-retained-v1/contextbench-round43-scorer-smoke-cache'
WORK_ROOT = Path.home() / '.local/share/are/contextbench-retained-v1/contextbench-round43-scorer-smoke-work'


def run(args, **kwargs):
    return subprocess.run(args, text=True, capture_output=True, check=False, **kwargs)


def public_probe(repo: Path, commit: str) -> str:
    result = run(['git', '-C', str(repo), 'ls-tree', '-r', '--name-only', commit])
    if result.returncode:
        raise RuntimeError('round43.smoke-ls-tree')
    paths = [path for path in result.stdout.splitlines() if path and not path.endswith('/')]
    preferred = [path for path in paths if Path(path).suffix.lower() in {'.c', '.cc', '.cpp', '.go', '.js', '.py', '.rs', '.ts', '.tsx', '.h', '.hpp'}]
    if not (preferred or paths):
        raise RuntimeError('round43.smoke-no-public-file')
    return sorted(preferred or paths)[0]


CACHE.mkdir(parents=True, exist_ok=True)
inventory = {row['instance_id']: row for row in INVENTORY['repositories']}
rows = []
with tempfile.TemporaryDirectory(prefix='are-round43-native-smoke-') as directory:
    temporary = Path(directory)
    for index, task in enumerate(SELECTION['tasks']):
        source = inventory[task['instance_id']]
        probe = public_probe(Path(source['cache_path']), task['base_commit'])
        prediction = {
            'instance_id': task['instance_id'],
            'repo_url': task['repo_url'],
            'commit': task['base_commit'],
            'traj_data': {'pred_steps': [{'files': [probe], 'spans': {probe: [{'start': 1, 'end': 1}]}}], 'pred_files': [probe], 'pred_spans': {probe: [{'start': 1, 'end': 1}]}},
            'model_patch': '',
        }
        pred_path, out_path = temporary / f'{index}-pred.json', temporary / f'{index}-score.json'
        pred_path.write_text(json.dumps(prediction) + '\n')
        environment = dict(os.environ, CONTEXTBENCH_TMP_ROOT=str(WORK_ROOT))
        result = run([str(PYTHON), str(SCORER), '--upstream', str(UPSTREAM), '--gold', str(GOLD), '--pred', str(pred_path), '--cache', str(CACHE), '--out', str(out_path)], timeout=300, env=environment)
        rows.append({'instance_id': task['instance_id'], 'status': 'scoreable' if result.returncode == 0 and out_path.exists() else 'failed', 'scorer_exit_code': result.returncode, 'public_probe_sha256': hashlib.sha256(probe.encode()).hexdigest(), 'model_calls': 0})
        if rows[-1]['status'] != 'scoreable':
            raise RuntimeError('round43.native-smoke:' + task['instance_id'] + ':' + result.stderr[-500:])

cache_bytes = sum(path.stat().st_size for path in CACHE.rglob('*') if path.is_file())
work_bytes = sum(path.stat().st_size for path in WORK_ROOT.rglob('*') if path.is_file()) if WORK_ROOT.exists() else 0
shutil.rmtree(CACHE)
if WORK_ROOT.exists():
    shutil.rmtree(WORK_ROOT)
artifact = {
    'schema_version': 'are.contextbench-round43-native-scorer-smoke/v1',
    'status': 'passed',
    'rows': rows,
    'passed': len(rows),
    'scheduled': len(SELECTION['tasks']),
    'gold_disclosure': 'none; native scores and gold-derived locations were discarded inside temporary storage',
    'cache_cleanup': {'paths': [str(CACHE), str(WORK_ROOT)], 'bytes_removed': cache_bytes + work_bytes, 'removed': True, 'reconstructible': True},
    'model_calls': 0,
    'authority_effect': 'none',
    'open_questions_ref': 'PLAN-round43.md#open-questions',
}
(ROOT / 'round43-native-scorer-smoke.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'status': artifact['status'], 'passed': artifact['passed'], 'scheduled': artifact['scheduled'], 'cache_bytes_removed': cache_bytes + work_bytes}))
