import json,pathlib,subprocess,os,hashlib,time,shutil
repo=pathlib.Path('/home/vrondelli/projects/cyberAlchemy-v2')
base=repo/'implementation/agent-reasoning-engine'
raw=pathlib.Path('/tmp/are-glm-headroom-tuning-01')
out=base/'benchmarks/glm-episodes-v1/evidence/headroom-generalization-2026-09-07/tuning-01'
raw.mkdir(exist_ok=False);out.mkdir(exist_ok=False)
node='/home/vrondelli/.local/bin/node'
sources=json.loads(pathlib.Path('/tmp/are-headroom-sources.json').read_text())
def save(path,data):path.write_text(json.dumps(data,indent=2)+'\n')
def check_sources():
 for s in sources:
  if hashlib.sha256(pathlib.Path(s['path']).read_bytes()).hexdigest()!=s['sha256']:raise RuntimeError('frozen-source-drift')
schedule=[]
for rep,limits in enumerate([[8000],[8000]],1):
 for position,limit in enumerate(limits):
  policies=['clear-v1','recent-observations-v2'] if (rep+position)%2 else ['recent-observations-v2','clear-v1']
  for policy in policies:schedule.append({'index':len(schedule),'repetition':rep,'episode':'retention-tool-pairs','policy':policy,'soft_limit':limit})
manifest={'authority_effect':'none','schedule':schedule,'sources':sources,'model':'glm-5.3-flash','completion_policy':'deduplicated-state-v6','delivery_policy':'bounded-reads-v1','source_policy':'inspected-mutation-v1','soft_limits':[8000],'hard_limit':16384,'maximum_model_attempts':48,'maximum_tokenizer_attempts':96,'per_arm_timeout_ms':580000,'automatic_retries':0,'failure_replacement':False,'open_questions_ref':'README.md#open-questions'}
save(out/'manifest.json',manifest);save(raw/'manifest.json',manifest)
shutil.copyfile('/tmp/are-headroom-PLAN.md',out/'PLAN.md')
shutil.copyfile('/tmp/run-are-headroom-tuning-01.py',out/'driver.py')
shutil.copyfile('/tmp/are-headroom-effect.json',out/'effect.json')
shutil.copyfile('/tmp/are-headroom-tests.tap',out/'prior-tests.tap')
env=dict(os.environ,PATH='/home/vrondelli/.local/bin:'+os.environ['PATH'],ARE_SECRET_PYTHON='/usr/bin/python3',ARE_SECRET_PROJECT='/home/vrondelli/projects/domainspec-core/projects/secret-management')
results=[];tasks={};stopped=None;started=time.monotonic()
for item in schedule:
 try:
  check_sources()
  if time.monotonic()-started>3960:raise RuntimeError('experiment-time-limit')
  name=f"trial-{item['index']:02d}";directory=raw/name;dest=out/name;dest.mkdir()
  save(dest/'started.json',{**item,'started_at_utc':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'authority_effect':'none'})
  print(json.dumps({'status':'STARTED',**item}),flush=True)
  cmd=[node,str(base/'benchmarks/glm-episodes-v1/runner.mjs'),'--credential','/home/vrondelli/.config/are/glm-flash-credential.json','--output-directory',str(directory),'--episode',item['episode'],'--retention-policy',item['policy'],'--delivery-policy','bounded-reads-v1','--completion-policy','deduplicated-state-v6','--source-policy','inspected-mutation-v1','--soft-limit',str(item['soft_limit'])]
  with (raw/(name+'.log')).open('w') as log:proc=subprocess.run(cmd,cwd=repo,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=660)
  check_sources()
  report=subprocess.run([node,str(base/'benchmarks/glm-episodes-v1/report.mjs'),str(directory)],cwd=repo,env=env,capture_output=True,text=True)
  if report.returncode:raise RuntimeError('trial-report-invalid:'+report.stderr.strip())
  checked=json.loads(report.stdout)
  if checked['context_policy']['recycle_at']!=item['soft_limit']:raise RuntimeError('trial-context-mismatch')
  save(dest/'checked-report.json',checked)
  for filename in ['manifest.json','result.json']:shutil.copyfile(directory/filename,dest/filename)
  m=json.loads((directory/'manifest.json').read_text())
  if m['sources']!=sources:raise RuntimeError('trial-source-snapshot-mismatch')
  task=m['arms'][0]['task']
  if item['episode'] in tasks and task!=tasks[item['episode']]:raise RuntimeError('trial-task-drift')
  tasks[item['episode']]=task
  r=json.loads((directory/'result.json').read_text())
  for arm in r['arms']:
   armraw=pathlib.Path(arm['directory']);armout=dest/'arm-0';armout.mkdir()
   shutil.copyfile(armraw/'completed.json',armout/'completed.json')
   data=(armraw/'agent-result.json').read_bytes();a=json.loads(data)
   visible={k:a.get(k) for k in ['status','reason_codes','retention_policy','delivery_policy','completion_policy','source_policy','last_confirmed_source_pins','delivery_progress','candidate_validation','final_response_evidence','last_model_response_evidence','receipts','recycling']}
   visible['history']=[{k:h[k] for k in ['calls','observations','receipt','elapsed_ms','delivered_call_ids','source_pin_refs'] if k in h} for h in a['history']]
   visible.update(original_agent_result_file_sha256=hashlib.sha256(data).hexdigest(),authority_effect='none',open_questions_ref='../../README.md#open-questions')
   save(armout/'visible-trace.json',visible)
   if a.get('candidate'):save(armout/'candidate.json',a['candidate'])
  trial={**item,'runner_exit_code':proc.returncode,'report':checked}
  results.append(trial)
  if sum(x['report']['totals']['model_attempts'] or 0 for x in results)>48 or sum(x['report']['totals']['tokenizer_attempts'] or 0 for x in results)>96:raise RuntimeError('experiment-call-cap')
  save(out/'progress.json',{'authority_effect':'none','completed':len(results),'planned':4,'trials':results,'open_questions_ref':'README.md#open-questions'})
  a=checked['arms'][0]
  print(json.dumps({'status':'FINISHED',**item,'repair':a.get('verified_repair'),'continuity':a.get('continuity',{}).get('passed'),'reasons':a.get('reasons',[]),'model_attempts':checked['totals']['model_attempts'],'tokenizer_attempts':checked['totals']['tokenizer_attempts']}),flush=True)
 except Exception as exc:
  stopped=str(exc);print(json.dumps({'status':'EXPERIMENT_STOPPED','index':item['index'],'reason':stopped}),flush=True);break
save(out/'result.json',{'authority_effect':'none','status':'COMPLETED' if len(results)==4 else 'STOPPED','completed':len(results),'planned':4,'reason':stopped,'elapsed_ms':round((time.monotonic()-started)*1000),'trials':results,'open_questions_ref':'README.md#open-questions'})
print(json.dumps({'status':'EXPERIMENT_DONE','completed':len(results),'planned':4,'reason':stopped}),flush=True)
