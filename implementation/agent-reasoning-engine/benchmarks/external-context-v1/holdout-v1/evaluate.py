"""Bounded container evaluator using upstream task commands/parser. Open questions: README.md."""
import json,subprocess,pathlib,sys,time,hashlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent))
from score import score
cache,mode,outdir,taskdir=sys.argv[1:5]
taskdir=pathlib.Path(taskdir)
assert mode in ("base","gold","candidate")
raw=(pathlib.Path(cache)/'evaluator-task.json').read_bytes()
source=json.loads((taskdir/'source.json').read_text())
assert hashlib.sha256(raw).hexdigest()==source['evaluator_task_sha256'],'evaluator input drift'
row=json.loads(raw)
out=pathlib.Path(outdir);out.mkdir(parents=True,exist_ok=False)
name='are103-eval-'+mode+'-'+str(time.time_ns())
image=json.loads((taskdir/'image.json').read_text())['id']
def run(args,input=None,timeout=600):
 return subprocess.run(args,input=input,text=True,capture_output=True,timeout=timeout)
def command(cmd):return run(['docker','exec','-i',name,'bash','-lc',cmd])
report={'mode':mode,'instance_id':row['instance_id'],'status':'started','resolved':None,'cleanup_verified':False}
try:
 r=run(['docker','run','-d','--name',name,'--network','none','--cpus','2','--memory','4g','--pids-limit','1024','--cap-drop','ALL','--security-opt','no-new-privileges','--workdir','/testbed','--entrypoint','sleep',image,'infinity']);assert r.returncode==0,r.stderr
 r=command('git rev-parse HEAD');assert r.returncode==0 and r.stdout.strip()==row['base_commit'],'image base mismatch'
 patches=[row['test_patch']]
 if mode=='gold':patches.append(row['patch'])
 elif mode!='base':patches.append(pathlib.Path(sys.argv[5]).read_text())
 for i,patch in enumerate(patches):
  if patch.strip():
   r=run(['docker','exec','-i',name,'git','apply','--whitespace=nowarn','-'],input=patch);(out/f'apply-{i}.log').write_text(r.stdout+r.stderr);assert r.returncode==0,'patch application failed'
 for i,cmd in enumerate(row['rebuild_cmds']):
  r=command('cd /testbed && '+cmd);(out/f'build-{i}.log').write_text(r.stdout+r.stderr);report[f'build_{i}_exit']=r.returncode
  if r.returncode:raise RuntimeError('rebuild failed')
 for i,cmd in enumerate(row['test_cmds']):
  effective='pnpm exec vitest run --reporter=verbose --maxWorkers=2 --minWorkers=1 --testTimeout=30000' if cmd=='pnpm test -- --reporter=verbose 2>&1 | tee vitest-output.log' else cmd
  if effective!=cmd:effective+=' 2>&1 | tee vitest-output.log'
  report['effective_test_command']=effective
  r=command('cd /testbed && '+effective);(out/f'test-{i}.log').write_text(r.stdout+r.stderr);report[f'test_{i}_exit']=r.returncode
 log=''
 for cmd in row['print_cmds']:
  r=command('cd /testbed && '+cmd);assert r.returncode==0,'log collection failed';log+=r.stdout
 (out/'test-output.log').write_text(log)
 code=row['log_parser']+'\nimport json,sys\nprint(json.dumps(parser(sys.stdin.read())))\n'
 r=run(['docker','exec','-i',name,'sh','-c','cat > /tmp/are-parser.py'],input=code);assert r.returncode==0
 r=run(['docker','exec','-i',name,'python3','/tmp/are-parser.py'],input=log,timeout=30);assert r.returncode==0,'parser failed'
 statuses=json.loads(r.stdout);(out/'status.json').write_text(json.dumps(statuses,indent=2))
 report.update(status='scored',**score(row,statuses))
except Exception as e:report.update(status='evaluation_error',error=type(e).__name__+': '+str(e)[:1000])
finally:
 run(['docker','rm','-f',name],timeout=30)
 check=run(['docker','container','ls','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],timeout=30)
 report['cleanup_verified']=check.returncode==0 and not check.stdout.strip()
 report['authority_effect']='none';report['open_questions_ref']='../../PLAN.md'
 (out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
