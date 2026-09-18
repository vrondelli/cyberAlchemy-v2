"""Verify a real Codex initialize exchange through the extracted ARE wrapper."""
import hashlib
import json
import os
from pathlib import Path
import selectors
import signal
import subprocess
import sys
import tempfile
import time
from archive import unpack

if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 check-host-handshake.py /absolute/path/to/codex')
binary=Path(sys.argv[1]).resolve(strict=True)
root=Path(__file__).resolve().parents[1]
candidate=root/'evidence/private-candidate'
manifest=json.loads((candidate/'manifest.json').read_text())
closure=json.loads((candidate/'source-closure.json').read_text())
archive=candidate/manifest['archive']
if hashlib.sha256(archive.read_bytes()).hexdigest()!=manifest['sha256']:
    raise SystemExit('Archive hash mismatch')
version=subprocess.check_output([str(binary),'--version'],text=True,timeout=15).strip()
report={'schema_version':'keld.host-handshake/v1','archive_sha256':manifest['sha256'],
        'closure_digest':manifest['closure_digest'],'observed_version':version,
        'status':'FAIL','model_turns':0,
        'claim_limit':'Real app-server initialization through extracted ARE wrapper only; no model task, context use, reconnect or customer repository integration proved.'}
with tempfile.TemporaryDirectory(prefix='keld-host-') as tmp:
    directory=Path(tmp)/'engine';unpack(archive,closure,directory)
    wrapper=directory/'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper'
    profile=wrapper/'profiles/repository-v1.json'
    expected=json.loads(profile.read_text())['protocol_binding']['observed_codex_version']
    report['expected_version']=expected
    if version!=expected:
        report['reason']='host-version-mismatch'
    else:
        # File-backed stderr avoids a full pipe blocking the real server startup.
        with tempfile.TemporaryFile() as errors:
            child=subprocess.Popen(['node',str(wrapper/'bin/are-codex-app-server.mjs'),
                '--config',str(profile),'--repository-root',str(directory),
                '--codex-command',str(binary)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,
                stderr=errors,start_new_session=True,cwd=tmp)
            try:
                request={'jsonrpc':'2.0','id':1,'method':'initialize',
                    'params':{'clientInfo':{'name':'keld-private-package-check','version':'0.1.0'},
                              'capabilities':{'experimentalApi':True}}}
                child.stdin.write((json.dumps(request)+'\n').encode());child.stdin.flush()
                deadline=time.monotonic()+30;buffer=b''
                with selectors.DefaultSelector() as selector:
                    selector.register(child.stdout,selectors.EVENT_READ)
                    while time.monotonic()<deadline:
                        if not selector.select(max(0,deadline-time.monotonic())):break
                        chunk=os.read(child.stdout.fileno(),65536)
                        if not chunk:break
                        buffer+=chunk
                        if len(buffer)>1048576:raise ValueError('Oversized protocol output')
                        while b'\n' in buffer:
                            line,buffer=buffer.split(b'\n',1)
                            message=json.loads(line)
                            if message.get('id')==1:
                                result=message.get('result')
                                if isinstance(result,dict) and isinstance(result.get('userAgent'),str) and 'error' not in message:
                                    report['status']='PASS';report['initialize_response_keys']=sorted(result)
                                    child.stdin.write(b'{"jsonrpc":"2.0","method":"initialized","params":{}}\n');child.stdin.flush()
                                else:report['reason']='invalid-initialize-response'
                                break
                        if report['status']=='PASS' or 'reason' in report:break
                if report['status']!='PASS':report.setdefault('reason','wrapper-exited-or-handshake-timeout')
            finally:
                try:os.killpg(child.pid,signal.SIGKILL)
                except ProcessLookupError:pass
                child.wait(timeout=10)
                child.stdin.close();child.stdout.close()
                errors.seek(0)
                # Keep diagnostics local; no raw profile, credentials or context in the report.
                report['stderr_bytes']=len(errors.read())
report['temporary_copy_removed']=True
(candidate/'host-handshake.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
raise SystemExit(0 if report['status']=='PASS' else 1)
