from pathlib import Path
import hashlib, json, subprocess, tarfile, tempfile, sys
HERE=Path(__file__).resolve().parent
ROOT=Path(__file__).resolve().parents[7]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(v,msg):
    if not v:raise ValueError(msg)
source=read(HERE/'source-manifest.json')
for r in source['files']:require(sha(ROOT/r['path'])==r['sha256'],'source drift:'+r['path'])
lock=read(HERE/'compiler-lock.json')
require(sha(ROOT/lock['archive']['path'])==lock['archive']['sha256'],'archive drift')
require(sha(Path(lock['node']['path']))==lock['node']['sha256'],'Node drift')
for r in read(HERE/'runtime-lock.json')['files']:require(sha(Path(r['path']))==r['sha256'],'runtime drift:'+r['path'])
provider=read(HERE/'provider-contract.json')
for r in provider['schemas'].values():require(sha(HERE/r['path'])==r['sha256'],'schema drift')
require(provider['runtime_guarantees_observed'] is False,'provider overclaim')
require(len({r['resource'] for r in provider['schemas'].values()})==2,'transaction collapse')
constraints=read(ROOT/'projects/domainspec-v2/architecture/durable-recovery/constraints.json')['constraints']
cs={r['constraint_id']:r for r in constraints}
obs=read(HERE/'obligations.json')['obligations']
scenarios={s['scenario_id']:s for s in read(ROOT/'projects/domainspec-v2/development/completion-dag/v1/evidence/r01-recovery-v1/failure-matrix.json')['scenarios']}
require(len(obs)==30 and {r['constraint_ref'] for r in obs}==set(cs),'obligation coverage')
for r in obs:
    c=cs[r['constraint_ref']];s=scenarios[r['test_ref'].split(':',1)[1]]
    require(r['property_ref']==c['property_ref'] and r['owner_role']==c['owner_route'],'owner/property join')
    require(s['constraint_ref']==r['constraint_ref'] and r['runtime_result']=='not_evaluable','test join')
graph=read(HERE/'graph.json')
# Graph node representation is feature + source node identity.
model=read(HERE/'system-model/specs/recovery/feature.json')
node_refs={'recovery:'+n for n in model['nodes']}
scaffold=read(HERE/'scaffold-map.json')['components']
require(len(scaffold)==23 and all(r['node_ref'] in node_refs for r in scaffold),'scaffold mapping')
with tempfile.TemporaryDirectory(prefix='dsv2-r02-verify-') as scratch:
    with tarfile.open(ROOT/lock['archive']['path']) as t:t.extractall(scratch,filter='data')
    run=subprocess.run([lock['node']['path'],str(HERE/'compile.mjs'),str(Path(scratch)/'package'),str(HERE/'system-model'),str(HERE/'bindings.json')],capture_output=True,text=True,timeout=60)
    require(run.returncode==0,run.stderr)
    value=json.loads(run.stdout)
    require(value['graph']==graph and value['certificate']==read(HERE/'certificate.json'),'compiled artifact drift')
    require(value['binding_manifest']==read(HERE/'binding-manifest.json'),'binding drift')
    require(value['generated_contract']==(HERE/'generated-binding.py').read_text(),'generated contract drift')
if '--core' not in sys.argv:
    outputs=read(HERE/'output-manifest.json')
    for r in outputs['files']:require(sha(HERE/r['path'])==r['sha256'],'output drift:'+r['path'])
    actual={str(p.relative_to(HERE)) for p in HERE.rglob('*') if p.is_file()}
    require(actual=={r['path'] for r in outputs['files']}|{'output-manifest.json','receipt.json','progress.json'},'file allowlist')
    receipt=read(HERE/'receipt.json')
    require(receipt['source_manifest_sha256']==sha(HERE/'source-manifest.json'),'source receipt')
    require(receipt['output_manifest_sha256']==sha(HERE/'output-manifest.json'),'output receipt')
    require(receipt['result']=='PASS' and receipt['authority_effect']=='none','receipt ceiling')
    for r in receipt['input_receipt_refs']:require(sha(ROOT/r['path'])==r['sha256'],'input receipt')
    progress=read(HERE/'progress.json')
    require(progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json'),'progress receipt')
    require(progress['dependency_ready_product_nodes']==['R03','R04','U00','L00'],'frontier')
print(json.dumps({'result':'PASS','scope':'R02 system prototype only','nodes':len(graph['nodes']),'relationships':len(graph['relationships']),'owner_test_obligations':len(obs),'runtime_conformance':'not_evaluable'}))
