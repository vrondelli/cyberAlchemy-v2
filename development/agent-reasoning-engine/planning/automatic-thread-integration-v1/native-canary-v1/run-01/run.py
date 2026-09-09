import json,os,subprocess,threading,queue,time,hashlib
from pathlib import Path
OUT=Path(__file__).resolve().parent
WS=Path(json.loads((OUT/'WORKSPACE.json').read_text())['path'])
BIN='/mnt/c/Users/vlad_/.codex/bin/wsl/fea8d57830aac904/codex'
COUNT=OUT/'TURN-COUNT.json'
if COUNT.exists():raise SystemExit('This attempt already reserved turns; no rerun allowed.')
report={'status':'PREFLIGHT','turns_submitted':0,'turns':[],'model':'gpt-5.6-luna','auth_type':None,'activation':False}
def save(): (OUT/'RESULT.json').write_text(json.dumps(report,indent=2)+'\n')
save()
args=[BIN,'--dangerously-bypass-hook-trust','app-server','-c','projects.'+json.dumps(str(WS))+'.trust_level="trusted"','-c','model="gpt-5.6-luna"','-c','model_reasoning_effort="low"','-c','service_tier="default"']
env=os.environ.copy()
env['CODEX_HOME']=str(WS/'codex-home')
for k in ['OPENAI_API_KEY','CODEX_API_KEY']:env.pop(k,None)
p=subprocess.Popen(args,cwd=WS,env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=open(WS/'server.stderr','w'),text=True,bufsize=1)
q=queue.Queue();seq=0;notifications=[]
def reader():
 for line in p.stdout:
  try:q.put(json.loads(line))
  except Exception:q.put({'parse_error':True})
 q.put({'ended':True})
threading.Thread(target=reader,daemon=True).start()
def emit(x):p.stdin.write(json.dumps(x)+'\n');p.stdin.flush()
def take(deadline):
 r=q.get(timeout=max(.01,deadline-time.monotonic()))
 if 'ended' in r:raise RuntimeError('app-server-exited')
 if 'method' in r:
  notifications.append(r)
  # A model tool request is outside this canary's text-only envelope.
  if 'id' in r:raise RuntimeError('unexpected-server-request:'+r['method'])
 return r
def rpc(method,params):
 global seq
 seq+=1;i=seq;emit({'id':i,'method':method,'params':params});deadline=time.monotonic()+30
 while True:
  r=take(deadline)
  if r.get('id')==i:
   if 'error' in r:raise RuntimeError(method+':'+json.dumps(r['error']))
   return r['result']
def callbacks():
 f=WS/'callbacks.jsonl';return [json.loads(x) for x in f.read_text().splitlines()] if f.exists() else []
