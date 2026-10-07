"""Score the sealed, already-exposed G02 r11 task-1 ARE-only rerun once."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path('/tmp/are-g02-r4-runs/g02-r11-callcap12-exposed-task1-r1')
BASE = Path('/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev')
FREEZE_SHA = '660af7dd0b2f9f50b22b49f0b34331f7f374b8ba6cc2b2f16fcc69b02f6cb103'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text())


def f1(metric):
    coverage, precision = metric['coverage'], metric['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    run = ROOT / 'evidence/run'
    score = run / 'native-score.json'
    result = ROOT / 'SCORE-RESULT.json'
    seal_path = ROOT / 'PRE-SCORE-SEAL.json'
    if score.exists() or result.exists() or not seal_path.is_file():
        raise RuntimeError('score-existing-or-seal-missing')
    seal = read(seal_path)
    if (seal['status'] != 'prediction-and-cost-sealed-before-native-score' or
            not seal['score_unopened'] or seal['freeze_sha256'] != FREEZE_SHA):
        raise RuntimeError('pre-score-order')
    bindings = {
        ROOT / 'FREEZE.json': seal['freeze_sha256'],
        ROOT / 'SETTLEMENT.json': seal['settlement_sha256'],
        ROOT / 'evidence/RESULTS.json': seal['results_sha256'],
        run / 'result.json': seal['result_sha256'],
        run / 'prediction.json': seal['prediction_sha256'],
        run / 'events.jsonl': seal['events_sha256'],
    }
    if any(sha(path) != expected for path, expected in bindings.items()):
        raise RuntimeError('sealed-input-drift')
    command = [
        'docker', 'run', '--rm', '--network', 'host', '--cpus', '1', '--memory', '512m',
        '-v', f'{BASE}/repo:/repo:ro', '-v', f'{BASE}/upstream:/upstream:ro',
        '-v', f'{BASE}/scoring-cache:/cache', '-v', f'{run}:/work',
        'are-contextbench-scorer:g01-r1', 'python',
        '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
        '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
        '--pred', '/work/prediction.json', '--cache', '/cache', '--out', '/work/native-score.json',
    ]
    with (ROOT / 'score-stdout.txt').open('x') as stdout, (ROOT / 'score-stderr.txt').open('x') as stderr:
        completed = subprocess.run(command, stdout=stdout, stderr=stderr, timeout=300, check=False)
    if completed.returncode != 0 or not score.is_file():
        raise RuntimeError(f'native-score-failed:{completed.returncode}')
    native = read(score)['native']['final']
    scored = {
        'schema_version': 'are.g02-r11-callcap12-exposed-task1-score/v1',
        'posture': 'already-exposed-ARE-only-development',
        'freeze_sha256': FREEZE_SHA,
        'pre_score_seal_sha256': sha(seal_path),
        'score_script_sha256': sha(Path(__file__)),
        'prediction_sha256': seal['prediction_sha256'],
        'native_score_sha256': sha(score),
        'span_f1': f1(native['span']), 'file_f1': f1(native['file']),
        'known_model_tokens': seal['known_model_tokens'], 'model_calls': seal['model_calls'],
        'finalization_start': seal['finalization_start'],
        'elapsed_seconds': seal['elapsed_seconds'],
        'archived_r11_are_known_model_tokens': 68540,
        'archived_r11_are_span_f1': 0.4172769953051643,
        'archived_r11_are_file_f1': 0.6666666666666666,
        'claim_ceiling': 'Single exposed task against archived non-matched results; no campaign or superiority claim.',
    }
    with result.open('x') as stream:
        json.dump(scored, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'scored-exposed-only', 'result_sha256': sha(result),
                      'span_f1': scored['span_f1'], 'file_f1': scored['file_f1'],
                      'known_model_tokens': scored['known_model_tokens']}))


if __name__ == '__main__':
    main()
