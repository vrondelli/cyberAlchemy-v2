"""Check the retained private archive in a local, network-isolated Node container."""
import hashlib
import json
from pathlib import Path
import subprocess
import uuid

root=Path(__file__).resolve().parents[1]
candidate=root/'evidence/private-candidate'
manifest=json.loads((candidate/'manifest.json').read_text())
archive=candidate/'are-private-candidate.tar.gz'
if hashlib.sha256(archive.read_bytes()).hexdigest()!=manifest['sha256']:
    raise SystemExit('Archive does not match manifest')
# inspect never pulls: this check must not silently download a large image.
image='node:26.8.1-bookworm-slim'
image_id=subprocess.check_output(['docker','image','inspect',image,'--format','{{.Id}}'],text=True,timeout=30).strip()
name='keld-are-check-'+uuid.uuid4().hex[:12]
command=['docker','run','--name',name,'--rm','--pull=never','--network=none','--read-only',
         '--cap-drop=ALL','--security-opt=no-new-privileges',
         '--tmpfs','/work:rw,nosuid,size=128m',
         '--mount',f'type=bind,source={candidate},target=/input,readonly',
         '--workdir','/work',image_id,'sh','-c',
         'tar -xzf /input/are-private-candidate.tar.gz && cd cyberAlchemy-v2/implementation/agent-reasoning-engine && node bin/are.mjs doctor --json']
try:
    run=subprocess.run(command,text=True,capture_output=True,timeout=90)
finally:
    subprocess.run(['docker','rm','-f',name],capture_output=True,timeout=15)
try:
    doctor=json.loads(run.stdout)
except json.JSONDecodeError:
    doctor=None
passed=run.returncode==0 and doctor is not None and doctor.get('status')=='PASS' and doctor.get('source_closure',{}).get('closure_digest')==manifest['closure_digest']
report={'schema_version':'keld.container-startup/v1','status':'PASS' if passed else 'FAIL',
        'image':image,'image_id':image_id,'archive_sha256':manifest['sha256'],
        'closure_digest':manifest['closure_digest'],'exit_code':run.returncode,
        'doctor':doctor,'stderr':run.stderr[-4000:],
        'limitations':'Doctor startup only in Linux Node image. Not full native tests, actual agent integration, or other OS support.'}
(candidate/'container-startup.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ('status','image_id','archive_sha256','exit_code','limitations')}))
raise SystemExit(0 if passed else 1)
