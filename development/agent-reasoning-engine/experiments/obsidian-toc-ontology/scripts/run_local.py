"""Local pilot operator; never invokes a model or changes a solver's source."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'manifest.json'
BASE = '6393b3ab32a2ace1fc24d4b0f5e0f13a179c874f'
PREFIX = 'obsidian-ontology-20260905-'


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def output(args):
    return run(args, capture_output=True, text=True).stdout.strip()


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as f:
        json.dump(data, f, indent=2)
        f.write('\n')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def create(name):
    manifest = json.loads(MANIFEST.read_text())
    image = manifest['image_digest']
    if not image:
        raise RuntimeError('Pin image digest first')
    run(['docker', 'run', '-d', '--name', name, '--network', 'none',
         '--cpus', '2', '--memory', '8g', '--label',
         'experiment=obsidian-toc-ontology-20260905', image,
         'sleep', 'infinity'], capture_output=True)
    sha = output(['docker', 'exec', name, 'git', '-C', '/app', 'rev-parse', 'HEAD'])
    if sha != BASE:
        raise RuntimeError(f'Unexpected base {sha}')
    dirty = output(['docker', 'exec', name, 'git', '-C', '/app', 'status', '--porcelain'])
    if dirty:
        raise RuntimeError(f'Dirty image: {dirty}')


def prepare(run_id):
    path = ROOT / 'evidence' / 'runs' / run_id
    if path.exists():
        raise RuntimeError('Run already exists')
    name = PREFIX + run_id.lower()
    create(name)
    run(['docker', 'exec', name, 'mkdir', '-p', '/tmp/experiment-notes'])
    arm = run_id[-1]
    prompt = (ROOT / 'prompts/common.md').read_text() + '\n' + (
        ROOT / f'prompts/{arm}.md').read_text()
    instruction = ROOT / 'evidence/upstream/instruction.md'
    run(['docker', 'cp', str(instruction), name + ':/tmp/experiment-notes/instruction.md'])
    # The task instruction is unmodified; the common protocol explicitly overrides
    # its commit request because collection here includes working-tree source bytes.
    record = {'run_id': run_id, 'arm': arm, 'container': name,
              'prepared_at': dt.datetime.now(dt.timezone.utc).isoformat(),
              'base_sha': BASE, 'image_digest': json.loads(MANIFEST.read_text())['image_digest'],
              'prompt_sha256': hashlib.sha256(prompt.encode()).hexdigest(),
              'instruction_sha256': digest(instruction), 'status': 'prepared'}
    save(path / 'prepared.json', record)
    (path / 'prompt.md').write_text(prompt)
    print(json.dumps(record))


def freeze(run_id):
    path = ROOT / 'evidence/runs' / run_id
    record = json.loads((path / 'prepared.json').read_text())
    if (path / 'frozen.json').exists():
        raise RuntimeError('Run already frozen')
    name = record['container']
    # A disposable index includes new files without a commit or main-index edits.
    script = '''set -eu
cd /app
export GIT_INDEX_FILE=/tmp/experiment-collection-index
test ! -e "$GIT_INDEX_FILE"
git read-tree HEAD
git add -- src
git diff --cached --binary ''' + BASE
    patch = run(['docker', 'exec', name, 'bash', '-c', script], capture_output=True).stdout
    path.mkdir(parents=True, exist_ok=True)
    with (path / 'model.patch').open('xb') as f:
        f.write(patch)
    status = output(['docker', 'exec', name, 'git', '-C', '/app', 'status', '--porcelain'])
    run(['docker', 'cp', name + ':/tmp/experiment-notes', str(path / 'notes')], capture_output=True)
    save(path / 'frozen.json', {**record, 'status': 'frozen',
         'frozen_at': dt.datetime.now(dt.timezone.utc).isoformat(),
         'patch_sha256': hashlib.sha256(patch).hexdigest(), 'patch_bytes': len(patch),
         'working_tree_status': status, 'collection': 'temporary-index src-only diff; no commit'})
    run(['docker', 'stop', name], capture_output=True)
    print('Frozen', run_id, len(patch), 'bytes')


def evaluate(run_id):
    if run_id == 'base':
        path = ROOT / 'evidence/preflight'
        patch = None
    else:
        path = ROOT / 'evidence/runs' / run_id / 'evaluation'
        patch = path.parent / 'model.patch'
        frozen = json.loads((path.parent / 'frozen.json').read_text())
        if digest(patch) != frozen['patch_sha256']:
            raise RuntimeError('Frozen patch drift')
    if path.exists():
        raise RuntimeError('Evaluation already exists')
    path.mkdir(parents=True)
    name = PREFIX + 'verify-' + run_id.lower()
    create(name)
    run(['docker', 'cp', str(ROOT / 'evidence/upstream/tests'), name + ':/tests'], capture_output=True)
    run(['docker', 'exec', name, 'mkdir', '-p', '/logs/artifacts', '/logs/verifier'])
    if patch:
        run(['docker', 'cp', str(patch), name + ':/logs/artifacts/model.patch'], capture_output=True)
    start = time.monotonic()
    started = dt.datetime.now(dt.timezone.utc).isoformat()
    with (path / 'test-stdout.txt').open('xb') as log:
        try:
            proc = subprocess.run(['docker', 'exec', name, 'bash', '/tests/test.sh'],
                                  stdout=log, stderr=subprocess.STDOUT, timeout=1800)
            code = proc.returncode
        except subprocess.TimeoutExpired:
            code = None
            run(['docker', 'stop', name], capture_output=True)
    run(['docker', 'cp', name + ':/logs/verifier', str(path / 'verifier')], capture_output=True)
    run(['docker', 'stop', name], capture_output=True)
    reward = path / 'verifier/reward.json'
    receipt = {'run_id': run_id, 'started_at': started, 'wall_seconds': time.monotonic()-start,
               'exit_code': code, 'reward': json.loads(reward.read_text()) if reward.exists() else None,
               'image_digest': json.loads(MANIFEST.read_text())['image_digest'],
               'command': 'docker exec <pristine-verifier> bash /tests/test.sh',
               'status': 'evaluated' if code == 0 and reward.exists() else 'not_evaluable',
               'patch_sha256': digest(patch) if patch else None,
               'test_stdout_sha256': digest(path / 'test-stdout.txt')}
    save(path / 'receipt.json', receipt)
    print(json.dumps(receipt))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['prepare', 'freeze', 'evaluate'])
    parser.add_argument('run_id', choices=['base', 'pilot-A', 'pilot-B', 'pilot-C'])
    args = parser.parse_args()
    if args.run_id == 'base' and args.mode != 'evaluate':
        parser.error('base is evaluation-only')
    {'prepare': prepare, 'freeze': freeze, 'evaluate': evaluate}[args.mode](args.run_id)
