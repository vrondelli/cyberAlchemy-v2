"""One source-only Go treatment, frozen before native scoring."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time

BASE = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-normalized-clauses-16-go-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
TASK = 'SWE-Bench-Pro__go__maintenance__bugfix__05aad678.json'
NAME = 'are-g02-normalized-clauses-16-go-r1'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
BASE_OVERLAY = None
HASHES = {
    'tasks/' + TASK: '1d5fef530d00c572f867f15e35be4e03e6ee39757fa287747fbe3483a2835683',
    'code/deepseek-full-window-profile.mjs': '14a9f470164537010e943bac8abd1a541c1584de1fd6621b174b9d3af08d97d8',
    'code/confirm-are.mjs': '0688be71c6e237ce8acdc039ddc22db818f4023b12aac0f82512601a09b37d1e',
    'code/ranked-source-acquisition.mjs': '8a2a12aad6ff2e2994af1788d9e441e2e4e4065a41d2b84aaa4268466633f1cb',
    'code/episode-recovery-v2.mjs': 'edf8d1477aab9ba86e788a3b22c579cb100d9b8d74197a25fb144f2581882eff',
}


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
    subprocess.run(['git', '-C', str(BASE / 'cache/flipt'), 'cat-file', '-e',
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
            '-v', str(ROOT / 'code/episode-recovery-v2.mjs') + ':/repo/' + C + '/discovery-v1/episode-recovery-v2.mjs:ro',
            *(['-v', str(ROOT / BASE_OVERLAY) + ':/repo/' + C + '/ranked-source-acquisition-base.mjs:ro'] if BASE_OVERLAY else []),
            '-v', str(ROOT / 'evidence') + ':/evidence',
            '-v', str(ROOT / 'sources') + ':/sources',
            '-v', SECRET + ':/run/secrets/model_api_key:ro',
            IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs',
            'contextbench-1']
    save(ROOT / 'STARTED.json', {'task_id': 'contextbench-1',
         'instance_id': task['instance_id'], 'base_commit': task['base_commit'],
         'input_sha256': HASHES, 'image': IMAGE, 'started_unix': time.time(),
         'hypothesis': 'normalized clause-diverse acquisition with 16-call finalization generalizes to Go',
         'success': 'valid matched selection; both F1 metrics higher, model tokens and wall time lower than same-instance DSH'})
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
