#!/usr/bin/env python3
"""Select Round 49 from public columns after an isolated sealed eligibility projection."""
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
TASK_ROOT = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/development-tasks-round49'
SCOREABILITY = REPO / 'implementation/agent-reasoning-engine/benchmarks/contextbench-v1/sealed-scoreability.py'
PUBLIC = ['instance_id', 'original_inst_id', 'repo', 'repo_url', 'language', 'base_commit', 'problem_statement', 'source']
LANGUAGES = ['c', 'cpp', 'go', 'javascript', 'python', 'rust', 'typescript']
PUBLIC_SAFETY_EXCLUDED_REPOS = {'ponylang/ponyc'}
PUBLIC_SAFETY_EXCLUSIONS = {
    'Multi-SWE-Bench__c__maintenance__bugfix__5b90848f',
    'Multi-SWE-Bench__c__maintenance__bugfix__7a22ebc0',
    'Multi-SWE-Bench__go__maintenance__bugfix__250649eb',
    'Multi-SWE-Bench__c__maintenance__bugfix__7efc43e3',
    'SWE-Bench-Verified__python__maintenance__bugfix__16c72e4c',
}


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
    and row['repo'] not in PUBLIC_SAFETY_EXCLUDED_REPOS
    and row['instance_id'] not in PUBLIC_SAFETY_EXCLUSIONS
    and row['source'] != 'Pro'
    and all(isinstance(row[key], str) and row[key] for key in PUBLIC)
]
candidate_input = ROOT / 'round49-scoreability-input.json'
candidate_input.write_text(json.dumps({
    'schema_version': 'are.contextbench-scoreability-input/v1',
    'instance_ids': sorted(row['instance_id'] for row in public_eligible),
    'selection_fields_disclosed': PUBLIC,
    'authority_effect': 'none',
}, indent=2) + '\n')
scoreability_out = ROOT / 'round49-sealed-scoreability.json'
run = subprocess.run([
    sys.executable, str(SCOREABILITY), '--upstream', str(UPSTREAM), '--gold', str(GOLD),
    '--input', str(candidate_input), '--out', str(scoreability_out),
], text=True, capture_output=True)
if run.returncode:
    raise RuntimeError('round49.scoreability:' + run.stderr.strip())
projection = json.loads(scoreability_out.read_text())
decisions = {row['instance_id']: row['scoreable'] for row in projection['rows']}
scoreable = [row for row in public_eligible if decisions.get(row['instance_id']) is True]
by_language = {
    language: sorted((row for row in scoreable if row['language'] == language), key=lambda row: row['instance_id'])
    for language in LANGUAGES
}
quotas = {'c': 2, 'cpp': 2, 'go': 2, 'javascript': 2, 'python': 4, 'rust': 2, 'typescript': 2}
selected, selected_repos = [], set()
for language in LANGUAGES:
    candidates = by_language[language]
    for row in candidates:
        if row['repo'] in selected_repos:
            continue
        selected.append(row)
        selected_repos.add(row['repo'])
        if sum(item['language'] == language for item in selected) == quotas[language]:
            break
    if sum(item['language'] == language for item in selected) != quotas[language]:
        raise RuntimeError('round49.insufficient-unique-repository-language-stratum:' + language)
selected = sorted(selected, key=lambda row: row['instance_id'])
if len(selected) != 16 or len({row['repo'] for row in selected}) != 16:
    raise RuntimeError('round49.replication-shape')

TASK_ROOT.mkdir(parents=True, exist_ok=False)
manifest = []
for row in selected:
    path = TASK_ROOT / (row['instance_id'] + '.json')
    path.write_text(json.dumps(row, indent=2) + '\n')
    manifest.append({'instance_id': row['instance_id'], 'file': path.name, 'sha256': sha(path)})
manifest_path = TASK_ROOT / 'manifest.json'
manifest_path.write_text(json.dumps({'schema_version': 'are.contextbench-task-manifest/v1', 'tasks': manifest, 'gold_fields_present': False, 'projected_columns': PUBLIC, 'sealed_scoreability_ref': str(scoreability_out.relative_to(REPO)), 'authority_effect': 'none'}, indent=2) + '\n')

artifact = {
    'schema_version': 'are.contextbench-round49-task-selection/v1',
    'status': 'selected-fresh-scoreable-replication',
    'selection_rule': 'First lexicographic never-matrix-exposed, public-safety-screened, scoreable non-Pro tasks satisfying fixed language quotas (C 2, C++ 2, Go 2, JavaScript 2, Python 4, Rust 2, TypeScript 2) with 16 distinct repositories. Scoreability came from an isolated identity/boolean/reason-code projection.',
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
    'open_questions_ref': 'PLAN-round49.md#open-questions',
}
(ROOT / 'round49-task-selection.json').write_text(json.dumps(artifact, indent=2) + '\n')
print(json.dumps({'tasks': artifact['task_count'], 'public_eligible': len(public_eligible), 'scoreable': len(scoreable), 'unscoreable': projection['unscoreable_count'], 'identities': [row['instance_id'] for row in selected]}))
