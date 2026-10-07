"""Run one predeclared, source-only G02 call-cap development screen on the VPS."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time

BASE = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-callcap16-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
TASK = 'SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f.json'
TASK_SHA = 'c4d920d0970b4c5a1b809b67e19a88399aa46b53e5a1a18d233e039e6c490bc5'
PROFILE_SHA = '0bcf651b60a656cc53b55a262f3caf94633155eb6842251759225c87c1d3aa72'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
NETWORK = 'are-g02-benchmark-egress-20260926'
NAME = 'are-g02-callcap16-r1-contextbench-2'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_new(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())


def main():
    if not ROOT.is_dir() or (ROOT / 'STARTED.json').exists():
        raise RuntimeError('run-root-missing-or-already-started')
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')
    if sha(BASE / 'tasks' / TASK) != TASK_SHA:
        raise RuntimeError('task-drift')
    if sha(ROOT / 'code' / 'deepseek-full-window-profile.mjs') != PROFILE_SHA:
        raise RuntimeError('profile-drift')
    task = json.loads((BASE / 'tasks' / TASK).read_text())
    subprocess.run(['git', '-C', str(BASE / 'cache' / 'nodebb'), 'cat-file', '-e',
                    task['base_commit'] + '^{commit}'], check=True, timeout=30)
    subprocess.run(['docker', 'image', 'inspect', IMAGE], stdout=subprocess.DEVNULL,
                   check=True, timeout=30)
    subprocess.run(['docker', 'network', 'inspect', NETWORK], stdout=subprocess.DEVNULL,
                   check=True, timeout=30)
    if not pathlib.Path(SECRET).is_file():
        raise RuntimeError('credential-file-unavailable')
    if subprocess.run(['docker', 'container', 'inspect', NAME], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode == 0:
        raise RuntimeError('container-name-already-used')
    for directory in ('evidence', 'sources'):
        target = ROOT / directory
        target.mkdir()
        os.chown(target, 65532, 65532)
    command = ['docker', 'run', '--name', NAME, '--read-only', '--cap-drop', 'ALL',
               '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '1g',
               '--pids-limit', '128', '--log-opt', 'max-size=8m', '--log-opt', 'max-file=1',
               '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m', '--network', NETWORK,
               '--user', '65532:65532', '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
               '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000',
               '-e', 'GIT_CONFIG_GLOBAL=/repo/' + C + '/g02-fresh-pair-20260926/are-gitconfig',
               '-v', str(BASE) + ':/repo:ro', '-v', str(BASE / 'tasks') + ':/tasks:ro',
               '-v', str(BASE / 'cache') + ':/cache:ro',
               '-v', str(ROOT / 'code' / 'deepseek-full-window-profile.mjs') + ':/repo/' + C + '/deepseek-full-window-profile.mjs:ro',
               '-v', str(ROOT / 'evidence') + ':/evidence',
               '-v', str(ROOT / 'sources') + ':/sources',
               '-v', SECRET + ':/run/secrets/model_api_key:ro',
               IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs',
               'contextbench-2']
    write_new(ROOT / 'STARTED.json', {'task_id': 'contextbench-2', 'task_sha256': TASK_SHA,
              'profile_sha256': PROFILE_SHA, 'image': IMAGE, 'started_unix': time.time(),
              'hypothesis': 'call cap 16 preserves native quality while cutting token and wall cost',
              'control': {'native_span_f1': 0.3768548949307837,
                          'native_file_f1': 0.14285714285714285,
                          'known_model_tokens': 82817, 'wall_seconds': 178.5},
              'success_gates': 'valid selection; span and file F1 >= control; tokens < control; wall < control'})
    write_new(ROOT / 'COMMAND.json', command)
    start = time.monotonic()
    exit_code = None
    error = None
    with (ROOT / 'stdout.txt').open('x') as stdout, (ROOT / 'stderr.txt').open('x') as stderr:
        try:
            exit_code = subprocess.run(command, stdout=stdout, stderr=stderr, timeout=900).returncode
        except subprocess.TimeoutExpired:
            subprocess.run(['docker', 'stop', '--time', '30', NAME], timeout=45)
            exit_code = 124
        except Exception as exc:
            error = type(exc).__name__ + ': ' + str(exc)[:300]
    write_new(ROOT / 'SETTLEMENT.json', {'exit_code': exit_code, 'error': error,
              'elapsed_seconds': time.monotonic() - start, 'scoring_pending': True})
    print(json.dumps({'exit_code': exit_code, 'error': error}), flush=True)


if __name__ == '__main__':
    main()
