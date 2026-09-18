#!/usr/bin/env python3
"""Select the frozen 10K confirmation cohort without disclosing gold locations."""
import hashlib
import json
import subprocess
import sys
import re
from pathlib import Path

import pyarrow.parquet as parquet

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
REPO = ROOT.parents[2]
IMPL = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1'
UPSTREAM = Path.home() / '.local/share/are/contextbench-upstream-117'
GOLD = UPSTREAM / 'data/full.parquet'
TASK_ROOT = IMPL / 'confirmation-tasks-round58'
SCOREABILITY = IMPL / 'sealed-scoreability.py'
PUBLIC = ['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language', 'base_commit', 'problem_statement', 'source']
QUOTAS = {'cpp': 1, 'go': 1, 'java': 1, 'javascript': 1, 'python': 2, 'rust': 1, 'typescript': 1}
EXCLUDED_REPOS = {'ponylang/ponyc'}
EXCLUDED_IDS = {
    'Multi-SWE-Bench__c__maintenance__bugfix__5b90848f',
    'Multi-SWE-Bench__c__maintenance__bugfix__7a22ebc',
    'Multi-SWE-Bench__go__maintenance__bugfix__250649eb',
    'Multi-SWE-Bench__c__maintenance__bugfix__7efc43e3',
    'SWE-Bench-Verified__python__maintenance__bugfix__16c72e4c',
}
SECURITY_SHAPED = re.compile(r'(?i)\b(?:password|secret|credential|exploit|vulnerability|cve-\d+|malware)\b')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

exposed, matrix_refs = set(), []
for path in sorted([*ROOT.glob('*matrix*.json'), *HERE.glob('*matrix*.json')]):
    try:
        data = json.loads(path.read_text())
    except Exception:
        continue
    identities = {row.get('instance_id') for row in data.get('tasks', []) if row.get('instance_id')}
    if identities:
        exposed.update(identities)
        matrix_refs.append({'path': str(path.relative_to(REPO)), 'sha256': sha(path), 'task_count': len(identities)})

all_rows = parquet.read_table(GOLD, columns=PUBLIC).to_pylist()
candidates = [row for row in all_rows
              if row['instance_id'] not in exposed
              and row['repo'] not in EXCLUDED_REPOS
              and row['instance_id'] not in EXCLUDED_IDS
              and row['source'] != 'Pro'
              and not SECURITY_SHAPED.search(row['problem_statement'])
              and all(isinstance(row[key], str) and row[key] for key in PUBLIC)]
input_path = HERE / 'round58-scoreability-input.json'
input_path.write_text(json.dumps({
    'schema_version': 'are.contextbench-scoreability-input/v1',
    'instance_ids': sorted(row['instance_id'] for row in candidates),
    'selection_fields_disclosed': PUBLIC,
    'source_partition': 'fresh-10k-confirmation',
    'authority_effect': 'none',
}, indent=2) + '\n')
projection_path = HERE / 'round58-sealed-scoreability.json'
run = subprocess.run([sys.executable, str(SCOREABILITY), '--upstream', str(UPSTREAM), '--gold', str(GOLD), '--input', str(input_path), '--out', str(projection_path)], text=True, capture_output=True)
if run.returncode:
    raise RuntimeError('round58.scoreability:' + run.stderr[-2000:])
projection = json.loads(projection_path.read_text())
scoreable = {row['instance_id'] for row in projection['rows'] if row['scoreable'] is True}

selected, selected_repos = [], set()
for language, quota in QUOTAS.items():
    for row in sorted((item for item in candidates if item['language'] == language and item['instance_id'] in scoreable), key=lambda item: item['instance_id']):
        if row['repo'] in selected_repos:
            continue
        selected.append(row)
        selected_repos.add(row['repo'])
        if sum(item['language'] == language for item in selected) == quota:
            break
    if sum(item['language'] == language for item in selected) != quota:
        raise RuntimeError('round58.insufficient-language-stratum:' + language)
selected.sort(key=lambda row: row['instance_id'])
if len(selected) != 8 or len(selected_repos) != 8:
    raise RuntimeError('round58.selection-shape')

TASK_ROOT.mkdir(parents=True, exist_ok=False)
manifest = []
for row in selected:
    path = TASK_ROOT / (row['instance_id'] + '.json')
    path.write_text(json.dumps(row, indent=2) + '\n')
    manifest.append({'instance_id': row['instance_id'], 'file': path.name, 'sha256': sha(path)})
manifest_path = TASK_ROOT / 'manifest.json'
manifest_path.write_text(json.dumps({
    'schema_version': 'are.contextbench-task-manifest/v1',
    'partition': 'fresh-10k-confirmation',
    'tasks': manifest,
    'gold_fields_present': False,
    'projected_columns': PUBLIC,
    'sealed_scoreability_ref': str(projection_path.relative_to(REPO)),
    'authority_effect': 'none',
}, indent=2) + '\n')

artifact = {
    'schema_version': 'are.contextbench-round58-task-selection/v1',
    'status': 'selected-fresh-scoreable-10k-confirmation',
    'selection_rule': 'First lexicographic globally never-matrix-exposed, public-safety-screened, scoreable identities satisfying fixed language quotas and eight distinct repositories.',
    'public_input_screen': {'security_shaped_problem_statements_excluded': True, 'pattern_classes': ['password', 'secret', 'credential', 'exploit', 'vulnerability', 'CVE identifier', 'malware']},
    'tasks': [dict(instance_id=row['instance_id'], repo=row['repo'], language=row['language'], source=row['source'], repo_url=row['repo_url'], base_commit=row['base_commit'], task_file=str(TASK_ROOT / (row['instance_id'] + '.json')), task_sha256=manifest[index]['sha256'], prior_exposure='none-in-recorded-contextbench-matrices', sealed_scoreable=True) for index, row in enumerate(selected)],
    'task_count': 8,
    'eligible_unexposed_tasks': len(candidates),
    'sealed_scoreable_tasks': len(scoreable),
    'prior_exposed_identities': len(exposed),
    'prior_matrix_refs': matrix_refs,
    'scoreability_input_ref': str(input_path.relative_to(REPO)),
    'scoreability_input_sha256': sha(input_path),
    'sealed_scoreability_ref': str(projection_path.relative_to(REPO)),
    'sealed_scoreability_sha256': sha(projection_path),
    'task_manifest_ref': str(manifest_path),
    'task_manifest_sha256': sha(manifest_path),
    'model_calls': 0,
    'authority_effect': 'none',
    'benchmark_cleared': False,
    'open_questions_ref': 'agent-reasoning-engine/research/contextbench-v1/larger-window-v1/PLAN.md#open-questions',
}
(HERE / 'round58-task-selection.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'tasks': 8, 'eligible_unexposed': len(candidates), 'scoreable': len(scoreable), 'prior_exposed': len(exposed), 'identities': [row['instance_id'] for row in selected]}))
