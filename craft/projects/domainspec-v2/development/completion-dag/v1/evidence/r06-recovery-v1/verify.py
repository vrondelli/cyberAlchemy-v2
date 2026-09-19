"""Read-only source currency, test binding and packet closure verification."""
from pathlib import Path
import hashlib
import json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(path):return json.loads(path.read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def check(value,message):
    if not value:raise ValueError(message)
for row in read(HERE/'source-manifest.json')['files']:
    check(sha(ROOT/row['path'])==row['sha256'],'source drift: '+row['path'])
for row in read(HERE.parent/'r02-recovery-v1/runtime-lock.json')['files']:
    check(sha(Path(row['path']))==row['sha256'],'runtime drift')
tests=read(HERE/'TEST-RESULTS.json')
check(tests['result']=='PASS' and tests['tests_per_repetition']==20 and len(tests['repetitions'])==2,'test coverage')
for run in tests['repetitions']:
    check(run['exit_code']==0 and 'Ran 20 tests' in run['stderr'] and run['stderr'].rstrip().endswith('OK'),'test result')
check(set(tests['source_hashes'])=={'recovery.py','test_recovery.py'},'tested source allowlist')
for name,digest in tests['source_hashes'].items():check(sha(HERE/name)==digest,'tested source drift')
outputs=read(HERE/'output-manifest.json')
for row in outputs['files']:check(sha(HERE/row['path'])==row['sha256'],'output drift: '+row['path'])
receipt=read(HERE/'receipt.json')
check(receipt['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'source receipt')
check(receipt['output_manifest_sha256']==sha(HERE/'output-manifest.json'),'output receipt')
for row in receipt['input_receipt_refs']:check(sha(ROOT/row['path'])==row['sha256'],'input receipt')
check(receipt['result']=='PASS' and receipt['authority_effect']=='none','claim ceiling')
check(receipt['checks_with_observed_results']==read(HERE/'CHECKS.json')['checks'],'check receipt')
progress=read(HERE/'progress.json')
check(progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
prior=progress['prior_progress'];check(sha(ROOT/prior['path'])==prior['sha256'],'prior progress')
check(progress['dependency_ready_product_nodes']==['R07','U00','L00'],'frontier')
check(progress['program_complete'] is False,'program ceiling')
expected={row['path'] for row in outputs['files']}|{'output-manifest.json','receipt.json','progress.json'}
check({str(path.relative_to(HERE)) for path in HERE.rglob('*') if path.is_file()}==expected,'file allowlist')
print(json.dumps({'verification':'PASS','node':'R06','recorded_tests':20,'repetitions':2,'scope':'local persisted retry, terminal and restart candidate','recovery_product_approved':False}))
