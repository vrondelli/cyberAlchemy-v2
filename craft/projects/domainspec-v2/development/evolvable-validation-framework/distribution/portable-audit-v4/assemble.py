#!/usr/bin/env python3
"""Create a new candidate from the immutable 0.3.0 archive and authored overlays."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import sys
import tarfile

HERE = Path(__file__).resolve().parent
KIT = HERE / 'kit'
BASE = HERE.parent / 'portable-audit-v3/artifacts/evf-audit-kit-0.3.0-linux-x86_64.tar.gz'
BASE_SHA = '9e49b226355bbc1a2c6d8a312737a5bbe6e7e05735d4d4844b7ff676a3a8f201'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare():
    if KIT.exists() or KIT.is_symlink() or sha(BASE) != BASE_SHA:
        raise RuntimeError('Require an absent kit directory and unchanged 0.3.0 base')
    templates = sorted(p for p in (HERE / 'template').rglob('*') if p.is_file())
    if not templates or any(p.is_symlink() or '__pycache__' in p.parts for p in templates):
        raise RuntimeError('Unsafe or empty template set')
    KIT.mkdir()
    with tarfile.open(BASE) as archive:
        for member in archive.getmembers():
            parts = Path(member.name).parts
            if not member.isfile() or parts[0] != 'evf-audit-kit-0.3.0' or '..' in parts:
                raise RuntimeError('Unsafe predecessor member')
            target = KIT.joinpath(*parts[1:])
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as stream:
                stream.write(archive.extractfile(member).read())
            target.chmod(member.mode)
    for template in templates:
        target = KIT / template.relative_to(HERE / 'template')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(template.read_bytes())
    (KIT / 'evf').chmod(0o755)
    build = KIT / 'build.py'
    build.write_text(build.read_text().replace('"0.3.0-candidate"', '"0.4.0-candidate"'))
    provenance = json.loads((KIT / 'SOURCE-PROVENANCE.json').read_text())
    provenance.update(version='0.4.0-candidate', portable_base_archive_sha256=BASE_SHA,
                      portable_extension='Mandatory Bubblewrap CLI containment; Rust core unchanged; historical example projections inherited from 0.3.0, not containment attestations')
    (KIT / 'SOURCE-PROVENANCE.json').write_text(json.dumps(provenance, indent=2) + '\n')
    runpy.run_path(str(build))['manifest']()
    print('Prepared 0.4.0; validate before archiving')


def archive():
    subprocess.run([sys.executable, '-B', str(KIT / 'check_examples.py')], cwd=KIT, check=True)
    manifest = json.loads((KIT / 'KIT-MANIFEST.json').read_text())
    if manifest['version'] != '0.4.0-candidate':
        raise RuntimeError('Wrong candidate version')
    for template in (HERE / 'template').rglob('*'):
        if template.is_file() and template.read_bytes() != (KIT / template.relative_to(HERE / 'template')).read_bytes():
            raise RuntimeError('Template/kit drift: ' + str(template))
    entries = manifest['files'] + [{'path': 'KIT-MANIFEST.json', 'sha256': sha(KIT / 'KIT-MANIFEST.json'), 'size_bytes': (KIT / 'KIT-MANIFEST.json').stat().st_size}]
    for item in entries:
        path = KIT / item['path']
        if path.is_symlink() or not path.resolve().is_relative_to(KIT) or sha(path) != item['sha256'] or path.stat().st_size != item['size_bytes']:
            raise RuntimeError('Candidate drift: ' + item['path'])
        if any(marker in path.read_bytes() for marker in (b'/home/vrondelli', b'/mnt/c/Users/vlad_', b'domainspec-core', b'projects/domainspec-v2', b'cyberAlchemy-v2')):
            raise RuntimeError('Private locator in export: ' + item['path'])
    folder = HERE / 'artifacts'
    folder.mkdir(exist_ok=True)
    output = folder / 'evf-audit-kit-0.4.0-linux-x86_64.tar.gz'
    with output.open('xb') as stream:
        with gzip.GzipFile(filename='', mode='wb', fileobj=stream, mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode='w') as tar:
                for item in sorted(entries, key=lambda i: i['path']):
                    path = KIT / item['path']
                    info = tar.gettarinfo(str(path), arcname='evf-audit-kit-0.4.0/' + item['path'])
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ''
                    info.mode = 0o755 if item['path'] == 'evf' or item['path'].startswith('bin/') else 0o644
                    with path.open('rb') as source:
                        tar.addfile(info, source)
    with (folder / 'SHA256SUMS').open('x') as stream:
        stream.write(sha(output) + '  ' + output.name + '\n')
    print(json.dumps({'archive': str(output), 'sha256': sha(output), 'size_bytes': output.stat().st_size, 'published': False}))


def sync():
    if (HERE / 'artifacts/evf-audit-kit-0.4.0-linux-x86_64.tar.gz').exists():
        raise RuntimeError('An archived candidate must not be changed')
    if not KIT.is_dir() or sha(BASE) != BASE_SHA:
        raise RuntimeError('Require prepared prototype and unchanged predecessor')
    for source in (HERE / 'template').rglob('*'):
        if source.is_file():
            if source.is_symlink() or '__pycache__' in source.parts:
                raise RuntimeError('Unsafe template')
            target = KIT / source.relative_to(HERE / 'template')
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
    (KIT / 'evf').chmod(0o755)
    runpy.run_path(str(KIT / 'build.py'))['manifest']()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['prepare', 'sync', 'archive'])
    args = parser.parse_args()
    {'prepare': prepare, 'sync': sync, 'archive': archive}[args.action]()
