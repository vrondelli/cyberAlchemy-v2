import json,os,tempfile,subprocess,threading,queue,time,hashlib
from pathlib import Path
OUT=Path(__file__).resolve().parent
BIN='/mnt/c/Users/vlad_/.codex/bin/wsl/fea8d57830aac904/codex'
results=[]
for name,cli,bypass in [('outer-cli-only',True,None),('thread-config-true',False,True),('thread-config-false',False,False)]:
 ws=Path(tempfile.mkdtemp(prefix='are-hook-diagnosis-'));home=ws/'home';home.mkdir(mode=0o700)
 marker=ws/'callback.json';script=ws/'marker.py'
 script.write_text('import sys,json\nfrom pathlib import Path\ne=json.load(sys.stdin)\nPath('+repr(str(marker))+').write_text(json.dumps(e))\nprint("{}")\n')
 hooks={'hooks':{'SessionStart':[{'hooks':[{'type':'command','command':'/usr/bin/python3 '+str(script),'timeout':3}]}]}}
 (home/'hooks.json').write_text(json.dumps(hooks))
 (home/'config.toml').write_text('model="gpt-5.6-luna"\n')
 env=os.environ.copy();env['CODEX_HOME']=str(home)
 for key in ['OPENAI_API_KEY','CODEX_API_KEY']:env.pop(key,None)
 args=[BIN]+(['--dangerously-bypass-hook-trust'] if cli else [])+['app-server']
 p=subprocess.Popen(args,cwd=ws,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
 q=queue.Queue();notes=[]
 def reader(proc=p,events=q):
  for line in proc.stdout:
   try:events.put(json.loads(line))
   except Exception:pass
  events.put({'ended':True})
 threading.Thread(target=reader,daemon=True).start()
 def rpc(i,method,params):
  p.stdin.write(json.dumps({'id':i,'method':method,'params':params})+'\n');p.stdin.flush();end=time.monotonic()+20
  while True:
   r=q.get(timeout=max(.01,end-time.monotonic()))
   if r.get('ended'):raise RuntimeError('host-exited')
   if r.get('id')==i:
    if 'error'in r:raise RuntimeError(json.dumps(r['error']))
    return r['result']
   notes.append(r)
 row={'case':name,'workspace':str(ws),'cli_flag':cli,'thread_config':bypass,'turn_start_calls':0}
 try:
  rpc(1,'initialize',{'clientInfo':{'name':'are_hook_diagnosis','version':'0.1'},'capabilities':{'experimentalApi':True}})
  p.stdin.write('{"method":"initialized"}\n');p.stdin.flush()
  h=rpc(2,'hooks/list',{'cwds':[str(ws)]});row['discovered']=h
  config={} if bypass is None else {'bypass_hook_trust':bypass}
  th=rpc(3,'thread/start',{'cwd':str(ws),'model':'gpt-5.6-luna','sessionStartSource':'startup','config':config,'sandbox':'read-only','approvalPolicy':'never','baseInstructions':'No model turns are requested in this diagnostic.'})
  row['thread_id']=th['thread']['id']
  # Metadata RPC completes after startup; bounded grace allows callback file flush.
  end=time.monotonic()+3
  while time.monotonic()<end and not marker.exists():time.sleep(.05)
  row['callback_observed']=marker.exists()
  if marker.exists():row['callback']=json.loads(marker.read_text())
 except Exception as e:row['error']=str(e) or type(e).__name__
 finally:
  p.terminate()
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:p.kill();p.wait()
  row['process_stopped']=True
 results.append(row);print(json.dumps({'case':name,'callback':row.get('callback_observed'),'error':row.get('error')}),flush=True)
(OUT/'RESULT.json').write_text(json.dumps({'binary':BIN,'results':results,'experimental_model_calls':0,'turn_start_calls':0,'credentials_used':False},indent=2)+'\n')
