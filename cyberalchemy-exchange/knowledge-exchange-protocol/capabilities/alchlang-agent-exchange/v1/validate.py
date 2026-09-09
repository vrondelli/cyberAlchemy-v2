#!/usr/bin/env python3
"""Build and test the local ARE/KEP product candidate without live services."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[5]
COMPILER=REPO/'cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/implementation'
ARE=REPO/'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime'
KEP=ROOT.parents[2]/'runtime'
DS=REPO/'projects/domainspec-v2'
EXCLUDED={'PRODUCT-TEST-RESULT.json','DEMO-RESULT.json','PARTIAL-TEST-RESULT.json'}

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def canonical(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()

def relative_imports(seeds):
    pending=list(seeds);seen=set()
    while pending:
        path=pending.pop().resolve()
        if path in seen:continue
        if not path.is_relative_to(REPO):raise ValueError('dependency outside repository: '+str(path))
        seen.add(path)
        if path.suffix not in {'.mjs','.js','.ts','.mts'}:continue
        for ref in re.findall(r'''(?:from\s*|import\s*\(\s*|import\s*)["'](\.[^"']+)["']''',path.read_text()):
            target=path.parent/ref
            candidates=[target,target.with_suffix('.ts'),Path(str(target)+'.ts'),target/'index.ts',target/'index.mjs']
            selected=next((p for p in candidates if p.is_file()),None)
            if selected is None:raise ValueError('unresolved source dependency '+str(target))
            pending.append(selected)
    return seen

def manifest():
    files={p for p in ROOT.rglob('*') if p.is_file() and p.name not in EXCLUDED and not any(part.startswith('.run-') or part in {'target','__pycache__'} for part in p.relative_to(ROOT).parts)}
    files.update(relative_imports([ARE/'controller.mjs',ARE/'model-transport.mjs',ARE/'verifier.mjs',DS/'impl/tools/minted-project/views.ts']))
    files.update((COMPILER/'src').glob('*.ts'))
    files.update(KEP.glob('src/**/*.rs'));files.update((KEP/'adapters/src').glob('*.rs'))
    files.update([COMPILER/'package.json',KEP/'Cargo.toml',KEP/'adapters/Cargo.toml',ARE/'package.json',DS/'impl/package.json',REPO/'toolchains/node-typescript/bin/node-env'])
    for registry in ['definitions/minted-project/supported-profiles.yml','definitions/meta-types/meta-types.yml','definitions/relationships/relationships.yml','impl/spec/minted-project/formations/entity-body.schema.json','impl/spec/minted-project/formations/rule-body.schema.json']:
        files.add(DS/registry)
    return {str(p.relative_to(REPO)):sha(p) for p in sorted(files)}

def node_command(*args):
    return [str(REPO/'toolchains/node-typescript/bin/node-env'),'run','--project','projects/domainspec-v2/impl','--',*args]

def invoke(command,timeout=180,env=None):
    return subprocess.run(command,cwd=REPO,env=env,capture_output=True,text=True,timeout=timeout)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-evidence',action='store_true')
    args=parser.parse_args()
    before=manifest();checks=[];demo=None;binary_digest=None
    with tempfile.TemporaryDirectory(prefix='kep-alchlang-build-') as target:
        # Reusable compiler output is optional and stays outside repository sources.
        build_target=Path(os.environ.get('KEP_BUILD_TARGET',target)).resolve()
        if build_target.is_relative_to(REPO):raise ValueError('KEP_BUILD_TARGET must be outside repository')
        env={**os.environ,'CARGO_TARGET_DIR':str(build_target)}
        build=invoke(['cargo','build','--offline','--locked','--manifest-path',str(ROOT/'bridge/Cargo.toml')],timeout=300,env=env)
        checks.append({'check':'rust-bridge-build','status':'PASS' if build.returncode==0 else 'FAIL','output':(build.stdout+build.stderr)[-10000:]})
        # Replay generated model and DomainSpec views even if native build fails.
        replay_cmd=node_command('node','--import','tsx','../../../'+str((ROOT/'build.ts').relative_to(REPO)),'--emit-json')
        first=invoke(replay_cmd);second=invoke(replay_cmd)
        replay_ok=first.returncode==second.returncode==0 and first.stdout==second.stdout
        if replay_ok:
            artifacts=json.loads(first.stdout)
            replay_ok=all((ROOT/'generated'/name).read_text()==value for name,value in artifacts.items())
        checks.append({'check':'alchlang-and-domainspec-replay','status':'PASS' if replay_ok else 'FAIL','error':None if replay_ok else (first.stderr+second.stderr)[-2000:]})
        if build.returncode==0:
            executable=build_target/'debug/kep-alchlang-local-bridge';binary_digest=sha(executable)
            with tempfile.TemporaryDirectory(prefix='.run-',dir=ROOT) as run:
                binary=Path(run)/'kep-bridge';shutil.copy2(executable,binary)
                command=node_command('env','KEP_BRIDGE_BINARY=/workspace/'+str(binary.relative_to(REPO)),'node','--import','tsx')
                tests=invoke(command+['--test',*['../../../'+str((ROOT/p).relative_to(REPO)) for p in ['exchange.test.ts','integration.test.ts']]])
                matched=re.search(r'(?:ℹ|#)\s*tests\s+(\d+)',tests.stdout)
                count=int(matched[1]) if matched else 0
                checks.append({'check':'receiver-and-are-kep-integration','status':'PASS' if tests.returncode==0 and count>=21 else 'FAIL','test_count':count,'output':(tests.stdout+tests.stderr)[-14000:]})
                demo_run=invoke(command+['../../../'+str((ROOT/'demo.ts').relative_to(REPO))])
                if demo_run.returncode==0:demo=json.loads(demo_run.stdout)
                good=demo is not None and demo['status']=='PASS' and demo['signature_verified'] and demo['bundle_verified'] and bool(demo['bundle']['files']) and demo['kep']['acknowledgements']==1 and len(demo['agents'])==2
                checks.append({'check':'two-agent-demo','status':'PASS' if good else 'FAIL','error':None if good else demo_run.stderr[-2000:]})
        else:
            checks.extend({'check':name,'status':'not_evaluable','reason':'Rust bridge build failed'} for name in ['receiver-and-are-kep-integration','two-agent-demo'])
    simulation=invoke(['python3','-B',str(ROOT/'simulate.py')])
    checks.append({'check':'simulation-without-kep','status':'PASS' if simulation.returncode==0 else 'FAIL',
        'output':(simulation.stdout+simulation.stderr)[-6000:]})
    after=manifest()
    checks.append({'check':'selected-source-stability','status':'PASS' if before==after else 'FAIL'})
    prototype=json.loads((ROOT/'prototype.json').read_text())
    checks.append({'check':'host-and-authority-boundary','status':'PASS' if prototype['implementation']['host_runtime']=='ARE Coding-Agent Runtime' and prototype['product_approval'] is None and prototype['authority_effect']=='none' else 'FAIL'})
    definitions={d['id'] for d in prototype['definitions']}
    scaffold=prototype['ontology_scaffold']
    semantic_ok=(len(definitions)==4 and set(scaffold['nodes'])==definitions and scaffold['registered'] is False
        and all(r['source'] in definitions and r['target'] in definitions for r in scaffold['relations'])
        and json.loads((COMPILER/'package.json').read_text())['version']=='0.4.0-candidate.0')
    checks.append({'check':'prototype-scaffold-and-compiler-version','status':'PASS' if semantic_ok else 'FAIL'})
    result={'status':'PASS' if all(c['status']=='PASS' for c in checks) else 'BLOCK','candidate_digest':hashlib.sha256(canonical(after)).hexdigest(),
      'manifest':after,'bridge_binary_sha256':binary_digest,'checks':checks,'product_approval':None,'authority_effect':'none',
      'live_model_invoked':False,'solana_invoked':False,'claim_ceiling':'One tested local ARE scripted exchange with real KEP encryption and state transitions. No production, remote identity, durable delivery, Solana finality or deployment claim.'}
    if args.write_evidence and result['status']=='PASS':
        (ROOT/'PRODUCT-TEST-RESULT.json').write_text(json.dumps(result,indent=2)+'\n')
        (ROOT/'DEMO-RESULT.json').write_text(json.dumps({'candidate_digest':result['candidate_digest'],**demo},indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='manifest'},indent=2))
    return 0 if result['status']=='PASS' else 1

if __name__=='__main__':
    try:raise SystemExit(main())
    except (OSError,ValueError,subprocess.SubprocessError) as error:
        print(json.dumps({'status':'BLOCK','error':str(error),'authority_effect':'none'}));raise SystemExit(1)