try:
 rpc('initialize',{'clientInfo':{'name':'are_canary','version':'0.1'},'capabilities':{'experimentalApi':True}});emit({'method':'initialized'})
 account=rpc('account/read',{'refreshToken':False}).get('account',{});report['auth_type']=account.get('type');assert report['auth_type']=='chatgpt','ChatGPT login required'
 models=rpc('model/list',{'includeHidden':True})['data'];assert any(m['model']=='gpt-5.6-luna' for m in models),'Luna unavailable'
 hooks=rpc('hooks/list',{'cwds':[str(WS)]});(OUT/'HOOK-DISCOVERY.json').write_text(json.dumps(hooks,indent=2)+'\n');print('HOOK_DISCOVERY',json.dumps(hooks),flush=True)
 # Require exactly the intended three command strings, no extra hook commands.
 def commands(x):
  if isinstance(x,dict):
   for k,v in x.items():
    if k=='command' and isinstance(v,str):yield v
    else:yield from commands(v)
  elif isinstance(x,list):
   for v in x:yield from commands(v)
 cmds=list(commands(hooks));assert len(cmds)==3 and set(cmds)=={'/usr/bin/python3 '+str(WS/'hook.py')},'Unexpected or missing hook commands'
 th=rpc('thread/start',{'model':'gpt-5.6-luna','allowProviderModelFallback':False,'cwd':str(WS),'approvalPolicy':'never','sandbox':'read-only','historyMode':'legacy','experimentalRawEvents':True,'baseInstructions':'You are a text-only test assistant. Never call tools, delegate, browse or edit files. Answer in at most 80 words. Lines starting /are are interpreted by a local test adapter; briefly acknowledge them. Follow current user requests. When asked for a source_digest, report it only if supplied in scoped preference context; otherwise say absent.','config':{'model_reasoning_effort':'low','service_tier':'default'}})
 thread=th['thread'];tid=thread['id'];report['thread_id']=tid;report['actual_model']=th.get('model');assert th.get('model')=='gpt-5.6-luna','Wrong model'
 transcript=thread.get('path');assert isinstance(transcript,str) and transcript,'Native transcript path missing'
 (WS/'binding.json').write_text(json.dumps({'mode':'isolated-prototype','session_id':tid,'cwd':str(WS),'transcript_path':transcript,'participant_ref':'canary:chatgpt-user','product_ref':'canary:are-hook','log_path':str(WS/'ledger.jsonl')}))
 report['transcript_path']=transcript;save();print('READY',tid,flush=True)
 prompts=['Explain a cache briefly.','/are mode apply-scoped','/are learn examples','Explain a cache briefly. Also report the source_digest from the current scoped preference context, or absent if none is present.']
 for number,prompt in enumerate(prompts,1):
  assert number<=4
  report['turns_submitted']=number;COUNT.write_text(json.dumps({'reserved_turns':number,'limit':4})+'\n');save()
  offset=len(notifications)
  t=rpc('turn/start',{'threadId':tid,'model':'gpt-5.6-luna','effort':'low','serviceTierForTurn':'default','input':[{'type':'text','text':prompt}],'clientUserMessageId':'canary-'+str(number)})['turn'];turnid=t['id']
  deadline=time.monotonic()+90;done=None
  while done is None:
   for n in notifications[offset:]:
    if n.get('method')=='turn/completed' and n.get('params',{}).get('turn',{}).get('id')==turnid:done=n;break
   if done is None:take(deadline)
  status=done['params']['turn']['status'];assert status=='completed','Turn did not complete: '+status
  c=[x for x in callbacks() if x.get('turn')==turnid and x.get('phase')=='output']
  assert len(c)==2 and {x['event'] for x in c}=={'UserPromptSubmit','Stop'},'Native prompt/completion callbacks missing'
  assert all(x['status']==0 for x in c),'Hook failed: '+json.dumps(c)
  outputs=[n['params']['item'].get('text','') for n in notifications[offset:] if n.get('method')=='item/completed' and n.get('params',{}).get('item',{}).get('type')=='agentMessage']
  context=json.loads(next(x['output'] for x in c if x['event']=='UserPromptSubmit')).get('hookSpecificOutput',{}).get('additionalContext','')
  row={'number':number,'turn_id':turnid,'status':status,'prompt':prompt,'response':'\n'.join(outputs),'context':context,'callbacks_ok':True};report['turns'].append(row);save();print('TURN',number,'COMPLETE',row['response'][:160],flush=True)
  if number==4:
   assert context,'No retained guidance on final turn'
   data=json.loads(context.split('\n',1)[1]);expected=data[0]['source_digest'];report['model_reported_hook_only_digest']=expected in row['response'];assert report['model_reported_hook_only_digest'],'Model did not report hook-only digest'
 report['status']='PASS_BOUNDED_NATIVE_CANARY';report['claim_ceiling']='Native callback and model echo evidence; not raw outbound network capture, general learning benefit, or desktop activation.'
except Exception as error:
 report['status']='FAIL' if report['turns_submitted'] else 'BLOCKED_PREFLIGHT';report['error']=str(error) or type(error).__name__;print('STOP',report['status'],report['error'],flush=True)
finally:
 save()
 if p.poll() is None:p.terminate()
 try:p.wait(timeout=10)
 except subprocess.TimeoutExpired:p.kill();p.wait()
 # Retain only this canary's callbacks and selected notifications, no account credentials.
 if (WS/'callbacks.jsonl').exists():(OUT/'CALLBACKS.jsonl').write_bytes((WS/'callbacks.jsonl').read_bytes())
 selected=[n for n in notifications if n.get('method') in ['turn/completed','thread/tokenUsage/updated','item/completed']]
 (OUT/'EVENTS.json').write_text(json.dumps(selected,indent=2)+'\n')
