"""Run one fixed G02 ARE/DSH confirmation pair; no retry or gold mount."""
import concurrent.futures
import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time

BASE_ROOT = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-callcap16-confirm-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
SPEC = importlib.util.spec_from_file_location('g02_base_runner', BASE_ROOT / C / 'g02-fresh-pair-20260926/run_pair.py')
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
TASKS = {
 'contextbench-1': ('SWE-Bench-Pro__go__maintenance__bugfix__997c7afd.json', '6a594c11a2657f7c0ee08fc95586017b4564ae936cc700125c6d8ab56c83dc78', 'flipt'),
 'contextbench-2': ('SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae.json', '891e224a109e0ac1a2aca54cf6d31caeeda7ffb62b40d30fe7ac7daa30bac8fe', 'nodebb'),
}
PROFILE_SHA = '0bcf651b60a656cc53b55a262f3caf94633155eb6842251759225c87c1d3aa72'
WRAPPER_SHA = None  # bound from the copied file in the run's STARTED receipt


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def preflight(task_id):
    if task_id not in TASKS or not ROOT.is_dir():
        raise RuntimeError('unknown-task-or-run-root')
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')
    filename, digest, cache = TASKS[task_id]
    path = ROOT / 'tasks' / filename
    if sha(path) != digest or sha(ROOT / 'code/deepseek-full-window-profile.mjs') != PROFILE_SHA:
        raise RuntimeError('task-or-profile-drift')
    task = json.loads(path.read_text())
    BASE.command(['git', '-C', str(BASE_ROOT / 'cache' / cache), 'cat-file', '-e',
                  task['base_commit'] + '^{commit}'])
    BASE.command(['docker', 'image', 'inspect', BASE.IMAGE])
    BASE.command(['docker', 'network', 'inspect', BASE.EGRESS])
    BASE.command(['docker', 'network', 'inspect', 'are-dsh-canary'])
    if not pathlib.Path(BASE.SECRET).is_file():
        raise RuntimeError('credential-file-unavailable')
    for arm in ('are', 'dsh'):
        if (ROOT / 'runs' / (task_id + '-' + arm)).exists():
            raise RuntimeError('slot-already-started')


