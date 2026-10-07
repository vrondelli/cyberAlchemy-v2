"""Launch the two source-only G02/DSH pairs on the GLM VPS; score only after sealing.

Run-owned paths only. No automatic model retry or benchmark gold mount.
Open questions: whether the candidate generalizes beyond these two tasks.
"""
import concurrent.futures
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time

ROOT = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
EGRESS = 'are-g02-benchmark-egress-20260926'
TASKS = {
    'contextbench-1': ('SWE-Bench-Pro__go__maintenance__bugfix__6efcf999.json', 'd85d82580cbf8733ae3ad977581392f8bc3d46cecf7036e8c89a381c9e7e3b56', 'flipt'),
    'contextbench-2': ('SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f.json', 'c4d920d0970b4c5a1b809b67e19a88399aa46b53e5a1a18d233e039e6c490bc5', 'nodebb'),
}
OVERLAYS = {
    C + '/deepseek-pilot-are-worker-screen-v2.mjs': '5da7eb680570a43779182d72bbef196a4b5d3c2799d7157e6d355e0c9468e44b',
    C + '/ranked-source-acquisition.mjs': '180f47c3ee83ec4bc5906c3017958bc9f9bd8fd92488ede519e3564584953327',
    C + '/ranked-source-acquisition-base.mjs': 'a287d8ceac9bdf2b210b1cf63268560b32da5481c58aee73dae076f7f87885ab',
    C + '/terminal-evidence.mjs': 'fc919decaa287672e2dc298c19f509c9c243d38d83067df5faca6fcbb6b3253b',
    'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v1/contextbench/representation.mjs': 'bad0d4f85a80915c6402f27ca99989a71100f4943fc838747518ef5e661c8162',
}


def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())


def command(args):
    return subprocess.run(args, capture_output=True, text=True, check=True, timeout=120)


def common(name):
    return ['docker', 'run', '--name', name, '--read-only', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '1g',
            '--pids-limit', '128', '--log-opt', 'max-size=8m', '--log-opt', 'max-file=1',
            '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m']


def preflight():
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')
    if (ROOT / 'CAMPAIGN-STARTED.json').exists():
        raise RuntimeError('campaign-already-started')
    for task_id, (filename, digest, cache_name) in TASKS.items():
        task_path = ROOT / 'tasks' / filename
        if hashlib.sha256(task_path.read_bytes()).hexdigest() != digest:
            raise RuntimeError('task-sha-drift:' + task_id)
        task = json.loads(task_path.read_text())
        command(['git', '-C', str(ROOT / 'cache' / cache_name), 'cat-file', '-e',
                 task['base_commit'] + '^{commit}'])
    for path, digest in OVERLAYS.items():
        if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != digest:
            raise RuntimeError('overlay-sha-drift:' + path)
    command(['docker', 'image', 'inspect', IMAGE])
    command(['docker', 'network', 'inspect', 'are-dsh-canary'])
    command(['docker', 'network', 'inspect', EGRESS])
    if not pathlib.Path(SECRET).is_file():
        raise RuntimeError('credential-file-unavailable')


def state(name):
    result = subprocess.run(['docker', 'inspect', '--format', '{{json .State}}', name],
                            capture_output=True, text=True, timeout=30)
    return json.loads(result.stdout) if result.returncode == 0 else {'missing': True}


