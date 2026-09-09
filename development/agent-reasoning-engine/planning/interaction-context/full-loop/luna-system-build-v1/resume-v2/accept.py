"""Independent black-box acceptance: invoke inside the isolated bwrap namespace."""
import contextlib,json,os,pathlib,select,subprocess,sys,tempfile,time,urllib.request,urllib.error,signal
from startup import read_startup
CAND=pathlib.Path(sys.argv[1]);PHASE=int(sys.argv[2]);NODE=sys.argv[3];DATA=pathlib.Path(sys.argv[4]);DATA.mkdir(parents=True,exist_ok=True)
BASE={'product_id':'p1','participant_id':'u1'}
LEGACY=json.loads(pathlib.Path(sys.argv[5]).read_text()) if len(sys.argv)>5 else None
MIGRATION_FIXTURE=None
def args(script):return [NODE,'--no-warnings','--permission','--allow-fs-read='+str(CAND),'--allow-fs-read='+str(DATA),'--allow-fs-write='+str(DATA),'--allow-net','--max-old-space-size=128',str(CAND/script)]
def cli(store,command,value):
 p=subprocess.run(args('src/cli.mjs')+['--store',str(store),command,'--json',json.dumps(value)],capture_output=True,text=True,timeout=8)
 return p,json.loads(p.stdout if p.returncode==0 else p.stderr)
