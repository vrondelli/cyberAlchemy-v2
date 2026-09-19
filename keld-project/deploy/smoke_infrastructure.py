"""Verify merchant-free startup using disposable containers and synthetic secrets."""
import http.client,json,os,re,shutil,subprocess,tempfile,time,uuid
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
  run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','sh','/work/install-permissions.sh','--infrastructure-only'])
  run(compose+['up','-d','--pull','never'])
  port=run(compose+['port','edge','8080']).stdout.strip()
  match=re.fullmatch(r'127\.0\.0\.1:([1-9][0-9]{0,4})',port)
  if not match or int(match.group(1))>65535:raise RuntimeError('edge-port-invalid')
  edge_port=int(match.group(1))
  def get(host,path):
   if host not in ('auth.example.test','shop.example.test') or not path.startswith('/') or '://' in path:raise RuntimeError('smoke-request-invalid')
   connection=http.client.HTTPConnection('127.0.0.1',edge_port,timeout=5)
   try:
    connection.request('GET',path,headers={'Host':host})
    response=connection.getresponse()
    return response.status,response.read()
   finally:connection.close()
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
