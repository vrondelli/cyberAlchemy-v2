#!/usr/bin/env python3
"""Run under run-desktop; checks glibc linkage and native libraries. Questions: README.md."""
import json,os,subprocess,tempfile
from pathlib import Path
root=Path(os.environ['PKG_CONFIG_SYSROOT_DIR'])
with tempfile.TemporaryDirectory(prefix='ca2-desktop-link-') as directory:
    directory=Path(directory);source=directory/'main.rs';binary=directory/'probe'
    source.write_text('fn main() { println!("desktop-link-ok"); }\n')
    # Mirror pkg-config crate's explicit overlay search path, not just LIBRARY_PATH.
    subprocess.run(['rustc',str(source),'-L','native='+str(root/'usr/lib/x86_64-linux-gnu'),'-o',str(binary)],check=True)
    dynamic=subprocess.check_output(['readelf','-d',str(binary)],text=True)
    assert 'Shared library: [libc.so.6]' in dynamic, 'Rust executable did not select shared glibc'
    assert subprocess.check_output([str(binary)],text=True).strip()=='desktop-link-ok'
    versions=subprocess.check_output(['pkg-config','--modversion','gtk+-3.0','webkit2gtk-4.1'],text=True).splitlines()
    subprocess.run(['pkg-config','--libs','gtk+-3.0','webkit2gtk-4.1'],check=True,stdout=subprocess.DEVNULL)
    print(json.dumps({'status':'PASS','shared_glibc':True,'rust_execution':True,'gtk':versions[0],'webkit':versions[1],'open_questions_ref':'README.md#open-questions'}))
