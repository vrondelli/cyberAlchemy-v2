"""Verify source/output identity and recorded test evidence without rerunning effects."""
from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(ok,msg):
    if not ok:raise ValueError(msg)
for r in read(HERE/'source-manifest.json')['files']:
    check(sha(ROOT/r['path'])==r['sha256'],'source drift:'+r['path'])
for r in read(HERE.parent/'r02-recovery-v1/runtime-lock.json')['files']:
    check(sha(Path(r['path']))==r['sha256'],'selected runtime drift:'+r['path'])
test=read(HERE/'TEST-RESULTS.json')
check(test['exit_code']==0 and test['result']=='PASS','test result')
check('Ran 24 tests' in test['stderr'] and test['stderr'].rstrip().endswith('OK'),'test count')
for n,h in test['source_hashes'].items():check(sha(HERE/n)==h,'tested source drift:'+n)
for r in read(HERE/'output-manifest.json')['files']:
    check(sha(HERE/r['path'])==r['sha256'],'output drift:'+r['path'])
receipt=read(HERE/'receipt.json')
check(receipt['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'source receipt')
check(receipt['output_manifest_sha256']==sha(HERE/'output-manifest.json'),'output receipt')
for r in receipt['input_receipt_refs']:check(sha(ROOT/r['path'])==r['sha256'],'input receipt')
check(receipt['result']=='PASS' and receipt['authority_effect']=='none','claim ceiling')
progress=read(HERE/'progress.json')
check(progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
check(progress['dependency_ready_product_nodes']==['R04','U00','L00'],'frontier')
expected={r['path'] for r in read(HERE/'output-manifest.json')['files']}|{'output-manifest.json','receipt.json','progress.json'}
check({str(p.relative_to(HERE)) for p in HERE.rglob('*') if p.is_file()}==expected,'file allowlist')
print(json.dumps({'verification':'PASS','node':'R03','recorded_tests':24,'scope':'atomic coordination store candidate','recovery_product_approved':False}))
