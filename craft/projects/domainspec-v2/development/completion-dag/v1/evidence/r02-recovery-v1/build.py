"""Compile and check only this R02 prototype; fresh outputs required."""
from pathlib import Path
import ast, hashlib, json, sqlite3, subprocess, sys, tarfile, tempfile
HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[7]
ARCHIVE = ROOT / 'projects/domainspec-v2/development/completion-dag/v1/evidence/c04-f01-successor/bundle/package/domainspec-v2-cli-1.0.0.tgz'
NODE = Path('/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name, value):
    with (HERE / name).open('x') as f: json.dump(value, f, indent=2); f.write('\n')
if sha(ARCHIVE) != '8587a0355c39878264935ef4e824ff80266383690e82c756f8216af48a5c194a': raise ValueError('compiler archive drift')
if sha(NODE) != '19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3': raise ValueError('Node drift')
checks=[]
with tempfile.TemporaryDirectory(prefix='dsv2-r02-') as scratch:
    work=Path(scratch)
    with tarfile.open(ARCHIVE) as t: t.extractall(work, filter='data')
    command=[str(NODE),str(HERE/'compile.mjs'),str(work/'package'),str(HERE/'system-model'),str(HERE/'bindings.json')]
    run=subprocess.run(command,capture_output=True,text=True,timeout=60)
    if run.returncode: raise RuntimeError(run.stderr)
    result=json.loads(run.stdout)
    write('graph.json',result['graph']); write('certificate.json',result['certificate']); write('binding-manifest.json',result['binding_manifest'])
    with (HERE/'generated-binding.py').open('x') as f: f.write(result['generated_contract'])
    checks.append({'id':'compiler-and-binding','result':'PASS','nodes':len(result['graph']['nodes']),'relationships':len(result['graph']['relationships']),'repeat_identical':True,'certificate_valid':True,'runtime_guarantees_observed':False})
    for name in ['contracts.py','generated-binding.py']: ast.parse((HERE/name).read_text()); checks.append({'id':name+'-syntax','result':'PASS'})
    for name in ['coordination','operation']:
        con=sqlite3.connect(work/(name+'.sqlite'),autocommit=True)
        try:
            con.execute('PRAGMA journal_mode=DELETE');con.execute('PRAGMA synchronous=EXTRA');con.execute('PRAGMA foreign_keys=ON');con.execute('PRAGMA busy_timeout=100')
            con.executescript((HERE/(name+'.sql')).read_text())
            observed={k:con.execute('PRAGMA '+k).fetchone()[0] for k in ['journal_mode','synchronous','foreign_keys','user_version']}
            if observed!={'journal_mode':'delete','synchronous':3,'foreign_keys':1,'user_version':1}: raise ValueError(observed)
            if con.execute('PRAGMA integrity_check').fetchone()[0]!='ok' or con.execute('PRAGMA foreign_key_check').fetchall(): raise ValueError('schema integrity')
            checks.append({'id':name+'-schema','result':'PASS','pragmas':observed,'tables':[x[0] for x in con.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]})
            def rejected(label,sql,args=()):
                try: con.execute(sql,args)
                except sqlite3.IntegrityError: checks.append({'id':label,'result':'PASS','observed':'rejected'})
                else: raise ValueError('accepted hostile case: '+label)
            if name=='coordination':
                con.execute("INSERT INTO intents VALUES('i','w','f','workflow','failed','journal','plan','{}','binding')")
                con.execute("INSERT INTO dispatches VALUES('d','i','ready',0,0)")
                rejected('duplicate-failure',"INSERT INTO intents VALUES('i2','w','f','workflow','failed','journal','plan','{}','binding')")
                rejected('immutable-intent',"UPDATE intents SET plan_digest='changed' WHERE intent_id='i'")
                con.execute("INSERT INTO claims VALUES('c','d','worker1',1,0,0,'current')")
                rejected('two-current-claims',"INSERT INTO claims VALUES('c2','d','worker2',2,0,0,'current')")
                rejected('invalid-terminal-state',"INSERT INTO terminals VALUES('d','cancelled','unresolved',NULL,'cause','{}',0)")
                rejected('terminal-semantic-mismatch',"INSERT INTO terminals VALUES('d','completed','unresolved',NULL,'cause','{}',0)")
                con.execute("INSERT INTO occurrences VALUES('d','o',0,'op','inv','bind','payload','{}','retry','policy')")
                con.execute("INSERT INTO leases VALUES('l','c',1,0,5000,NULL)")
                rejected('attempt-budget',"INSERT INTO attempts VALUES('a','d','o',4,'c','l',1,0,NULL,NULL,NULL)")
                con.execute("INSERT INTO progress VALUES('d','o','result','{}',0)")
                rejected('progress-deletion',"DELETE FROM progress WHERE dispatch_id='d'")
                # SQL supports local all-or-none; worker/CAS behavior remains R03.
                con.execute('BEGIN IMMEDIATE')
                con.execute("INSERT INTO transitions VALUES('t','d',0,'cmd','{}')")
                con.execute("INSERT INTO dispatch_outbox VALUES('e','t','{}',NULL)")
                con.execute('ROLLBACK')
                if con.execute('SELECT count(*) FROM transitions').fetchone()[0] or con.execute('SELECT count(*) FROM dispatch_outbox').fetchone()[0]:raise ValueError('rollback residue')
                checks.append({'id':'coordination-explicit-rollback','result':'PASS','limit':'SQL transaction smoke only, not crash testing'})
            else:
                con.execute("INSERT INTO invocation_results VALUES('inv','op','bind','payload','{}','result',0)")
                rejected('duplicate-invocation-result',"INSERT INTO invocation_results VALUES('inv','op','bind','payload','{}','result',0)")
                rejected('result-mutation',"UPDATE invocation_results SET result_digest='new'")
                rejected('outbox-without-result',"INSERT INTO operation_outbox VALUES('event','missing','{}')")
        finally:con.close()
write('BUILD-CHECKS.json',{'checks':checks,'runtime_result':'not_evaluable','claim_ceiling':'Compilation, Python syntax and SQL schema smoke only. No durable worker, restart, fencing, retry, replay or product-conformance proof.'})
write('compiler-lock.json',{'archive':{'path':str(ARCHIVE.relative_to(ROOT)),'sha256':sha(ARCHIVE)},'node':{'path':str(NODE),'sha256':sha(NODE)},'python':{'path':str(Path(sys.executable).resolve()),'sha256':sha(Path(sys.executable).resolve()),'version':sys.version},'sqlite_version':sqlite3.sqlite_version,'claim':'Exact compiler package and observed prototype test runtime; future runtime tests must recheck dependency closure.'})
print(json.dumps({'result':'PASS','checks':len(checks),'scope':'R02 prototype compilation and schema checks'}))
