import sys, pathlib, tempfile, sqlite3, threading, time, json, dataclasses, hashlib
ROOT=pathlib.Path('/home/vrondelli/projects/domainspec-core')
BASE=ROOT/'projects/domainspec-v2/development/completion-dag/v1/evidence'
sys.path.insert(0,str(BASE/'r03-recovery-v1'))
from test_store import Store, StoreFailure, Clock, fixture, dump, reference, canonical
rows=json.loads((BASE/'r07-recovery-v1/source-manifest.json').read_text())['files']
def hashes():return {r['path']:hashlib.sha256((ROOT/r['path']).read_bytes()).hexdigest() for r in rows}
before=hashes(); assert all(before[r['path']]==r['sha256'] for r in rows)
reports=[]
with tempfile.TemporaryDirectory(prefix='r08-review-probe-') as tmp:
 path=pathlib.Path(tmp)/'coordination.sqlite'; clock=Clock(); s=Store.initialize(path,'coordination',clock)
 intent,bindings=fixture(); s.register('register','dispatch',intent,bindings)
 # A valid alternative plan for the same failure, not merely an invalid digest.
 d=reference.plan_workflow_recovery(workflow_id='flow',workflow_execution_id='run',failure_occurrence_id='failure',failed_step_id='ship',completed_step_ids=('reserve','charge'),orchestrated_operation_ids=('release','refund-alternative'),mappings=(reference.RecoveryOperationMapping('reserve','release'),reference.RecoveryOperationMapping('charge','refund-alternative')))
 changed=json.loads(canonical(dataclasses.asdict(d.recovery_intent)))
 changed_bindings=[{**bindings[i],'occurrence_id':e['plan_occurrence_id']} for i,e in enumerate(changed['plan'])]
 snapshot=dump(path)
 try:s.register('changed-plan','dispatch',changed,changed_bindings);raise AssertionError('accepted changed plan')
 except StoreFailure as e:assert e.code=='DUPLICATE_FAILURE_MISMATCH'; reports.append({'probe':'valid-changed-plan','result':'PASS','code':e.code,'original_plan_digest':intent['plan_digest'],'changed_plan_digest':changed['plan_digest']})
 assert dump(path)==snapshot
 authority=s.acquire('acquire','dispatch',0,'claim','worker','lease')['authority']
 snapshot=dump(path)
 class Expiring(Store):
  def _before_commit(self):clock.now=5000
 try:Expiring(path,'coordination',clock).start('expired','dispatch',1,authority,'expired-attempt');raise AssertionError('accepted expiry')
 except StoreFailure as e:assert e.code=='LEASE_EXPIRED'; reports.append({'probe':'expiry-at-precommit-check','result':'PASS','code':e.code})
 assert dump(path)==snapshot
 # A reader blocks COMMIT after the final authorization check. Trace only observes SQL.
 clock.now=4999; entered=threading.Event(); reader_ready=threading.Event(); errors=[]
 class Traced(Store):
  def _connect(self,writable=False):
   con=super()._connect(writable)
   if writable:con.set_trace_callback(lambda sql:entered.set() if sql=='COMMIT' else None)
   return con
 def reader():
  try:
   con=sqlite3.connect(path,autocommit=True);con.execute('BEGIN');con.execute('SELECT * FROM dispatches').fetchall();reader_ready.set()
   assert entered.wait(2)
   time.sleep(.02);clock.now=5000;con.execute('ROLLBACK');con.close()
  except BaseException as e:errors.append(repr(e));reader_ready.set()
 t=threading.Thread(target=reader);t.start();assert reader_ready.wait(2)
 result=Traced(path,'coordination',clock).start('crossing','dispatch',1,authority,'crossing-attempt')
 t.join(2);assert not t.is_alive() and not errors
 reports.append({'probe':'commit-completion-after-final-check','result':'OBSERVED_LIMIT_NOT_PROFILE_VIOLATION','final_check_time':4999,'clock_after_commit':clock.now,'lease_expires_at':5000,'response':result,'clock_high_water':dump(path)['metadata'][0][-1]})
after=hashes();assert before==after
manifest=hashlib.sha256((BASE/'r07-recovery-v1/PRODUCT-TEST-MANIFEST.json').read_bytes()).hexdigest()
assert manifest=='f7068d6ecd0ae4208b792804fcf502a1b25502309913eaa32c7b88b3138d47aa'
print(json.dumps({'reviewer':'native helper /root/r08_reviewer','reports':reports,'source_files':len(rows),'source_currentness':'PASS unchanged before/after','manifest_sha256':manifest},indent=2))
