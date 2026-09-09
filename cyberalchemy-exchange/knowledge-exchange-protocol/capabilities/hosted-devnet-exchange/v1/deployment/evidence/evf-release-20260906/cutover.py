import json, subprocess, pathlib, time, os, hashlib, sys
os.umask(0o077)
base=pathlib.Path('/srv/kep-hosted-devnet'); os.chdir(base); out=base/'artifacts/evf-release-20260906'
def run(*args):return subprocess.check_output(args,text=True).strip()
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def sql(q):return run('docker','exec','kep-hosted-devnet-database-1','psql','-U','kep','-d','kep','-Atc',q).splitlines()
assert json.loads((out/'rehearsal-result.json').read_text())['result']=='PASS'
image=sys.argv[1]
assert run('docker','image','inspect','--format','{{.Id}}','ca2-kep-hosted-devnet:evf-release-20260906')==image
assert sha('compose.yaml')=='f27b14c2dc408db0b2c1fe19cefc1ad72e5169502a3a1d510889c60a56c3822d'
assert sha('.env')=='cd5c7f3875b736f90301bc6ae5884029e860b33df6cb349a5dc024cb16cf81ee'
db=run('docker','inspect','--format','{{.Id}}','kep-hosted-devnet-database-1')
db_info=json.loads(run('docker','inspect','kep-hosted-devnet-database-1'))[0]
volume=[x['Name'] for x in db_info['Mounts'] if x['Destination']=='/var/lib/postgresql/data'];assert volume==['kep-hosted-devnet_kep-postgres']
old_image=run('docker','inspect','--format','{{.Image}}','kep-hosted-devnet-application-1')
assert old_image=='sha256:5f1270e03f4b3fdedefe52e5712b0e24fbacddc2016d302358c350c1da85c537'
old=pathlib.Path('compose.yaml').read_bytes();(out/'compose.before.yaml').write_bytes(old)
subprocess.run(['docker','compose','stop','application'],check=True)
assert run('docker','inspect','--format','{{.State.Running}}','kep-hosted-devnet-application-1')=='false'
backup=out/'preupdate.dump'
with backup.open('xb') as f:subprocess.run(['docker','exec','kep-hosted-devnet-database-1','pg_dump','-U','kep','-d','kep','-Fc'],stdout=f,check=True)
with backup.open('rb') as f, (out/'preupdate-list.txt').open('w') as log:subprocess.run(['docker','exec','-i','kep-hosted-devnet-database-1','pg_restore','--list'],stdin=f,stdout=log,check=True)
legacy=sql('SELECT md5(state_json::text) FROM kep_hosted.application_state;')[0]
counts=sql('SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal;')
documents_sql="SELECT md5(COALESCE(jsonb_agg(to_jsonb(d) ORDER BY collection, record_id)::text, '[]')) FROM kep_hosted.state_documents d;"
documents_hash=sql(documents_sql)
new=old.decode().replace('image: '+old_image,'image: '+image)
new=new.replace('  database:\n','  database:\n    mem_limit: 1g\n    memswap_limit: 1g\n    cpus: 1.0\n    pids_limit: 256\n',1).replace('  application:\n','  application:\n    mem_limit: 768m\n    memswap_limit: 768m\n    cpus: 1.0\n    pids_limit: 128\n',1)
assert new!=old.decode() and new.count('image: '+image)==1
pending=out/'compose.after.yaml';pending.write_text(new)
# Exact application image plus the validated resource envelope; no other changes.
pathlib.Path('compose.yaml.next').write_text(new);os.replace('compose.yaml.next','compose.yaml')
subprocess.run(['docker','compose','up','-d','--no-deps','--pull','never','database'],check=True)
for _ in range(60):
 if run('docker','inspect','--format','{{.State.Health.Status}}','kep-hosted-devnet-database-1')=='healthy':break
 time.sleep(1)
else:raise RuntimeError('database readiness timed out')
subprocess.run(['docker','compose','up','-d','--no-deps','--pull','never','application'],check=True)
for _ in range(60):
 status=run('docker','inspect','--format','{{.State.Health.Status}}','kep-hosted-devnet-application-1')
 if status=='healthy':break
 if run('docker','inspect','--format','{{.State.Running}}','kep-hosted-devnet-application-1')!='true':raise RuntimeError('new application exited')
 time.sleep(1)
else:raise RuntimeError('new application readiness timed out')
new_db=json.loads(run('docker','inspect','kep-hosted-devnet-database-1'))[0]
assert new_db['Image']==db_info['Image']
assert [x['Name'] for x in new_db['Mounts'] if x['Destination']=='/var/lib/postgresql/data']==volume
for name,memory,pids in [('application',805306368,128),('database',1073741824,256)]:
 h=json.loads(run('docker','inspect','kep-hosted-devnet-'+name+'-1'))[0]['HostConfig']
 assert h['Memory']==memory and h['MemorySwap']==memory and h['NanoCpus']==1000000000 and h['PidsLimit']==pids
assert sha('.env')=='cd5c7f3875b736f90301bc6ae5884029e860b33df6cb349a5dc024cb16cf81ee'
assert sql('SELECT version FROM kep_hosted.state_layout;')==['1']
assert sql('SELECT md5(state_json::text) FROM kep_hosted.application_state;')==[legacy]
assert sql('SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal;')==counts
assert sql(documents_sql)==documents_hash
result={'normalized_documents_unchanged':True,'result':'PASS_BOUNDED','image':image,'previous_image':old_image,'previous_database_container':db,'database_container':new_db['Id'],'database_volume':volume[0],'quotas_verified':True,'backup_sha256':sha(backup),'backup_path':str(backup),'quiescent_backup':True,'backup_list_verified':True,'legacy_md5':legacy,'payload_count':int(counts[0]),'journal_count':int(counts[1]),'layout_version':1,'health':status,'compose_sha256':sha('compose.yaml'),'environment_unchanged':True,'authorization':'User requested deploy commit and push for the tested EVF fixes','automatic_rollback':False}
(out/'execution.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
