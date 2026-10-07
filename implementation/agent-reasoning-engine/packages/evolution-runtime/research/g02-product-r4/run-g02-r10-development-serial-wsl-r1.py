#!/usr/bin/env python3
"""Guarded serial execution of the frozen r10 development cohort."""

import hashlib
import importlib.util
import json
import re
from pathlib import Path


SOURCE = Path(__file__).with_name('run-g02-r8-serial-wsl-r1.py')
SOURCE_SHA = '739a3bd0269aec2f00d5a013df48ef7fd11ff301a2276a453eb71fc608f865fc'
ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r10-20261002')
DEFINITION_SHA = '7a8517f8ffdcbd4997c01790d67e4dda0464d264738e618e151a636615049ee5'
AUDITOR = '/opt/are/evolution-runtime/g02-r10-freeze-code-r1/audit-g02-r10-development-pair-r1.py'
AUDITOR_SHA = '3d97250f6ba9b12779935f581924b3f76f3289041c4d3db21c7b309d29b459e8'


def main():
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA:
        raise ValueError('g02-r10-serial.pinned-r8-driver-drift')
    spec = importlib.util.spec_from_file_location('g02_r8_serial', SOURCE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ARCHIVE = ARCHIVE
    module.DEFINITION = ARCHIVE / 'definition/DEFINITION.json'
    module.DEFINITION_SHA = DEFINITION_SHA
    module.REMOTE_DEFINITION = '/opt/are/evolution-runtime/g02-product-replication-r10/DEFINITION.json'
    module.AUDITOR = AUDITOR
    module.AUDITOR_SHA = AUDITOR_SHA
    module.PROGRESS = ARCHIVE / 'SERIAL-PROGRESS.jsonl'

    def preflight(pair, definition):
        module.need(module.sha(module.DEFINITION) == DEFINITION_SHA and
                    definition['status'] == 'frozen-before-model-dispatch', 'definition-drift')
        root = pair['root']
        module.need(re.fullmatch(r'/tmp/are-g02-r4-runs/g02-cross-layer-pr10-mixed-[0-9]{2}', root)
                    and pair['suffix'] == Path(root).name.removeprefix('g02-cross-layer-')
                    and re.fullmatch(r'(?:SWE-Bench-Pro|SWE-Bench-Verified|Multi-SWE-Bench)__[A-Za-z0-9_-]+', pair['instance_id'])
                    and pair['repo'] in ('ansible/ansible', 'django/django',
                                         'sympy/sympy', 'sveltejs/svelte'),
                    'pair-scope')
        target = ARCHIVE / 'pairs' / f"{pair['ordinal']:02d}-{pair['suffix']}"
        module.need(not target.exists(), 'archive-already-exists')
        script = ('import hashlib,json,os,shutil,sys;'
                  'from pathlib import Path;'
                  'd=Path(sys.argv[1]);r=Path(sys.argv[2]);a=Path(sys.argv[3]);'
                  'h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();'
                  'm={x.split()[0]:int(x.split()[1])*1024 for x in '
                  'Path("/proc/meminfo").read_text().splitlines() if x.startswith("MemAvailable:")};'
                  'print(json.dumps({"definition_sha":h(d),"auditor_sha":h(a),'
                  '"mount":os.path.ismount(r.parent),"root_absent":not r.exists(),'
                  '"scratch_free":shutil.disk_usage(r.parent).free,'
                  '"root_free":shutil.disk_usage("/").free,'
                  '"ram_available":m["MemAvailable:"]}))')
        result = module.remote('python3', '-c', script, module.REMOTE_DEFINITION,
                               root, AUDITOR)
        module.need(result.returncode == 0, 'remote-preflight-exec:' + result.stderr[-500:])
        state = json.loads(result.stdout)
        module.need(state['definition_sha'] == DEFINITION_SHA and
                    state['auditor_sha'] == AUDITOR_SHA and state['mount'] and
                    state['root_absent'] and state['scratch_free'] >= module.TMPFS_FLOOR and
                    state['root_free'] >= module.ROOT_FLOOR and
                    state['ram_available'] >= module.RAM_FLOOR,
                    f'resource-or-source-guard:{state}')
        return target, state

    def readiness(ordinal):
        result = module.remote(module.NODE, module.READINESS,
                               f'probe_20261002_g02_r10_pair{ordinal:02d}',
                               module.HELPER, module.HELPER_SHA, timeout=90)
        module.need(result.returncode == 0, 'provider-not-ready:' + result.stdout[-400:])
        value = json.loads(result.stdout)
        module.need(value['status'] == 'ready' and value['tokenizer_status'] == 200
                    and value['generation_status'] == 200, 'readiness-shape')
        return value

    module.preflight = preflight
    module.readiness = readiness
    module.main()


if __name__ == '__main__':
    main()
