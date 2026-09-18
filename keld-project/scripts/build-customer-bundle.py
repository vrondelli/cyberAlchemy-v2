"""Build and independently exercise the private engine + onboarding bundle."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import uuid
from archive import pack, unpack

root=Path(__file__).resolve().parents[1]
candidate=root/'evidence/private-candidate'
engine_manifest=json.loads((candidate/'manifest.json').read_text())
engine_archive=candidate/'are-private-candidate.tar.gz'
if hashlib.sha256(engine_archive.read_bytes()).hexdigest()!=engine_manifest['sha256']:
    raise SystemExit('Engine archive hash mismatch')
out=root/'evidence/customer-bundle';out.mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(prefix='keld-bundle-') as temp:
    base=Path(temp);stage=base/'stage';stage.mkdir();(stage/'tools').mkdir();(stage/'example-project').mkdir()
    for source,target in [('manifest.json','engine-manifest.json'),('source-closure.json','engine-source-closure.json'),('are-private-candidate.tar.gz','are-private-candidate.tar.gz')]:
        shutil.copyfile(candidate/source,stage/target)
    for name in ['archive.py','install-private-engine.py','setup-customer-profile.mjs','customer-app-server.mjs','customer-runtime.mjs','with-writer-lock.py','reconcile-customer-state.py','create-customer-project.mjs']:
        shutil.copyfile(root/'scripts'/name,stage/'tools'/name)
    shutil.copyfile(root/'docs/BUNDLE-README.md',stage/'README.md')
    # Generate sample data at build time; the fixture generator is not a bundle runtime dependency.
    generator="import {customerFixture} from "+json.dumps((root/'scripts/customer-fixture.mjs').as_uri())+"; import {writeFileSync} from 'node:fs'; const input=customerFixture(process.argv[1]); input.persistent_state=true; writeFileSync(process.argv[1]+'/setup.json',JSON.stringify(input,null,2)+'\\n');"
    subprocess.run(['node','--input-type=module','-e',generator,str(stage/'example-project')],check=True,timeout=30)
    spec={'project_id':'bakery','definitions':[{'id':'batch','term':'Batch','meaning':'A batch contains twelve loaves.'},{'id':'pickup','term':'Pickup','meaning':'Pickup closes at 17:00.'}],'instructions':'Use the bakery definitions when explaining orders.','persistent_state':False}
    (stage/'project-spec.example.json').write_text(json.dumps(spec,indent=2)+'\n')
    entries=[]
    for path in sorted(stage.rglob('*')):
        if path.is_file():
            path.chmod(0o644);data=path.read_bytes()
            entries.append({'path':path.relative_to(stage).as_posix(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'mode':0o644})
    inventory={'files':entries}
    archive=base/'are-customer-bundle.tar.gz';pack(stage,inventory,archive)
    repeat=base/'repeat.tar.gz';pack(stage,inventory,repeat)
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    if hashlib.sha256(repeat.read_bytes()).hexdigest()!=digest:raise RuntimeError('Bundle is not reproducible')
    repeat.unlink()
    extracted=base/'extracted';unpack(archive,inventory,extracted)
    installed=extracted/'engine'
    subprocess.run(['python3',str(extracted/'tools/install-private-engine.py'),str(extracted),str(installed)],check=True,timeout=30,capture_output=True)
    image='node:26.8.1-bookworm-slim'
    image_id=subprocess.check_output(['docker','image','inspect',image,'--format','{{.Id}}'],text=True,timeout=30).strip()
    check="""