def run(task_id, arm):
    slot = task_id + '-' + arm
    run_root = ROOT / 'runs' / slot
    run_root.mkdir()
    started = time.time()
    save(run_root / 'STARTED.json', {'task_id': task_id, 'arm': arm, 'started_unix': started})
    name = 'are-g02-fresh-r3-' + slot
    proxy = None
    exit_code = None
    failure = None
    try:
        if shutil.disk_usage(ROOT).free < 8 * 1024**3:
            raise RuntimeError('host-free-space-reserve')
        for folder in ('evidence', 'sources'):
            (run_root / folder).mkdir()
        task_file, _, cache_name = TASKS[task_id]
        task = json.loads((ROOT / 'tasks' / task_file).read_text())
        if arm == 'are':
            os.chown(run_root / 'evidence', 65532, 65532)
            os.chown(run_root / 'sources', 65532, 65532)
            args = common(name) + ['--network', EGRESS, '--user', '65532:65532', '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
                '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000', '-e', 'GIT_CONFIG_GLOBAL=/repo/' + C + '/g02-fresh-pair-20260926/are-gitconfig',
                '-v', str(ROOT) + ':/repo:ro', '-v', str(ROOT / 'tasks') + ':/tasks:ro',
                '-v', str(ROOT / 'cache') + ':/cache:ro', '-v', str(run_root / 'evidence') + ':/evidence',
                '-v', str(run_root / 'sources') + ':/sources', '-v', SECRET + ':/run/secrets/model_api_key:ro',
                IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs', task_id]
        else:
            for folder in ('base', 'work'):
                command(['git', 'clone', '--no-local', '--no-checkout', str(ROOT / 'cache' / cache_name),
                         str(run_root / 'sources' / folder)])
                command(['git', '-C', str(run_root / 'sources' / folder), 'checkout', '--detach', task['base_commit']])
            for folder in ('state', 'tools', 'transport'):
                (run_root / folder).mkdir()
            os.chown(run_root / 'transport', 65532, 65532)
            proxy = name + '-proxy'
            profile = (ROOT / 'profile-template.patch.yml').read_text().replace('are-dsh-profile-60', proxy).replace(
                '0d8c794d2ac7acc171ea7741c71100391cf70faf', task['base_commit'])
            (run_root / 'profile.patch.yml').write_text(profile)
            proxy_args = common(proxy) + ['--network', EGRESS, '-d', '--user', '65532:65532',
                '-e', 'CONTEXT_WINDOW=1000000', '-e', 'OUTPUT_CAP=8192', '-e', 'TOKEN_BUDGET=650000',
                '-e', 'MAX_REQUEST_BYTES=33554432', '-e', 'MAX_STAGE_BYTES=536870912',
                '-v', str(ROOT) + ':/repo:ro',
                '-v', str(run_root / 'transport') + ':/evidence', '-v', SECRET + ':/run/secrets/model_api_key:ro',
                IMAGE, 'node', '/repo/' + C + '/deepseek-transport-server.mjs']
            save(run_root / 'PROXY-COMMAND.json', proxy_args)
            command(proxy_args)
            command(['docker', 'network', 'connect', 'are-dsh-canary', proxy])
            prompt = task['problem_statement'] + ('\n\nInvestigate this issue and attempt a patch using the repository tools. '
                'Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. '
                'Report inability honestly. Source-selection scores do not prove patch correctness.')
            args = common(name) + ['--network', 'are-dsh-canary', '-e', 'HOME=/tmp', '-e', 'DSH_HOME=/state',
                '-e', 'CANARY_PLACEHOLDER=benchmark-no-secret', '-v', '/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro',
                '-v', str(ROOT) + ':/repo:ro', '-v', str(run_root / 'state') + ':/state',
                '-v', str(run_root / 'sources' / 'base') + ':/base:ro',
                '-v', str(run_root / 'sources' / 'work') + ':/work',
                '-v', str(run_root / 'tools') + ':/evidence', '-w', '/work', IMAGE, 'node',
                '/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js', '--profile', 'headless',
                '--patch', '/repo/runs/' + slot + '/profile.patch.yml', prompt]
        save(run_root / 'COMMAND.json', args)
        with (run_root / 'stdout.txt').open('x') as stdout, (run_root / 'stderr.txt').open('x') as stderr:
            try:
                exit_code = subprocess.run(args, stdout=stdout, stderr=stderr, timeout=1800).returncode
            except subprocess.TimeoutExpired:
                subprocess.run(['docker', 'stop', '--time', '30', name], capture_output=True, timeout=45)
                exit_code = 124
    except Exception as error:
        failure = type(error).__name__ + ': ' + str(error)[:300]
    finally:
        for target in (name, proxy):
            if target and state(target).get('Running'):
                subprocess.run(['docker', 'stop', '--time', '30', target], capture_output=True, timeout=45)
        result = {'task_id': task_id, 'arm': arm, 'exit_code': exit_code, 'failure': failure,
                  'elapsed_seconds': time.time() - started, 'container_state': state(name),
                  'proxy_state': state(proxy) if proxy else None, 'scoring_pending': True}
        save(run_root / 'SETTLEMENT.json', result)
        print(json.dumps({'slot': slot, 'exit_code': exit_code, 'failure': failure}), flush=True)
    return result


if __name__ == '__main__':
    preflight()
    save(ROOT / 'CAMPAIGN-STARTED.json', {'started_unix': time.time(), 'tasks': list(TASKS),
        'arms': ['are', 'dsh'], 'image': IMAGE, 'candidate_overlay_sha256': OVERLAYS,
        'scoring_pending': True})
    results = []
    for task_id in TASKS:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results.extend(pool.map(lambda arm: run(task_id, arm), ('are', 'dsh')))
    save(ROOT / 'CAMPAIGN-SETTLEMENT.json', {'results': results, 'scoring_pending': True})
