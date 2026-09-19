"""Fail-closed filesystem boundary for the portable EVF entry point.

This confines host file access. It does not authenticate a hostile provider's
evidence, isolate providers from their shared audit workspace, or defeat kernel
exploits. The permitted host trees must not have concurrent writers at launch.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import selectors
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time

KIT = Path(__file__).resolve().parent
CONTEXT = Path('/run/evf-containment.json')
SYSTEM_DIRS = ('/usr/bin', '/usr/lib/x86_64-linux-gnu', '/usr/lib/gcc', '/usr/libexec/gcc', '/usr/lib64', '/usr/include', '/etc/alternatives')
SYSTEM_FILES = ('/etc/ld.so.cache',)
NAMESPACES = ('mnt', 'pid', 'net', 'user', 'ipc', 'uts')
COMMANDS = {'doctor', 'init', 'formal-init', 'build-example', 'freeze', 'run',
            'verify', 'formal-tools', 'formal-run', 'formal-verify', 'contained-test'}
SUITES = {'test_formal.py', 'test_tlc.py', 'test_formal_live.py', 'test_tlc_live.py'}


class Blocked(ValueError):
    pass


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2) + '\n').encode()


def sha(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as source:
        for block in iter(lambda: source.read(1048576), b''):
            result.update(block)
    return result.hexdigest()


def namespaces():
    return {name: os.readlink('/proc/self/ns/' + name) for name in NAMESPACES}


def require_inside():
    """Not an environment-variable switch: require a read-only launch context
    and distinct kernel namespace identities. Host/kit modification is outside
    the threat model. Intentionally launching raw internal binaries bypasses CLI.
    """
    try:
        value = json.loads(CONTEXT.read_text())
        if value['schema_version'] != 'evf.contained-launch/v1-candidate':
            raise Blocked('Unknown containment context')
        current = namespaces()
        if any(current[key] == value['host_namespaces'][key] for key in NAMESPACES):
            raise Blocked('Required namespace boundary is absent')
        mounts = Path('/proc/self/mountinfo').read_text().splitlines()
        if not any(row.split()[4] == str(CONTEXT) and 'ro' in row.split()[5].split(',') for row in mounts):
            raise Blocked('Containment context is not read-only')
        return value
    except (OSError, KeyError, TypeError, ValueError) as error:
        raise Blocked('Filesystem containment required; use ./evf. ' + str(error)) from error


def runtime():
    if os.geteuid() == 0:
        raise Blocked('Run the public launcher as an ordinary user, not root')
    selected = shutil.which('bwrap')
    if not selected:
        raise Blocked('Bubblewrap not found; install the distribution runtime. No uncontained fallback')
    path = Path(selected).resolve(strict=True)
    info = path.stat()
    if path != Path('/usr/bin/bwrap') or info.st_uid != 0 or info.st_mode & 0o6022:
        raise Blocked('Require the non-setuid, root-owned distribution /usr/bin/bwrap')
    result = subprocess.run([str(path), '--version'], stdin=subprocess.DEVNULL,
                            capture_output=True, timeout=5, env={'LANG': 'C'}, close_fds=True)
    if result.returncode or not result.stdout.startswith(b'bubblewrap '):
        raise Blocked('Bubblewrap version probe failed')
    return path, result.stdout.decode().strip()


def overlaps(first, second):
    return first.is_relative_to(second) or second.is_relative_to(first)


def bounded_path(value, workspace=False):
    original = Path(value).absolute()
    selected = original.resolve(strict=True)
    if original != selected:
        raise Blocked('Use a canonical path without symlink components: ' + str(original))
    broad = {Path('/'), Path('/home'), Path('/tmp'), Path('/var'), Path('/mnt'),
             Path('/opt'), Path('/srv'), Path.home().resolve()}
    if selected in broad or selected in Path.home().resolve().parents:
        raise Blocked('Refusing a broad host path: ' + str(selected))
    if any(selected.is_relative_to(p) for p in map(Path, ('/proc', '/sys', '/dev', '/run', '/etc', '/usr', '/bin', '/lib', '/lib64'))):
        raise Blocked('System paths are controlled by the fixed runtime policy: ' + str(selected))
    if not selected.is_dir() and (workspace or not selected.is_file()):
        raise Blocked('Expected a directory or regular runtime file')
    if overlaps(selected, KIT):
        raise Blocked('Selected path overlaps the read-only kit')
    if workspace and any((selected / name).exists() for name in ('.git', '.ssh', '.aws', '.kube')):
        raise Blocked('Use a dedicated audit workspace, not a checkout or credential directory')
    return selected


def inspect_tree(path, writable=False, system=False):
    """Reject hidden sockets/devices, writable hard-link aliases, and nested
    user mounts. Symlinks in runtime trees resolve only within the mounted view.
    Workspace symlinks are rejected before any host parser reads audit inputs.
    """
    def check(item):
        info = item.lstat()
        if stat.S_ISLNK(info.st_mode):
            if writable:
                raise Blocked('Workspace symlink is not permitted: ' + str(item))
            return
        if not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
            raise Blocked('Socket, device, FIFO or special file in selected tree: ' + str(item))
        if writable and stat.S_ISREG(info.st_mode) and info.st_nlink != 1:
            raise Blocked('Workspace hard-linked file is not permitted: ' + str(item))
        if not system and item != path and item.is_dir() and os.path.ismount(item):
            raise Blocked('Nested mount in selected tree: ' + str(item))
    check(path)
    if path.is_dir():
        def fail(error):
            raise error
        for parent, directories, files in os.walk(path, followlinks=False, onerror=fail):
            for name in directories + files:
                check(Path(parent) / name)


def policy(workspace, runtimes):
    root = bounded_path(workspace, workspace=True)
    selected = [bounded_path(value) for value in runtimes]
    for index, path in enumerate(selected):
        if overlaps(path, root) or any(overlaps(path, earlier) for earlier in selected[:index]):
            raise Blocked('Runtime paths must not overlap each other or the writable workspace')
    inspect_tree(root, writable=True)
    for path in selected:
        inspect_tree(path)
    system = [Path(p) for p in SYSTEM_DIRS + SYSTEM_FILES if Path(p).exists()]
    import re
    system += sorted(p for p in Path('/usr/lib').glob('python3.*') if p.is_dir() and re.fullmatch(r'python3\.\d+', p.name))
    for path in system:
        inspect_tree(path, system=True)
    bwrap, version = runtime()
    return {'schema_version': 'evf.contained-launch/v1-candidate',
            'workspace': str(root), 'kit': str(KIT),
            'read_only_runtime_paths': sorted(map(str, selected)),
            'read_only_system_paths': list(map(str, system)),
            'host_namespaces': namespaces(), 'bubblewrap': {'path': str(bwrap), 'sha256': sha(bwrap), 'version': version},
            'network': 'isolated', 'persistent_writes': 'selected-audit-workspace-only',
            'writable_workspace_is_not_evidence_authentication': True,
            'authority_effect': 'none'}


def command(value, argv, context_fd):
    args = [value['bubblewrap']['path'], '--unshare-user', '--unshare-pid', '--unshare-net',
            '--unshare-ipc', '--unshare-uts', '--unshare-cgroup-try', '--die-with-parent',
            '--new-session', '--cap-drop', 'ALL', '--clearenv']
    for path in value['read_only_system_paths']:
        args += ['--ro-bind', path, path]
    for alias, target in (('/bin', 'usr/bin'), ('/lib', 'usr/lib'), ('/lib64', 'usr/lib64')):
        if Path('/' + target).exists():
            args += ['--symlink', target, alias]
    args += ['--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/home', '--dir', '/run']
    for path in [value['kit'], *value['read_only_runtime_paths']]:
        args += ['--ro-bind', path, path]
    args += ['--bind', value['workspace'], value['workspace'], '--ro-bind-data', str(context_fd), str(CONTEXT),
             '--chdir', value['workspace'], '--setenv', 'PATH', '/usr/bin:/bin', '--setenv', 'LANG', 'C',
             '--setenv', 'LC_ALL', 'C', '--setenv', 'PYTHONDONTWRITEBYTECODE', '1',
             '--setenv', 'HOME', '/tmp/evf-home', '--dir', '/tmp/evf-home', '--', *map(str, argv)]
    return args


def launch(value, argv, timeout=1800, limit=8 * 1024 * 1024):
    # The only inherited descriptor contains the public mount policy, never a
    # host directory handle, credential, terminal, or arbitrary caller FD.
    with tempfile.TemporaryFile() as context:
        context.write(encoded(value))
        context.flush()
        context.seek(0)
        args = command(value, argv, context.fileno())
        proc = subprocess.Popen(args, cwd='/', stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, env={'LANG': 'C', 'LC_ALL': 'C'},
                                pass_fds=(context.fileno(),), close_fds=True, start_new_session=True)
        selector = selectors.DefaultSelector()
        buffers = {'stdout': bytearray(), 'stderr': bytearray()}
        start = time.monotonic()
        failure = None
        for name in buffers:
            stream = getattr(proc, name)
            os.set_blocking(stream.fileno(), False)
            selector.register(stream, selectors.EVENT_READ, name)
        try:
            while selector.get_map():
                if time.monotonic() - start > timeout:
                    failure = 'containment-timeout'
                    break
                for key, _ in selector.select(0.05):
                    chunk = os.read(key.fd, 65536)
                    if not chunk:
                        selector.unregister(key.fileobj)
                    else:
                        buffers[key.data].extend(chunk)
                        if sum(map(len, buffers.values())) > limit:
                            failure = 'containment-output-limit'
                            break
                if failure:
                    break
            if not failure:
                try:
                    proc.wait(timeout=max(0.01, timeout - (time.monotonic() - start)))
                except subprocess.TimeoutExpired:
                    failure = 'containment-timeout'
        finally:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            proc.wait(timeout=5)
            selector.close()
            proc.stdout.close()
            proc.stderr.close()
        return {'exit_code': proc.returncode, 'failure': failure,
                'stdout': bytes(buffers['stdout']), 'stderr': bytes(buffers['stderr'])}


def inner(arguments):
    require_inside()
    if arguments[0] == 'contained-test':
        parser = argparse.ArgumentParser()
        parser.add_argument('--suite', choices=sorted(SUITES), required=True)
        parser.add_argument('--workspace', required=True)
        args, remaining = parser.parse_known_args(arguments[1:])
        # Test diagnostics must survive the outer namespace exiting. These are
        # inside the explicitly writable audit workspace, not host-global /tmp.
        scratch = Path(args.workspace) / '.evf-test-tmp'
        scratch.mkdir(exist_ok=True)
        if scratch.is_symlink():
            raise Blocked('Test temporary directory cannot be a symlink')
        os.environ['TMPDIR'] = str(scratch)
        suite = KIT / 'tests' / args.suite
        sys.argv = [str(suite)] + (['--workspace', args.workspace] if args.suite == 'test_formal_live.py' else []) + remaining
        import runpy
        runpy.run_path(str(suite), run_name='__main__')
        return 0
    sys.argv = [str(KIT / 'evf'), *arguments]
    if arguments[0].startswith('formal-'):
        import formal
        return formal.main()
    import evf_core
    return evf_core.main()


def main(arguments=None):
    import evf_core
    parser = argparse.ArgumentParser(description='Contained EVF audit CLI. Runtime paths are explicit, read-only grants for this command only.', allow_abbrev=False)
    parser.add_argument('--runtime', action='append', default=[], metavar='PATH', help='Dedicated runtime directory or JAR, read-only; repeat as needed')
    parsed, arguments = parser.parse_known_args(sys.argv[1:] if arguments is None else arguments)
    try:
        if not arguments or arguments[0] not in COMMANDS:
            raise Blocked('Choose an EVF command: ' + ', '.join(sorted(COMMANDS)))
        evf_core.check_kit()
        name = arguments[0]
        if name in ('init', 'formal-init'):
            if len(arguments) != 2 or parsed.runtime:
                raise Blocked('Usage: ./evf ' + name + ' NEW_DIRECTORY')
            if name == 'init':
                result = evf_core.init(arguments[1])
            else:
                target = Path(arguments[1]).absolute()
                if target.exists() or target.is_symlink():
                    raise Blocked('Choose a new formal-audit directory; existing work is preserved')
                shutil.copytree(KIT / 'formal-example', target)
                result = {'status': 'created', 'workspace': str(target), 'next': 'formal-tools with --runtime paths, then formal-run'}
            print(json.dumps(result, indent=2))
            return 0
        temporary = None
        if name == 'doctor':
            temporary = tempfile.TemporaryDirectory(prefix='evf-containment-doctor-')
            root = temporary.name
        else:
            if arguments.count('--workspace') != 1:
                raise Blocked('Supply exactly one --workspace PATH')
            index = arguments.index('--workspace')
            if index + 1 == len(arguments):
                raise Blocked('Missing workspace path')
            root = arguments[index + 1]
        try:
            selected = policy(root, parsed.runtime)
            # The imported inner entry has no environment-variable escape hatch.
            boot = 'import sys; sys.path.insert(0, ' + repr(str(KIT)) + '); import containment; sys.exit(containment.inner(sys.argv[1:]))'
            result = launch(selected, ['/usr/bin/python3', '-I', '-B', '-c', boot, *arguments])
        finally:
            if temporary is not None:
                temporary.cleanup()
        if result['failure']:
            raise Blocked(result['failure'])
        output = result['stdout'].decode(errors='replace')
        diagnostic = result['stderr'].decode(errors='replace')
        if diagnostic:
            print(diagnostic, file=sys.stderr, end='')
        if name == 'contained-test':
            print(output, end='')
            return result['exit_code'] if result['exit_code'] >= 0 else 2
        try:
            response = json.loads(output)
        except ValueError:
            raise Blocked('Contained command did not return a complete JSON result: ' + diagnostic[:2000])
        if not isinstance(response, dict):
            raise Blocked('Contained command returned an unexpected result')
        # This is a launch diagnostic, not a signed attestation or an EVF proof.
        response['containment'] = selected
        print(json.dumps(response, indent=2))
        return result['exit_code'] if result['exit_code'] >= 0 else 2
    except (Blocked, OSError, ValueError, KeyError, TypeError, subprocess.TimeoutExpired, evf_core.Error) as error:
        print(json.dumps({'status': 'blocked', 'reason': str(error), 'authority_effect': 'none'}, indent=2))
        return 2
