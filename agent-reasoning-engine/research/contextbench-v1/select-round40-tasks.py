#!/usr/bin/env python3
"""Select Round 40 from public columns after an isolated sealed eligibility projection."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pyarrow.parquet as parquet

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
UPSTREAM = Path('/home/vrondelli/.local/share/are/contextbench-upstream-117')
GOLD = UPSTREAM / 'data/full.parquet'
TASK_ROOT = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round40'
SCOREABILITY = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py'
PUBLIC = ['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language', 'base_commit', 'problem_statement', 'source']
LANGUAGES = ['c', 'cpp', 'go', 'javascript', 'python', 'rust', 'typescript']


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


exposed, matrix_refs = set(), []
for path in sorted(ROOT.glob('*matrix*.json')):
    try:
        data = json.loads(path.read_text())
    except Exception:
        continue
    ids = {row.get('instance_id') for row in data.get('tasks', []) if row.get('instance_id')}
    if ids:
        exposed.update(ids)
        matrix_refs.append({'path': str(path.relative_to(REPO)), 'sha256': sha(path), 'task_count': len(ids)})

rows = parquet.read_table(GOLD, columns=PUBLIC).to_pylist()
public_eligible = [
    row for row in rows
    if row['instance_id'] not in exposed
    and row['source'] != 'Pro'
    and all(isinstance(row[key], str) and row[key] for key in PUBLIC)
]
candidate_input = ROOT / 'round40-scoreability-input.json'
candidate_input.write_text(json.dumps({
    'schema_version': 'are.contextbench-scoreability-input/v1',
    'instance_ids': sorted(row['instance_id'] for row in public_eligible),
    'selection_fields_disclosed': PUBLIC,
    'authority_effect': 'none',
}, indent=2) + '\n')
scoreability_out = ROOT / 'round40-sealed-scoreability.json'
run = subprocess.run([
    sys.executable, str(SCOREABILITY), '--upstream', str(UPSTREAM), '--gold', str(GOLD),
    '--input', str(candidate_input), '--out', str(scoreability_out),
], text=True, capture_output=True)
if run.returncode:
    raise RuntimeError('round40.scoreability:' + run.stderr.strip())
projection = json.loads(scoreability_out.read_text())
decisions = {row['instance_id']: row['scoreable'] for row in projection['rows']}
scoreable = [row for row in public_eligible if decisions.get(row['instance_id']) is True]
by_language = {
    language: sorted((row for row in scoreable if row['language'] == language), key=lambda row: row['instance_id'])
    for language in LANGUAGES
}
if any(not values for values in by_language.values()) or len(by_language['c']) < 2:
    raise RuntimeError('round40.insufficient-scoreable-language-strata')
selected = sorted([by_language[language][0] for language in LANGUAGES] + [by_language['c'][1]], key=lambda row: row['instance_id'])

TASK_ROOT.mkdir(parents=True, exist_ok=False)
manifest = []
for row in selected:
    path = TASK_ROOT / (row['instance_id'] + '.json')
    path.write_text(json.dumps(row, indent=2) + '\n')
    manifest.append({'instance_id': row['instance_id'], 'file': path.name, 'sha256': sha(path)})
manifest_path = TASK_ROOT / 'manifest.json'
manifest_path.write_text(json.dumps({'schema_version': 'are.contextbench-task-manifest/v1', 'tasks': manifest, 'gold_fields_present': False, 'projected_columns': PUBLIC, 'sealed_scoreability_ref': str(scoreability_out.relative_to(REPO)), 'authority_effect': 'none'}, indent=2) + '\n')

artifact = {
    'schema_version': 'are.contextbench-round40-task-selection/v1',
    'status': 'selected-fresh-scoreable-development-canary',
    'selection_rule': 'First lexicographic never-matrix-exposed scoreable non-Pro task in each of seven public language groups, plus the second C task. Scoreability came from an isolated identity/boolean/reason-code projection.',
    'projected_public_columns': PUBLIC,
    'sealed_projection_disclosure': projection['disclosure'],
    'forbidden_values_not_disclosed_to_selector': ['gold paths', 'gold spans', 'gold patches', 'gold content'],
    'tasks': [{'instance_id': row['instance_id'], 'repo': row['repo'], 'language': row['language'], 'source': row['source'], 'repo_url': row['repo_url'], 'base_commit': row['base_commit'], 'task_file': str(TASK_ROOT / (row['instance_id'] + '.json')), 'task_sha256': manifest[index]['sha256'], 'prior_exposure': 'none-in-recorded-contextbench-matrices', 'sealed_scoreable': True} for index, row in enumerate(selected)],
    'task_count': len(selected),
    'public_eligible_unexposed_tasks': len(public_eligible),
    'sealed_scoreable_tasks': len(scoreable),
    'sealed_unscoreable_tasks': projection['unscoreable_count'],
    'prior_exposed_identities': len(exposed),
    'prior_matrix_refs': matrix_refs,
    'scoreability_input_ref': str(candidate_input.relative_to(REPO)),
    'scoreability_input_sha256': sha(candidate_input),
    'sealed_scoreability_ref': str(scoreability_out.relative_to(REPO)),
    'sealed_scoreability_sha256': sha(scoreability_out),
    'task_manifest_ref': str(manifest_path),
    'task_manifest_sha256': sha(manifest_path),
    'upstream_ref': str(UPSTREAM),
    'upstream_revision': projection['upstream_revision'],
    'model_calls': 0,
    'authority_effect': 'none',
    'benchmark_cleared': False,
    'open_questions_ref': 'PLAN-round40.md#open-questions',
}
(ROOT / 'round40-task-selection.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'tasks': artifact['task_count'], 'public_eligible': len(public_eligible), 'scoreable': len(scoreable), 'unscoreable': projection['unscoreable_count'], 'identities': [row['instance_id'] for row in selected]}))
