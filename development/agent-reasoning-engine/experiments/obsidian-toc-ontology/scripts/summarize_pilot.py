"""Print descriptive pilot results; never substitutes raw counts for official scores."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return json.loads(path.read_text()) if path.exists() else None


def summarize(run_id):
    p = ROOT / 'evidence/runs' / run_id
    joined = read(p / 'join.json') or {}
    result = read(p / 'evaluation/receipt.json')
    raw = read(p / 'evaluation/verifier/reports/new_ctrf.json')
    row = {'run_id': run_id, 'status': joined.get('result', 'pending'),
           'official': result.get('reward') if result else None,
           'raw_feature_counts': None, 'raw_failed_cases': [], 'tokens': None,
           'token_status': 'not exposed by native helper',
           'patch_sha256': (read(p / 'frozen.json') or {}).get('patch_sha256')}
    if result:
        row['status'] = ('PASS' if result['reward']['reward'] == 1 else 'FAIL') if (
            result['status'] == 'evaluated') else 'not_evaluable'
    if raw:
        rows = raw['results']['tests']
        row['raw_feature_counts'] = dict(Counter(t['status'] for t in rows))
        row['raw_failed_cases'] = [t['name'] for t in rows if t['status'] != 'passed']
    return row


if __name__ == '__main__':
    replacements = read(ROOT / 'evidence/replacements.json') or {}
    ids = ['pilot-A', 'pilot-B', 'pilot-C'] + [r['replacement'] for r in replacements.values()]
    print(json.dumps({'pilot_only': True, 'runs': [summarize(r) for r in ids],
                      'measured_runs_started': 0,
                      'comparison_status': 'not_evaluable under planned model/token controls',
                      'claim_ceiling': 'Descriptive single-task pilot; no causal or general efficacy claim'}, indent=2))
