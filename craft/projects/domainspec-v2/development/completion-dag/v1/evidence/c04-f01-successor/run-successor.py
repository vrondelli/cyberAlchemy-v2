from pathlib import Path
import subprocess,json,time,hashlib,shutil
O=Path(__file__).resolve().parent
T=Path('/home/vrondelli/projects/domainspec-v2-c04-successor-tools')
W=Path('/home/vrondelli/projects/domainspec-v2-c04-f01-successor')
H=json.loads((O/'commit.json').read_text())['commit']
rows=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(label,args):
 argv=['python3','-B',str(T/'run.py'),*args];start=time.monotonic();print('RUNNING '+label,flush=True)
 with (O/'logs'/f'{label}.log').open('x') as log:r=subprocess.run(argv,stdout=log,stderr=subprocess.STDOUT)
 row={'id':label,'argv':argv,'result':'PASS' if r.returncode==0 else 'BLOCK','exit_code':r.returncode,'elapsed_seconds':round(time.monotonic()-start,3),'log':f'logs/{label}.log','log_sha256':sha(O/'logs'/f'{label}.log')};rows.append(row);(O/'validation-results.json').write_text(json.dumps({'source_commit':H,'checks':rows},indent=2)+'\n');print(label+' '+row['result'],flush=True)
 return r.returncode==0
for label,args in [('TYPE',['npm','run','typecheck']),('RELEASE',['node','--test','test/release/release-candidate.test.mjs']),('CONTRACT',['npm','run','test:contract']),('BUILD',['npm','run','build']),('PACKAGE',['npm','run','validate:clean-package'])]:
 if not run(label,args):raise SystemExit(1)
# Retained C02 evidence is copied byte-for-byte after checking its manifest.
C=O.parent/'c01-c02-9832ee36'
for node in ['C01','C02']:
 receipt=json.loads((C/node/'receipt.json').read_text());assert receipt['result']=='PASS'
 for row in receipt['output_manifest']:assert sha(C/row['path'])==row['sha256']
 for row in receipt['checks_with_observed_results']:assert sha(C/row['log'])==row['log_sha256']
for row in json.loads((C/'qualification-manifest.json').read_text())['files']:assert sha(C/row['path'])==row['sha256']
shutil.copytree(C/'qualification',T/'qualification-successor')
for n in [1,2]:
 if not run(f'BUNDLE-{n}',['npm','run','release-candidate:prepare','--','--qualification-evidence-root',str(T/'qualification-successor'),'--output-root',str(T/f'candidate-successor-{n}'),'--source-commit',H]):raise SystemExit(1)
print('PASS affected tests and two candidate builds',flush=True)
