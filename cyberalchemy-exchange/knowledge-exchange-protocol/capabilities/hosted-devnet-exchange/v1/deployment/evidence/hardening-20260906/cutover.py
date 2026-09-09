import json, subprocess, pathlib, time, os, hashlib, sys
os.umask(0o077)
base=pathlib.Path('/srv/kep-hosted-devnet'); os.chdir(base); out=base/'artifacts/hardening-20260906'
def run(*args):return subprocess.check_output(args,text=True).strip()
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def sql(q):return run('docker','exec','kep-hosted-devnet-database-1','psql','-U','kep','-d','kep','-Atc',q).splitlines()
assert json.loads((out/'rehearsal-result.json').read_text())['result']=='PASS'
image=sys.argv[1]
assert run('docker','image','inspect','--format','{{.Id}}','ca2-kep-hosted-devnet:hardening-20260906')==image
assert sha('compose.yaml')=='f194fe7bb9906d2e6368839ee0d0b9805183264fd9f716d96500c2f0ee547236'
assert sha('.env')=='cd5c7f3875b736f90301bc6ae5884029e860b33df6cb349a5dc024cb16cf81ee'
db=run('docker','inspect','--format','{{.Id}}','kep-hosted-devnet-database-1')
old_image=run('docker','inspect','--format','{{.Image}}','kep-hosted-devnet-application-1')
assert old_image=='sha256:561bec08c109bc60b86023377c1916e2a1137052268cc4ff01b23a5e01a477c8'
old=pathlib.Path('compose.yaml').read_bytes();(out/'compose.before.yaml').write_bytes(old)
subprocess.run(['docker','compose','stop','application'],check=True)
assert run('docker','inspect','--format','{{.State.Running}}','kep-hosted-devnet-application-1')=='false'
backup=out/'preupdate.dump'
with backup.open('xb') as f:subprocess.run(['docker','exec','kep-hosted-devnet-database-1','pg_dump','-U','kep','-d','kep','-Fc'],stdout=f,check=True)
with backup.open('rb') as f, (out/'preupdate-list.txt').open('w') as log:subprocess.run(['docker','exec','-i','kep-hosted-devnet-database-1','pg_restore','--list'],stdin=f,stdout=log,check=True)
legacy=sql('SELECT md5(state_json::text) FROM kep_hosted.application_state;')[0]
counts=sql('SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal;')
new=old.decode().replace('image: '+old_image,'image: '+image)
assert new!=old.decode() and new.count('image: '+image)==1
pending=out/'compose.after.yaml';pending.write_text(new)
# Compose is unchanged except the exact application image.
pathlib.Path('compose.yaml.next').write_text(new);os.replace('compose.yaml.next','compose.yaml')
subprocess.run(['docker','compose','up','-d','--no-deps','--pull','never','application'],check=True)
for _ in range(60):
 status=run('docker','inspect','--format','{{.State.Health.Status}}','kep-hosted-devnet-application-1')
 if status=='healthy':break
 if run('docker','inspect','--format','{{.State.Running}}','kep-hosted-devnet-application-1')!='true':raise RuntimeError('new application exited')
 time.sleep(1)
else:raise RuntimeError('new application readiness timed out')
assert run('docker','inspect','--format','{{.Id}}','kep-hosted-devnet-database-1')==db
assert sha('.env')=='cd5c7f3875b736f90301bc6ae5884029e860b33df6cb349a5dc024cb16cf81ee'
assert sql('SELECT version FROM kep_hosted.state_layout;')==['1']
assert sql('SELECT md5(state_json::text) FROM kep_hosted.application_state;')==[legacy]
assert sql('SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal;')==counts
result={'result':'PASS_BOUNDED','image':image,'previous_image':old_image,'database_container':db,'backup_sha256':sha(backup),'backup_path':str(backup),'quiescent_backup':True,'backup_list_verified':True,'legacy_md5':legacy,'payload_count':int(counts[0]),'journal_count':int(counts[1]),'layout_version':1,'health':status,'compose_sha256':sha('compose.yaml'),'environment_unchanged':True,'authorization':'User requested deploy the current version in this task','automatic_rollback':False}
(out/'execution.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
