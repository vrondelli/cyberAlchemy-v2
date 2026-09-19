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
env={**os.environ,
     'KELD_DOMAIN':'shop.example.test','AUTH_DOMAIN':'auth.example.test','ACME_EMAIL':'test@example.test',
     # Digest-shaped values exercise the production preflight. The smoke overlay
     # separately selects already-built local images for the disposable runtime.
     'ARE_EDGE_IMAGE':'registry.example/are-edge@sha256:'+'1'*64,
     'ARE_PUBLIC_CHAT_IMAGE':'registry.example/are-chat@sha256:'+'2'*64,
     'ARE_INFERENCE_BROKER_IMAGE':'registry.example/are-broker@sha256:'+'3'*64,
     'ARE_PROVIDER_GATEWAY_IMAGE':'registry.example/are-gateway@sha256:'+'4'*64,
     # Synthetic smoke-only values, never production policy or provider pricing.
     'ARE_CHAT_IDLE_RETENTION_SECONDS':'300',
     'ARE_BROKER_HOURLY_MICROUSD_LIMIT':'500000',
     'ARE_BROKER_MONTHLY_MICROUSD_LIMIT':'5000000',
     'ARE_PROVIDER_INPUT_MICROUSD_PER_MILLION_TOKENS':'200000',
     'ARE_PROVIDER_OUTPUT_MICROUSD_PER_MILLION_TOKENS':'1000000'}
