#!/usr/bin/env python3
"""Offline native-score diagnostic for r11's already-exposed pruned ARE pairs."""

import hashlib
import json
import shlex
import shutil
import subprocess
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002')
LOCAL = Path('/home/vlad_/are-benchmark-archive/g02-r11-raw-vs-pruned-exposed-r1-20261002')
REMOTE = Path('/opt/are/evolution-runtime/g02-r11-raw-vs-pruned-exposed-r1')
SCORER = Path('/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev')
HOST = 'root@187.77.163.194'
DEFINITION_SHA = '0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf'
TERMINAL_SHA = '843c413a43e5646f21a3323058a885b1837c0c21b8494b91e787752ee2aac4f0'
EXPECTED = (2, 5, 6, 8, 10, 12)
IMAGE = 'sha256:e592d8dcd42b3218edd36dbf1b959ef5964f203d099f382a301e2ec9bf1941ff'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r11-raw-pruned.' + reason)


def command(argv, timeout=300):
    result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
    need(result.returncode == 0, 'command:' + ' '.join(argv[:2]) + ':' + result.stderr[-400:])
    return result


def remote(*argv, timeout=300):
    return command(['ssh', '-o', 'BatchMode=yes', HOST, shlex.join(map(str, argv))], timeout)


def f1(value):
    coverage, precision = value['coverage'], value['precision']
    return 2 * coverage * precision / (coverage + precision) if coverage + precision else 0.0


