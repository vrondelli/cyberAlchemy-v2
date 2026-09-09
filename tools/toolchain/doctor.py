#!/usr/bin/env python3
"""Compile and execute native witnesses. Open questions: README.md."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent

def command(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()

def main():
    versions = {tool: {'path': shutil.which(tool), 'version': command(tool, '--version').splitlines()[0]} for tool in ['rustup', 'rustc', 'cargo', 'cc', 'c++', 'ld', 'make']}
    checks = []
    with tempfile.TemporaryDirectory(prefix='ca2-toolchain-doctor-') as directory:
        root = Path(directory)
        fixtures = [('c', 'cc', '#include <stdio.h>\nint main(void){puts("c-ok");return 0;}\n', 'c-ok'),
                    ('cpp', 'c++', '#include <iostream>\nint main(){std::cout << "cpp-ok\\n";}\n', 'cpp-ok'),
                    ('rs', 'rustc', 'fn main(){println!("rust-ok");}\n', 'rust-ok')]
        for extension, tool, source, expected in fixtures:
            file = root / ('main.' + extension)
            file.write_text(source)
            executable = root / ('witness-' + extension)
            command(tool, str(file), '-o', str(executable))
            assert command(str(executable)) == expected
            checks.append({'language': extension, 'compile_link_execute': 'pass'})
        # Exercise Cargo's build-script discovery of cc/ar and linking a C static archive.
        project = root / 'cargo-native'
        (project / 'src').mkdir(parents=True)
        (project / 'Cargo.toml').write_text('[package]\nname="ca2-native-doctor"\nversion="0.1.0"\nedition="2021"\n')
        (project / 'native.c').write_text('int answer(void){return 42;}\n')
        (project / 'build.rs').write_text('''use std::{env,process::Command};
fn main(){let out=env::var("OUT_DIR").unwrap();
assert!(Command::new(env::var("CC").unwrap_or("cc".into())).args(["-c","native.c","-o",&format!("{out}/native.o")]).status().unwrap().success());
assert!(Command::new("ar").args(["rcs",&format!("{out}/libnative.a"),&format!("{out}/native.o")]).status().unwrap().success());
println!("cargo:rustc-link-search=native={out}");println!("cargo:rustc-link-lib=static=native");}
''')
        (project / 'src/main.rs').write_text('extern "C" {fn answer()->i32;}\nfn main(){assert_eq!(unsafe{answer()},42);println!("cargo-c-ok");}\n')
        output = command('cargo', 'run', '--offline', '--quiet', '--manifest-path', str(project / 'Cargo.toml'))
        assert output.splitlines()[-1] == 'cargo-c-ok'
        checks.append({'language': 'Cargo build script + C archive + Rust executable', 'compile_link_execute': 'pass'})
    print(json.dumps({'status': 'pass', 'tools': versions, 'checks': checks, 'open_questions_ref': 'README.md#open-questions'}, indent=2))

if __name__ == '__main__':
    main()