with tempfile.TemporaryDirectory(prefix='keld-compose-') as tmp:
    root=Path(tmp)/'keld-project'/'deploy';root.mkdir(parents=True)
    for name in ('compose.yaml','keycloak-entrypoint.sh','install-permissions.sh','verify-production-inputs.mjs'):
        shutil.copyfile(HERE/name,root/name)
    are_deploy=root.parent/'are-documentation'/'deploy';are_deploy.mkdir(parents=True)
    shutil.copyfile(HERE.parent/'are-documentation'/'deploy'/'seccomp-node.json',are_deploy/'seccomp-node.json')
    (root/'Caddyfile').write_text('''\
http://shop.example.test:8080 {
 @private path /readyz
 handle @private {
  respond 404
 }
 @are path /are /are/*
 handle @are {
  reverse_proxy are-edge:8080 {
   header_up Host shop.example.test
  }
 }
 handle {
  reverse_proxy web:8080 {
   header_up Host shop.example.test
  }
 }
}
''')
    (root/'smoke.yaml').write_text('''\
services:
  edge:
    ports: !override ["127.0.0.1::8080"]
  are-edge:
    image: are-chat-edge:security-candidate
  are-public-chat:
    image: are-public-chat:security-candidate
  are-inference-broker:
    image: are-inference-broker:security-candidate
  are-provider-gateway:
    image: are-provider-gateway:security-candidate
''')
    store,_=synthetic_store(root);prepare(store,settings(root),root/'.runtime')
    model_secret=root/'.runtime'/'secrets'/'are_model_api_key'
    model_secret.write_text('synthetic-model-api-key')
    model_secret.chmod(0o400)
    compose=['docker','compose','--project-directory',str(root),'-p',project,'-f',str(root/'compose.yaml'),'-f',str(root/'smoke.yaml')]
    def run(args,**kwargs):
        return subprocess.run(args,env=env,text=True,capture_output=True,check=True,**kwargs)
    def service(name):
        return run(compose+['ps','-q',name]).stdout.strip()
    def completed_service(name):
        return run(compose+['ps','-a','-q',name]).stdout.strip()
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
        tls_probe="const {connect}=await import('node:tls');const s=connect({host:'keycloak',port:8080,rejectUnauthorized:false});const done=ok=>{s.destroy();process.exit(ok?0:1)};const timer=setTimeout(()=>done(true),2000);s.once('secureConnect',()=>{clearTimeout(timer);done(false)});s.once('error',()=>{clearTimeout(timer);done(true)});"
        run(['docker','exec',service('web'),'node','--input-type=module','-e',tls_probe])
        probe="import http from 'node:http';const get=(host,path,publicHost)=>new Promise((resolve,reject)=>{const q=http.get({host,port:8080,path,headers:{host:publicHost}},r=>{const chunks=[];r.on('data',x=>chunks.push(x));r.on('end',()=>resolve({status:r.statusCode,type:r.headers['content-type'],body:Buffer.concat(chunks).toString()}))});q.on('error',reject)});const fail=x=>{throw new Error(x)};const shop=await get('edge','/','shop.example.test');if(shop.status!==200||!shop.body.includes('KELD'))fail('keld-caddy-route');const privateRoute=await get('edge','/readyz','shop.example.test');if(privateRoute.status!==404)fail('public-readiness-route');const are=await get('edge','/are/','shop.example.test');if(are.status!==200||!are.body.includes('A.R.E. — Agent Reasoning Engine'))fail('are-page-route-'+are.status+'-'+are.type+'-'+are.body.length);const status=await get('edge','/are/api/are/status','shop.example.test');const state=JSON.parse(status.body);if(status.status!==200||state.mode!=='live'||state.idle_retention_seconds!==300)fail('are-status-route');const old=await get('edge','/api/are/status','shop.example.test');if(old.body.includes('\\\"scope\\\":\\\"conversation-only\\\"'))fail('legacy-api-route');const sibling=await get('edge','/area','shop.example.test');if(sibling.body.includes('A.R.E. — Agent Reasoning Engine'))fail('are-sibling-route');const bad=await get('web','/','evil.example');if(bad.status!==400)fail('keld-host-rejection');"
        try:run(['docker','exec',service('web'),'node','--input-type=module','-e',probe])
        except subprocess.CalledProcessError as error:
            labels=[line for line in error.stderr.splitlines() if 'Error:' in line]
            raise RuntimeError('route probe failed: '+(labels[-1] if labels else 'unlabeled')) from error
        run(['docker','exec',service('worker'),'node','--input-type=module','-e',
             "import {loadConfig} from './src/config.mjs';const c=await loadConfig('/config/keld.json',{role:'worker',requireCurrentQuote:false});if(c.integration.auth||process.env.KELD_OIDC_SECRET_FILE)process.exit(1);"])
        preflight=json.loads(run(['docker','inspect',completed_service('are-production-inputs')]).stdout)[0]
        assert preflight['State']['ExitCode']==0
        assert preflight['Config']['User']=='10001:10001'
        assert preflight['HostConfig']['NetworkMode']=='none'
        assert preflight['HostConfig']['ReadonlyRootfs']
        assert 'ALL' in preflight['HostConfig']['CapDrop']
        assert not preflight['HostConfig']['PortBindings']
        preflight_logs=run(compose+['logs','--no-color','are-production-inputs']).stdout
        assert '"values_printed":false' in preflight_logs
        assert not any(value in preflight_logs for name,value in env.items() if name.startswith('ARE_'))
        metadata=json.loads(run(['docker','inspect',service('web')]).stdout)[0]
        assert not metadata['HostConfig']['PortBindings']
        assert all('synthetic-secret' not in x for x in metadata['Config']['Env'])
        keycloak=json.loads(run(['docker','inspect',service('keycloak')]).stdout)[0]
        keycloak_env=set(keycloak['Config']['Env'])
        assert not keycloak['HostConfig']['PortBindings']
        assert 'KC_DB=postgres' in keycloak_env and 'KC_HTTP_ENABLED=true' in keycloak_env
        assert not any(value.startswith('KC_HTTPS_') for value in keycloak_env)
        expected_networks={
          'are-edge':{'are-edge','are-chat-ingress'},
          'are-public-chat':{'are-chat-ingress','are-inference'},
          'are-inference-broker':{'are-inference','are-provider-link'},
          'are-provider-gateway':{'are-provider-link','are-provider-egress'},
        }
        for name,expected in expected_networks.items():
            container=json.loads(run(['docker','inspect',service(name)]).stdout)[0]
            assert not container['HostConfig']['PortBindings']
            assert container['Config']['User']=='65532:65532'
            assert container['HostConfig']['ReadonlyRootfs']
            assert 'ALL' in container['HostConfig']['CapDrop']
            assert any(value.startswith('no-new-privileges') for value in container['HostConfig']['SecurityOpt'])
            assert any(value.startswith('seccomp') for value in container['HostConfig']['SecurityOpt'])
            actual={network.removeprefix(project+'_') for network in container['NetworkSettings']['Networks']}
            assert actual==expected,(name,actual,expected)
            assert all('synthetic-model-api-key' not in value for value in container['Config']['Env'])
        print(json.dumps({'ok':True,'checks':['postgres migrations','Keycloak realm discovery','Keycloak backend TLS absent','web readiness','public readiness denial','exact /are/ Caddy routing','legacy /api/are rejection','/area route separation','Host rejection','worker without auth secrets','enforced production-input gate','ARE network segmentation','ARE hardened runtime controls','no backend published ports'],'scope':'loopback HTTP proxy; synthetic credentials and policy values; no model, merchant, public TLS, browser OIDC or deployment proof'}))
    except Exception:
        # Synthetic-only stack, but emit just status names, not arbitrary logs.
        status=subprocess.run(compose+['ps','--format','json'],env=env,text=True,capture_output=True)
        print('Container smoke failed; inspect disposable stack status before cleanup.',file=__import__('sys').stderr)
        summary=[]
        for line in status.stdout.splitlines():
            try:
                item=json.loads(line);summary.append({'service':item.get('Service'),'state':item.get('State'),'health':item.get('Health')})
            except json.JSONDecodeError:summary.append({'service':'compose-status-unparseable','state':'unknown','health':''})
        print(json.dumps(summary,sort_keys=True),file=__import__('sys').stderr)
        raise
    finally:
        subprocess.run(compose+['down','--volumes','--remove-orphans'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=90)
        subprocess.run(['docker','run','--rm','--pull=never','-v',str(root)+':/work','ubuntu:24.04','chown','-R',str(os.getuid())+':'+str(os.getgid()),'/work'],stdout=subprocess.DEVNULL,check=True)