def run(task_id, arm):
    filename, _, cache = TASKS[task_id]
    task = json.loads((ROOT / 'tasks' / filename).read_text())
    slot = task_id + '-' + arm
    run_root = ROOT / 'runs' / slot
    run_root.mkdir()
    started = time.time()
    BASE.save(run_root / 'STARTED.json', {'task_id': task_id, 'arm': arm,
              'instance_id': task['instance_id'], 'started_unix': started})
    name = 'are-g02-cap16-confirm-' + slot
    proxy = name + '-proxy' if arm == 'dsh' else None
    exit_code = None
    failure = None
    try:
        (run_root / 'sources').mkdir()
        if arm == 'are':
            (run_root / 'evidence').mkdir()
            os.chown(run_root / 'sources', 65532, 65532)
            os.chown(run_root / 'evidence', 65532, 65532)
            args = BASE.common(name) + ['--network', BASE.EGRESS, '--user', '65532:65532',
                '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
                '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000',
                '-e', 'GIT_CONFIG_GLOBAL=/repo/' + C + '/g02-fresh-pair-20260926/are-gitconfig',
                '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(ROOT / 'tasks') + ':/tasks:ro',
                '-v', str(BASE_ROOT / 'cache') + ':/cache:ro',
                '-v', str(ROOT / 'code/deepseek-full-window-profile.mjs') + ':/repo/' + C + '/deepseek-full-window-profile.mjs:ro',
                '-v', str(ROOT / 'code/confirm-are.mjs') + ':/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs:ro',
                '-v', str(run_root / 'evidence') + ':/evidence',
                '-v', str(run_root / 'sources') + ':/sources',
                '-v', BASE.SECRET + ':/run/secrets/model_api_key:ro',
                BASE.IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs', task_id]
        else:
            for folder in ('base', 'work'):
                BASE.command(['git', 'clone', '--no-local', '--no-checkout',
                              str(BASE_ROOT / 'cache' / cache), str(run_root / 'sources' / folder)])
                BASE.command(['git', '-C', str(run_root / 'sources' / folder),
                              'checkout', '--detach', task['base_commit']])
            for folder in ('state', 'tools', 'transport'):
                (run_root / folder).mkdir()
            os.chown(run_root / 'transport', 65532, 65532)
            profile = (BASE_ROOT / 'profile-template.patch.yml').read_text().replace(
                'are-dsh-profile-60', proxy).replace(
                '0d8c794d2ac7acc171ea7741c71100391cf70faf', task['base_commit'])
            (run_root / 'profile.patch.yml').write_text(profile)
            proxy_args = BASE.common(proxy) + ['--network', BASE.EGRESS, '-d',
                '--user', '65532:65532', '-e', 'CONTEXT_WINDOW=1000000',
                '-e', 'OUTPUT_CAP=8192', '-e', 'TOKEN_BUDGET=1000000',
                '-e', 'MAX_REQUEST_BYTES=33554432', '-e', 'MAX_STAGE_BYTES=536870912',
                '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(run_root / 'transport') + ':/evidence',
                '-v', BASE.SECRET + ':/run/secrets/model_api_key:ro',
                BASE.IMAGE, 'node', '/repo/' + C + '/deepseek-transport-server.mjs']
            BASE.save(run_root / 'PROXY-COMMAND.json', proxy_args)
            BASE.command(proxy_args)
            BASE.command(['docker', 'network', 'connect', 'are-dsh-canary', proxy])
            prompt = task['problem_statement'] + ('\n\nInvestigate this issue and attempt a patch using the repository tools. '
                'Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. '
                'Report inability honestly. Source-selection scores do not prove patch correctness.')
            args = BASE.common(name) + ['--network', 'are-dsh-canary', '-e', 'HOME=/tmp',
                '-e', 'DSH_HOME=/state', '-e', 'CANARY_PLACEHOLDER=benchmark-no-secret',
                '-v', '/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro',
                '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(ROOT) + ':/confirm:ro',
                '-v', str(run_root / 'state') + ':/state',
                '-v', str(run_root / 'sources/base') + ':/base:ro',
                '-v', str(run_root / 'sources/work') + ':/work',
                '-v', str(run_root / 'tools') + ':/evidence', '-w', '/work', BASE.IMAGE,
                'node', '/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js', '--profile',
                'headless', '--patch', '/confirm/runs/' + slot + '/profile.patch.yml', prompt]
        BASE.save(run_root / 'COMMAND.json', args)
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
            if target and BASE.state(target).get('Running'):
                subprocess.run(['docker', 'stop', '--time', '30', target], capture_output=True, timeout=45)
        BASE.save(run_root / 'SETTLEMENT.json', {'task_id': task_id, 'arm': arm,
                  'exit_code': exit_code, 'failure': failure,
                  'elapsed_seconds': time.time() - started,
                  'container_state': BASE.state(name),
                  'proxy_state': BASE.state(proxy) if proxy else None,
                  'scoring_pending': True})
        print(json.dumps({'slot': slot, 'exit_code': exit_code, 'failure': failure}), flush=True)


if __name__ == '__main__':
    task_id = sys.argv[1]
    preflight(task_id)
    BASE.save(ROOT / ('PAIR-' + task_id + '-STARTED.json'), {
        'task_id': task_id, 'started_unix': time.time(),
        'task_sha256': TASKS[task_id][1], 'candidate_profile_sha256': PROFILE_SHA,
        'candidate_wrapper_sha256': sha(ROOT / 'code/confirm-are.mjs'),
        'image': BASE.IMAGE, 'arms': ['are', 'dsh'],
        'limits': {'are_max_calls': 16, 'are_screen_token_ceiling': 650000,
                   'dsh_transport_budget': 1000000, 'per_arm_seconds': 1800},
        'success': 'both arms valid; ARE Span-F1 and File-F1 greater, model tokens and wall time lower'})
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda arm: run(task_id, arm), ('are', 'dsh')))
    BASE.save(ROOT / ('PAIR-' + task_id + '-SETTLEMENT.json'), {'results': results})
