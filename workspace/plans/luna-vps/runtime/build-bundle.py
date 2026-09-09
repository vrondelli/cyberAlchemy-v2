#!/usr/bin/env python3
"""Build an isolated, relocatable fixture candidate. Open questions: ../HOST-PLAN.md."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tarfile


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', required=True, type=Path)
    parser.add_argument('--codex', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    checkout = here.parents[3]
    parent = checkout.parent
    product = checkout / 'implementation/agent-reasoning-engine'
    binding = json.loads((here.parent / 'host-binding.candidate.json').read_text())
    assert sha(args.codex) == binding['runtime']['codex_sha256'], 'Codex hash mismatch'
    for binary, expected in [(args.node, 'v' + binding['runtime']['node_version']),
                             (args.codex, 'codex-cli ' + binding['runtime']['codex_version'])]:
        observed = subprocess.check_output([str(binary), '--version'], text=True).strip()
        assert observed == expected, (observed, expected)
    closure = json.loads(subprocess.check_output(
        [str(args.node), str(product / 'bin/are.mjs'), 'closure', '--json'], text=True))
    files = {item['path']: item['sha256'] for item in closure['files']}
    base = (here.parent / binding['base_profile_ref']).resolve()
    assert sha(base) == binding['base_profile_sha256'], 'Base profile changed'
    profile = json.loads(base.read_text())
    profile['gateway'].update(binding['profile_overrides']['gateway'])

    def sources(value):
        if isinstance(value, dict):
            path = value.get('path')
            if isinstance(path, str) and path.startswith('cyberAlchemy-v2/'):
                source = parent / path
                assert source.resolve().is_relative_to(checkout), path
                if source.is_file() and path not in files:
                    files[path] = sha(source)
                    if source.suffix == '.json':
                        sources(json.loads(source.read_text()))
            for item in value.values():
                sources(item)
        elif isinstance(value, list):
            for item in value:
                sources(item)

    sources(profile)
    decision = product / 'packages/request-decision-router/profiles/cyberalchemy-v1.json'
    sources(json.loads(decision.read_text()))
    # Only the product closure and explicitly selected profile/provenance files.
    root = args.output.resolve()
    root.mkdir(parents=True, exist_ok=False)
    for name, digest in sorted(files.items()):
        source = parent / name
        assert source.resolve().is_relative_to(checkout), name
        assert not source.is_symlink(), name
        assert not any(part in {'.git', '.env', 'node_modules', '.runtime'} for part in source.parts), name
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        assert sha(target) == digest, 'Source changed during build: ' + name
    (root / 'bin').mkdir()
    for name, source in [('node', args.node), ('codex', args.codex)]:
        shutil.copyfile(source, root / 'bin' / name)
        (root / 'bin' / name).chmod(0o755)
    node_license = args.node.parent.parent / 'LICENSE'
    shutil.copyfile(node_license, root / 'bin/NODE-LICENSE')
    (root / 'pilot-profile.json').write_text(json.dumps(profile, indent=2) + '\n')
    canary = root / 'cyberAlchemy-v2/implementation/agent-reasoning-engine/scripts/portable-full-wrapper-canary.mjs'
    shutil.copyfile(product / 'scripts/test-native-prompt-hook.mjs', canary)
    subprocess.run(['patch', '--batch', '--fuzz=0', str(canary), str(here / 'full-wrapper-canary.patch')], check=True)
    manifest = {'schema_version': 'are.vps-fixture-bundle/v1', 'authority_effect': 'none',
                'scope': 'disposable native full-wrapper fixture; no live model or service activation',
                'product_closure_digest': closure['closure_digest'],
                'open_questions_ref': 'workspace/plans/luna-vps/HOST-PLAN.md#open-questions',
                'files': [{'path': str(p.relative_to(root)), 'sha256': sha(p), 'bytes': p.stat().st_size}
                          for p in sorted(root.rglob('*')) if p.is_file()]}
    (root / 'MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (root / 'SHA256SUMS').write_text(''.join(f"{f['sha256']}  {f['path']}\n" for f in manifest['files'])
                                   + f"{sha(root / 'MANIFEST.json')}  MANIFEST.json\n")
    archive = root.with_suffix('.tar.gz')
    with tarfile.open(archive, 'w:gz', compresslevel=1) as out:
        out.add(root, arcname='candidate')
    print(json.dumps({'archive': str(archive), 'sha256': sha(archive),
                      'manifest_sha256': sha(root / 'MANIFEST.json'), 'files': len(manifest['files'])}))


if __name__ == '__main__':
    main()
