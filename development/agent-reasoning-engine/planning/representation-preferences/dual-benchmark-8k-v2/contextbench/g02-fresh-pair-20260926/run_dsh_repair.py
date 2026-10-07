"""Retry only the DSH control after the R3 zero-model-call proxy admission failure.

Uses the same source-only tasks, pinned commits, GLM, image, 1M context and
30-minute deadline. The transport requires token_budget >= context window.
"""
import importlib.util
import json
import os
import pathlib
import subprocess
import time

HERE = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location('g02_pair_runner', HERE / 'run_pair.py')
BASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BASE)
ROOT = BASE.ROOT


def run_dsh(task_id):
    filename, _, cache = BASE.TASKS[task_id]
    task = json.loads((ROOT / 'tasks' / filename).read_text())
    slot = task_id + '-dsh-repair'
    run_root = ROOT / 'runs' / slot
    run_root.mkdir()
    started = time.time()
    BASE.save(run_root / 'STARTED.json', {'task_id': task_id, 'arm': 'dsh', 'retry_of': task_id + '-dsh',
        'reason': 'prior proxy failed constructor before any model dispatch', 'started_unix': started})
    name = 'are-g02-fresh-r3-' + slot
    proxy = name + '-proxy'
    exit_code = None
    failure = None
    try:
        for folder in ('sources', 'state', 'tools', 'transport'):
            (run_root / folder).mkdir()
        os.chown(run_root / 'transport', 65532, 65532)
        for folder in ('base', 'work'):
            BASE.command(['git', 'clone', '--no-local', '--no-checkout', str(ROOT / 'cache' / cache),
                          str(run_root / 'sources' / folder)])
            BASE.command(['git', '-C', str(run_root / 'sources' / folder), 'checkout', '--detach', task['base_commit']])
        profile = (ROOT / 'profile-template.patch.yml').read_text().replace('are-dsh-profile-60', proxy).replace(
            '0d8c794d2ac7acc171ea7741c71100391cf70faf', task['base_commit'])
        (run_root / 'profile.patch.yml').write_text(profile)
        proxy_args = BASE.common(proxy) + ['--network', BASE.EGRESS, '-d', '--user', '65532:65532',
            '-e', 'CONTEXT_WINDOW=1000000', '-e', 'OUTPUT_CAP=8192', '-e', 'TOKEN_BUDGET=1000000',
            '-e', 'MAX_REQUEST_BYTES=33554432', '-e', 'MAX_STAGE_BYTES=536870912',
            '-v', str(ROOT) + ':/repo:ro', '-v', str(run_root / 'transport') + ':/evidence',
            '-v', BASE.SECRET + ':/run/secrets/model_api_key:ro', BASE.IMAGE, 'node',
            '/repo/' + BASE.C + '/deepseek-transport-server.mjs']
        BASE.save(run_root / 'PROXY-COMMAND.json', proxy_args)
        BASE.command(proxy_args)
        BASE.command(['docker', 'network', 'connect', 'are-dsh-canary', proxy])
        prompt = task['problem_statement'] + ('\n\nInvestigate this issue and attempt a patch using the repository tools. '
            'Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. '
            'Report inability honestly. Source-selection scores do not prove patch correctness.')
        args = BASE.common(name) + ['--network', 'are-dsh-canary', '-e', 'HOME=/tmp', '-e', 'DSH_HOME=/state',
            '-e', 'CANARY_PLACEHOLDER=benchmark-no-secret', '-v', '/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro',
            '-v', str(ROOT) + ':/repo:ro', '-v', str(run_root / 'state') + ':/state',
            '-v', str(run_root / 'sources' / 'base') + ':/base:ro',
            '-v', str(run_root / 'sources' / 'work') + ':/work',
            '-v', str(run_root / 'tools') + ':/evidence', '-w', '/work', BASE.IMAGE, 'node',
            '/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js', '--profile', 'headless',
            '--patch', '/repo/runs/' + slot + '/profile.patch.yml', prompt]
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
            if BASE.state(target).get('Running'):
                subprocess.run(['docker', 'stop', '--time', '30', target], capture_output=True, timeout=45)
        BASE.save(run_root / 'SETTLEMENT.json', {'task_id': task_id, 'arm': 'dsh-repair',
            'exit_code': exit_code, 'failure': failure, 'elapsed_seconds': time.time() - started,
            'container_state': BASE.state(name), 'proxy_state': BASE.state(proxy), 'scoring_pending': True})
        print(json.dumps({'slot': slot, 'exit_code': exit_code, 'failure': failure}), flush=True)


if __name__ == '__main__':
    for task_id in BASE.TASKS:
        run_dsh(task_id)
