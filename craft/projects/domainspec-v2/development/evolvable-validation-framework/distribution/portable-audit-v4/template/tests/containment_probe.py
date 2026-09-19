"""Synthetic payload used only by the containment regression controller."""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys

kit, workspace, outside, runtime, fd, port, host_socket = sys.argv[1:]
sys.path.insert(0, kit)
import containment
containment.require_inside()
root = Path(workspace)
results = {}


def denied(name, action):
    try:
        action()
    except OSError:
        results[name] = True
    else:
        results[name] = False


results['workspace_read'] = (root / 'input.txt').read_text() == 'permitted input'
(root / 'result.txt').write_text('permitted output')
results['workspace_write'] = (root / 'result.txt').read_text() == 'permitted output'
results['runtime_read'] = (Path(runtime) / 'data.txt').read_text() == 'read-only runtime'
denied('outside_read', lambda: Path(outside).read_bytes())
denied('runtime_write', lambda: (Path(runtime) / 'data.txt').write_text('forbidden'))


def open_kit_writable():
    # Never alter the real kit, even if the boundary is broken.
    handle = os.open(Path(kit) / 'containment.py', os.O_WRONLY)
    os.close(handle)


denied('kit_write', open_kit_writable)
link = root / 'escape-link'
link.symlink_to(outside)
denied('symlink_read', lambda: link.read_bytes())
link.unlink()
denied('hardlink_escape', lambda: os.link(outside, root / 'escape-hardlink'))
denied('proc_root_escape', lambda: Path('/proc/1/root' + outside).read_bytes())
denied('host_socket', lambda: socket.socket(socket.AF_UNIX).connect(host_socket))


def network():
    with socket.socket() as stream:
        stream.settimeout(0.3)
        stream.connect(('127.0.0.1', int(port)))


denied('host_network', network)
try:
    descriptor_data = os.read(int(fd), 4096)
except OSError:
    descriptor_data = b''
results['inherited_descriptor_closed'] = b'outside secret' not in descriptor_data
results['environment_cleared'] = 'EVF_PROBE_SECRET' not in os.environ
code = 'from pathlib import Path; import sys;\ntry: Path(sys.argv[1]).read_bytes()\nexcept OSError: sys.exit(0)\nelse: sys.exit(1)'
child = subprocess.run(['/usr/bin/python3', '-I', '-c', code, outside], capture_output=True)
results['child_confined'] = child.returncode == 0
results['no_new_privs'] = 'NoNewPrivs:\t1' in Path('/proc/self/status').read_text()
results['capabilities_dropped'] = 'CapEff:\t0000000000000000' in Path('/proc/self/status').read_text()
# A /tmp pathname can be recreated in the private tmpfs without reaching its
# same-named host file. The host controller, not this payload, checks that the
# real sentinel's bytes remain unchanged after both write attempts.
try:
    Path(outside).write_text('sandbox-local shadow, never host data')
except OSError:
    pass
link.symlink_to(outside)
try:
    link.write_text('second sandbox-local shadow')
except OSError:
    pass
link.unlink()
results['outside_write_attempt_completed'] = True
results['symlink_write_attempt_completed'] = True
print(json.dumps(results))
sys.exit(0 if all(results.values()) else 1)
