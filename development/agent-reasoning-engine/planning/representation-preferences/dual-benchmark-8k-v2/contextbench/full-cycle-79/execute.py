"""Run the two prospectively frozen max-window ARE treatments once each."""
import concurrent.futures, hashlib, json, os, pathlib, shutil, subprocess, time

ROOT = pathlib.Path('/opt/are-harness-benchmark/full-cycle-79')
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
SECRET = '/opt/are-keld-presentation/secrets/model_api_key'

def save(path, value):
    with path.open('x') as handle:
        json.dump(value, handle, indent=2)
        handle.flush()
        os.fsync(handle.fileno())
    descriptor = os.open(path.parent, os.O_RDONLY)
    os.fsync(descriptor)
    os.close(descriptor)

def capacity():
    if shutil.disk_usage(ROOT).free < 8 * 1024**3:
        raise RuntimeError('host-free-space-reserve')

def common(name):
    return [
        'docker', 'run', '--name', name, '--read-only', '--cap-drop', 'ALL',
        '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '2g',
        '--pids-limit', '128', '--log-opt', 'max-size=8m', '--log-opt',
        'max-file=1', '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m'
    ]

def settled(name):
    result = subprocess.run(
        ['docker', 'inspect', '--format', '{{json .State}}', name],
        capture_output=True, text=True, timeout=30
    )
    return json.loads(result.stdout) if result.returncode == 0 else {'missing': True}

def run(slot):
    run_root = ROOT / 'runs' / slot['id']
    run_root.mkdir()
    capacity()
    started = time.time()
    name = 'are-r79-' + slot['id']
    code = None
    failure = None
    save(run_root / 'STARTED.json', {'slot': slot, 'started_unix': started})
    try:
        for child in ['evidence', 'sources']:
            (run_root / child).mkdir()
        os.chown(run_root / 'evidence', 65532, 65532)
        os.chown(run_root / 'sources', 65532, 65532)
        command = common(name) + [
            '--user', '65532:65532',
            '-e', 'GIT_CONFIG_GLOBAL=/repo/are-gitconfig',
            '-e', 'ARE_RESEARCH_VARIANT=' + slot['arm'],
            '-v', str(ROOT) + ':/repo:ro',
            '-v', '/opt/are-harness-benchmark/paired-pilot-63/cache:/cache:ro',
            '-v', str(run_root / 'evidence') + ':/evidence',
            '-v', str(run_root / 'sources') + ':/sources',
            '-v', SECRET + ':/run/secrets/model_api_key:ro',
            IMAGE, 'node', '/repo/' + C + '/deepseek-pilot-are-worker.mjs',
            slot['task_id']
        ]
        save(run_root / 'COMMAND.json', command)
        with (run_root / 'stdout.txt').open('x') as stdout, \
             (run_root / 'stderr.txt').open('x') as stderr:
            try:
                code = subprocess.run(
                    command, stdout=stdout, stderr=stderr, timeout=2700
                ).returncode
            except subprocess.TimeoutExpired:
                subprocess.run(
                    ['docker', 'stop', '--time', '30', name],
                    capture_output=True, timeout=45
                )
                code = 124
    except Exception as error:
        failure = type(error).__name__ + ': ' + str(error)[:300]
    finally:
        if settled(name).get('Running'):
            subprocess.run(
                ['docker', 'stop', '--time', '30', name],
                capture_output=True, timeout=45
            )
        result = {
            'slot': slot,
            'harness_exit': code,
            'failure': failure,
            'elapsed_seconds': time.time() - started,
            'harness_state': settled(name),
            'scoring_pending': True,
            'benchmark_cleared': False
        }
        save(run_root / 'SETTLEMENT.json', result)
        print(json.dumps({'slot': slot['id'], 'exit': code, 'failure': failure}),
              flush=True)
        return result

if __name__ == '__main__':
    capacity()
    review = json.loads((ROOT / 'REVIEW.json').read_text())
    assert review['dispatch_ready'] is True
    freeze = json.loads((ROOT / 'FREEZE.json').read_text())
    for binding in freeze['bindings']:
        assert hashlib.sha256((ROOT / binding['path']).read_bytes()).hexdigest() == binding['sha256'], binding['path']
    save(ROOT / 'CAMPAIGN-STARTED.json', {
        'started_unix': time.time(),
        'freeze_sha256': hashlib.sha256((ROOT / 'FREEZE.json').read_bytes()).hexdigest()
    })
    slots = [
        {'id': '2-incremental', 'task_id': 'contextbench-2',
         'arm': 'incremental-recovery'},
        {'id': '2-radical', 'task_id': 'contextbench-2',
         'arm': 'radical-ranked-acquisition'}
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(run, slots))
    save(ROOT / 'CAMPAIGN-SETTLEMENT.json', {
        'outcomes': results,
        'all_assigned': len(results) == 2,
        'benchmark_cleared': False
    })
