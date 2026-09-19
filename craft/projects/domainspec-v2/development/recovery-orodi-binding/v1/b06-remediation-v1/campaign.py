"""Frozen B06 successor local product-test campaign; each case owns temporary fixtures."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def utc(): return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def write(name, value): (HERE/name).write_text(json.dumps(value,indent=2)+'\n')

def check(candidate):
    for name in ['source-manifest.json','runtime-manifest.json']:
        if sha(HERE/name) != candidate['manifests'][name]: raise ValueError('manifest drift: '+name)
        for entry in json.loads((HERE/name).read_text())['files']:
            path=Path(entry['path']);path=path if path.is_absolute() else ROOT/path
            if sha(path) != entry['sha256']: raise ValueError('selected source drift: '+str(path))

def main():
    if (HERE/'RESULTS.json').exists() or (HERE/'execution-log.jsonl').exists(): raise ValueError('refuse to overwrite existing campaign')
    candidate=json.loads((HERE/'CANDIDATE.json').read_text());candidate_hash=sha(HERE/'CANDIDATE.json')
    check(candidate)
    runs=[]
    driver=ROOT/candidate['driver']['path'];python=candidate['python']['path']
    for repetition in [1,2]:
        ids=candidate['scenario_ids'] if repetition==1 else list(reversed(candidate['scenario_ids']))
        for scenario in ids:
            check(candidate)
            if sha(HERE/'CANDIDATE.json') != candidate_hash: raise ValueError('candidate drift')
            started=time.monotonic();start=utc()
            command=[python,'-B',str(driver),'--scenario',scenario,'--repetition',str(repetition),'--manifest-sha256',candidate['original_product_manifest']['sha256'],'--observer-sha256',candidate['observer']['sha256']]
            child=subprocess.Popen(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
            try:
                stdout,stderr=child.communicate(timeout=30)
                payload=json.loads(stdout)
                if payload.get('scenario_id')!=scenario or payload.get('repetition')!=repetition or 'observation' not in payload:
                    raise ValueError('case returned no matching observation: '+stdout[:1000])
                record=payload
                if child.returncode!=record['exit_code']: raise ValueError('process/record exit mismatch')
                record['stderr']=stderr
            except subprocess.TimeoutExpired:
                os.killpg(child.pid,signal.SIGKILL);stdout,stderr=child.communicate()
                record={'scenario_id':scenario,'repetition':repetition,'result':'not_evaluable','cause':'30-second scenario deadline','stdout':stdout,'stderr':stderr}
            except (ValueError,KeyError) as error:
                record={'scenario_id':scenario,'repetition':repetition,'result':'not_evaluable','cause':str(error)}
            record['duration_seconds']=round(time.monotonic()-started,3)
            runs.append(record)
            summary={'scenario_id':scenario,'repetition':repetition,'result':record['result'],'started_at':start,'finished_at':utc(),'duration_seconds':record['duration_seconds']}
            with (HERE/'execution-log.jsonl').open('a') as stream: stream.write(json.dumps(summary)+'\n')
            write('RESULTS.json',{'status':'running','runs':runs})
            print(json.dumps(summary),flush=True)
            # Case-local test failures are collected as product evidence. A source
            # integrity failure stops subsequent execution immediately.
            check(candidate)
    if sha(HERE/'CANDIDATE.json') != candidate_hash: raise ValueError('candidate drift')
    status='PASS' if len(runs)==60 and all(r['result']=='PASS' for r in runs) else 'BLOCK'
    write('RESULTS.json',{'status':status,'recorded_at_utc':utc(),'runs':runs,'replay_independence':'Fresh interpreter and temporary fixtures per case; reverse order in repetition 2. Same authored tests.'})
    print(json.dumps({'campaign':status,'executions':len(runs)}))
    return 0 if status=='PASS' else 1

if __name__=='__main__': sys.exit(main())
