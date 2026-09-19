"""Finish an already dispatched cohort; never starts or retries model work.
Open questions: PLAN.md. Bounded local evidence, source clones remain on VPS.
"""
import subprocess, pathlib, json, time, tarfile, os, sys
HERE=pathlib.Path(__file__).resolve().parent
REMOTE='/opt/are-harness-benchmark/output-74'
SSH=['ssh','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10','root@187.77.163.194']
def status(stage,**extra):
 p=HERE/'FINISHER-STATUS.json';tmp=HERE/'FINISHER-STATUS.tmp';tmp.write_text(json.dumps({'stage':stage,'time':time.time(),**extra},indent=2));os.replace(tmp,p)
def remote(code,timeout=120):return subprocess.run(SSH+['python3 -'],input=code,text=True,capture_output=True,check=True,timeout=timeout).stdout
try:
 status('waiting-for-eight-settled-outcomes')
 deadline=time.time()+3*3600
 while time.time()<deadline:
  ready=remote(f'from pathlib import Path\nprint(Path({REMOTE!r},"CAMPAIGN-SETTLEMENT.json").exists())').strip()
  if ready=='True':break
  time.sleep(30)
 else:raise RuntimeError('cohort-settlement-timeout; no model restart performed')
 status('export-and-reconcile')
 subprocess.run(['scp','-q',str(HERE/'analyze.mjs'),'root@187.77.163.194:/opt/are-harness-benchmark/analysis-output74.mjs'],check=True,timeout=60)
 code=r'''
from pathlib import Path
import json,subprocess,hashlib,tarfile
r=Path('/opt/are-harness-benchmark/output-74');image='sha256:6406e582e89acd60a59294144bfb526aa9ee1687273a7e475b68906705426385';C='development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
freeze=json.loads((r/'FREEZE.json').read_text())
for b in freeze['bindings']:assert hashlib.sha256((r/b['path']).read_bytes()).hexdigest()==b['sha256'],b['path']
base=['docker','run','--rm','--network','none','--read-only','--memory','2g','-v',str(r)+':/repo']
for name,cmd in [('export',base+[image,'node','/repo/'+C+'/deepseek-pilot-export.mjs','/repo']),('accounting',base+['-v','/opt/are-harness-benchmark/analysis-output74.mjs:/analysis.mjs:ro',image,'node','/analysis.mjs'])]:
 with (r/(name+'.stdout')).open('x')as out,(r/(name+'.stderr')).open('x')as err:subprocess.run(cmd,stdout=out,stderr=err,check=True,timeout=180)
files=[r/n for n in ['FREEZE.json','REVIEW.json','CAMPAIGN-STARTED.json','CAMPAIGN-SETTLEMENT.json','EXPORTS.json','ACCOUNTING-VERIFICATION.json','COMPOSED-PROFILE.yml']]
for d in sorted((r/'runs').iterdir()):
 for name in ['STARTED.json','SETTLEMENT.json','stdout.txt','stderr.txt','NATIVE-EXPORT.json','prediction.json','evidence/RESULTS.json','evidence/run/state/glm-transport-ledger.json']:
  p=d/name
  if p.is_file():files.append(p)
 for name in ['transport','tools']:
  if (d/name).is_dir():files.extend(p for p in (d/name).iterdir()if p.is_file())
assert sum(p.stat().st_size for p in files)<256*1024**2,'local-evidence-uncompressed-bound'
index={'remote_root':str(r),'files':[{'path':str(p.relative_to(r)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}for p in files],'full_sources_and_sessions':'retained only on VPS','open_questions_ref':'PLAN.md'}
(r/'EVIDENCE-INDEX.json').write_text(json.dumps(index,indent=2));files.append(r/'EVIDENCE-INDEX.json')
with tarfile.open(r/'review-evidence.tar.gz','w:gz')as t:
 for p in files:t.add(p,arcname=str(p.relative_to(r)),recursive=False)
assert (r/'review-evidence.tar.gz').stat().st_size<64*1024**2,'local-evidence-compressed-bound'
print(json.dumps({'archive_bytes':(r/'review-evidence.tar.gz').stat().st_size,'files':len(files)}))
'''
 print(remote(code,timeout=450),flush=True);status('download-bounded-evidence')
 archive=HERE/'review-evidence.tar.gz';assert not archive.exists()
 subprocess.run(['scp','-q','root@187.77.163.194:'+REMOTE+'/review-evidence.tar.gz',str(archive)],check=True,timeout=180)
 assert archive.stat().st_size<64*1024**2
 evidence=HERE/'evidence';evidence.mkdir();total=0
 with tarfile.open(archive)as t:
  for m in t:
   parts=pathlib.PurePosixPath(m.name).parts;assert m.isfile()and not m.name.startswith('/')and '..' not in parts
   total+=m.size;assert total<256*1024**2
   p=evidence.joinpath(*parts);p.parent.mkdir(parents=True,exist_ok=True)
   with p.open('xb')as out:out.write(t.extractfile(m).read())
 import hashlib
 index=json.loads((evidence/'EVIDENCE-INDEX.json').read_text())
 for b in index['files']:assert hashlib.sha256((evidence/b['path']).read_bytes()).hexdigest()==b['sha256']
 status('native-scoring')
 subprocess.run([sys.executable,str(HERE/'score.py')],check=True,timeout=1800)
 status('completed',result='RESULTS.json',evidence_bytes=total);print('Output74 accounting and native scoring completed.',flush=True)
except Exception as error:
 status('failed',error=type(error).__name__+': '+str(error));raise
