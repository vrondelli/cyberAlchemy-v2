"""One fresh source-only G02 ARE/DSH pair; post-filter and score after sealing."""
import concurrent.futures
import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import subprocess
import time

BASE_ROOT = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
ROOT = pathlib.Path('/opt/are-benchmark-runs/g02-task-path-prospective-r1')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
TASK = 'SWE-Bench-Pro__javascript__maintenance__bugfix__14ef25ae.json'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'
EGRESS = 'are-g02-benchmark-egress-20260926'
HASHES = {
    'tasks/' + TASK: 'cd932a746cfe2292b6f15e6727054bf32b8f0827421b91d2233c5b496a6eb7c4',
    'code/deepseek-full-window-profile.mjs': '4ffdbf00e7aad30ebd4235dd830127fdbce001425e67bed5ff5f1a9fd4baa52e',
    'code/fresh-are.mjs': '1ceeb41f706d9dcbbdb259223522fe578a6138be9724daf66a5840037f01d1c6',
    'code/ranked-source-acquisition.mjs': '0072b55febf2a62d50a0cb92675a110913d1bfcd71905c35c60458b69681b942',
    'code/filter-prediction.mjs': '0045683aec458d0223dcb8c46c0c38b1d05f0f34ba32e77171f5be8e2f00890b',
}
spec = importlib.util.spec_from_file_location('g02_base_runner', BASE_ROOT / C / 'g02-fresh-pair-20260926/run_pair.py')
BASE = importlib.util.module_from_spec(spec)
spec.loader.exec_module(BASE)


