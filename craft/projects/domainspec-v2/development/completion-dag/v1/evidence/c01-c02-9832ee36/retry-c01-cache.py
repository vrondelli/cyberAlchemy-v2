from pathlib import Path
import json,subprocess,time,hashlib,datetime
T=Path(__file__).resolve().parent;O=Path('/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/c01-c02-9832ee36')
rows=[]
for i,script in [('PARALLEL','test:parallel'),('PACKAGE','validate:clean-package')]:
 args=['python3','-B',str(T/'run.py'),'env','-u','NPM_CONFIG_CACHE','npm','run',script];start=time.monotonic();print('RUNNING '+i+' cache-corrected',flush=True)
 log=O/'logs'/f'{i}.cache-corrected.log'
 with log.open('x') as out:r=subprocess.run(args,stdout=out,stderr=subprocess.STDOUT)
 row={'phase_id':i,'argv':args,'result':'PASS' if r.returncode==0 else 'BLOCK','exit_code':r.returncode,'elapsed_seconds':round(time.monotonic()-start,3),'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':str(log.relative_to(O)),'log_sha256':hashlib.sha256(log.read_bytes()).hexdigest(),'supersedes_for_current_evaluation':f'logs/{i}.log','scope':'Same source and dependencies; remove conflicting uppercase npm cache override only.'};rows.append(row)
 (O/'cache-recovery-results.json').write_text(json.dumps({'status':'running' if i=='PARALLEL' else 'complete','reason':'Inherited uppercase NPM_CONFIG_CACHE selects root-owned image cache instead of task-local lowercase cache. npm config confirmed both cases.','phases':rows,'authority_effect':'none'},indent=2)+'\n');print(i+' '+row['result'],flush=True)
