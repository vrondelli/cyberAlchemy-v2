#!/usr/bin/env python3
"""Single-owner local provisioning host; Rust derives every DAG transition."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import sqlite3
import stat
import subprocess
import sys
import time

PACKAGE = Path(__file__).resolve().parent
REPOSITORY = PACKAGE.parents[2]
BRIDGE = PACKAGE / 'bridge/target/debug/alch-provision-dag'


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_bytes())


def child(argv, *, timeout, cwd, env=None, stdin=None, lock_fd=None):
    """Bound the whole process group, including Ansible module subprocesses."""
    with subprocess.Popen(argv, cwd=cwd, env=env, stdin=subprocess.PIPE,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                          start_new_session=True,
                          pass_fds=() if lock_fd is None else (lock_fd,)) as proc:
        try:
            out, err = proc.communicate(stdin, timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(proc.pid, signal.SIGKILL)
            proc.communicate()
            raise RuntimeError('COMMAND_TIMEOUT')
        if proc.returncode:
            raise RuntimeError('COMMAND_FAILED:' + str(proc.returncode) + ':' + err.decode(errors='replace')[-1500:])
        return out


def derive(dag, events):
    return json.loads(child([str(BRIDGE)], timeout=10, cwd=PACKAGE,
                            stdin=encoded({'dag': dag, 'events': events})))


def safe_tree(root):
    """Private, trusted local fixture only; refuse redirected output paths."""
    for base, dirs, files in os.walk(root, followlinks=False):
        for name in dirs + files:
            path = Path(base) / name
            mode = path.lstat().st_mode
            if stat.S_ISLNK(mode) or not (stat.S_ISREG(mode) or stat.S_ISDIR(mode)):
                raise RuntimeError('UNSAFE_TARGET_PATH')
            if path.is_file() and path.stat().st_nlink != 1:
                raise RuntimeError('HARDLINK_FORBIDDEN')


def open_root(value):
    root = Path(value)
    if not re.fullmatch(r'/tmp/alch-provision-[A-Za-z0-9_-]+', str(root)):
        raise RuntimeError('ROOT_MUST_BE_PRIVATE_TMP_FIXTURE')
    if not root.exists():
        root.mkdir(mode=0o700)
    if root.is_symlink() or not root.is_dir() or root.stat().st_uid != os.getuid() or stat.S_IMODE(root.stat().st_mode) != 0o700:
        raise RuntimeError('ROOT_NOT_PRIVATE')
    safe_tree(root)
    return root


def current_binding():
    manifest = load(PACKAGE / 'source-manifest.json')
    for name, expected in manifest['sources'].items():
        relative = name.removeprefix('cyberAlchemy-v2/')
        source = REPOSITORY / relative
        if digest(source.read_bytes()) != expected:
            raise RuntimeError('SOURCE_DRIFT:' + name)
    return {'manifest': digest(encoded(manifest)), 'bridge': digest(BRIDGE.read_bytes()),
            'ansible': digest(Path('/usr/bin/ansible-playbook').read_bytes())}


def replay(db, dag):
    rows = db.execute('SELECT body FROM history ORDER BY seq').fetchall()
    stored = [json.loads(row[0]) for row in rows]
    events = [row['event'] for row in stored if row['event'] is not None]
    result = derive(dag, events)
    if stored != result['transitions']:
        raise RuntimeError('ACCEPTED_HISTORY_DRIFT')
    return result, events


def accept(db, dag, event, expected):
    """Atomic event/cursor/complete-command-batch append with compare-and-append."""
    db.execute('BEGIN IMMEDIATE')
    try:
        result, events = replay(db, dag)
        for prior in events:
            if prior['event_id'] == event['event_id']:
                if prior != event:
                    raise RuntimeError('DIVERGENT_EVENT')
                db.rollback()
                return 'Duplicate'
        if digest(encoded(result['transitions'][-1]['cursor'])) != expected:
            raise RuntimeError('CURSOR_CONFLICT')
        next_result = derive(dag, events + [event])
        db.execute('INSERT INTO history(body) VALUES (?)', (encoded(next_result['transitions'][-1]).decode(),))
        db.commit()
        return 'Accepted'
    except BaseException:
        db.rollback()
        raise


def desired(contract):
    return contract['runtime_configuration']


def configured(root, contract):
    safe_tree(root)
    try:
        return (load(root / 'target/config/host.json') == desired(contract)
                and stat.S_IMODE((root / 'target/config/host.json').stat().st_mode) == 0o600
                and all((root / ('target/' + name)).is_dir()
                        and stat.S_IMODE((root / ('target/' + name)).stat().st_mode) == 0o700
                        for name in ('config', 'state')))
    except (FileNotFoundError, json.JSONDecodeError):
        return False


def configure(root, contract, lock_fd, timeout):
    safe_tree(root)
    target = root / 'target'
    target.mkdir(mode=0o700, exist_ok=True)
    private = root / 'ansible'
    private.mkdir(mode=0o700, exist_ok=True)
    variables = private / 'vars.json'
    variables.write_bytes(encoded({'target_root': str(target), 'host_config': desired(contract)}))
    config = private / 'ansible.cfg'
    config.write_text('[defaults]\nretry_files_enabled = False\ninterpreter_python = /usr/bin/python3\n')
    env = {'PATH': '/usr/bin:/bin', 'HOME': str(private), 'LANG': 'C.UTF-8',
           'ANSIBLE_CONFIG': str(config), 'ANSIBLE_LOCAL_TEMP': str(private / 'tmp'),
           'ANSIBLE_REMOTE_TEMP': str(private / 'remote'), 'ANSIBLE_NOCOLOR': '1',
           'ANSIBLE_COLLECTIONS_PATH': '/usr/share/ansible/collections'}
    out = child(['/usr/bin/ansible-playbook', str(PACKAGE / 'playbook.yml'),
                 '-i', 'localhost,', '--connection', 'local', '--extra-vars', '@' + str(variables)],
                timeout=timeout, cwd=private, env=env, lock_fd=lock_fd)
    # Installed default callback recap; failure to interpret it never means success.
    match = re.search(rb'localhost\s+:\s+ok=\d+\s+changed=(\d+)\s+unreachable=0\s+failed=0', out)
    if not match or not configured(root, contract):
        raise RuntimeError('ANSIBLE_RESULT_NOT_VERIFIED')
    return {'changed': int(match.group(1)), 'stdout_sha256': digest(out), 'reconciled': False}


def execute(node, root, contract, lock_fd, timeout):
    safe_tree(root)
    if node == 'validate':
        return {'contract_sha256': digest(encoded(contract)), 'target': 'disposable-local'}
    if node == 'configure':
        if configured(root, contract):
            return {'reconciled': True, 'changed': 0, 'configuration_sha256': digest(encoded(desired(contract)))}
        return configure(root, contract, lock_fd, timeout)
    if node == 'verify-config':
        if not configured(root, contract):
            raise RuntimeError('CONFIGURATION_NOT_READY')
        return {'configuration_sha256': digest(encoded(desired(contract))), 'independently_read': True}
    if node == 'verify-storage':
        path = root / 'target/state/probe'
        # Exclusive creation avoids overwriting any fixture data; recovery can inspect its exact content.
        if path.exists():
            if path.read_bytes() != b'alch-storage-probe\n':
                raise RuntimeError('PROBE_CONFLICT')
        else:
            with path.open('xb') as stream:
                stream.write(b'alch-storage-probe\n')
                stream.flush()
                os.fsync(stream.fileno())
        if path.read_bytes() != b'alch-storage-probe\n':
            raise RuntimeError('STORAGE_NOT_READY')
        path.unlink()
        return {'write_fsync_read': True}
    if node == 'ready':
        if not configured(root, contract):
            raise RuntimeError('READINESS_DRIFT')
        return {'capacity': 'local-fixture', 'runtime_activated': False, 'authority_effect': 'none'}
    raise RuntimeError('ADAPTER_NOT_ALLOWED:' + node)


def run(root_value, crash_after=None, fail_node=None):
    root = open_root(root_value)
    # Held for the host lifetime and inherited by Ansible. A killed host cannot
    # race a successor while its child is still provisioning.
    with (root / 'owner.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError('RUN_ALREADY_OWNED')
        binding = current_binding()
        contract = load(PACKAGE / 'domainspec.json')
        dag = load(PACKAGE / 'generated/dag.json')
        with sqlite3.connect(root / 'history.sqlite', isolation_level=None) as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('PRAGMA synchronous=FULL')
            db.executescript('CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS history (seq INTEGER PRIMARY KEY, body TEXT NOT NULL);')
            row = db.execute('SELECT body FROM metadata WHERE id=1').fetchone()
            if row is None:
                initial = derive(dag, [])['transitions'][0]
                db.execute('BEGIN IMMEDIATE')
                db.execute('INSERT INTO metadata VALUES (1, ?)', (encoded({'binding': binding, 'root': str(root), 'deadline': time.time() + dag['deadline_seconds']}).decode(),))
                db.execute('INSERT INTO history(body) VALUES (?)', (encoded(initial).decode(),))
                db.commit()
            meta = json.loads(db.execute('SELECT body FROM metadata WHERE id=1').fetchone()[0])
            if meta['binding'] != binding or meta['root'] != str(root):
                raise RuntimeError('RUN_BINDING_DRIFT')
            while True:
                result, events = replay(db, dag)
                if any(event['outcome'] == 'failed' for event in events):
                    return {'status': 'Failed', 'root': str(root), 'cursor': result['transitions'][-1]['cursor'], 'authority_effect': 'none'}
                if result['terminal']:
                    return {'status': result['status'], 'root': str(root),
                            'cursor': result['transitions'][-1]['cursor'],
                            'events': len(events), 'authority_effect': 'none'}
                completed = {event['command_id'] for event in events}
                commands = [cmd for t in result['transitions'] for cmd in t['commands'] if cmd['command_id'] not in completed]
                if not commands:
                    raise RuntimeError('NO_RUNNABLE_COMMAND')
                command = commands[0]
                node = command['node_id']
                event = {'event_id': command['command_id'] + ':result', 'command_id': command['command_id'], 'node_id': node}
                try:
                    remaining = meta['deadline'] - time.time()
                    if remaining <= 0:
                        raise RuntimeError('DAG_DEADLINE_EXCEEDED')
                    if fail_node == node:
                        raise RuntimeError('INJECTED_NODE_FAILURE')
                    output = execute(node, root, contract, lock.fileno(), min(remaining, contract['step_timeout_seconds']))
                    if crash_after == node:
                        os._exit(75)  # effect completed, no accepted result
                    event.update(outcome='succeeded', output_ref=output, error=None)
                except Exception as error:
                    event.update(outcome='failed', output_ref=None, error=str(error))
                accept(db, dag, event, digest(encoded(result['transitions'][-1]['cursor'])))
                if event['outcome'] == 'failed':
                    # Stop before any other issued sibling or downstream effect.
                    failed, _ = replay(db, dag)
                    return {'status': 'Failed', 'root': str(root), 'cursor': failed['transitions'][-1]['cursor'], 'authority_effect': 'none'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--run-root', required=True)
    parser.add_argument('--crash-after', choices=['configure', 'verify-storage'])
    parser.add_argument('--fail-node', choices=['configure', 'verify-config', 'verify-storage'])
    args = parser.parse_args()
    try:
        result = run(args.run_root, args.crash_after, args.fail_node)
        print(json.dumps(result, indent=2))
        return 0 if result['status'] == 'Succeeded' else 1
    except Exception as error:
        print(json.dumps({'status': 'Blocked', 'error': str(error)}))
        return 1


if __name__ == '__main__':
    sys.exit(main())
