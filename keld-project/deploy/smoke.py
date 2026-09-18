"""Disposable real container startup test; synthetic vault, no merchant calls."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import uuid
from prepare import prepare
from test_prepare import synthetic_store,settings

HERE=Path(__file__).resolve().parent
project='keld-smoke-'+uuid.uuid4().hex[:10]
env={**os.environ,'KELD_DOMAIN':'shop.example.test','AUTH_DOMAIN':'auth.example.test','ACME_EMAIL':'test@example.test'}
with tempfile.TemporaryDirectory(prefix='keld-compose-') as tmp:
    root=Path(tmp)
    for name in ('compose.yaml','keycloak-entrypoint.sh','install-permissions.sh'):
        shutil.copyfile(HERE/name,root/name)
    (root/'Caddyfile').write_text(':8080 {\n reverse_proxy web:8080 {\n header_up Host shop.example.test\n }\n}\n')
    (root/'smoke.yaml').write_text('services:\n  edge:\n    ports: !override ["127.0.0.1::8080"]\n')
    store,_=synthetic_store(root);prepare(store,settings(root),root/'.runtime')
    compose=['docker','compose','--project-directory',str(root),'-p',project,'-f',str(root/'compose.yaml'),'-f',str(root/'smoke.yaml')]
    def run(args,**kwargs):
        return subprocess.run(args,env=env,text=True,capture_output=True,check=True,**kwargs)
    def service(name):
        return run(compose+['ps','-q',name]).stdout.strip()
    try:
        run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','sh','/work/install-permissions.sh'])
        run(compose+['up','-d','--no-build','--pull','never'],timeout=180)
        for _ in range(90):
            try:
                run(['docker','exec',service('web'),'node','-e',"fetch('http://127.0.0.1:8080/readyz').then(r=>process.exit(r.ok?0:1))"])
                break
            except subprocess.CalledProcessError:time.sleep(1)
        else:raise RuntimeError('web readiness timed out')
        for _ in range(90):
            probe="fetch('http://keycloak:8080/realms/keld/.well-known/openid-configuration').then(async r=>{const x=await r.json();if(!r.ok||x.issuer!=='https://auth.example.test/realms/keld')process.exit(1)}).catch(()=>process.exit(1))"
            try:run(['docker','exec',service('web'),'node','-e',probe]);break
            except subprocess.CalledProcessError:time.sleep(1)
        else:raise RuntimeError('issuer readiness timed out')
        probe="const r=await fetch('http://edge:8080/');if(!r.ok||!(await r.text()).includes('KELD'))process.exit(1);const bad=await fetch('http://web:8080/',{headers:{host:'evil.example'}});if(bad.status!==400)process.exit(1);"
        run(['docker','exec',service('web'),'node','--input-type=module','-e',probe])
        run(['docker','exec',service('worker'),'node','--input-type=module','-e',
             "import {loadConfig} from './src/config.mjs';const c=await loadConfig('/config/keld.json',{role:'worker',requireCurrentQuote:false});if(c.integration.auth||process.env.KELD_OIDC_SECRET_FILE)process.exit(1);"])
        metadata=json.loads(run(['docker','inspect',service('web')]).stdout)[0]
        assert not metadata['HostConfig']['PortBindings']
        assert all('synthetic-secret' not in x for x in metadata['Config']['Env'])
        print(json.dumps({'ok':True,'checks':['postgres migrations','Keycloak realm discovery','web readiness','Caddy routing','Host rejection','worker without auth secrets','no backend published ports'],'scope':'loopback HTTP proxy; synthetic credentials; no merchant or browser OIDC proof'}))
    except Exception:
        # Synthetic-only stack, but emit just status names, not arbitrary logs.
        status=subprocess.run(compose+['ps','--format','json'],env=env,text=True,capture_output=True)
        print('Container smoke failed; inspect disposable stack status before cleanup.',file=__import__('sys').stderr)
        print(status.stdout,file=__import__('sys').stderr)
        raise
    finally:
        subprocess.run(compose+['down','--volumes','--remove-orphans'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=90)
        subprocess.run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','chown','-R',str(os.getuid())+':'+str(os.getgid()),'/work'],stdout=subprocess.DEVNULL,check=True)
