"""Fixed no-retry matrix. Open questions: PLAN.md."""
import json,pathlib,subprocess,sys,hashlib,time
h=pathlib.Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text())
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert len(sys.argv) in (2,3),'credential reference and optional explicit continuation receipt'
m=read(h/'matrix.json');freeze=read(h/'freeze.json')
for f in freeze['sources']:assert digest(h/f['path'])==f['sha256'],'source drift: '+f['path']
resume=read(pathlib.Path(sys.argv[2])) if len(sys.argv)==3 else None
if resume:
 assert resume['freeze_sha256']==digest(h/'freeze.json') and resume['resume_unstarted_only'] is True
 assert resume['diagnostic_ref'] and resume['cleanup_verified'] is True
spent_reserve=0
for c in m['cells']:
 out=h/'evidence'/c['cell_id'];log=h/('run-'+c['cell_id']+'.log')
 spent_reserve+=m['per_cell_model_reserve_usd']
 assert spent_reserve<=m['model_reserve_usd']+1e-9,'spend ceiling'
 if out.exists():
  assert resume and (out/'completed.json').exists(),'existing cell cannot replay'
  assert read(out/'result.json')['cleanup_verified'],'existing cleanup failed'
  continue
 assert not log.exists(),'existing dispatch log requires diagnosis'
 print('starting '+c['cell_id'],flush=True)
 with log.open('x') as f:p=subprocess.run(['node',str(h/'run.mjs'),sys.argv[1],c['cell_id']],stdout=f,stderr=subprocess.STDOUT)
 assert p.returncode==0 and (out/'completed.json').exists(),'runner failed before terminal evidence'
 r=read(out/'result.json');print(json.dumps({k:r.get(k) for k in ['cell_id','status','model_attempts','patch_produced','error','cleanup_verified']}),flush=True)
 assert r['model_attempts']<=24 and r['tokenizer_attempts']<=48
 assert r['list_price_estimate_usd']<=m['per_cell_model_reserve_usd'],'observed spend exceeded reserve'
 if r['status']=='run_error' or not r['cleanup_verified']:raise RuntimeError('infrastructure/runtime failure: preserve and pause')
