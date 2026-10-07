"""Exact private G02 exposed-development rerun; no scoring or gold access."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import time
from datetime import datetime, timezone

ROOT = pathlib.Path('/tmp/are-g02-r4-runs/g02-r11-callcap12-exposed-task1-r1')
CACHE = pathlib.Path('/tmp/are-g02-r11-task-caches-r1/cache')
BASE = pathlib.Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926')
C = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
IMAGE = 'sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
NAME = 'are-g02-r11-callcap12-exposed-task1-r1'
SECRET = pathlib.Path('/opt/are-keld-presentation/secrets/model_api_key')
GITCONFIG = pathlib.Path('/opt/are/evolution-runtime/g02-r11-selection-only-tools-r1/product-replication-gitconfig')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_once(path, value):
    with path.open('x') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())


def main():
    freeze = json.loads((ROOT / 'FREEZE.json').read_text())
    binding = json.loads((ROOT / 'tasks/binding.json').read_text())
    if (freeze['status'] != 'frozen-before-model-dispatch' or
            binding['container_name'] != NAME or binding['experiment_id'] != NAME.removeprefix('are-') or
            binding['instance_id'] != freeze['instance_id']):
        raise RuntimeError('freeze-binding-mismatch')
    for relative, expected in freeze['source_sha256'].items():
        if digest(ROOT / relative) != expected:
            raise RuntimeError('input-drift:' + relative)
    if digest(GITCONFIG) != 'b593aded097b1dd5e7514e107a7326d4d830d6a554b5ac554291a5c47dd46c1b':
        raise RuntimeError('gitconfig-drift')
    if not SECRET.is_file():
        raise RuntimeError('credential-unavailable')
    task = json.loads((ROOT / 'tasks' / binding['task_file']).read_text())
    if task['base_commit'] != binding['base_commit'] or task['instance_id'] != binding['instance_id']:
        raise RuntimeError('task-binding-mismatch')
    subprocess.run(['git', '-C', str(CACHE / binding['cache']), 'cat-file', '-e',
                    binding['base_commit'] + '^{commit}'], check=True, timeout=30)
    subprocess.run(['docker', 'image', 'inspect', IMAGE], stdout=subprocess.DEVNULL, check=True, timeout=30)
    subprocess.run(['docker', 'network', 'inspect', 'are-g02-benchmark-egress-20260926'],
                   stdout=subprocess.DEVNULL, check=True, timeout=30)
    if subprocess.run(['docker', 'container', 'inspect', NAME], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode == 0:
        raise RuntimeError('container-name-already-used')
    if shutil.disk_usage('/').free < 750000 * 1024 or shutil.disk_usage('/tmp').free < 2500000 * 1024:
        raise RuntimeError('filesystem-reserve')
    with pathlib.Path('/proc/meminfo').open() as stream:
        mem_available = next(int(line.split()[1]) for line in stream if line.startswith('MemAvailable:'))
    if mem_available < 1048576:
        raise RuntimeError('memory-reserve')
    for folder in ('evidence', 'sources'):
        target = ROOT / folder
        target.mkdir()
        os.chown(target, 65532, 65532)
    args = ['docker', 'run', '--name', NAME, '--read-only', '--cap-drop', 'ALL',
            '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '512m',
            '--pids-limit', '128', '--log-opt', 'max-size=8m', '--log-opt', 'max-file=1',
            '--tmpfs', '/tmp:rw,nosuid,nodev,size=128m', '--network',
            'are-g02-benchmark-egress-20260926', '--user', '65532:65532',
            '-e', 'ARE_RESEARCH_VARIANT=radical-ranked-acquisition',
            '-e', 'ARE_SCREEN_FINALIZATION_RESERVE_TOKENS=25000',
            '-e', 'GIT_CONFIG_GLOBAL=/run/are-product-replication-gitconfig',
            '-v', str(BASE) + ':/repo:ro', '-v', str(ROOT / 'tasks') + ':/tasks:ro',
            '-v', str(CACHE) + ':/cache:ro',
            '-v', str(ROOT / 'code/deepseek-full-window-profile.mjs') + ':/repo/' + C + '/deepseek-full-window-profile.mjs:ro',
            '-v', str(ROOT / 'code/confirm-are.mjs') + ':/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs:ro',
            '-v', str(ROOT / 'code/ranked-source-acquisition.mjs') + ':/repo/' + C + '/ranked-source-acquisition.mjs:ro',
            '-v', str(ROOT / 'code/episode-recovery-v2.mjs') + ':/repo/' + C + '/discovery-v1/episode-recovery-v2.mjs:ro',
            '-v', str(ROOT / 'code/base-overlay.mjs') + ':/repo/' + C + '/ranked-source-acquisition-base.mjs:ro',
            '-v', str(ROOT / 'evidence') + ':/evidence', '-v', str(ROOT / 'sources') + ':/sources',
            '-v', str(SECRET) + ':/run/secrets/model_api_key:ro',
            '-v', str(GITCONFIG) + ':/run/are-product-replication-gitconfig:ro',
            IMAGE, 'node', '/repo/' + C + '/g02-fresh-pair-20260926/fresh-pair-are.mjs', 'contextbench-1']
    save_once(ROOT / 'COMMAND.json', args)
    save_once(ROOT / 'STARTED.json', {
        'schema_version': 'are.g02-r11-callcap12-exposed-task1-started/v1',
        'instance_id': binding['instance_id'], 'freeze_sha256': digest(ROOT / 'FREEZE.json'),
        'started_utc': datetime.now(timezone.utc).isoformat(), 'gold_loaded': False})
    start = time.monotonic()
    error = None
    exit_code = None
    with (ROOT / 'stdout.txt').open('x') as stdout, (ROOT / 'stderr.txt').open('x') as stderr:
        try:
            exit_code = subprocess.run(args, stdout=stdout, stderr=stderr, timeout=900).returncode
        except subprocess.TimeoutExpired:
            subprocess.run(['docker', 'stop', '--time', '30', NAME], timeout=45)
            exit_code = 124
        except Exception as exc:
            error = type(exc).__name__ + ': ' + str(exc)[:300]
    settlement = {'schema_version': 'are.g02-r11-callcap12-exposed-task1-settlement/v1',
                  'exit_code': exit_code, 'error': error,
                  'elapsed_seconds': time.monotonic() - start, 'scoring_pending': True}
    save_once(ROOT / 'SETTLEMENT.json', settlement)
    print(json.dumps(settlement), flush=True)


if __name__ == '__main__':
    main()
