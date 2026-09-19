import subprocess,json,time,datetime,hashlib
from pathlib import Path
T=Path(__file__).resolve().parent
B=Path('/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1')
O=B/'evidence/c01-c02-9832ee36'
W=Path('/home/vrondelli/projects/domainspec-v2-verification-9832ee36')
O.mkdir(exist_ok=False);(O/'logs').mkdir()
p=json.loads((B/'evidence/p00-c00-9832ee36/test-phases.json').read_text())
results={'ENV':'PASS'};records=[]
for phase in p['phases']:
 i=phase['phase_id']
 if i in ['ENV','BUNDLE']:continue
 if i=='QUALIFY':
  args=['npm','run','recipe-qualification:l1','--','--output-root',str(T/'qualification-c02'),'--expected-baseline',str(W/'projects/domainspec-v2/impl/cli/fixtures/qualification/l1-baseline.json')]
 else:
  import shlex
  args=shlex.split(phase['command'])
 blocked=[d for d in phase['requires'] if results.get(d)!='PASS']
 record={'phase_id':i,'owner_node':phase['owner_node'],'argv':['python3','-B',str(T/'run.py'),*args],'started_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_commit':'9832ee36c5332be825ff065fb8cff05b23b2fd81'}
 if blocked:
  record.update(result='not_evaluable',causal_blockers=blocked,exit_code=None)
 else:
  print('RUNNING '+i,flush=True);start=time.monotonic()
  with (O/'logs'/f'{i}.log').open('x') as log:
   result=subprocess.run(record['argv'],stdout=log,stderr=subprocess.STDOUT)
  record.update(result='PASS' if result.returncode==0 else 'BLOCK',exit_code=result.returncode,elapsed_seconds=round(time.monotonic()-start,3),log=f'logs/{i}.log',log_sha256=hashlib.sha256((O/'logs'/f'{i}.log').read_bytes()).hexdigest())
 results[i]=record['result'];records.append(record)
 (O/'phase-results.json').write_text(json.dumps({'status':'running','phases':records},indent=2)+'\n')
 print(i+' '+record['result'],flush=True)
summary={'status':'complete','phases':records,'C01':'PASS' if all(r['result']=='PASS' for r in records if r['owner_node']=='C01') else 'BLOCK','C02':results['QUALIFY'],'authority_effect':'none'}
(O/'phase-results.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary,indent=2),flush=True)
