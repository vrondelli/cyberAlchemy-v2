from pathlib import Path
import json,hashlib,subprocess,time,os
R=Path('/home/vrondelli/projects/domainspec-core');B=R/'projects/domainspec-v2/development/completion-dag/v1';T=Path(__file__).resolve().parent;W=Path('/home/vrondelli/projects/domainspec-v2-verification-9832ee36');O=B/'evidence/c03-9832ee36';C=B/'evidence/c01-c02-9832ee36';H='9832ee36c5332be825ff065fb8cff05b23b2fd81'
def sha(b):return hashlib.sha256(b).hexdigest()
for n in ['C01','C02']:
 d=json.loads((C/n/'receipt.json').read_text());assert d['result']=='PASS'
 for row in d['output_manifest']:assert sha((C/row['path']).read_bytes())==row['sha256']
 for row in d['checks_with_observed_results']:assert sha((C/row['log']).read_bytes())==row['log_sha256']
for r in json.loads((C/'qualification-manifest.json').read_text())['files']:
 assert sha((C/r['path']).read_bytes())==r['sha256'];assert sha((T/'qualification-c02'/Path(r['path']).relative_to('qualification')).read_bytes())==r['sha256']
s=json.loads((B/'evidence/p00-c00-9832ee36/sources.json').read_text());assert all(sha((W/r['path']).read_bytes())==r['sha256'] for r in s['sources'])
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=W).decode().strip()==H
assert subprocess.check_output(['git','-c','core.fsmonitor=false','status','--porcelain=v1','--untracked-files=all'],cwd=W,env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'}).strip()==b''
O.mkdir(exist_ok=False);(O/'logs').mkdir();rows=[]
for n in [1,2]:
 args=['python3','-B',str(T/'run.py'),'env','-u','NPM_CONFIG_CACHE','npm','run','release-candidate:prepare','--','--qualification-evidence-root',str(T/'qualification-c02'),'--output-root',str(T/f'candidate-c03-{n}'),'--source-commit',H]
 log=O/'logs'/f'build-{n}.log';print(f'RUNNING build {n}',flush=True);start=time.monotonic()
 with log.open('x') as f:r=subprocess.run(args,stdout=f,stderr=subprocess.STDOUT)
 rows.append({'build':n,'argv':args,'exit_code':r.returncode,'result':'PASS' if r.returncode==0 else 'BLOCK','seconds':round(time.monotonic()-start,3),'log':str(log.relative_to(O)),'log_sha256':sha(log.read_bytes())});(O/'build-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(f'build {n}: '+rows[-1]['result'],flush=True)
 if r.returncode:break
