"""Explicit Linux/local-storage stale-lock reconciliation; never replays actions."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import tempfile


def sha(data):
    return hashlib.sha256(data).hexdigest()


def regular(path):
    if not stat.S_ISREG(path.lstat().st_mode):
        raise ValueError(f'Expected regular file: {path.name}')
    return path.read_bytes()


def stopped(pid):
    if type(pid) is not int or pid <= 0:
        raise ValueError('Invalid writer process ID')
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return
    except PermissionError:
        pass
    raise ValueError('Writer PID exists or cannot be inspected; refusing reconciliation')


def reconcile(engine, project, expected=None, confirm=False):
    engine, project = Path(engine).resolve(strict=True), Path(project).resolve(strict=True)
    state = project / '.are-keld'
    if state.is_symlink() or not state.is_dir():
        raise ValueError('Expected local .are-keld directory')
    if (state / 'writer.lock').exists():
        raise ValueError('Legacy launcher lock needs separate reconciliation')
    profile = json.loads(regular(state / 'profile.json'))
    config = profile['reasoning_state']
    if config['storage_mode'] != 'append-only-file-fsync' or config['log_path'] != '.are-keld/reasoning-state.jsonl':
        raise ValueError('Unsupported customer ledger configuration')
    log = state / 'reasoning-state.jsonl'
    lock = state / 'reasoning-state.jsonl.writer.lock'
    fd = os.open(state / 'writer.flock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        if not stat.S_ISREG(os.fstat(fd).st_mode):
            raise ValueError('Expected regular OS lock file')
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        lock_bytes, log_bytes = regular(lock), regular(log)
        record = json.loads(lock_bytes)
        if record.get('schema_version') != 'are.reasoning-state-writer-lock/v1' or record.get('ledger_path') != str(log):
            raise ValueError('Lock does not belong to this ledger')
        stopped(record.get('process_id'))
        module = engine / 'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs'
        script = '''import {pathToFileURL} from 'node:url';
const api=await import(pathToFileURL(process.argv[1]));
const verified=api.verifyReasoningStateLog(process.argv[2],{expected_ledger_id:process.argv[3]});
const selected=verified.ok?api.selectRecoverableCheckpoint(verified):verified;
console.log(JSON.stringify({ok:selected.ok,reason_codes:selected.reason_codes??[],disposition:selected.disposition??null}));'''
        result = subprocess.run(['node', '--input-type=module', '-e', script, str(module), str(log), config['ledger_id']], capture_output=True, text=True, check=True, timeout=30)
        verified = json.loads(result.stdout)
        if not verified['ok']:
            raise ValueError('Ledger not recoverable: ' + ','.join(verified['reason_codes']))
        report = {'status': 'eligible-for-confirmation', 'lock_sha256': sha(lock_bytes), 'ledger_sha256': sha(log_bytes), 'checkpoint': verified['disposition'], 'actions_replayed': 0}
        if expected is None:
            return report
        if not confirm or expected != report['lock_sha256']:
            raise ValueError('Apply requires matching lock hash and explicit local stopped-writer confirmation')
        # Preserve all customer state; refuse links rather than copying their targets.
        for path in state.rglob('*'):
            if path.is_symlink() or not (path.is_dir() or path.is_file()):
                raise ValueError('Unsupported entry in customer state backup')
        backup = Path(tempfile.mkdtemp(prefix='are-recovery-', dir=project))
        shutil.copytree(state, backup / '.are-keld')
        if regular(backup / '.are-keld' / lock.name) != lock_bytes or regular(backup / '.are-keld' / log.name) != log_bytes:
            raise ValueError('Backup verification failed')
        stopped(record['process_id'])
        if regular(lock) != lock_bytes or regular(log) != log_bytes:
            raise ValueError('State changed during reconciliation; backup retained, lock untouched')
        (backup / 'reconciliation.json').write_text(json.dumps(report, indent=2) + '\n')
        # Persist the backup before releasing the stale lock.
        for path in backup.rglob('*'):
            if path.is_file():
                with path.open('rb') as saved:
                    os.fsync(saved.fileno())
        for path in sorted([backup, *[p for p in backup.rglob('*') if p.is_dir()]], key=lambda p: len(p.parts), reverse=True):
            directory_fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(directory_fd)
            finally:
                os.close(directory_fd)
        parent_fd = os.open(project, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(parent_fd)
        finally:
            os.close(parent_fd)
        lock.unlink()
        return {**report, 'status': 'lock-reconciled', 'backup': str(backup), 'claim_limit': 'No action replay or transport resumption; normal startup must validate state again.'}
    finally:
        os.close(fd)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('engine')
    parser.add_argument('project')
    parser.add_argument('--expected-lock-sha256')
    parser.add_argument('--confirm-local-stopped-writer', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(reconcile(args.engine, args.project, args.expected_lock_sha256, args.confirm_local_stopped_writer)))
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as error:
        parser.exit(1, f'Reconciliation refused: {error}\n')
