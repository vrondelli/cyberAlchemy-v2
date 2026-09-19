"""Read-only packet currency and evidence-join verification, not a test rerun."""
from pathlib import Path
import hashlib
import json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def check(value, message):
    if not value:raise ValueError(message)
for row in read(HERE/'source-manifest.json')['files']:
    check(sha(ROOT/row['path'])==row['sha256'],'source drift: '+row['path'])
for row in read(HERE.parent/'r02-recovery-v1/runtime-lock.json')['files']:
    check(sha(Path(row['path']))==row['sha256'],'runtime drift')
t=read(HERE/'TEST-RESULTS.json')
check(t['result']=='PASS' and t['tests_per_repetition']==16 and len(t['repetitions'])==2,'test coverage')
for run in t['repetitions']:
    check(run['exit_code']==0 and 'Ran 16 tests' in run['stderr'] and run['stderr'].rstrip().endswith('OK'),'test result')
for name,digest in t['source_hashes'].items():check(sha(HERE/name)==digest,'tested source drift')
outputs=read(HERE/'output-manifest.json')
for row in outputs['files']:check(sha(HERE/row['path'])==row['sha256'],'output drift: '+row['path'])
receipt=read(HERE/'receipt.json')
check(receipt['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'source receipt')
check(receipt['output_manifest_sha256']==sha(HERE/'output-manifest.json'),'output receipt')
for row in receipt['input_receipt_refs']:check(sha(ROOT/row['path'])==row['sha256'],'input receipt')
check(receipt['result']=='PASS' and receipt['authority_effect']=='none','claim ceiling')
progress=read(HERE/'progress.json')
check(progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
prior=progress['prior_progress'];check(sha(ROOT/prior['path'])==prior['sha256'],'prior progress')
check(progress['dependency_ready_product_nodes']==['R06','U00','L00'],'frontier')
check(progress['program_complete'] is False,'program ceiling')
expected={row['path'] for row in outputs['files']}|{'output-manifest.json','receipt.json','progress.json'}
check({str(p.relative_to(HERE)) for p in HERE.rglob('*') if p.is_file()}==expected,'file allowlist')
print(json.dumps({'verification':'PASS','node':'R05','recorded_tests':16,'repetitions':2,'scope':'bounded fenced worker candidate','recovery_product_approved':False}))
