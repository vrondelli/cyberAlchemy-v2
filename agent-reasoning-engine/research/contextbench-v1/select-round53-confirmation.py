#!/usr/bin/env python3
"""Select an untouched, scoreable confirmation cohort from the reserved partition."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pyarrow.parquet as parquet

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
IMPL = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1'
ROUND = int(sys.argv[1]) if len(sys.argv) > 1 else 53
TASK_ROOT = IMPL / f'confirmation-tasks-round{ROUND}'
UPSTREAM = Path('/home/vrondelli/.local/share/are/contextbench-upstream-117')
GOLD = UPSTREAM / 'data/full.parquet'
SCOREABILITY = IMPL / 'sealed-scoreability.py'
PUBLIC = ['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language', 'base_commit', 'problem_statement', 'source']
QUOTAS = {'cpp': 1, 'go': 1, 'java': 1, 'javascript': 1, 'python': 2, 'rust': 1, 'typescript': 1}
SAFETY_EXCLUDED_REPOS = {'ponylang/ponyc'}
SAFETY_EXCLUDED_IDS = {
    'Multi-SWE-Bench__c__maintenance__bugfix__5b90848f',
    'Multi-SWE-Bench__c__maintenance__bugfix__7a22ebc',
    'Multi-SWE-Bench__go__maintenance__bugfix__250649eb',
    'Multi-SWE-Bench__c__maintenance__bugfix__7efc43e3',
    'SWE-Bench-Verified__python__maintenance__bugfix__16c72e4c',
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

exposed = set()
matrix_refs = []
for path in sorted(ROOT.glob('*matrix*.json')):
    try:
        data = json.loads(path.read_text())
    except Exception:
        continue
    ids = {row.get('instance_id') for row in data.get('tasks', []) if row.get('instance_id')}
    if ids:
        exposed.update(ids)
        matrix_refs.append({'path': str(path.relative_to(REPO)), 'sha256': sha(path), 'task_count': len(ids)})

candidate_rows = parquet.read_table(GOLD, columns=PUBLIC).to_pylist()
candidates = [row for row in candidate_rows
              if row['instance_id'] not in exposed
              and row['repo'] not in SAFETY_EXCLUDED_REPOS
              and row['instance_id'] not in SAFETY_EXCLUDED_IDS
              and row['source'] != 'Pro']
scoreability_input = ROOT / f'round{ROUND}-scoreability-input.json'
scoreability_input.write_text(json.dumps({
    'schema_version': 'are.contextbench-scoreability-input/v1',
    'instance_ids': sorted(row['instance_id'] for row in candidates),
    'selection_fields_disclosed': PUBLIC,
    'source_partition': 'fresh-public-independent-confirmation',
    'authority_effect': 'none',
}, indent=2) + '\n')
scoreability_out = ROOT / f'round{ROUND}-sealed-scoreability.json'
run = subprocess.run([
    sys.executable, str(SCOREABILITY), '--upstream', str(UPSTREAM), '--gold', str(GOLD),
    '--input', str(scoreability_input), '--out', str(scoreability_out),
], text=True, capture_output=True)
if run.returncode:
    raise RuntimeError(run.stderr.strip())
projection = json.loads(scoreability_out.read_text())
scoreable = {row['instance_id'] for row in projection['rows'] if row['scoreable'] is True}

selected = []
selected_repos = set()
for language, quota in QUOTAS.items():
    for row in sorted((x for x in candidates if x['language'] == language and x['instance_id'] in scoreable), key=lambda x: x['instance_id']):
        if row['repo'] in selected_repos:
            continue
        selected.append(row)
        selected_repos.add(row['repo'])
        if sum(x['language'] == language for x in selected) == quota:
            break
    if sum(x['language'] == language for x in selected) != quota:
        raise RuntimeError('insufficient-confirmation-stratum:' + language)
selected.sort(key=lambda row: row['instance_id'])
if len(selected) != 8 or len(selected_repos) != 8:
    raise RuntimeError('confirmation-shape')

TASK_ROOT.mkdir(parents=True, exist_ok=False)
manifest = []
for row in selected:
    path = TASK_ROOT / (row['instance_id'] + '.json')
    path.write_text(json.dumps(row, indent=2) + '\n')
    manifest.append({'instance_id': row['instance_id'], 'file': path.name, 'sha256': sha(path)})
manifest_path = TASK_ROOT / 'manifest.json'
manifest_path.write_text(json.dumps({
    'schema_version': 'are.contextbench-task-manifest/v1',
    'partition': 'fresh-independent-confirmation',
    'tasks': manifest,
    'gold_fields_present': False,
    'projected_columns': PUBLIC,
    'sealed_scoreability_ref': str(scoreability_out.relative_to(REPO)),
    'authority_effect': 'none',
}, indent=2) + '\n')

artifact = {
    'schema_version': f'are.contextbench-round{ROUND}-task-selection/v1',
    'status': 'selected-untouched-scoreable-independent-confirmation',
    'selection_rule': 'First lexicographic never-matrix-exposed scoreable public identities satisfying fixed language quotas and eight distinct repositories. The former reserved partition was excluded because Round 30 already evaluated all of it.',
    'tasks': [dict(instance_id=row['instance_id'], repo=row['repo'], language=row['language'], source=row['source'],
                   repo_url=row['repo_url'], base_commit=row['base_commit'], task_file=str(TASK_ROOT / (row['instance_id'] + '.json')),
                   task_sha256=manifest[i]['sha256'], prior_exposure='none-in-recorded-contextbench-matrices', sealed_scoreable=True)
              for i, row in enumerate(selected)],
    'task_count': 8,
    'public_dataset_tasks': len(candidate_rows),
    'eligible_unexposed_tasks': len(candidates),
    'sealed_scoreable_tasks': len(scoreable),
    'prior_exposed_identities': len(exposed),
    'prior_matrix_refs': matrix_refs,
    'scoreability_input_ref': str(scoreability_input.relative_to(REPO)),
    'scoreability_input_sha256': sha(scoreability_input),
    'sealed_scoreability_ref': str(scoreability_out.relative_to(REPO)),
    'sealed_scoreability_sha256': sha(scoreability_out),
    'task_manifest_ref': str(manifest_path),
    'task_manifest_sha256': sha(manifest_path),
    'model_calls': 0,
    'authority_effect': 'none',
    'benchmark_cleared': False,
    'open_questions': ['Will the frozen H72 effect replicate on this untouched cohort?'],
}
(ROOT / f'round{ROUND}-task-selection.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'tasks': 8, 'identities': [row['instance_id'] for row in selected]}))
