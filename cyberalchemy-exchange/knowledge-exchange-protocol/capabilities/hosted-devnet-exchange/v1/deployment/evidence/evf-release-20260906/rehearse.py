import json, subprocess, pathlib, time, os
os.umask(0o077)
base=pathlib.Path('/srv/kep-hosted-devnet'); out=base/'artifacts/evf-release-20260906'
def run(*args): return subprocess.check_output(args,text=True).strip()
app=json.loads(run('docker','inspect','kep-hosted-devnet-application-1'))[0]
env=dict(x.split('=',1) for x in app['Config']['Env'])
url=env['CA2_KEP_DATABASE_URL']; assert url.endswith('/kep')
file=out/'rehearsal.env'
file.write_text('CA2_KEP_BIND=0.0.0.0:8080\nCA2_KEP_DATABASE_URL='+url[:-4]+'/kep_evf_release_rehearsal_20260906\nCA2_KEP_DEVNET_RPC_URL=http://127.0.0.1:9\n')
expected=run('docker','exec','kep-hosted-devnet-database-1','psql','-U','kep','-d','kep_evf_release_rehearsal_20260906','-Atc','SELECT version FROM kep_hosted.state_layout; SELECT md5(state_json::text) FROM kep_hosted.application_state; SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal;').splitlines()
name='kep-evf-release-rehearsal-20260906'
cid=run('docker','run','-d','--name',name,'--network','kep-hosted-devnet_backend','--memory','768m','--memory-swap','768m','--cpus','1','--pids-limit','128','--read-only','--tmpfs','/tmp:size=16m,mode=1777','--cap-drop','ALL','--security-opt','no-new-privileges:true','--env-file',str(file),'ca2-kep-hosted-devnet:evf-release-20260906')
try:
 for n in range(30):
  state=run('docker','inspect','--format','{{.State.Running}}',name)
  if state!='true': raise RuntimeError('rehearsal server exited; inspect private log before proceeding')
  test=subprocess.run(['docker','exec',name,'curl','-fsS','--max-time','2','http://127.0.0.1:8080/ready'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  if test.returncode==0:break
  time.sleep(1)
 else: raise RuntimeError('rehearsal readiness timed out')
 checks=[]
 for route in ['/health','/ready','/','/console-experience/','/white-paper','/assets/console-experience.js']:
  status=run('docker','exec',name,'curl','-sS','-o','/dev/null','-w','%{http_code}','--max-time','5','http://127.0.0.1:8080'+route)
  assert status=='200',(route,status)
  checks.append({'route':route,'status':int(status)})
 header_text=run('docker','exec',name,'curl','-sSI','http://127.0.0.1:8080/console-experience/').lower()
 assert 'strict-transport-security: max-age=31536000' in header_text and 'x-content-type-options: nosniff' in header_text and 'referrer-policy: no-referrer' in header_text
 sql="SELECT version FROM kep_hosted.state_layout; SELECT md5(state_json::text) FROM kep_hosted.application_state; SELECT count(*) FROM kep_hosted.file_payloads; SELECT count(*) FROM kep_hosted.event_journal; SELECT count(*) FROM kep_hosted.state_documents;"
 values=run('docker','exec','kep-hosted-devnet-database-1','psql','-U','kep','-d','kep_evf_release_rehearsal_20260906','-Atc',sql).splitlines()
 assert values[:4]==expected,values
 result={'result':'PASS','container':cid,'checks':checks,'layout':int(values[0]),'legacy_md5':values[1],'payload_count':int(values[2]),'journal_count':int(values[3]),'documents':int(values[4])}
 (out/'rehearsal-result.json').write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result))
finally:
 subprocess.run(['docker','stop','--time','30',name],check=True,stdout=subprocess.DEVNULL)
