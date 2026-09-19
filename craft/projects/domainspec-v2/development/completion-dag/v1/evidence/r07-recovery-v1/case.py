"""One scenario in a fresh interpreter; no writes outside temporary fixtures."""
from pathlib import Path
import importlib
import io
import json
import os
import sqlite3
import subprocess
import sys
import unittest
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
for directory in ['r03-recovery-v1','r04-recovery-v1','r05-recovery-v1','r06-recovery-v1']:
    sys.path.insert(0,str(HERE.parent/directory))
sys.path.insert(0,str(HERE))
def observe(instance):
    result={'pid':os.getpid(),'sqlite_version':sqlite3.sqlite_version,'python':sys.version,'databases':{}}
    clock=getattr(instance,'clock',None)
    if clock:
        try:result['clock']=clock()
        except Exception as error:result['clock_error']=repr(error)
    for name in ['cp','op','path']:
        path=getattr(instance,name,None)
        if not isinstance(path,Path):continue
        if not path.exists():result['databases'][name]={'state':'absent'};continue
        db=None
        try:
            db=sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True)
            db.execute('BEGIN')
            names=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
            result['databases'][name]={'state':'observed','path':str(path),'journal_mode':db.execute('PRAGMA journal_mode').fetchone()[0],'schema_version':db.execute('PRAGMA user_version').fetchone()[0],'tables':{n:db.execute('SELECT * FROM "'+n.replace('"','""')+'" ORDER BY rowid').fetchall() for n in names}}
        except sqlite3.Error as error:result['databases'][name]={'state':'not_evaluable','cause':str(error)}
        finally:
            if db:db.close()
    return result
scenario_id=sys.argv[1]
scenario=next(r for r in json.loads((HERE/'scenario-map.json').read_text())['scenarios'] if r['scenario_id']==scenario_id)
records=[]
for name in scenario['tests']:
    module_name,class_name,method=name.split('.')
    module=importlib.import_module(module_name)
    instance=getattr(module,class_name)(method)
    record={'test':name}
    setup,teardown=instance.setUp,instance.tearDown
    def before():
        setup();record['before']=observe(instance)
    def after():
        record['after']=observe(instance);teardown()
    instance.setUp,instance.tearDown=before,after
    stream=io.StringIO()
    result=unittest.TextTestRunner(stream=stream,verbosity=2).run(instance)
    record.update(result='PASS' if result.wasSuccessful() and not result.skipped else 'FAIL',tests_run=result.testsRun,raw_output=stream.getvalue())
    records.append(record)
contract=None
if scenario['contract_probe']:
    lock=json.loads((HERE.parent/'r02-recovery-v1/compiler-lock.json').read_text())
    process=subprocess.run([lock['node']['path'],str(HERE/'contracts.mjs'),str(ROOT)],capture_output=True,text=True,timeout=20)
    contract={'exit_code':process.returncode,'stdout':process.stdout,'stderr':process.stderr}
passed=all(r['result']=='PASS' for r in records) and (contract is None or contract['exit_code']==0)
trace=getattr(sys.modules.get('additional_tests'),'TRACE',[])
print(json.dumps({'scenario_id':scenario_id,'pid':os.getpid(),'result':'PASS' if passed else 'FAIL','tests':records,'contract_probe':contract,'process_trace':trace}))
sys.exit(0 if passed else 1)
