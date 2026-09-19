"""Fixed prospective eight-outcome VPS pilot. Open questions: PLAN.json.
Run-owned paths only; paid stages never resume or retry. No benchmark gold mounted.
"""
import concurrent.futures,hashlib,json,pathlib,shutil,subprocess,time,os
ROOT=pathlib.Path('/opt/are-harness-benchmark/output-74')
IMAGE='sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385'
C='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
SECRET='/opt/are-keld-presentation/secrets/model_api_key'
def save(path,value):
 with path.open('x') as f:json.dump(value,f,indent=2);f.flush();os.fsync(f.fileno())
 fd=os.open(path.parent,os.O_RDONLY);os.fsync(fd);os.close(fd)
def command(cmd,**kw):return subprocess.run(cmd,check=True,timeout=120,**kw)
def capacity():
 if shutil.disk_usage(ROOT).free<8*1024**3:raise RuntimeError('host-free-space-reserve')
def common(name):return ['docker','run','--name',name,'--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--cpus','1','--memory','2g','--pids-limit','128','--log-opt','max-size=8m','--log-opt','max-file=1','--tmpfs','/tmp:rw,nosuid,nodev,size=128m']
def settled(name):
 p=subprocess.run(['docker','inspect','--format','{{json .State}}',name],capture_output=True,text=True,timeout=30)
 return json.loads(p.stdout) if p.returncode==0 else {'missing':True}
def run(slot):
 task_id,arm=slot['task_id'],slot['arm'];r=ROOT/'runs'/slot['id'];r.mkdir();capacity();start=time.time();name='are-out74-'+slot['id'];proxy=None;code=None;failure=None
 save(r/'STARTED.json',{'slot':slot,'started_unix':start})
 try:
  for n in ['evidence','sources']:(r/n).mkdir()
  if arm=='current-are':
   os.chown(r/'evidence',65532,65532);os.chown(r/'sources',65532,65532)
   cmd=common(name)+['--user','65532:65532','-e','GIT_CONFIG_GLOBAL=/repo/are-gitconfig','-v',str(ROOT)+':/repo:ro','-v','/opt/are-harness-benchmark/paired-pilot-63/cache:/cache:ro','-v',str(r/'evidence')+':/evidence','-v',str(r/'sources')+':/sources','-v',SECRET+':/run/secrets/model_api_key:ro',IMAGE,'node','/repo/'+C+'/deepseek-pilot-are-worker.mjs',task_id]
  else:
   task=json.loads((ROOT/'tasks'/(task_id+'.json')).read_text())
   for n in ['base','work']:
    command(['git','clone','--no-local','--no-checkout',str(ROOT/'cache'/task_id),str(r/'sources'/n)],capture_output=True)
    command(['git','-C',str(r/'sources'/n),'checkout','--detach',task['base_commit']],capture_output=True)
   for n in ['state','tools','transport']:(r/n).mkdir()
   os.chown(r/'transport',65532,65532);proxy=name+'-proxy'
   profile=(ROOT/'profile-template.patch.yml').read_text().replace('are-dsh-profile-60',proxy).replace('0d8c794d2ac7acc171ea7741c71100391cf70faf',task['base_commit'])
   (r/'profile.patch.yml').write_text(profile)
   pcmd=common(proxy)+['-d','-e','OUTPUT_CAP=8192','-e','CONTEXT_WINDOW=1000000','-e','TOKEN_BUDGET=4000000','-e','MAX_REQUEST_BYTES=33554432','-e','MAX_STAGE_BYTES=536870912','--user','65532:65532','-v',str(ROOT)+':/repo:ro','-v',str(r/'transport')+':/evidence','-v',SECRET+':/run/secrets/model_api_key:ro',IMAGE,'node','/repo/'+C+'/deepseek-transport-server.mjs']
   save(r/'PROXY-COMMAND.json',pcmd);command(pcmd,capture_output=True);command(['docker','network','connect','are-dsh-canary',proxy],capture_output=True)
   prompt=task['problem_statement']+'\n\nInvestigate this issue and attempt a patch using the repository tools. Finish by calling submit_context_selection with a concise summary and the pinned-base source read IDs used. Report inability honestly. Source-selection scores do not prove patch correctness.'
   cmd=common(name)+['--network','are-dsh-canary','-e','HOME=/tmp','-e','DSH_HOME=/state','-e','CANARY_PLACEHOLDER=benchmark-no-secret','-v','/opt/are-harness-benchmark/dsh-0.1.5-rc.2:/dsh:ro','-v',str(ROOT)+':/repo:ro','-v',str(r/'state')+':/state','-v',str(r/'sources/base')+':/base:ro','-v',str(r/'sources/work')+':/work','-v',str(r/'tools')+':/evidence','-w','/work',IMAGE,'node','/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js','--profile','headless','--patch','/repo/runs/'+slot['id']+'/profile.patch.yml',prompt]
  save(r/'COMMAND.json',cmd)
  with (r/'stdout.txt').open('x') as out,(r/'stderr.txt').open('x') as err:
   try:code=subprocess.run(cmd,stdout=out,stderr=err,timeout=1800).returncode
   except subprocess.TimeoutExpired:
    subprocess.run(['docker','stop','--time','30',name],capture_output=True,timeout=45);code=124
 except Exception as e:failure=type(e).__name__+': '+str(e)[:300]
 finally:
  if settled(name).get('Running'):subprocess.run(['docker','stop','--time','30',name],capture_output=True,timeout=45)
  if proxy and settled(proxy).get('Running'):subprocess.run(['docker','stop','--time','30',proxy],capture_output=True,timeout=45)
  result={'slot':slot,'harness_exit':code,'failure':failure,'elapsed_seconds':time.time()-start,'harness_state':settled(name),'proxy_state':settled(proxy) if proxy else None,'scoring_pending':True,'benchmark_cleared':False}
  save(r/'SETTLEMENT.json',result);print(json.dumps({'slot':slot['id'],'exit':code,'failure':failure}),flush=True)
 return result
if __name__=='__main__':
 capacity();review=json.loads((ROOT/'REVIEW.json').read_text());assert review['dispatch_ready'] is True
 freeze=json.loads((ROOT/'FREEZE.json').read_text())
 for b in freeze['bindings']:assert hashlib.sha256((ROOT/b['path']).read_bytes()).hexdigest()==b['sha256'],b['path']
 save(ROOT/'CAMPAIGN-STARTED.json',{'started_unix':time.time(),'freeze_sha256':hashlib.sha256((ROOT/'FREEZE.json').read_bytes()).hexdigest()})
 slots=[]
 for i in range(1,5):
  order=['deepseek-harness-adapted','current-are'] if i%2 else ['current-are','deepseek-harness-adapted']
  for arm in order:slots.append({'id':str(i)+'-'+('dsh' if arm.startswith('deepseek') else 'are'),'task_id':'contextbench-'+str(i),'arm':arm})
 results=[]
 # Two arms of each pair concurrently; no extra model workers.
 # Every assigned outcome is retained, including legitimate task failures.
 for i in range(0,8,2):
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results.extend(pool.map(run,slots[i:i+2]))
 save(ROOT/'CAMPAIGN-SETTLEMENT.json',{'outcomes':results,'all_assigned':len(results)==8,'benchmark_cleared':False})
