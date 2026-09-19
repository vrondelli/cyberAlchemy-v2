from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(v,msg):
    if not v:raise ValueError(msg)
for r in read(HERE/'source-manifest.json')['files']:check(sha(ROOT/r['path'])==r['sha256'],'source drift:'+r['path'])
for r in read(HERE.parent/'r02-recovery-v1/runtime-lock.json')['files']:check(sha(Path(r['path']))==r['sha256'],'runtime drift')
t=read(HERE/'TEST-RESULTS.json')
check(t['exit_code']==0 and t['result']=='PASS' and 'Ran 21 tests' in t['stderr'] and t['stderr'].rstrip().endswith('OK'),'test result')
for n,h in t['source_hashes'].items():check(sha(HERE/n)==h,'tested source drift')
p=read(HERE/'adapter-profile.json');m=p['binding_digest_material']
check(m['adapter_sha256']==sha(HERE/'ledger.py'),'adapter binding')
check(m['schema_sha256']==sha(HERE.parent/'r02-recovery-v1/operation.sql'),'schema binding')
check(hashlib.sha256(json.dumps(m,sort_keys=True,separators=(',',':'),ensure_ascii=True).encode()).hexdigest()==p['binding_digest'],'binding digest')
outputs=read(HERE/'output-manifest.json')
for r in outputs['files']:check(sha(HERE/r['path'])==r['sha256'],'output drift')
r=read(HERE/'receipt.json')
check(r['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'source receipt')
check(r['output_manifest_sha256']==sha(HERE/'output-manifest.json'),'output receipt')
for x in r['input_receipt_refs']:check(sha(ROOT/x['path'])==x['sha256'],'input receipt')
check(r['result']=='PASS' and r['authority_effect']=='none','claim ceiling')
p=read(HERE/'progress.json')
check(p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
check(p['dependency_ready_product_nodes']==['R05','U00','L00'],'frontier')
expected={x['path'] for x in outputs['files']}|{'output-manifest.json','receipt.json','progress.json'}
check({str(x.relative_to(HERE)) for x in HERE.rglob('*') if x.is_file()}==expected,'file allowlist')
print(json.dumps({'verification':'PASS','node':'R04','recorded_tests':21,'scope':'local Operation replay adapter','recovery_product_approved':False}))