@contextlib.contextmanager
def server(store):
 p=subprocess.Popen(args('src/server.mjs')+['--store',str(store),'--port','0'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 try:
  line=read_startup(p)
  port=json.loads(line)['port'];assert isinstance(port,int) and port>0
  def request(method,path,data=None,raw=None):
   body=raw if raw is not None else None if data is None else json.dumps(data).encode()
   req=urllib.request.Request('http://127.0.0.1:'+str(port)+path,data=body,method=method,headers={'Content-Type':'application/json'})
   try:
    with urllib.request.urlopen(req,timeout=4) as response:return response.status,json.load(response)
   except urllib.error.HTTPError as error:return error.code,json.load(error)
  yield request
 finally:
  p.terminate()
  try:p.wait(timeout=2)
  except subprocess.TimeoutExpired:p.kill();p.wait()
  p.stdout.close();p.stderr.close()
def lesson(id='a',**kw):return {**BASE,'lesson_id':id,'instruction':'Use plain words','source_ref':'source:1','conditions':['operational'],'exclusions':['literal'],**kw}
def create(q,id='a',**kw):
 code,r=q('POST','/lessons',lesson(id,**kw));assert code==201,(code,r);return r['lesson']
def explain(q,**kw):
 code,r=q('POST','/explain',{**BASE,'text':'OPERATIONAL context',**kw});assert code==200,(code,r);return r
def scope_path(route,**kw):
 from urllib.parse import urlencode
 return route+'?'+urlencode({**BASE,**kw})
checks=[]
def check(name,fn):
 def expired(*_):raise TimeoutError('individual acceptance check exceeded 15 seconds')
 before=signal.signal(signal.SIGALRM,expired);signal.setitimer(signal.ITIMER_REAL,15)
 print('START '+name,file=sys.stderr,flush=True)
 try:fn();checks.append({'id':name,'status':'PASS'})
 except Exception as e:checks.append({'id':name,'status':'FAIL','error':str(e)[:2200] or type(e).__name__})
 finally:signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,before)
 print(json.dumps(checks[-1]),file=sys.stderr,flush=True)
def fresh(fn):
 def wrapped():
  with tempfile.TemporaryDirectory(dir=DATA) as d:
   with server(pathlib.Path(d)/'store.json') as q:fn(q)
 return wrapped

def basics(q):
 assert q('GET','/health')==(200,{'ok':True,'schema_version':PHASE})
 a=create(q);assert a['revision']==1 and a['disabled'] is False and a['source_ref']=='source:1'
 code,r=q('GET',scope_path('/lessons'));assert code==200 and [l['lesson_id'] for l in r['lessons']]==['a']
check('health-create-list',fresh(basics))
def isolation(q):
 create(q);create(q,product_id='p2');create(q,participant_id='u2')
 assert len(q('GET',scope_path('/lessons'))[1]['lessons'])==1
 assert len(explain(q)['assessments'])==1
 out=q('GET',scope_path('/export'))[1];assert len(out['lessons'])==1 and len(out['events'])==1
 assert q('POST','/lessons/a/disable',{'product_id':'absent','participant_id':'u1','expected_revision':1})[0]==404
check('product-and-participant-isolation',fresh(isolation))
def dispositions(q):
 create(q);r=explain(q);assert len(r['items'])==1 and r['assessments'][0]['disposition']=='applicable'
 assert explain(q,text='operational literal')['assessments'][0]['disposition']=='inapplicable'
 assert explain(q,text='different')['items']==[]
 assert explain(q,invalidated_refs=['source:1'])['assessments'][0]['disposition']=='unsupported'
 assert explain(q,override_ids=['a'])['assessments'][0]['disposition']=='overridden'
 assert len(explain(q)['items'])==1
check('applicability-invalidation-override-transient',fresh(dispositions))
def revision(q):
 create(q);before=q('GET',scope_path('/history',lesson_id='a'))[1]['events']
 code,r=q('POST','/lessons/a/revise',{**BASE,'expected_revision':1,'instruction':'Use examples','source_ref':'source:2'})
 assert code==200 and r['lesson']['revision']==2 and r['lesson']['conditions']==['operational']
 events=q('GET',scope_path('/history',lesson_id='a'))[1]['events'];assert events[:1]==before and len(events)==2
 assert events[1]['kind']=='revised' and events[1]['source_ref']=='source:2'
 assert q('POST','/lessons/a/revise',{**BASE,'expected_revision':1,'instruction':'Wrong','source_ref':'source:x'})[0]==409
 assert len(q('GET',scope_path('/history',lesson_id='a'))[1]['events'])==2
check('revision-cas-and-immutable-history',fresh(revision))
def disabled(q):
 create(q);body={**BASE,'expected_revision':1};assert q('POST','/lessons/a/disable',body)[0]==200
 before=q('GET',scope_path('/history',lesson_id='a'))[1]['events']
 assert q('POST','/lessons/a/disable',body)[0]==200
 assert q('GET',scope_path('/history',lesson_id='a'))[1]['events']==before
 code,r=q('POST','/lessons/a/revise',{**BASE,'expected_revision':1,'instruction':'Revised','source_ref':'source:2'});assert code==200 and r['lesson']['disabled'] is True
 assert explain(q)['assessments'][0]['disposition']=='disabled'
check('disable-idempotency-and-revision-preservation',fresh(disabled))
def errors(q):
 create(q);before=q('GET',scope_path('/export'))[1]
 for method,path,data,expected in [('POST','/lessons',lesson(),409),('POST','/lessons',lesson('b',instruction=''),400),('POST','/lessons',lesson('b',conditions='bad'),400),('POST','/lessons/a/revise',{**BASE,'instruction':'x','source_ref':'s'},400),('GET','/missing',None,404),('GET','/lessons',None,400)]:
  code,r=q(method,path,data);assert code==expected,(method,path,code,expected);assert isinstance(r.get('error',{}).get('code'),str) and isinstance(r['error'].get('message'),str)
 assert q('POST','/lessons',raw=b'{')[0]==400
 assert q('POST','/lessons',raw=b'x'*65537)[0]==413
 assert q('GET',scope_path('/export'))[1]==before
check('errors-size-cap-and-no-failed-write',fresh(errors))
def ordering(q):
 create(q,'z');create(q,'b');create(q,'a')
 out=q('GET',scope_path('/export'))[1];assert out['schema_version']==PHASE
 assert [l['lesson_id'] for l in out['lessons']]==['a','b','z']
 ids=[e['event_id'] for e in out['events']];assert ids==sorted(set(ids)) and all(isinstance(i,int) and i>0 for i in ids)
 assert [a['lesson_id'] for a in explain(q)['assessments']]==['a','b','z']
 assert q('GET',scope_path('/export'))[1]==out
check('deterministic-order-and-event-identity',fresh(ordering))
def persistence_cli():
 global MIGRATION_FIXTURE
 with tempfile.TemporaryDirectory(dir=DATA) as d:
  store=pathlib.Path(d)/'nested/store.json'
  with server(store) as q:create(q);before=q('GET',scope_path('/export'))[1]
  with server(store) as q:assert q('GET',scope_path('/export'))[1]==before
  p,r=cli(store,'list',BASE);assert p.returncode==0 and len(r['lessons'])==1
  p,r=cli(store,'revise',{**BASE,'lesson_id':'a','expected_revision':1,'instruction':'CLI revised','source_ref':'source:cli'});assert p.returncode==0 and r['lesson']['revision']==2
  p,r=cli(store,'explain',{**BASE,'text':'operational'});assert p.returncode==0 and r['items'][0]['instruction']=='CLI revised'
  p,r=cli(store,'history',{**BASE,'lesson_id':'a'});assert p.returncode==0 and len(r['events'])==2
  p,r=cli(store,'export',BASE);assert p.returncode==0 and r['schema_version']==PHASE
  p,r=cli(store,'disable',{**BASE,'lesson_id':'a','expected_revision':2});assert p.returncode==0 and r['lesson']['disabled']
  with server(store) as q:assert explain(q)['items']==[]
  MIGRATION_FIXTURE=json.loads(store.read_text())
check('restart-and-cli-http-interoperation',persistence_cli)
def cli_create_error():
 with tempfile.TemporaryDirectory(dir=DATA) as d:
  store=pathlib.Path(d)/'store.json';p,r=cli(store,'create',lesson());assert p.returncode==0 and r['lesson']['revision']==1
  before=store.read_bytes();p,r=cli(store,'create',lesson());assert p.returncode!=0 and 'error' in r and store.read_bytes()==before
  p=subprocess.run(args('src/cli.mjs')+['--help'],capture_output=True,text=True,timeout=5);assert p.returncode==0 and 'explain' in p.stdout
check('cli-create-errors-and-help',cli_create_error)
def corruption():
 with tempfile.TemporaryDirectory(dir=DATA) as d:
  store=pathlib.Path(d)/'store.json';store.write_text('{broken');before=store.read_bytes()
  p=subprocess.run(args('src/cli.mjs')+['--store',str(store),'list','--json',json.dumps(BASE)],capture_output=True,text=True,timeout=5);assert p.returncode!=0 and store.read_bytes()==before
  p=subprocess.Popen(args('src/server.mjs')+['--store',str(store),'--port','0'],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  try:code=p.wait(timeout=5);assert code!=0 and store.read_bytes()==before
  finally:
   if p.poll() is None:p.kill();p.wait()
check('corrupt-store-fails-without-overwrite',corruption)
def review_validation(q):
 create(q)
 for value in [None,True,3,'invalid',[]]:
  assert q('POST','/lessons/a/revise',raw=json.dumps(value).encode())[0]==400
check('nonobject-revision-body-validation',fresh(review_validation))
def missing_history(q):
 create(q);assert q('GET',scope_path('/history',lesson_id='absent'))[0]==404
check('missing-scoped-history',fresh(missing_history))
if PHASE==2:
 def expiry(q):
  a=create(q,expires_at=100);assert a['expires_at']==100
  assert len(explain(q,now=99)['items'])==1
  assert explain(q,now=100)['assessments'][0]['disposition']=='expired'
  assert explain(q,now=101,override_ids=['a'])['assessments'][0]['disposition']=='expired'
  assert len(q('GET',scope_path('/lessons'))[1]['lessons'])==1
  assert len(q('GET',scope_path('/history',lesson_id='a'))[1]['events'])==1
 check('expiry-boundary-and-projection-only',fresh(expiry))
 def expiry_revision(q):
  create(q,expires_at=100)
  code,r=q('POST','/lessons/a/revise',{**BASE,'expected_revision':1,'instruction':'revised','source_ref':'source:2'});assert code==200 and r['lesson']['expires_at']==100
  code,r=q('POST','/lessons/a/revise',{**BASE,'expected_revision':2,'instruction':'cleared','source_ref':'source:3','expires_at':None});assert code==200 and r['lesson']['expires_at'] is None
  assert len(explain(q,now=1000)['items'])==1
  q('POST','/lessons/a/disable',{**BASE,'expected_revision':3});assert explain(q,now=1000)['assessments'][0]['disposition']=='disabled'
 check('expiry-revision-preserve-and-clear',fresh(expiry_revision))
 def expiry_validation(q):
  for bad in [-1,1.5,'tomorrow',True,9007199254740992]:assert q('POST','/lessons',lesson(expires_at=bad))[0]==400,bad
  create(q);assert q('POST','/explain',{**BASE,'text':'operational','now':-1})[0]==400
 check('expiry-types-and-clock-validation',fresh(expiry_validation))
 def migration():
  with tempfile.TemporaryDirectory(dir=DATA) as d:
   assert LEGACY is not None,'No usable v1 store fixture; migration not evaluable'
   store=pathlib.Path(d)/'old.json';store.write_text(json.dumps(LEGACY))
   oldevents=LEGACY['events'];oldlessons=LEGACY['lessons']
   for _ in range(2):
    with server(store) as q:
     out=q('GET',scope_path('/export'))[1];assert out['schema_version']==2
     actual=json.loads(store.read_text());assert actual['events']==oldevents
     assert actual['lessons']==[{**l,'expires_at':None} for l in oldlessons]
   assert json.loads(store.read_text())['schema_version']==2
 check('v1-migration-history-and-repeat-open',migration)
 def expiry_cli():
  with tempfile.TemporaryDirectory(dir=DATA) as d:
   store=pathlib.Path(d)/'store.json';p,r=cli(store,'create',lesson(expires_at=5));assert p.returncode==0 and r['lesson']['expires_at']==5
   p,r=cli(store,'explain',{**BASE,'text':'operational','now':5});assert p.returncode==0 and r['assessments'][0]['disposition']=='expired'
 check('expiry-cli-parity',expiry_cli)
# Candidate-authored tests are supplementary and cannot replace independent acceptance.
files=list((CAND/'test').glob('*.test.mjs')) if (CAND/'test').exists() else []
modeltests={'status':'MISSING'}
if files:
 try:
  p=subprocess.run([NODE,'--no-warnings','--permission','--allow-fs-read='+str(CAND),'--allow-fs-read='+str(DATA),'--allow-fs-write='+str(DATA),'--allow-net','--test-isolation=none','--input-type=module','-e','for (const p of '+json.dumps([f.as_uri() for f in files])+') await import(p);'],cwd=CAND,capture_output=True,text=True,timeout=20,env={**os.environ,'TMPDIR':str(DATA)})
  modeltests={'status':'PASS' if p.returncode==0 else 'FAIL','exit_code':p.returncode,'output':(p.stdout+p.stderr)[-4500:]}
 except Exception as e:modeltests={'status':'FAIL','error':str(e)}
print(json.dumps({'phase':PHASE,'passed':sum(x['status']=='PASS' for x in checks),'total':len(checks),'checks':checks,'model_tests':modeltests,'migration_fixture':MIGRATION_FIXTURE if PHASE==1 else None}))
