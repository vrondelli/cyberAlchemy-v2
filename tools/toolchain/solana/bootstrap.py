#!/usr/bin/env python3
"""Install locked SBF tooling without changing global Rust. Open questions: README.md."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tarfile
import urllib.request

here = Path(__file__).resolve().parent
lock = json.loads((here / 'lock.json').read_text())
if platform.system() != 'Linux' or platform.machine() != 'x86_64':
    raise SystemExit('This lock supports Linux x86_64 only')
cache = Path.home() / '.cache/cyberalchemy-exchange'
prereq = cache / 'sbf-prerequisites'
prereq.mkdir(parents=True, exist_ok=True)
for item in lock['openssl_packages']:
    archive = prereq / item['file']
    if not archive.exists():
        subprocess.run(['apt-get', 'download', item['package'] + '=' + item['version']], cwd=prereq, check=True)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != item['sha256']:
        raise SystemExit('OpenSSL archive hash mismatch: ' + archive.name)
    subprocess.run(['dpkg-deb', '-x', str(archive), str(prereq / 'root')], check=True)
data = Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share')))
install = data / 'cyberalchemy/toolchains' / lock['installation_id']
env = dict(os.environ)
env.update(OPENSSL_INCLUDE_DIR=str(prereq / 'root/usr/include'),
           OPENSSL_LIB_DIR=str(prereq / 'root/usr/lib/x86_64-linux-gnu'), OPENSSL_STATIC='0',
           CFLAGS='-I' + str(prereq / 'root/usr/include/x86_64-linux-gnu'))
subprocess.run([str(here.parent / 'run'), 'cargo', 'install', 'cargo-build-sbf',
                '--version', lock['cargo_build_sbf'], '--locked', '--jobs', '2', '--root', str(install)], env=env, check=True)
downloads = cache / 'sbf-downloads'
downloads.mkdir(parents=True, exist_ok=True)
archive = downloads / ('platform-tools-' + lock['platform_tools'] + '.tar.bz2')
if not archive.exists():
    partial = archive.with_suffix('.partial')
    urllib.request.urlretrieve(lock['platform_archive'], partial)
    partial.rename(archive)
if hashlib.sha256(archive.read_bytes()).hexdigest() != lock['platform_sha256']:
    raise SystemExit('Platform archive hash mismatch')
destination = Path.home() / '.cache/solana' / lock['platform_tools'] / 'platform-tools'
marker = destination / 'exchange-toolchain.json'
if destination.exists():
    if not marker.exists() or json.loads(marker.read_text())['archive_sha256'] != lock['platform_sha256']:
        raise SystemExit('Existing platform-tools installation has no matching receipt; left unchanged')
else:
    stage = destination.with_name('platform-tools-exchange-staging')
    stage.mkdir(parents=True, exist_ok=False)
    try:
        with tarfile.open(archive) as tar:
            tar.extractall(stage, filter='data')
        (stage / 'exchange-toolchain.json').write_text(json.dumps({'archive_sha256':lock['platform_sha256']})+'\n')
        stage.rename(destination)
    except BaseException:
        shutil.rmtree(stage)
        raise
print('Pinned Solana tooling ready. Global Rust selection unchanged.')
