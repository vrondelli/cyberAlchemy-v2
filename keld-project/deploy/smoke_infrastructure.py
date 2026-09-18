"""Verify merchant-free startup using disposable containers and synthetic secrets."""
import json,os,shutil,subprocess,tempfile,time,uuid,urllib.request,urllib.error
from pathlib import Path
from prepare import prepare
from test_prepare import synthetic_store
HERE=Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix='keld-infra-smoke-') as tmp:
 root=Path(tmp);project='keld-infra-test-'+uuid.uuid4().hex[:8]
 for name in ('compose.yaml','compose.infrastructure.yaml','keycloak-entrypoint.sh','install-permissions.sh'):
  shutil.copyfile(HERE/name,root/name)
 caddy=(HERE/'Caddyfile.infrastructure').read_text().replace('{$KELD_DOMAIN}', 'http://shop.example.test:8080').replace('{$AUTH_DOMAIN}', 'http://auth.example.test:8080')
 (root/'Caddyfile.infrastructure').write_text(caddy)
 (root/'test.yaml').write_text('services:\n  edge:\n    ports: !override ["127.0.0.1::8080"]\n')
 env={**os.environ,'KELD_DOMAIN':'shop.example.test','AUTH_DOMAIN':'auth.example.test'}
 compose=['docker','compose','-p',project,'-f',str(root/'compose.infrastructure.yaml'),'-f',str(root/'test.yaml')]
 def run(cmd):return subprocess.run(cmd,env=env,text=True,capture_output=True,check=True)
 try:
  store,_=synthetic_store(root)
  prepare(store,{'origin':'https://shop.example.test','issuer':'https://auth.example.test/realms/keld'},root/'.runtime',infrastructure_only=True)
  run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','sh','/work/install-permissions.sh'])
  run(compose+['up','-d','--pull','never'])
  port=run(compose+['port','edge','8080']).stdout.strip()
  def get(host,path):
   request=urllib.request.Request('http://'+port+path,headers={'Host':host})
   try:
    with urllib.request.urlopen(request,timeout=5) as response:return response.status,response.read()
   except urllib.error.HTTPError as response:return response.code,response.read()
  for attempt in range(360):
   status,body=get('auth.example.test','/realms/keld/.well-known/openid-configuration')
   if status==200:break
   time.sleep(1)
  else:raise RuntimeError('issuer-timeout')
  assert json.loads(body)['issuer']=='https://auth.example.test/realms/keld'
  assert get('shop.example.test','/')[0]==503
  assert get('auth.example.test','/admin/')[0]==404
  assert get('auth.example.test','/realms/master/.well-known/openid-configuration')[0]==404
  assert set(run(compose+['ps','--services','--status','running']).stdout.split())=={'edge','postgres','keycloak'}
  print(json.dumps({'ok':True,'checks':['merchant-free cold start','issuer discovery','maintenance response','admin blocked','master realm blocked']}))
 finally:
  subprocess.run(compose+['down','--volumes','--remove-orphans'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=60)
  subprocess.run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','chown','-R',str(os.getuid())+':'+str(os.getgid()),'/work'],stdout=subprocess.DEVNULL,check=True)
