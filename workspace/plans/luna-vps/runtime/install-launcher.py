"""Install the tested private launcher. Open questions: ../HOST-PLAN.md."""
from pathlib import Path
import argparse
import json,subprocess,shlex
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--remote-stage',required=True);args=parser.parse_args()
base=Path(__file__).resolve().parent.parent; candidate=json.loads((base/'evidence/launcher-candidate.json').read_text()); stage=args.remote_stage; ssh=['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes',json.loads((base/'host-binding.candidate.json').read_text())['host']['ssh_alias']]
for local,remote in [('host.candidate.json','host.json'),('are-luna-pilot.service','are-luna-pilot.service')]:
 subprocess.run(ssh+['cat > '+shlex.quote(stage+'/'+remote)],input=(base/'runtime'/local).read_bytes(),check=True)
script='''import pathlib,json,hashlib,subprocess,os,grp,shutil,time
candidate=INPUT_CANDIDATE
stage=pathlib.Path(INPUT_STAGE)
target=pathlib.Path(candidate['launcher_directory']);unit=pathlib.Path('/etc/systemd/system/are-luna-pilot.service')
assert not target.exists() and not unit.exists(), 'Existing deployment requires inspection'
files={**candidate['files'],'host.json':candidate['host_config_sha256'],'are-luna-pilot.service':candidate['unit_sha256']}
for name,digest in files.items():assert hashlib.sha256((stage/name).read_bytes()).hexdigest()==digest,name
gid=grp.getgrnam('are-luna').gr_gid
target.mkdir(parents=True)
os.chown(target,0,gid);target.chmod(0o750)
for name,digest in files.items():
 shutil.copyfile(stage/name,target/name);os.chown(target/name,0,gid);(target/name).chmod(0o640)
 assert hashlib.sha256((target/name).read_bytes()).hexdigest()==digest
node='/srv/are-luna-pilot/candidates/04384954e710e58f/bin/node'
prepared=subprocess.run(['systemd-run','--quiet','--wait','--collect','--pipe','--unit=are-luna-pilot-prepare','-p','User=are-luna','-p','Group=are-luna','-p','RuntimeDirectory=are-luna-pilot','-p','RuntimeDirectoryMode=0700','-p','UMask=0077',node,str(target/'pilot-host.mjs'),str(target/'host.json'),'--prepare'],capture_output=True,text=True,timeout=90)
assert prepared.returncode==0,prepared.stderr
trust=json.loads(prepared.stdout.strip().splitlines()[-1]);assert trust['ready']
shutil.copyfile(target/'are-luna-pilot.service',unit);unit.chmod(0o644)
subprocess.run(['systemd-analyze','verify',str(unit)],check=True,capture_output=True)
subprocess.run(['systemctl','daemon-reload'],check=True)
subprocess.run(['systemctl','enable','--now','are-luna-pilot.service'],check=True,capture_output=True)
for attempt in range(15):
 r=subprocess.run(['runuser','-u','are-luna','--',node,str(target/'pilot-control.mjs'),'/run/are-luna-pilot/control.sock','status'],capture_output=True,text=True,timeout=5)
 if r.returncode==0:break
 time.sleep(1)
assert r.returncode==0,r.stderr
status=json.loads(r.stdout);assert status['ok'] and status['result']['ready']
print(json.dumps({'status':'PASS','launcher_directory':str(target),'service':'are-luna-pilot.service','enabled':True,'health':status['result'],'persisted_hook_trust_verified':True,'external_model_calls':0,'open_questions_ref':'../HOST-PLAN.md#open-questions'},indent=2))
shutil.rmtree(stage)
'''.replace('INPUT_CANDIDATE',repr(candidate)).replace('INPUT_STAGE',repr(stage))
r=subprocess.run(ssh+['python3 -'],input=script,text=True,capture_output=True,timeout=150)
(base/'evidence/launcher-activation.json').write_text(r.stdout if r.returncode==0 else json.dumps({'status':'FAIL','stdout':r.stdout,'stderr':r.stderr,'open_questions_ref':'../HOST-PLAN.md#open-questions'},indent=2))
print(r.returncode,r.stdout,r.stderr[-2000:]);assert r.returncode==0
