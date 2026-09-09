#!/usr/bin/env python3
"""Extract pinned desktop dependencies without system installation. Questions: README.md."""
import concurrent.futures, hashlib, json, os, platform, subprocess, tempfile, urllib.request
from pathlib import Path
here=Path(__file__).resolve().parent
lock_bytes=(here/'desktop-lock.json').read_bytes();lock=json.loads(lock_bytes)
if 'VERSION_ID="26.04"' not in Path('/etc/os-release').read_text() or platform.machine()!='x86_64':
    raise SystemExit('Desktop dependency lock requires Ubuntu 26.04 x86_64')
digest=hashlib.sha256(lock_bytes).hexdigest()
base=Path(os.environ.get('XDG_DATA_HOME',str(Path.home()/'.local/share')))/'cyberalchemy/toolchains'
base.mkdir(parents=True,exist_ok=True);root=base/('desktop-'+digest[:16])
def bind_host_libraries(root):
    # Keep the shared compiler's sysroot as the glibc linker-script owner.
    # LLVM lld cannot relocate scripts from a second sysroot under that owner.
    for name in ['libc.so', 'libm.so', 'libm.a']:
        script=root/'usr/lib/x86_64-linux-gnu'/name
        if script.is_file() and not script.is_symlink() and b'GNU ld script' in script.read_bytes():
            script.unlink()
    # Without libc.so, an overlay libc.a silently produces a mixed static glibc.
    # The shared compiler must also own libc's archive selection.
    (root/'usr/lib/x86_64-linux-gnu/libc.a').unlink(missing_ok=True)
    # apt resolves against installed packages; bind their exact runtime filenames.
    record=root/'host-library-bindings.json'
    bindings=json.loads(record.read_text())['bindings'] if record.exists() else []
    for link in (root/'usr/lib/x86_64-linux-gnu').rglob('*.so'):
        if not link.is_symlink() or link.exists():continue
        target=link.parent/link.readlink()
        try:relative=target.relative_to(root)
        except ValueError:continue
        installed=Path('/')/relative
        if installed.is_file() and not target.is_symlink():
            target.parent.mkdir(parents=True,exist_ok=True);target.symlink_to(installed)
            bindings.append(str(installed))
    (root/'host-library-bindings.json').write_text(json.dumps({'bindings':sorted(set(bindings)),'open_questions_ref':str(here/'README.md')},indent=2)+'\n')
if root.exists():
    assert json.loads((root/'installation.json').read_text())['lock_sha256']==digest
    bind_host_libraries(root)
    print(root);raise SystemExit(0)
cache=base/'desktop-downloads';cache.mkdir(exist_ok=True)
def download(p):
    archive=cache/p['filename']
    if archive.exists() and hashlib.sha256(archive.read_bytes()).hexdigest()==p['sha256']:return archive
    url=p['uri'].replace('http://','https://',1)
    with urllib.request.urlopen(url,timeout=120) as response: payload=response.read()
    assert hashlib.sha256(payload).hexdigest()==p['sha256'],p['package']
    archive.write_bytes(payload);return archive
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    archives=list(pool.map(download,lock['packages']))
with tempfile.TemporaryDirectory(prefix='.desktop-',dir=base) as temporary:
    stage=Path(temporary)/'root';stage.mkdir()
    for archive in archives:subprocess.run(['dpkg-deb','--extract',str(archive),str(stage)],check=True)
    (stage/'installation.json').write_text(json.dumps({'lock_sha256':digest,'open_questions_ref':str(here/'README.md')})+'\n')
    bind_host_libraries(stage)
    stage.rename(root)
print(root)
