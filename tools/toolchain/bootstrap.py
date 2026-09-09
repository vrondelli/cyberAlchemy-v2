#!/usr/bin/env python3
"""Install the locked user-owned Linux toolchain. Open questions: README.md."""
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
LOCK = json.loads((HERE / 'lock.json').read_text())

def run(*args, **kwargs):
    subprocess.run(args, check=True, **kwargs)

def main():
    system = dict(line.split('=', 1) for line in Path('/etc/os-release').read_text().splitlines() if '=' in line)
    if system.get('ID', '').strip('"') != 'ubuntu' or system.get('VERSION_ID', '').strip('"') != '26.04' or platform.machine() != 'x86_64':
        raise SystemExit('This package lock supports Ubuntu 26.04 x86_64 only; see README.md.')
    data = Path(os.environ.get('XDG_DATA_HOME', str(Path.home() / '.local/share')))
    root = data / 'cyberalchemy/toolchains' / LOCK['installation_id']
    digest = hashlib.sha256((HERE / 'lock.json').read_bytes()).hexdigest()
    root.parent.mkdir(parents=True, exist_ok=True)
    marker = root / 'installation.json'
    if root.exists():
        if not marker.exists() or json.loads(marker.read_text())['lock_sha256'] != digest:
            raise SystemExit(f'Existing incomplete or different installation: {root}; inspect before removing it.')
        print(f'Using verified package installation: {root}', flush=True)
    else:
        with tempfile.TemporaryDirectory(prefix='.install-', dir=root.parent) as directory:
            stage = Path(directory)
            downloads = stage / 'downloads'
            downloads.mkdir()
            run('apt-get', 'download', *[p['package'] + '=' + p['version'] for p in LOCK['packages']], cwd=downloads)
            by_hash = {hashlib.sha256(p.read_bytes()).hexdigest(): p for p in downloads.glob('*.deb')}
            sysroot = stage / 'root/sysroot'
            sysroot.mkdir(parents=True)
            for package in LOCK['packages']:
                archive = by_hash.get(package['sha256'])
                if archive is None:
                    raise SystemExit(f"Missing or mismatched archive: {package['package']}")
                run('dpkg-deb', '--extract', str(archive), str(sysroot))
            # The compiler is isolated; runtime glibc remains the installed host's ABI.
            # Ubuntu uses merged /usr; linker scripts also reference /lib and /lib64.
            for alias in ['lib', 'lib64']:
                target = sysroot / alias
                if not target.exists() and not target.is_symlink():
                    target.symlink_to('usr/' + alias)
            libraries = sysroot / 'usr/lib/x86_64-linux-gnu'
            libraries.mkdir(parents=True, exist_ok=True)
            for name in ['libc.so.6', 'libm.so.6', 'libmvec.so.1', 'libdl.so.2', 'libpthread.so.0', 'librt.so.1', 'ld-linux-x86-64.so.2']:
                installed = Path('/usr/lib/x86_64-linux-gnu') / name
                target = libraries / name
                if installed.exists() and not target.exists() and not target.is_symlink():
                    target.symlink_to(installed)
            loader = sysroot / 'usr/lib64/ld-linux-x86-64.so.2'
            loader.parent.mkdir(exist_ok=True)
            if not loader.exists() and not loader.is_symlink():
                loader.symlink_to('/lib64/ld-linux-x86-64.so.2')
            binaries = stage / 'root/bin'
            binaries.mkdir()
            for name in ['cc', 'gcc', 'c++', 'g++', 'cpp']:
                shutil.copyfile(HERE / 'compiler.sh', binaries / name)
                (binaries / name).chmod(0o755)
            for name in ['ar', 'as', 'ld', 'nm', 'objcopy', 'objdump', 'ranlib', 'readelf', 'strip', 'make']:
                (binaries / name).symlink_to('../sysroot/usr/bin/' + ('make' if name == 'make' else 'x86_64-linux-gnu-' + name))
            receipt = {'lock_sha256': digest, 'installation_id': LOCK['installation_id'], 'compiler_wrapper_sha256': hashlib.sha256((HERE / 'compiler.sh').read_bytes()).hexdigest(), 'host_runtime': '/usr/lib/x86_64-linux-gnu', 'open_questions_ref': str(HERE / 'README.md')}
            (stage / 'root/installation.json').write_text(json.dumps(receipt, indent=2) + '\n')
            (stage / 'root').rename(root)
    # Refresh only this setup's owned wrappers; package payload remains immutable.
    for name in ['cc', 'gcc', 'c++', 'g++', 'cpp']:
        shutil.copyfile(HERE / 'compiler.sh', root / 'bin' / name)
        (root / 'bin' / name).chmod(0o755)
    receipt = json.loads(marker.read_text())
    receipt['compiler_wrapper_sha256'] = hashlib.sha256((HERE / 'compiler.sh').read_bytes()).hexdigest()
    marker.write_text(json.dumps(receipt, indent=2) + '\n')
    # Link installed runtime libraries needed by GCC's development linker scripts.
    for name in ['libgcc_s.so.1', 'libstdc++.so.6']:
        target = root / 'sysroot/usr/lib/x86_64-linux-gnu' / name
        installed = Path('/usr/lib/x86_64-linux-gnu') / name
        if not installed.exists():
            raise SystemExit(f'Missing host runtime prerequisite: {installed}')
        if not target.exists() and not target.is_symlink():
            target.symlink_to(installed)
    # Existing rustup owns Rust. Do not change its global default or shell startup files.
    cargo_home = Path(os.environ.get('CARGO_HOME', str(Path.home() / '.cargo')))
    rustup = cargo_home / 'bin/rustup'
    if not rustup.is_file():
        raise SystemExit('Install rustup from https://rustup.rs first, then rerun this bootstrap.')
    run(str(rustup), 'toolchain', 'install', LOCK['rust'], '--profile', 'minimal', '--component', 'rustfmt', '--component', 'clippy')
    # ~/.local/bin is already in this host's PATH. Never replace an unrelated command.
    local_bin = Path.home() / '.local/bin'
    local_bin.mkdir(parents=True, exist_ok=True)
    links = {name: root / 'bin' / name for name in ['cc', 'gcc', 'c++', 'g++', 'cpp', 'make']}
    links.update({name: cargo_home / 'bin' / name for name in ['rustup', 'cargo', 'rustc', 'rustdoc', 'rustfmt', 'cargo-fmt', 'cargo-clippy', 'clippy-driver']})
    for name, target in links.items():
        link = local_bin / name
        if link.exists() or link.is_symlink():
            if not link.is_symlink() or link.resolve() != target.resolve():
                old = Path(os.readlink(link)) if link.is_symlink() else None
                previous = old.parent.parent if old and old.is_absolute() else None
                if previous and previous.parent == root.parent and (previous / 'installation.json').is_file() and old.parent.name == 'bin':
                    link.unlink()
                    link.symlink_to(target)
                else:
                    raise SystemExit(f'Refusing to replace unrelated command: {link}')
        else:
            link.symlink_to(target)
    print(f'Installed: {root}\nCommands: {local_bin}\nUse tools/toolchain/run for a clean-shell environment.')

if __name__ == '__main__':
    main()
