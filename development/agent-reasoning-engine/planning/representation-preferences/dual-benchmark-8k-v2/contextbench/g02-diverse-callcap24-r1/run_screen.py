"""Run one exposed-task ARE treatment with a source-diverse primer and 24-call cap."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time

BASE = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-diverse-callcap24-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
TASK = 'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae.json'
HASHES = {
 'tasks/' + TASK: '891e224a109e0ac1a2aca54cf6d31caeeda7ffb62b40d30fe7ac7daa30bac8fe',
 'code/deepseek-full-window-profile.mjs': '4a76b193d33ae2c581549ec85b9359f2ce3dc3fc9029e79c9878d1531281e748',
 'code/confirm-are.mjs': '22e9bf24bf8371da0ff615761dea0f829e756750c05e489c3b629d1d953b7f76',
 'code/ranked-source-acquisition.mjs': '0072b55febf2a62d50a0cb92675a110913d1bfcd71905c35c60458b69681b942',
}
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
NAME = 'are-g02-diverse-callcap24-r1-contextbench-2'


def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())


def main():
    if not ROOT.is_dir() or (ROOT / 'STARTED.json').exists():
        raise RuntimeError('run-root-missing-or-started')
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')
    for path, expected in HASHES.items():
        if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != expected:
            raise RuntimeError('input-drift:' + path)
    task = json.loads((ROOT / 'tasks' / TASK).read_text())
    subprocess.run(['git', '-C', str(BASE / 'cache/nodebb'), 'cat-file', '-e',
                    task['base_commit'] + '^{commit}'], check=True, timeout=30)
    for command in (['docker', 'image', 'inspect', IMAGE],
                    ['docker', 'network', 'inspect', 'are-g02-benchmark-egress-20260926']):
        subprocess.run(command, stdout=subprocess.DEVNULL, check=True, timeout=30)
    if not pathlib.Path(SECRET).is_file():
        raise RuntimeError('credential-file-unavailable')
    if subprocess.run(['docker', 'container', 'inspect', NAME], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode == 0:
        raise RuntimeError('container-name-already-used')
    for folder in ('evidence', 'sources'):
        target = ROOT / folder
        target.mkdir()
        os.chown(target, 65532, 65532)
    args = ['docker', 'run', '--name', NAME, '--read-only', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '1g',
            '--pids-limit', '128', '--log-opt', 'max-size=8m', '--log-opt', 'max-file=1',
            '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m', '--network',
            'are-g02-benchmark-egress-20260926', '--user', '65532:65532',
            '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
            '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000',
            '-e', 'GIT_CONFIG_GLOBAL=/repo/' + C + '/g02-fresh-pair-20260926/are-gitconfig',
            '-v', str(BASE) + ':/repo:ro', '-v', str(ROOT / 'tasks') + ':/tasks:ro',
            '-v', str(BASE / 'cache') + ':/cache:ro',
            '-v', str(ROOT / 'code/deepseek-full-window-profile.mjs') + ':/repo/' + C + '/deepseek-full-window-profile.mjs:ro',
            '-v', str(ROOT / 'code/confirm-are.mjs') + ':/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs:ro',
            '-v', str(ROOT / 'code/ranked-source-acquisition.mjs') + ':/repo/' + C + '/ranked-source-acquisition.mjs:ro',
            '-v', str(ROOT / 'evidence') + ':/evidence',
            '-v', str(ROOT / 'sources') + ':/sources',
            '-v', SECRET + ':/run/secrets/model_api_key:ro',
            IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs',
            'contextbench-2']
    save(ROOT / 'STARTED.json', {'task_id': 'contextbench-2',
         'instance_id': task['instance_id'], 'base_commit': task['base_commit'],
         'input_sha256': HASHES, 'image': IMAGE, 'started_unix': time.time(),
         'hypothesis': '24-call limit permits deeper source validation with the same diverse primer',
         'control': {'span_f1': 0.3960750269644595, 'file_f1': 0.4,
                     'model_tokens': 482228, 'wall_seconds': 223.40971755981445},
         'success': 'valid native selection; both F1 metrics greater than control; fewer tokens and less wall time'})
    save(ROOT / 'COMMAND.json', args)
    start = time.monotonic()
    exit_code = None
    error = None
    with (ROOT / 'stdout.txt').open('x') as stdout, (ROOT / 'stderr.txt').open('x') as stderr:
        try:
            exit_code = subprocess.run(args, stdout=stdout, stderr=stderr, timeout=900).returncode
        except subprocess.TimeoutExpired:
            subprocess.run(['docker', 'stop', '--time', '30', NAME], timeout=45)
            exit_code = 124
        except Exception as exc:
            error = type(exc).__name__ + ': ' + str(exc)[:300]
    save(ROOT / 'SETTLEMENT.json', {'exit_code': exit_code, 'error': error,
         'elapsed_seconds': time.monotonic() - start, 'scoring_pending': True})
    print(json.dumps({'exit_code': exit_code, 'error': error}), flush=True)


if __name__ == '__main__':
    main()
