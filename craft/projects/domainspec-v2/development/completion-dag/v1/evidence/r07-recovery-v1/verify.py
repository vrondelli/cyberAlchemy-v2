from pathlib import Path
import hashlib,json
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[6]
def read(path):return json.loads(path.read_text())
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def check(value,message):
    if not value:raise ValueError(message)
for row in read(HERE/'source-manifest.json')['files']:check(sha(ROOT/row['path'])==row['sha256'],'source drift: '+row['path'])
for row in read(HERE.parent/'r02-recovery-v1/runtime-lock.json')['files']:check(sha(Path(row['path']))==row['sha256'],'runtime drift')
node=read(HERE.parent/'r02-recovery-v1/compiler-lock.json')['node'];check(sha(Path(node['path']))==node['sha256'],'Node drift')
results=read(HERE/'RESULTS.json')
check(results['status']=='PASS' and len(results['runs'])==60,'campaign status')
for name,digest in results['inputs'].items():check(sha(HERE/name)==digest,'tested harness drift: '+name)
expected=[row['scenario_id'] for row in read(HERE.parent/'r01-recovery-v1/failure-matrix.json')['scenarios']]
mapping=read(HERE/'scenario-map.json')['scenarios'];check([r['scenario_id'] for r in mapping]==expected,'matrix coverage')
for repetition in [1,2]:
    runs=[r for r in results['runs'] if r['repetition']==repetition]
    check([r['scenario_id'] for r in runs]==(expected if repetition==1 else list(reversed(expected))),'replay order')
    for run in runs:
        check(run['result']=='PASS' and run['exit_code']==0 and run['duration_seconds']<30,'scenario result')
        observation=run['observation'];check(observation['result']=='PASS','observation result')
        selected=next(r for r in mapping if r['scenario_id']==run['scenario_id'])
        check([r['test'] for r in observation['tests']]==selected['tests'],'executed test coverage')
        for test in observation['tests']:check(test['result']=='PASS' and test['tests_run']==1 and test['raw_output'].rstrip().endswith('OK'),'test failure or skip')
        if selected['contract_probe']:check(observation['contract_probe']['exit_code']==0 and json.loads(observation['contract_probe']['stdout'])['result']=='PASS','contract result')
manifest=read(HERE/'PRODUCT-TEST-MANIFEST.json')
check(manifest['results_sha256']==sha(HERE/'RESULTS.json') and manifest['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'product-test binding')
check(manifest['product_approved'] is False and manifest['authority_effect']=='none','approval ceiling')
for row in manifest['implementation_files']:check(sha(ROOT/row['path'])==row['sha256'],'candidate drift')
coverage=read(HERE/'COVERAGE.json')['scenarios'];check([row['scenario_id'] for row in coverage]==expected,'coverage report')
check(all(row['result']=='PASS' and row['repetitions']==[1,2] for row in coverage),'coverage status')
replay=read(HERE/'REPLAY-REPORT.json');check(replay['results_sha256']==sha(HERE/'RESULTS.json') and replay['independent_reviewer'] is False,'replay scope')
for row in read(HERE/'output-manifest.json')['files']:check(sha(HERE/row['path'])==row['sha256'],'packet drift')
r=read(HERE/'receipt.json')
check(r['output_manifest_sha256']==sha(HERE/'output-manifest.json') and r['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'receipt binding')
for row in r['input_receipt_refs']:check(sha(ROOT/row['path'])==row['sha256'],'input receipt')
p=read(HERE/'progress.json');check(p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
check(sha(ROOT/p['prior_progress']['path'])==p['prior_progress']['sha256'],'prior progress')
check(p['dependency_ready_product_nodes']==['R08','U00','L00'] and p['program_complete'] is False,'frontier')
allowed={r['path'] for r in read(HERE/'output-manifest.json')['files']}|{'output-manifest.json','receipt.json','progress.json'}
check({str(p.relative_to(HERE)) for p in HERE.rglob('*') if p.is_file()}==allowed,'file allowlist')
print(json.dumps({'verification':'PASS','node':'R07','scenarios':30,'executions':60,'replay':'isolated processes, same authored tests','product_approved':False}))
