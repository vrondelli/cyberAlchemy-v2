"""Project a verified private bundle into an allowlisted, non-selling storefront."""
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile


def public_metadata(manifest, archive_bytes):
    if manifest.get('schema_version')!='keld.customer-bundle/v1':
        raise ValueError('Unsupported bundle manifest')
    if len(archive_bytes)!=manifest.get('bytes') or hashlib.sha256(archive_bytes).hexdigest()!=manifest.get('sha256'):
        raise ValueError('Bundle integrity mismatch')
    checks=manifest.get('validation',{})
    if not all(checks.get(k)=='PASS' for k in ['doctor','customer_profile','customer_context_projection']) or checks.get('reproducible') is not True:
        raise ValueError('Bundle validation incomplete')
    version=manifest.get('engine_version')
    if not isinstance(version,str) or not re.fullmatch(r'[0-9A-Za-z.+-]{1,100}',version):
        raise ValueError('Invalid engine version')
    return {'schema_version':'keld.release-preview/v1','product_id':'agent-reasoning-engine',
            'engine_version':version,'stage':'private-alpha-preview','bundle_bytes':len(archive_bytes),
            'platform':'Linux','node_version':'26.8.1','agent_version':'Codex 0.153.0-alpha.5',
            'contents':['Full engine','Installer','Project setup and agent launcher','Sample project','Getting-started instructions'],
            'verification':'Isolated installation and customer-context checks passed.',
            'license_status':'awaiting-owner-confirmation','checkout_enabled':False,'download_enabled':False}


def build():
    root=Path(__file__).resolve().parents[1]
    bundle=root/'evidence/customer-bundle'
    manifest=json.loads((bundle/'manifest.json').read_text())
    # The filename is fixed; arbitrary manifest paths are never resolved into public output.
    metadata=public_metadata(manifest,(bundle/'are-customer-bundle.tar.gz').read_bytes())
    out=root/'evidence/connected-preview'
    with tempfile.TemporaryDirectory(prefix='keld-preview-') as tmp:
        stage=Path(tmp)
        for name in ['build.py','index.template.html','shop.fragment.html','shop.dialogs.html']:
            shutil.copyfile(root/'prototype'/name,stage/name)
        shutil.copytree(root/'prototype/assets',stage/'assets')
        fragment=(stage/'shop.fragment.html').read_text()
        version=html.escape(metadata['engine_version'])
        fragment=fragment.replace('id="release-fact">Alpha version','id="release-fact">'+version)
        anchor='<section class="alpha-offer shell"'
        if fragment.count(anchor)!=1:raise ValueError('Shop insertion anchor changed')
        section=f'''<section class="download-journey shell" id="release-preview" aria-labelledby="release-preview-title">
<div class="download-journey-heading"><div><p class="eyebrow">FROM THE WORKBENCH / PRIVATE ALPHA</p><h2 id="release-preview-title">A working package.<br/><em>Being prepared for you.</em></h2></div><p>Version {version}<br/>{metadata['bundle_bytes']/1_000_000:.1f} MB package · Preview only</p></div>
<div class="download-steps"><article><span class="eyebrow">01 / IN THE PACKAGE</span><h3>Start with the whole engine.</h3><p>The engine, installer, project setup, agent launcher, sample project and getting-started instructions are bundled together.</p></article>
<article><span class="eyebrow">02 / TESTED SETUP</span><h3>Bring your agent.</h3><p>Linux · Node 26.8.1 · Codex 0.153.0-alpha.5. You provide the agent and model access. Installation and customer-context checks passed in an isolated environment.</p></article>
<article><span class="eyebrow">03 / BEFORE RELEASE</span><h3>Finishing the handoff.</h3><p>Licensing, delivery and customer support details are being finalized. The original offer terms below are provisional. Checkout and downloads remain unavailable.</p></article></div></section>
'''
        fragment=fragment.replace(anchor,section+anchor)
        (stage/'shop.fragment.html').write_text(fragment)
        subprocess.run(['python3',str(stage/'build.py')],check=True,capture_output=True,timeout=30)
        # Output contains only served pages/assets; no archives, private manifests or source inventory.
        staged_public=stage/'public';staged_public.mkdir()
        for name in ['index.html','shop.html','legend.html','keld-illustrated-standalone.html','keld-shop-standalone.html','keld-legend-standalone.html']:
            shutil.copyfile(stage/name,staged_public/name)
        shutil.copytree(stage/'assets',staged_public/'assets')
        (staged_public/'assets/are-release.json').write_text(json.dumps(metadata,indent=2)+'\n')
        # Preserve one generated preview; imported originals remain byte-identical.
        if out.exists():shutil.rmtree(out)
        shutil.copytree(staged_public,out)
    print(json.dumps({'status':'PASS','output':str(out),'engine_version':metadata['engine_version'],'checkout_enabled':False,'download_enabled':False}))


if __name__=='__main__':
    build()