import {cpSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {setupCustomerProfile} from '/kit/tools/setup-customer-profile.mjs';
import {createCustomerProject} from '/kit/tools/create-customer-project.mjs';
import {createCodexAppServerWrapper} from '/kit/engine/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
import {readFileSync} from 'node:fs';
const doctor=spawnSync(process.execPath,['/kit/engine/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs','doctor','--json'],{encoding:'utf8',timeout:30000});
assert.equal(doctor.status,0); assert.equal(JSON.parse(doctor.stdout).status,'PASS');
cpSync('/kit/example-project','/work/customer',{recursive:true});
const input=JSON.parse(readFileSync('/work/customer/setup.json','utf8'));
const {loaded}=await setupCustomerProfile({engineRoot:'/kit/engine',projectRoot:'/work/customer',input});
const wrapper=createCodexAppServerWrapper({loaded_profile:loaded.value,decision_profile:loaded.decision_profile,definition_catalog:loaded.definition_catalog,ontology_snapshot:loaded.ontology_snapshot,source_snapshot:loaded.source_snapshot,context_source_provider:loaded.context_source_provider});
try {
const result=await wrapper.processClientMessage({jsonrpc:'2.0',id:1,method:'turn/start',params:{threadId:'bundle-check',input:[{type:'text',text:'Explain Widget'}]}});
assert.equal(result.to_server.length,1,JSON.stringify(result.to_client));
assert.match(JSON.stringify(result.to_server),/violet-widget-731/);
assert.doesNotMatch(JSON.stringify(result.to_server),/CAV2-D65|CA2-ROUTE|domainspec-core/);
const spec=JSON.parse(readFileSync('/kit/project-spec.example.json','utf8'));
const {loaded:authored}=await createCustomerProject({engineRoot:'/kit/engine',projectRoot:'/work/authored',input:spec});
const authoredWrapper=createCodexAppServerWrapper({loaded_profile:authored.value,decision_profile:authored.decision_profile,definition_catalog:authored.definition_catalog,ontology_snapshot:authored.ontology_snapshot,source_snapshot:authored.source_snapshot,context_source_provider:authored.context_source_provider});
try{
 const turn=await authoredWrapper.processClientMessage({jsonrpc:'2.0',id:2,method:'turn/start',params:{threadId:'authored',input:[{type:'text',text:'Explain a batch and pickup'}]}});
 assert.equal(turn.to_server.length,1);
 assert.match(JSON.stringify(turn.to_server),/twelve loaves/);
 assert.match(JSON.stringify(turn.to_server),/17:00/);
 assert.doesNotMatch(JSON.stringify(turn.to_server),/violet-widget|CAV2-D65|CA2-ROUTE/);
}finally{authoredWrapper.close()}
console.log(JSON.stringify({doctor:'PASS',customer_profile:'PASS',customer_context_projection:'PASS',customer_authoring:'PASS'}));
} finally {wrapper.close()}
"""
    name='keld-bundle-'+uuid.uuid4().hex[:12]
    try:
        run=subprocess.run(['docker','run','--name',name,'--rm','--pull=never','--network=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--tmpfs','/work:rw,nosuid,size=64m','--mount',f'type=bind,source={extracted},target=/kit,readonly','--workdir','/work',image_id,'node','--input-type=module','-e',check],text=True,capture_output=True,timeout=90)
        if run.returncode:raise RuntimeError('Bundle validation failed: '+run.stderr[-4000:])
        validation=json.loads(run.stdout)
    finally:
        subprocess.run(['docker','rm','-f',name],capture_output=True,timeout=15)
    manifest={'schema_version':'keld.customer-bundle/v1','engine_version':engine_manifest['version'],'engine_archive_sha256':engine_manifest['sha256'],'archive':archive.name,'sha256':digest,'bytes':archive.stat().st_size,'files':entries,'sale_approved':False,'publication_approved':False,'validation':{'reproducible':True,'image_id':image_id,**validation},'limitations':['licensing and notices unresolved','live agent is not bundled','interrupted-task recovery unverified']}
    pending=out/'.archive.pending'
    try:shutil.copyfile(archive,pending);pending.replace(out/archive.name)
    finally:pending.unlink(missing_ok=True)
    (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({k:manifest[k] for k in ['archive','sha256','bytes','sale_approved','validation']}))
