#!/usr/bin/env python3
"""Create a reviewable immutable deployment payload. Open questions: README.md."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

here = Path(__file__).resolve().parent
target = Path(sys.argv[1]).resolve()
kernel = Path(sys.argv[2]).resolve()
target.mkdir(mode=0o700)
sha = lambda data: hashlib.sha256(data).hexdigest()
source_id = sha((here / 'adapter.mjs').read_bytes() + kernel.read_bytes())[:16]
remote = f'/srv/are-luna-pilot/rwo/{source_id}'
candidate = '/srv/are-luna-pilot/candidates/04384954e710e58f'
launcher = '/srv/are-luna-pilot/launchers/22ddddd79b0f96af'
host = json.loads((here.parent / 'host.candidate.json').read_text())
host.update(state='/var/lib/are-luna-pilot/rwo-host', runtime='/run/are-rwo-luna')
adapter = dict(kernel=f'{remote}/rwo-are-pilot-kernel', kernel_sha256=sha(kernel.read_bytes()),
               state='/var/lib/are-luna-pilot/rwo-history', socket='/run/are-rwo-luna/control.sock',
               request_id='rwo_luna_live_20260907_01', port=18082)
for name, value in [('host.json', host), ('adapter.json', adapter)]:
    (target / name).write_text(json.dumps(value, indent=2) + '\n')
shutil.copyfile(here / 'adapter.mjs', target / 'adapter.mjs')
shutil.copyfile(here / 'install-deployment.py', target / 'install-deployment.py')
shutil.copyfile(kernel, target / 'rwo-are-pilot-kernel')
host_unit = (here.parent / 'are-luna-pilot.service').read_text()
host_unit = host_unit.replace('Description=ARE single Luna pilot host', 'Description=ARE host for one RWO Luna smoke')
host_unit = host_unit.replace('RuntimeDirectory=are-luna-pilot', 'RuntimeDirectory=are-rwo-luna')
host_unit = host_unit.replace('/run/are-luna-pilot', '/run/are-rwo-luna')
host_unit = host_unit.replace(f'{launcher}/host.json', f'{remote}/host.json')
(target / 'are-rwo-luna.service').write_text(host_unit)
(target / 'are-rwo-workspace.service').write_text(f'''[Unit]
Description=Read-only RWO ARE Workspace projection
After=network.target

[Service]
Type=simple
User=are-luna
Group=are-luna
UMask=0077
ExecStart={candidate}/bin/node {remote}/adapter.mjs {remote}/adapter.json serve
Restart=no
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/var/lib/are-luna-pilot

[Install]
WantedBy=multi-user.target
''')
files = {p.name: sha(p.read_bytes()) for p in sorted(target.iterdir())}
manifest = dict(schema_version='rwo-are-deployment/v1', remote=remote, files=files,
                budget=dict(provider_calls=1, max_output_tokens=512, tools_enabled=False),
                authority_effect='none', open_questions_ref='README.md#open-questions')
(target / 'MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
