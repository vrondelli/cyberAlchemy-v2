"""Separate post-matrix evaluation; no reference solution enters the model runner. Open questions: PLAN.md."""
import json,pathlib,subprocess,hashlib,sys,time
from concurrent.futures import ThreadPoolExecutor
h=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
cells=read(h/'matrix.json')['cells'];freeze=read(h/'freeze.json')
for f in freeze['sources']:assert digest(h/f['path'])==f['sha256'],'source drift'
for c in cells:assert (h/'evidence'/c['cell_id']/'completed.json').exists(),'all model episodes must be terminal first'
def evaluate_cell(c):
 d=h/'evidence'/c['cell_id'];r=read(d/'result.json')
 if not r['patch_produced']:return
 for mode in ['evaluation','reproduction']:
  if mode=='reproduction' and not read(d/'evaluation/report.json').get('resolved'):break
  out=d/mode;assert not out.exists(),'refuse overwrite or implicit replay'
  assert digest(d/'prediction.patch')==r['patch_sha256'],'patch drift'
  start=time.time();cmd=[sys.executable,str(h/'evaluate.py'),'/home/vrondelli/.cache/are-holdout102/'+c['task_id'],'candidate',str(out),str(h/'tasks'/c['task_id']),str(d/'prediction.patch')]
  p=subprocess.run(cmd,capture_output=True,text=True)
  (d/(mode+'-driver.log')).write_text(p.stdout+p.stderr)
  assert p.returncode==0 and (out/'report.json').exists(),'evaluator driver failure'
  assert digest(d/'prediction.patch')==r['patch_sha256'],'patch changed during evaluation'
  invocation={'cell_id':c['cell_id'],'output_directory':str(out),'patch_sha256':r['patch_sha256'],'evaluator_sha256':digest(h/'evaluate.py'),'freeze_sha256':digest(h/'freeze.json'),'report_sha256':digest(out/'report.json'),'elapsed_ms':round((time.time()-start)*1000),'authority_effect':'none','open_questions_ref':'../../PLAN.md'}
  (out/'invocation.json').write_text(json.dumps(invocation,indent=2)+'\n')
  e=read(out/'report.json');print(json.dumps({'cell_id':c['cell_id'],'mode':mode,**e}),flush=True)
  if e['status']!='scored' or not e['cleanup_verified']:raise RuntimeError('evaluator infrastructure failure: preserve and pause')

with ThreadPoolExecutor(max_workers=2) as pool:
 for offset in range(0,len(cells),2):
  futures=[pool.submit(evaluate_cell,c) for c in cells[offset:offset+2]]
  for future in futures:future.result()
