"""Collect-all campaign followed by isolated reverse-order replay; no acceptance."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import sys
import time
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def check_sources():
    for row in json.loads((HERE/'source-manifest.json').read_text())['files']:
        if sha(ROOT/row['path'])!=row['sha256']:raise ValueError('source drift: '+row['path'])
    for row in json.loads((HERE.parent/'r02-recovery-v1/runtime-lock.json').read_text())['files']:
        if sha(Path(row['path']))!=row['sha256']:raise ValueError('runtime drift')
    node=json.loads((HERE.parent/'r02-recovery-v1/compiler-lock.json').read_text())['node']
    if sha(Path(node['path']))!=node['sha256']:raise ValueError('Node drift')
check_sources()
inputs={name:sha(HERE/name) for name in ['campaign.py','case.py','additional_tests.py','contracts.mjs','scenario-map.json','source-manifest.json']}
scenarios=json.loads((HERE/'scenario-map.json').read_text())['scenarios']
declared=json.loads((HERE.parent/'r01-recovery-v1/failure-matrix.json').read_text())['scenarios']
assert {s['scenario_id'] for s in scenarios}=={s['scenario_id'] for s in declared}
runs=[]
for repetition in [1,2]:
    rows=scenarios if repetition==1 else list(reversed(scenarios))
    for row in rows:
        started=time.monotonic()
        try:
            child=subprocess.run([sys.executable,'-B',str(HERE/'case.py'),row['scenario_id']],capture_output=True,text=True,timeout=30)
            observation=json.loads(child.stdout) if child.stdout else None
            result='PASS' if child.returncode==0 and observation and observation['result']=='PASS' else 'FAIL'
            record={'scenario_id':row['scenario_id'],'repetition':repetition,'result':result,'exit_code':child.returncode,'observation':observation,'stderr':child.stderr}
        except subprocess.TimeoutExpired as error:
            record={'scenario_id':row['scenario_id'],'repetition':repetition,'result':'FAIL','cause':'30-second scenario deadline','stdout':str(error.stdout),'stderr':str(error.stderr)}
        except (ValueError,OSError) as error:
            record={'scenario_id':row['scenario_id'],'repetition':repetition,'result':'not_evaluable','cause':repr(error)}
        record['duration_seconds']=round(time.monotonic()-started,3)
        runs.append(record)
        print(json.dumps({k:record[k] for k in ['scenario_id','repetition','result','duration_seconds']}),flush=True)
        (HERE/'RESULTS.json').write_text(json.dumps({'status':'running','inputs':inputs,'runs':runs},indent=2)+'\n')
check_sources()
assert all(sha(HERE/name)==digest for name,digest in inputs.items())
result='PASS' if len(runs)==60 and all(r['result']=='PASS' for r in runs) else 'BLOCK'
(HERE/'RESULTS.json').write_text(json.dumps({'status':result,'recorded_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputs':inputs,'runs':runs,'replay_independence':'Fresh interpreter and temporary stores for every scenario; second execution reverses order. Same authored tests, no independent reviewer.'},indent=2)+'\n')
print(json.dumps({'campaign':result,'scenarios':30,'executions':len(runs)}),flush=True)
