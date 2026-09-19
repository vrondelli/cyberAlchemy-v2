"""Summarize retained aggregate evidence; no evaluator imports or provider calls.
Open questions: RADICAL-BRANCH-PLAN.md. Run from checkout root.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path.cwd()
HERE = Path(__file__).resolve().parent

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def verify(bindings):
    for binding in bindings:
        path = ROOT / binding['path']
        if digest(path) != binding['sha256']:
            raise ValueError(f"Evidence drift: {path}")
    return len(bindings)

old_path = HERE / 'discovery-v1/LIVE-FAILURE-ANALYSIS.json'
review_path = HERE / 'RECOVERY-R1-PARTIAL-SCORE-RESULT-REVIEW.json'
old = json.loads(old_path.read_text())
review = json.loads(review_path.read_text())
assert review['result_integrity_approved'] is True
assert review['original_experiment_classification'] == 'inconclusive'
counts = {'historical_bindings': verify(old['source_bindings']),
          'partial_review_bindings': verify(review['source_bindings'])}
rows = []
for outcome in old['outcomes']:
    coverage = {v['stage']: v for v in outcome['coverage']}
    assert set(coverage) == {'archive', 'offered', 'selected'}
    rows.append({'task_id': outcome['task_id'], 'arm': outcome['arm'],
                 'maximum_recall': {k: v['maximum_recall_exact'] for k, v in coverage.items()},
                 'archive_perfect_whole_read_feasible': coverage['archive']['perfect_whole_read_selection_attainable_unbounded']})
assert len(rows) == 8
inputs = [old_path, review_path, HERE / 'DEMAND-RECOVERY.md', HERE / 'discovery-v1/run-recovery-pair.mjs', Path(__file__).resolve()]
print(json.dumps({'status': 'completed-aggregate-evidence-audit', 'provider_calls': 0,
 'verified': counts, 'historical_discovery_rows': rows,
 'latest_partial_scores': review['native_scores'],
 'findings': [
  'External archive and demand recovery already exist; retrieval alone is not a distinct architectural intervention.',
  'Latest R1 control and treatment both enable discovery retention; eager versus demand is the varied field.',
  'Historical archive recall is below 0.41 for both arms of tasks 1, 3 and 4; selection-only changes cannot recover missing evidence on those archived trajectories.',
  'Historical task 2 treatment archive admits perfect whole-read selection but the actual selection loses recall.',
  'These historical coverage bounds are not measurements of latest R1 archive coverage.'
 ],
 'campaign_goal_achieved': False,
 'source_bindings': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p)} for p in inputs],
 'open_questions_ref': 'RADICAL-BRANCH-PLAN.md'}, indent=2))