def save(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.flush()
        os.fsync(stream.fileno())


def preflight():
    if not ROOT.is_dir() or (ROOT / 'CAMPAIGN-STARTED.json').exists():
        raise RuntimeError('run-root-missing-or-started')
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')
    for path, expected in HASHES.items():
        if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != expected:
            raise RuntimeError('input-drift:' + path)
    task = json.loads((ROOT / 'tasks' / TASK).read_text())
    BASE.command(['git', '-C', str(BASE_ROOT / 'cache/nodebb'), 'cat-file', '-e',
                  task['base_commit'] + '^{commit}'])
    for command in (['docker', 'image', 'inspect', IMAGE],
                    ['docker', 'network', 'inspect', EGRESS],
                    ['docker', 'network', 'inspect', 'are-dsh-canary']):
        BASE.command(command)
    if not pathlib.Path(SECRET).is_file():
        raise RuntimeError('credential-file-unavailable')
    for arm in ('are', 'dsh'):
        if (ROOT / 'runs' / arm).exists():
            raise RuntimeError('slot-already-started')


def run(arm):
    task = json.loads((ROOT / 'tasks' / TASK).read_text())
    run_root = ROOT / 'runs' / arm
    run_root.mkdir()
    started = time.time()
    save(run_root / 'STARTED.json', {'arm': arm, 'task_id': 'contextbench-2',
                                    'instance_id': task['instance_id'], 'started_unix': started})
    name = 'are-g02-taskpath-prospective-' + arm
    proxy = name + '-proxy' if arm == 'dsh' else None
    exit_code = None
    failure = None
    try:
        (run_root / 'sources').mkdir()
        if arm == 'are':
            (run_root / 'evidence').mkdir()
            os.chown(run_root / 'sources', 65532, 65532)
            os.chown(run_root / 'evidence', 65532, 65532)
            args = BASE.common(name) + ['--network', EGRESS, '--user', '65532:65532',
                '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
                '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000',
                '-e', 'GIT_CONFIG_GLOBAL=/repo/' + C + '/g02-fresh-pair-20260926/are-gitconfig',
                '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(ROOT / 'tasks') + ':/tasks:ro',
                '-v', str(BASE_ROOT / 'cache') + ':/cache:ro',
                '-v', str(ROOT / 'code/deepseek-full-window-profile.mjs') + ':/repo/' + C + '/deepseek-full-window-profile.mjs:ro',
                '-v', str(ROOT / 'code/fresh-are.mjs') + ':/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs:ro',
                '-v', str(ROOT / 'code/ranked-source-acquisition.mjs') + ':/repo/' + C + '/ranked-source-acquisition.mjs:ro',
                '-v', str(run_root / 'evidence') + ':/evidence',
                '-v', str(run_root / 'sources') + ':/sources',
                '-v', SECRET + ':/run/secrets/model_api_key:ro',
                IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs']
            timeout = 900
        else:
            for folder in ('base', 'work'):
                BASE.command(['git', 'clone', '--no-local', '--no-checkout',
                              str(BASE_ROOT / 'cache/nodebb'), str(run_root / 'sources' / folder)])
                BASE.command(['git', '-C', str(run_root / 'sources' / folder),
                              'checkout', '--detach', task['base_commit']])
            for folder in ('state', 'tools', 'transport'):
                (run_root / folder).mkdir()
            os.chown(run_root / 'transport', 65532, 65532)
            profile = (BASE_ROOT / 'profile-template.patch.yml').read_text().replace(
                'are-dsh-profile-60', proxy).replace(
                '0d8c794d2ac7acc171ea7741c71100391cf70faf', task['base_commit'])
            (run_root / 'profile.patch.yml').write_text(profile)
            proxy_args = BASE.common(proxy) + ['--network', EGRESS, '-d',
                '--user', '65532:65532', '-e', 'CONTEXT_WINDOW=1000000',
                '-e', 'OUTPUT_CAP=8192', '-e', 'TOKEN_BUDGET=1000000',
                '-e', 'MAX_REQUEST_BYTES=33554432', '-e', 'MAX_STAGE_BYTES=536870912',
                '-v', str(BASE_ROOT) + ':/repo:ro',
                '-v', str(run_root / 'transport') + ':/evidence',
                '-v', SECRET + ':/run/secrets/model_api_key:ro',
                IMAGE, 'node', '/repo/' + C + '/deepseek-transport-server.mjs']
            save(run_root / 'PROXY-COMMAND.json', proxy_args)
            BASE.command(proxy_args)
            BASE.command(['docker', 'network', 'connect', 'are-dsh-canary', proxy])
            prompt = task['problem_statement'] + ('\n\nInvestigate this issue and attempt a patch using the repository tools. '
                'Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. '
                'Report inability honestly. Source-selection scores do not prove patch correctness.')
            args = BASE.common(name) + ['--network', 'are-dsh-canary', '-e', 'HOME=/tmp',
                '-e', 'DSH_HOME=/state', '-e', 'CANARY_PLACEHOLDER=benchmark-no-secret',
                '-v', '/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro',
                '-v', str(BASE_ROOT) + ':/repo:ro', '-v', str(ROOT) + ':/pair:ro',
                '-v', str(run_root / 'state') + ':/state',
                '-v', str(run_root / 'sources/base') + ':/base:ro',
                '-v', str(run_root / 'sources/work') + ':/work',
                '-v', str(run_root / 'tools') + ':/evidence', '-w', '/work', IMAGE,
                'node', '/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js', '--profile',
                'headless', '--patch', '/pair/runs/dsh/profile.patch.yml', prompt]
            timeout = 1800
        save(run_root / 'COMMAND.json', args)
        with (run_root / 'stdout.txt').open('x') as stdout, (run_root / 'stderr.txt').open('x') as stderr:
            try:
                exit_code = subprocess.run(args, stdout=stdout, stderr=stderr, timeout=timeout).returncode
            except subprocess.TimeoutExpired:
                subprocess.run(['docker', 'stop', '--time', '30', name], capture_output=True, timeout=45)
                exit_code = 124
    except Exception as error:
        failure = type(error).__name__ + ': ' + str(error)[:300]
    finally:
        for target in (name, proxy):
            if target and BASE.state(target).get('Running'):
                subprocess.run(['docker', 'stop', '--time', '30', target], capture_output=True, timeout=45)
        settlement = {'arm': arm, 'task_id': 'contextbench-2', 'exit_code': exit_code,
                      'failure': failure, 'elapsed_seconds': time.time() - started,
                      'container_state': BASE.state(name),
                      'proxy_state': BASE.state(proxy) if proxy else None,
                      'scoring_pending': True}
        save(run_root / 'SETTLEMENT.json', settlement)
        print(json.dumps({'arm': arm, 'exit_code': exit_code, 'failure': failure}), flush=True)
    return settlement


if __name__ == '__main__':
    preflight()
    save(ROOT / 'CAMPAIGN-STARTED.json', {'task_id': 'contextbench-2',
         'task_sha256': HASHES['tasks/' + TASK], 'input_sha256': HASHES,
         'image': IMAGE, 'started_unix': time.time(),
         'candidate': 'no-archive discovery plus frozen task-path post-filter',
         'arms': ['are', 'dsh'],
         'success': 'both arms valid; ARE filtered Span-F1 and File-F1 strictly greater, tokens and wall time lower'})
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(run, ('are', 'dsh')))
    save(ROOT / 'CAMPAIGN-SETTLEMENT.json', {'results': results,
         'settled_unix': time.time(), 'scoring_pending': True})
