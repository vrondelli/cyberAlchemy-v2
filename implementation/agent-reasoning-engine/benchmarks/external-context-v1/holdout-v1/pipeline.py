"""One complete fixed experiment; no automatic resume or retry. Open questions: PLAN.md."""
import subprocess,pathlib,sys,json
h=pathlib.Path(__file__).resolve().parent
assert len(sys.argv)==2,'credential reference required'
def run(name,cmd):
 print(name,flush=True)
 with (h/(name+'-driver.log')).open('x') as f:r=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT)
 if r.returncode:raise RuntimeError(name+' stopped; inspect retained evidence before further work')
run('freeze',['node',str(h/'freeze.mjs')])
run('model-matrix',[sys.executable,str(h/'execute-matrix.py'),sys.argv[1]])
run('score-matrix',[sys.executable,str(h/'score-matrix.py')])
for cell in json.loads((h/'matrix.json').read_text())['cells']:
 run('audit-'+cell['cell_id'],['node',str(h/'audit.mjs'),cell['cell_id']])
run('closeout',['node',str(h/'closeout.mjs')])
run('analysis',['node',str(h/'analyze.mjs')])
print('Fixed matrix, scoring, reproduction and audits complete.',flush=True)
