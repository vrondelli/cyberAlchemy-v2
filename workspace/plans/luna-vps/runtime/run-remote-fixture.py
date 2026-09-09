"""Run the isolated fixture on the selected VPS. Open questions: ../HOST-PLAN.md."""
import argparse,subprocess,json,hashlib,re,shlex
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--archive',required=True,type=Path)
parser.add_argument('--sha256',required=True)
parser.add_argument('--output',required=True,type=Path)
parser.add_argument('--install',action='store_true',help='After the disposable test passes, stage and retest the isolated runtime')
args=parser.parse_args()
binding=json.loads((Path(__file__).resolve().parent.parent/'host-binding.candidate.json').read_text())
ssh=['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10',binding['host']['ssh_alias']]
def remote(command,**kw):
 result=subprocess.run(ssh+[command],text=True,capture_output=True,timeout=180,**kw)
 if result.returncode:
  args.output.write_text(json.dumps({'status':'FAIL','exit_code':result.returncode,
   'stdout':result.stdout,'stderr':result.stderr,
   'open_questions_ref':'../HOST-PLAN.md#open-questions'},indent=2)+'\n')
  raise RuntimeError('Remote fixture failed; bounded diagnostics saved to '+str(args.output))
 return result.stdout
archive=args.archive; digest=hashlib.sha256(archive.read_bytes()).hexdigest()
assert digest==args.sha256, 'Archive hash mismatch'
root=remote('mktemp -d /tmp/are-vps-fixture.XXXXXXXX').strip();assert re.fullmatch(r'/tmp/are-vps-fixture\.[A-Za-z0-9]+',root)
print('REMOTE_TEMPORARY_ROOT '+root,flush=True)
try:
 with archive.open('rb') as stream:subprocess.run(ssh+['cat > '+shlex.quote(root+'/bundle.tar.gz')],stdin=stream,check=True,timeout=180)
 print('TRANSFERRED',flush=True)
 q=shlex.quote(root)
 command=f'''set -eu
cd {q}
printf '%s  %s\\n' {digest} bundle.tar.gz | sha256sum --check --quiet
tar --no-same-owner -xzf bundle.tar.gz
cd candidate
sha256sum --check --quiet SHA256SUMS
chown nobody:nogroup {q}
runuser -u nobody -- {q}/candidate/bin/node {q}/candidate/cyberAlchemy-v2/implementation/agent-reasoning-engine/scripts/portable-full-wrapper-canary.mjs {q}/candidate/bin/codex --gateway
'''
 report=json.loads(remote(command));assert report['status']=='PASS',report
 if args.install:
  manifest_sha=hashlib.sha256(subprocess.check_output(['tar','-xOzf',str(archive),'candidate/MANIFEST.json'])).hexdigest()
  installer=Path(__file__).resolve().parent/'install-isolated.py'
  installation=json.loads(remote('python3 - '+shlex.quote(root+'/candidate')+' '+manifest_sha+' --install',input=installer.read_text()))
  target=installation['candidate']
  report=json.loads(remote('runuser -u are-luna -- '+shlex.quote(target+'/bin/node')+' '+shlex.quote(target+'/cyberAlchemy-v2/implementation/agent-reasoning-engine/scripts/portable-full-wrapper-canary.mjs')+' '+shlex.quote(target+'/bin/codex')+' --gateway'))
  assert report['status']=='PASS',report
  report['installation']=installation
  report['installer_sha256']=hashlib.sha256(installer.read_bytes()).hexdigest()
  report['execution_user']='are-luna'
  report['disposable_test_passed_before_installation']=True
 else:
  report['execution_user']='nobody'
 report['archive_sha256']=digest
 report['open_questions_ref']='../HOST-PLAN.md#open-questions'
 args.output.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'host':binding['host']['ssh_alias'],'execution_user':report['execution_user'],'archive_sha256':digest,'gateway':report.get('gateway'),'external_model_calls':report['external_model_calls']}),flush=True)
finally:
 remote('rm -rf -- '+shlex.quote(root))
 print('TEMPORARY_REMOTE_BUNDLE_REMOVED',flush=True)
