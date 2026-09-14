#!/usr/bin/env python3
"""Build exact local dependencies with the shared compiler. Questions: PLAN.md."""
import hashlib
import json
from pathlib import Path
import subprocess

HERE = Path(__file__).resolve().parent
CA2 = HERE.parents[2]
LOCK = json.loads((HERE / 'source-binding.json').read_text())
VENDOR = (HERE / LOCK['source_root']).resolve()
ORCHESTRATOR = CA2 / 'orchestrator/examples/robot-world'
LAUNCHER = CA2 / 'tools/toolchain/run-rwo'


def check_source():
    for name, expected in LOCK['files'].items():
        if hashlib.sha256((VENDOR / name).read_bytes()).hexdigest() != expected:
            raise ValueError('RWO_SOURCE_DRIFT:' + name)


if __name__ == '__main__':
    check_source()
    target = HERE.parent / 'runtime/target'
    for manifest, extra in [
        (ORCHESTRATOR / 'Cargo.toml', ['--bin', 'world_contracts']),
        (HERE.parent / 'runtime/Cargo.toml', []),
    ]:
        subprocess.run([str(LAUNCHER), 'cargo', 'build', '--offline', '--locked',
                        '--manifest-path', str(manifest), *extra], check=True, cwd=CA2)
    print(json.dumps({'status': 'PASS', 'rwo_source_files_verified': len(LOCK['files']), 'authority_effect': 'none'}))
