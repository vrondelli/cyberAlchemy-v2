#!/usr/bin/env python3
"""Derive a separate exposed Ansible freeze script from the tested r1 freezer."""

import hashlib
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime/g02-r5-cohort-code-r1')
SOURCE = BASE / 'freeze-g02-r5-index64-exposed-r1.py'
OUTPUT = BASE / 'freeze-g02-r5-index64-exposed-r2.py'
SOURCE_SHA = '6ea219cb565a8631fc92eef38fc678fbde4c46bbbda2487b9d67b1c50c2d1457'
REPLACEMENTS = {
    "g02-r5-index64-development-tools-r2'": "g02-r5-index64-development-tools-r3'",
    "INDEX64-DEV-SOURCE-R2.json'": "INDEX64-DEV-SOURCE-R3.json'",
    "probe_20261001_g02_r5_index64/READY.json'": "probe_20261001_g02_r5_index64_ans83/READY.json'",
    "g02-r5-index64-exposed-ans-2464eadb-r1/FREEZE.json'": "g02-r5-index64-exposed-ans-83c269c9-r1/FREEZE.json'",
    "g02-cross-layer-pr5-index64-ans-2464eadb')": "g02-cross-layer-pr5-index64-ans-83c269c9')",
    "SOURCE_MANIFEST_SHA = '52324ded43509fed03e5b29578dff6b426c88697086dcacdce385bb82d5ff5ad'":
        "SOURCE_MANIFEST_SHA = '1848a111ff2068ca6fbaed0d3fc828d6517efe63bbdcb8d789173a66e61a5f91'",
    "READY_SHA = '1ed1f6d219b5decbf78e46fa1fb082cbc90b61cbeff04c2f0abeb76d0b405fe3'":
        "READY_SHA = '895cf2f71f98fdefc50f622f3e447b46aa1722b89f217308257299bb76b16db3'",
    "TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__2464eadb'":
        "TASK_ID = 'SWE-Bench-Pro__python__maintenance__bugfix__83c269c9'",
    "'db2d5b09eff918e981c9e10787a5f2c500d1784f'":
        "'07e7b69c04116f598ed2376616cbb46343d9a0e9'",
    "'suffix': 'pr5-index64-ans-2464eadb'":
        "'suffix': 'pr5-index64-ans-83c269c9'",
    'an evaluator-exposed Ansible task with one reference file outside the 32 MiB index.':
        'an evaluator-exposed Ansible task with six additional reference files inside the 64 MiB index.',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if sha(SOURCE) != SOURCE_SHA or OUTPUT.exists():
        raise ValueError('g02-r5-r2-freezer.source-or-output-drift')
    code = SOURCE.read_text()
    for before, after in REPLACEMENTS.items():
        if code.count(before) != 1:
            raise ValueError(f'g02-r5-r2-freezer.anchor:{before}')
        code = code.replace(before, after)
    compile(code, str(OUTPUT), 'exec')
    OUTPUT.write_text(code)
    print(json.dumps({'status': 'built-no-model', 'source_sha256': SOURCE_SHA,
                      'derived_sha256': sha(OUTPUT), 'replacement_count': len(REPLACEMENTS)}))


if __name__ == '__main__':
    main()
