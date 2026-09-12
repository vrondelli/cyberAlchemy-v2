"""One fresh episode per fixed cell; no retry or tuning. Open questions: PLAN.md."""
import json,pathlib,subprocess,sys
h=pathlib.Path(__file__).resolve().parent
assert len(sys.argv)==2,'credential reference required'
for c in json.loads((h/'matrix.json').read_text())['cells']:
 out=h/'evidence'/c['cell_id'];assert not out.exists(),'existing cell: no implicit replay'
 log=h/('run-'+c['cell_id']+'.log');assert not log.exists(),'existing driver log'
 print('starting '+c['cell_id'],flush=True)
 with log.open('x') as f:p=subprocess.run(['node',str(h/'run.mjs'),sys.argv[1],c['cell_id']],stdout=f,stderr=subprocess.STDOUT)
 assert p.returncode==0 and (out/'completed.json').exists(),'runner failed before terminal evidence'
 r=json.loads((out/'result.json').read_text());print(json.dumps({k:r.get(k) for k in ['cell_id','status','model_attempts','patch_produced','error','cleanup_verified']}),flush=True)
 if r['status']=='run_error' or not r['cleanup_verified']:raise RuntimeError('infrastructure/runtime failure: matrix paused without retry')