def main():
    need(sha(ARCHIVE / 'definition/DEFINITION.json') == DEFINITION_SHA and
         sha(ARCHIVE / 'TERMINAL-AUDIT-R11.json') == TERMINAL_SHA and
         not LOCAL.exists(), 'frozen-input-or-target-drift')
    remote('test', '!', '-e', REMOTE)
    definition = json.loads((ARCHIVE / 'definition/DEFINITION.json').read_text())
    selected = []
    for pair in definition['ordered_pairs'][:12]:
        ordinal = pair['ordinal']
        root = ARCHIVE / 'pairs' / f"{ordinal:02d}-{pair['suffix']}" / 'raw'
        seal_path = root / 'policy-pruning/POLICY-SEAL.json'
        seal = json.loads(seal_path.read_text())
        if seal['original_files'] <= seal['retained_files']:
            continue
        raw_path = root / 'evidence/run/prediction.json'
        pruned_path = root / 'policy-pruning/prediction.json'
        pruned_score = root / 'policy-pruning/native-score.json'
        need(seal['source_prediction_sha256'] == sha(raw_path) and
             seal['prediction_sha256'] == sha(pruned_path) and
             pruned_score.is_file() and
             json.loads(raw_path.read_text())['instance_id'] == pair['instance_id'],
             f'pair-{ordinal}-source-binding')
        selected.append({'ordinal': ordinal, 'suffix': pair['suffix'],
                         'instance_id': pair['instance_id'],
                         'raw_prediction_sha256': sha(raw_path),
                         'pruned_prediction_sha256': sha(pruned_path),
                         'pruned_score_sha256': sha(pruned_score),
                         'policy_seal_sha256': sha(seal_path),
                         'original_files': seal['original_files'],
                         'retained_files': seal['retained_files']})
    need(tuple(row['ordinal'] for row in selected) == EXPECTED,
         'score-blind-pruning-selection-drift')
    LOCAL.mkdir(mode=0o700)
    for row in selected:
        name = f"{row['ordinal']:02d}"
        folder = LOCAL / name
        folder.mkdir(mode=0o700)
        root = ARCHIVE / 'pairs' / f"{row['ordinal']:02d}-{row['suffix']}" / 'raw'
        shutil.copyfile(root / 'evidence/run/prediction.json', folder / 'prediction.json')
        need(sha(folder / 'prediction.json') == row['raw_prediction_sha256'],
             'staged-prediction-drift')
    manifest = {'schema_version': 'are.g02-r11-exposed-raw-score-input/v1',
                'definition_sha256': DEFINITION_SHA,
                'terminal_audit_sha256': TERMINAL_SHA,
                'selection': 'all completed pairs where frozen policy removed at least one file',
                'ordered_rows': selected,
                'score_unopened_at_input_seal': True,
                'model_calls': 0,
                'claim_ceiling': 'Six exposed raw-versus-pruned ARE selections only; no independent cohort or r11 recovery.',
                'open_questions': ['Did fixed pruning help or harm quality on its six changed selections?']}
    (LOCAL / 'INPUT-SEAL.json').write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'phase': 'input-sealed', 'input_sha256': sha(LOCAL / 'INPUT-SEAL.json'),
                      'ordinals': list(EXPECTED)}), flush=True)
    command(['rsync', '-a', '-e', 'ssh -o BatchMode=yes', str(LOCAL) + '/',
             f'{HOST}:{REMOTE}/'], timeout=1200)
    copy_check = command(['rsync', '-a', '-n', '--checksum', '--itemize-changes',
                          '-e', 'ssh -o BatchMode=yes', str(LOCAL) + '/',
                          f'{HOST}:{REMOTE}/'], timeout=1200)
    need(not copy_check.stdout.strip(), 'staged-remote-copy-diff')
    for row in selected:
        name = f"{row['ordinal']:02d}"
        work = REMOTE / name
        argv = ['docker', 'run', '--rm', '--network', 'none',
                '-v', f'{SCORER}/repo:/repo:ro',
                '-v', f'{SCORER}/upstream:/upstream:ro',
                '-v', f'{SCORER}/scoring-cache:/cache',
                '-v', f'{work}:/work', IMAGE,
                'python', '/repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/score_native.py',
                '--upstream', '/upstream', '--gold', '/upstream/data/full.parquet',
                '--pred', '/work/prediction.json', '--cache', '/cache',
                '--out', '/work/native-score.json']
        remote(*argv, timeout=600)
        command(['rsync', '-a', '-e', 'ssh -o BatchMode=yes',
                 f'{HOST}:{work}/native-score.json', str(LOCAL / name / 'native-score.json')],
                timeout=120)
        need(sha(LOCAL / name / 'prediction.json') == row['raw_prediction_sha256'] and
             (LOCAL / name / 'native-score.json').is_file(),
             f'pair-{name}-score-or-input-drift')
        print(json.dumps({'phase': 'raw-scored', 'ordinal': row['ordinal'],
                          'score_sha256': sha(LOCAL / name / 'native-score.json')}), flush=True)
    results = []
    for row in selected:
        root = ARCHIVE / 'pairs' / f"{row['ordinal']:02d}-{row['suffix']}" / 'raw'
        raw_score_path = LOCAL / f"{row['ordinal']:02d}" / 'native-score.json'
        pruned_score_path = root / 'policy-pruning/native-score.json'
        need(sha(pruned_score_path) == row['pruned_score_sha256'],
             'pruned-score-drift')
        raw_score = json.loads(raw_score_path.read_text())['native']['final']
        pruned_score = json.loads(pruned_score_path.read_text())['native']['final']
        results.append({'ordinal': row['ordinal'], 'instance_id': row['instance_id'],
                        'raw_score_sha256': sha(raw_score_path),
                        'pruned_score_sha256': sha(pruned_score_path),
                        'raw_file_f1': f1(raw_score['file']),
                        'raw_span_f1': f1(raw_score['span']),
                        'pruned_file_f1': f1(pruned_score['file']),
                        'pruned_span_f1': f1(pruned_score['span'])})
    payload = {'schema_version': 'are.g02-r11-exposed-raw-vs-pruned-result/v1',
               'status': 'six-exposed-selections-scored-offline',
               'input_seal_sha256': sha(LOCAL / 'INPUT-SEAL.json'),
               'script_sha256': sha(__file__), 'model_calls': 0,
               'network_posture': 'native scorer container --network none',
               'rows': results,
               'claim_ceiling': 'Exposed mechanism diagnosis; not r11 recovery, a campaign aggregate, or superiority.',
               'open_questions': ['Can a source-only policy improve file acquisition and cost on an independent fresh cohort?']}
    output = LOCAL / 'RESULT.json'
    need(not output.exists(), 'result-exists')
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': payload['status'], 'sha256': sha(output),
                      'rows': len(results), 'file_f1_improved': sum(row['pruned_file_f1'] > row['raw_file_f1'] for row in results),
                      'span_f1_improved': sum(row['pruned_span_f1'] > row['raw_span_f1'] for row in results)}), flush=True)


if __name__ == '__main__':
    main()
