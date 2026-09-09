#!/usr/bin/env python3
"""POSIX post-commit cache installer. Installation is an explicit local effect."""
import argparse
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import sys
import tempfile
import time

import recent as R

ROOT = Path(__file__).resolve().parent
MARKER = '# cyberalchemy-recent-context-v1 '


def encode(config):
    return base64.urlsafe_b64encode(R.canonical(config)).decode('ascii')


def render(config):
    token = encode(config)
    command = shlex.join([config['python'], '-B', config['runner'], 'run', '--config', token])
    return ('#!/bin/sh\n' + MARKER + token + '\n' + command +
            '\nrc=$?\nif [ "$rc" -ne 0 ]; then\n'
            '  echo "recent-context: refresh failed; commit is already complete" >&2\nfi\nexit 0\n').encode()


def no_symlinks(path):
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise R.Unavailable('hook path contains a symlink')


def location(repo):
    git = R.Git(repo)
    source = git.source()
    root = Path(source['repository'])
    git.repo = root
    common = Path(git.text('rev-parse', '--path-format=absolute', '--git-common-dir'))
    hook = Path(git.text('rev-parse', '--path-format=absolute', '--git-path', 'hooks/post-commit'))
    no_symlinks(hook)
    if not (hook.is_relative_to(root) or hook.is_relative_to(common)):
        raise R.Unavailable('shared/external hooks directory is outside this repository; no files changed')
    return git, source, common, hook


def inspect(hook):
    if not hook.exists():
        return {'status': 'not-installed', 'hook': str(hook)}
    if not hook.is_file() or hook.stat().st_size > 65536:
        raise R.Unavailable('existing post-commit is not an owned hook')
    raw = hook.read_bytes()
    try:
        line = raw.decode().splitlines()[1]
        if not line.startswith(MARKER):
            raise ValueError('marker missing')
        config = json.loads(base64.urlsafe_b64decode(line[len(MARKER):]))
        if render(config) != raw:
            raise ValueError('hook bytes changed')
    except (ValueError, KeyError, IndexError, TypeError, UnicodeError) as exc:
        raise R.Unavailable('existing post-commit is foreign or modified; preserved unchanged') from exc
    return {'status': 'installed' if os.access(hook, os.X_OK) else 'disabled',
            'hook': str(hook), 'config': config}


def source_hashes():
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in [ROOT/'hooks.py', ROOT/'recent.py', R.ROUTER_ROOT/'scripts/locate.py',
                      R.ROUTER_ROOT/'schemas/agent-router.schema.json']}


def install(repo, projects, paths, limit=20, max_files=100):
    if not 1 <= limit <= 100 or not 1 <= max_files <= 1000:
        raise R.Unavailable('limits must be 1..100 commits and 1..1000 files')
    if bool(projects) == bool(paths) or len(projects or []) > 8:
        raise R.Unavailable('select 1..8 projects or one group of literal paths')
    git, source, common, hook = location(repo)
    selections = []
    if projects:
        for project in sorted(set(projects)):
            scope, unresolved = R.scope_for_project(project, source['repository'], R.ROUTER_ROOT/'project-index.json')
            if unresolved:
                raise R.Unavailable('project is unresolved: ' + project)
            selections.append({'project': project, 'scope': scope})
    else:
        selections = [{'paths': sorted(set(R.clean_scope(p) for p in paths))}]
    config = {'version': 1, 'worktree': source['worktree'], 'repository': source['repository'],
              'python': sys.executable, 'runner': str(ROOT/'hooks.py'), 'sources': source_hashes(),
              'selections': selections, 'limit': limit, 'max_files': max_files}
    # Lock the existing common directory; status needs no lock-file writes.
    fd = os.open(common, os.O_RDONLY)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = inspect(hook)
        if state['status'] != 'not-installed':
            if state.get('config') == config and state['status'] == 'installed':
                return {**state, 'changed': False}
            raise R.Unavailable('owned hook configuration differs or is disabled; inspect and uninstall first')
        hook.parent.mkdir(parents=True, exist_ok=True)
        no_symlinks(hook)
        name = None
        try:
            with tempfile.NamedTemporaryFile(dir=hook.parent, prefix='.recent-install-', delete=False) as out:
                name = out.name
                out.write(render(config)); out.flush(); os.fchmod(out.fileno(), 0o755); os.fsync(out.fileno())
            os.link(name, hook)  # Exclusive publication; never overwrite a concurrent hook.
        finally:
            if name: Path(name).unlink(missing_ok=True)
        return {**inspect(hook), 'changed': True}
    finally:
        os.close(fd)


def uninstall(repo):
    _, source, common, hook = location(repo)
    fd = os.open(common, os.O_RDONLY)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = inspect(hook)
        if state['status'] == 'not-installed':
            return {**state, 'changed': False}
        if state['config']['worktree'] != source['worktree'] or state['config']['runner'] != str(ROOT/'hooks.py'):
            raise R.Unavailable('hook belongs to another worktree or installation; preserved')
        hook.unlink()
        return {'status': 'not-installed', 'hook': str(hook), 'changed': True, 'cache': 'preserved'}
    finally:
        os.close(fd)


def run(config):
    # Shared Git hook directories must not cause effects in another worktree.
    _, source, _, _ = location(Path.cwd())
    if source['worktree'] != config['worktree']:
        return
    if config['sources'] != source_hashes():
        raise R.Unavailable('installed source binding changed; review and reinstall')
    deadline = time.monotonic() + 30
    failures = []
    for selected in config['selections']:
        args = [config['python'], '-B', str(ROOT/'recent.py'), 'refresh', '--repo', source['repository'],
                '--limit', str(config['limit']), '--max-files', str(config['max_files'])]
        if 'project' in selected:
            scope, unresolved = R.scope_for_project(selected['project'], source['repository'], R.ROUTER_ROOT/'project-index.json')
            if unresolved or scope != selected['scope']:
                failures.append(selected)
                continue
            args += ['--project', selected['project']]
        else:
            for path in selected['paths']: args += ['--path', path]
        remaining = deadline - time.monotonic()
        if remaining <= 0: raise R.Unavailable('hook refresh exceeded 30 seconds')
        result = subprocess.run(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=remaining)
        if result.returncode: failures.append(selected)
    if failures:
        raise R.Unavailable('cache refresh failed for ' + json.dumps(failures))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['install', 'status', 'uninstall', 'run'])
    parser.add_argument('--repo', default='.')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--project', action='append'); group.add_argument('--path', action='append')
    parser.add_argument('--limit', type=int, default=20)
    parser.add_argument('--max-files', type=int, default=100)
    parser.add_argument('--config', help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        if args.operation == 'install':
            result = install(args.repo, args.project, args.path, args.limit, args.max_files)
        elif args.operation == 'uninstall': result = uninstall(args.repo)
        elif args.operation == 'status':
            _, source, _, hook = location(args.repo)
            result = inspect(hook)
            if 'config' in result:
                result['selected_worktree'] = result['config']['worktree'] == source['worktree']
                result['sources_current'] = result['config']['sources'] == source_hashes()
        else:
            run(json.loads(base64.urlsafe_b64decode(args.config)))
            return 0
        print(json.dumps(result, indent=2)); return 0
    except (R.Unavailable, OSError, ValueError, TypeError, KeyError, subprocess.SubprocessError) as exc:
        print('recent-context: ' + str(exc), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
