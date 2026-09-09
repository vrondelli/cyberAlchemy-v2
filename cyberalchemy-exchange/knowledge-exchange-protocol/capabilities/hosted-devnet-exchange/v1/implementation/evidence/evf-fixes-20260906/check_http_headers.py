from pathlib import Path
import json, os, socket, subprocess, time, urllib.request, urllib.error, hashlib
base=Path(__file__).resolve().parent;root=base.parents[1]
name='kep_evf_headers_'+str(time.time_ns())
subprocess.run(['docker','exec','kep-ux-review-20260906','createdb','-U','postgres',name],check=True)
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
env=dict(os.environ,CA2_KEP_DATABASE_URL='postgres://postgres@127.0.0.1:32773/'+name,CA2_KEP_BIND='127.0.0.1:'+str(port),CA2_KEP_DEVNET_RPC_URL='http://127.0.0.1:9')
binary=root/'target/release/hosted';opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
with (base/'headers-server.txt').open('w') as log:
 server=subprocess.Popen([str(binary)],env=env,stdout=log,stderr=subprocess.STDOUT)
 try:
  for _ in range(50):
   assert server.poll() is None,'server exited'
   try:
    with opener.open(f'http://127.0.0.1:{port}/ready',timeout=1) as r:
     if r.status==200:break
   except OSError:pass
   time.sleep(.1)
  else:raise RuntimeError('readiness timeout')
  results=[]
  for route in ['/','/console-experience/','/white-paper','/assets/console-experience.js','/ready','/missing-route']:
   try:r=opener.open(f'http://127.0.0.1:{port}'+route,timeout=5)
   except urllib.error.HTTPError as e:r=e
   with r:
    h={k.lower():v for k,v in r.headers.items()}
    assert h.get('strict-transport-security')=='max-age=31536000'
    assert h.get('x-content-type-options')=='nosniff' and h.get('referrer-policy')=='no-referrer'
    assert r.code==(404 if route=='/missing-route' else 200)
    results.append({'route':route,'status':r.code,'headers':h})
  (base/'http-headers.json').write_text(json.dumps({'result':'PASS','checks':results,'binary_sha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'database':name,'scope':'isolated real HTTP; HSTS browser persistence not activated on cleartext loopback'},indent=2)+'\n')
 finally:
  server.terminate()
  try:server.wait(timeout=10)
  except subprocess.TimeoutExpired:server.kill();server.wait();raise RuntimeError('graceful stop timed out')
 assert server.returncode==0
