"""Same-instance source-only DSH control for the G02 broad-hints confirmation."""
import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import subprocess
import time

BASE_ROOT = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-broad-hints-confirm-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
TASK = 'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c.json'
TASK_SHA = 'd54918fefde9f74b64d158511e2c1ec0453118fec8695a8935957e23de5b0004'
CACHE = 'nodebb'
COMMIT = 'f0d989e4ba5b0dccff6e56022fc6d378d05ab404'
NAME = 'are-g02-broad-hints-confirm-r1-dsh'
PROXY = NAME + '-proxy'
spec = importlib.util.spec_from_file_location('g02_pair_base', BASE_ROOT / C / 'g02-fresh-pair-20260926/run_pair.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)


def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())


def main():
    task_path = ROOT / 'tasks' / TASK
    run_root = ROOT / 'dsh-control'
    if not ROOT.is_dir() or run_root.exists():
        raise RuntimeError('control-root-missing-or-started')
    if hashlib.sha256(task_path.read_bytes()).hexdigest() != TASK_SHA:
        raise RuntimeError('control-task-drift')
    task = json.loads(task_path.read_text())
    if task['instance_id'] != TASK[:-5] or task['base_commit'] != COMMIT:
        raise RuntimeError('control-identity-drift')
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('control-host-space')
    for command in (['git', '-C', str(BASE_ROOT / 'cache' / CACHE), 'cat-file', '-e', task['base_commit'] + '^{commit}'],
                    ['docker', 'image', 'inspect', IMAGE],
                    ['docker', 'network', 'inspect', 'are-g02-benchmark-egress-20260926'],
                    ['docker', 'network', 'inspect', 'are-dsh-canary']):
        base.command(command)
    if not pathlib.Path(SECRET).is_file():
        raise RuntimeError('control-credential-missing')
    for name in (NAME, PROXY):
        if subprocess.run(['docker', 'container', 'inspect', name], stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).returncode == 0:
            raise RuntimeError('control-container-name-used')
    run_root.mkdir()
    started = time.time()
    save(run_root / 'STARTED.json', {'instance_id': task['instance_id'], 'task_sha256': TASK_SHA,
                                    'arm': 'dsh', 'started_unix': started, 'image': IMAGE})
    failure = None
    exit_code = None
    try:
        for folder in ('sources', 'state', 'tools', 'transport'):
            (run_root / folder).mkdir()
        os.chown(run_root / 'transport', 65532, 65532)
        for folder in ('base', 'work'):
            base.command(['git', 'clone', '--no-local', '--no-checkout', str(BASE_ROOT / 'cache' / CACHE),
                          str(run_root / 'sources' / folder)])
            base.command(['git', '-C', str(run_root / 'sources' / folder), 'checkout', '--detach', task['base_commit']])
        profile = (BASE_ROOT / 'profile-template.patch.yml').read_text().replace(
            'are-dsh-profile-60', PROXY).replace('0d8c794d2ac7acc171ea7741c71100391cf70faf', task['base_commit'])
        (run_root / 'profile.patch.yml').write_text(profile)
        proxy_args = base.common(PROXY) + ['--network', 'are-g02-benchmark-egress-20260926', '-d',
            '--user', '65532:65532', '-e', 'CONTEXT_WINDOW=1000000', '-e', 'OUTPUT_CAP=8192',
            '-e', 'TOKEN_BUDGET=1000000', '-e', 'MAX_REQUEST_BYTES=33554432',
            '-e', 'MAX_STAGE_BYTES=536870912', '-v', str(BASE_ROOT) + ':/repo:ro',
            '-v', str(run_root / 'transport') + ':/evidence',
            '-v', SECRET + ':/run/secrets/model_api_key:ro', IMAGE, 'node',
            '/repo/' + C + '/deepseek-transport-server.mjs']
        save(run_root / 'PROXY-COMMAND.json', proxy_args)
        base.command(proxy_args)
        base.command(['docker', 'network', 'connect', 'are-dsh-canary', PROXY])
        prompt = task['problem_statement'] + ('\n\nInvestigate this issue and attempt a patch using the repository tools. '
            'Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. '
            'Report inability honestly. Source-selection scores do not prove patch correctness.')
        args = base.common(NAME) + ['--network', 'are-dsh-canary', '-e', 'HOME=/tmp', '-e', 'DSH_HOME=/state',
            '-e', 'CANARY_PLACEHOLDER=benchmark-no-secret',
            '-v', '/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro',
            '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(ROOT) + ':/pair:ro',
            '-v', str(run_root / 'state') + ':/state',
            '-v', str(run_root / 'sources/base') + ':/base:ro',
            '-v', str(run_root / 'sources/work') + ':/work',
            '-v', str(run_root / 'tools') + ':/evidence', '-w', '/work', IMAGE,
            'node', '/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js', '--profile', 'headless',
            '--patch', '/pair/dsh-control/profile.patch.yml', prompt]
        save(run_root / 'COMMAND.json', args)
        with (run_root / 'stdout.txt').open('x') as stdout, (run_root / 'stderr.txt').open('x') as stderr:
            try:
                exit_code = subprocess.run(args, stdout=stdout, stderr=stderr, timeout=1800).returncode
            except subprocess.TimeoutExpired:
                subprocess.run(['docker', 'stop', '--time', '30', NAME], capture_output=True, timeout=45)
                exit_code = 124
    except Exception as error:
        failure = type(error).__name__ + ': ' + str(error)[:300]
    finally:
        for name in (NAME, PROXY):
            if base.state(name).get('Running'):
                subprocess.run(['docker', 'stop', '--time', '30', name], capture_output=True, timeout=45)
        save(run_root / 'SETTLEMENT.json', {'arm': 'dsh', 'exit_code': exit_code,
            'failure': failure, 'elapsed_seconds': time.time() - started,
            'container_state': base.state(NAME), 'proxy_state': base.state(PROXY),
            'scoring_pending': True})
        print(json.dumps({'exit_code': exit_code, 'failure': failure}), flush=True)


if __name__ == '__main__':
    main()
