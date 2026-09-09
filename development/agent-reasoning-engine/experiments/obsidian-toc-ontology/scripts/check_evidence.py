"""Check frozen inputs and scored pilot receipts without modifying evidence."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check_reward(reward):
    for prefix in ('f2p', 'p2p'):
        total, passed = reward[f'{prefix}_total'], reward[f'{prefix}_passed']
        if not isinstance(total, int) or not isinstance(passed, int) or not 0 <= passed <= total:
            raise ValueError('Invalid test count')
    expected = int(reward['f2p_total'] > 0 and reward['p2p_total'] > 0
                   and reward['f2p_passed'] == reward['f2p_total']
                   and reward['p2p_passed'] == reward['p2p_total'])
    if reward['reward'] != expected:
        raise ValueError('Binary reward does not agree with test counts')


def main():
    snapshot = json.loads((ROOT / 'evidence/pilot-inputs.json').read_text())
    for relative, digest in snapshot['files'].items():
        if sha(ROOT / relative) != digest:
            raise ValueError(f'Pilot input drift: {relative}')
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    for item in manifest['sources']:
        if sha(ROOT / item['path']) != item['sha256']:
            raise ValueError(f'Upstream drift: {item["path"]}')
    preflight = json.loads((ROOT / 'evidence/preflight/receipt.json').read_text())
    check_reward(preflight['reward'])
    if (preflight['reward']['f2p_passed'] != 0 or
            preflight['reward']['p2p_passed'] != preflight['reward']['p2p_total']):
        raise ValueError('Unexpected pristine-base behavior')
    outcomes = {}
    replacements_path = ROOT / 'evidence/replacements.json'
    replacements = json.loads(replacements_path.read_text()) if replacements_path.exists() else {}
    run_ids = manifest['pilot_runs'] + [r['replacement'] for r in replacements.values()]
    for run_id in run_ids:
        path = ROOT / 'evidence/runs' / run_id
        if not (path / 'evaluation/receipt.json').exists():
            join = json.loads((path / 'join.json').read_text()) if (path / 'join.json').exists() else {}
            outcomes[run_id] = 'not_evaluable' if join.get('result') == 'not_evaluable' else 'not yet graded'
            continue
        frozen = json.loads((path / 'frozen.json').read_text())
        evaluated = json.loads((path / 'evaluation/receipt.json').read_text())
        if sha(path / 'model.patch') != frozen['patch_sha256'] or (
                evaluated['patch_sha256'] != frozen['patch_sha256']):
            raise ValueError(f'Patch binding mismatch: {run_id}')
        if evaluated['image_digest'] != manifest['image_digest']:
            raise ValueError(f'Image mismatch: {run_id}')
        if sha(path / 'evaluation/test-stdout.txt') != evaluated['test_stdout_sha256']:
            raise ValueError(f'Log drift: {run_id}')
        if evaluated['status'] == 'evaluated':
            reward = json.loads((path / 'evaluation/verifier/reward.json').read_text())
            if reward != evaluated['reward']:
                raise ValueError(f'Reward binding mismatch: {run_id}')
            check_reward(reward)
            outcomes[run_id] = 'PASS' if reward['reward'] == 1 else 'FAIL'
        else:
            outcomes[run_id] = 'not_evaluable'
    print(json.dumps({'integrity': 'PASS', 'pilot_results': outcomes,
                      'measured_comparison': 'not_evaluable: model pin and token enforcement unavailable'}, indent=2))


if __name__ == '__main__':
    main()
