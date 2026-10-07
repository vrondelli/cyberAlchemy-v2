#!/usr/bin/env python3
"""Versioned 16 MiB-manifest variant of the isolated r1 capacity probe."""

from dataclasses import dataclass
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import sys


BASE = Path('/opt/are/evolution-runtime')
R1 = BASE / 'g01-post-r8-large-index-probe-r1/probe-large-source-index-r1.py'
OUT = BASE / 'g01-post-r8-large-index-probe-r2'
EXPECTED_R1_SHA = '80a0d918899efdef69b7a6a717720e4398f1841e4d6710e8b253c36be30cb3ff'


@dataclass(frozen=True)
class LargerLimits:
    entries: int = 50000
    file_bytes: int = 8 * 1024**2
    admitted_bytes: int = 64 * 1024**2
    postings: int = 2000000
    manifest_bytes: int = 16 * 1024**2


def main():
    if len(sys.argv) != 2 or sys.argv[1] != 'Multi-SWE-Bench__typescript__maintenance__bugfix__1ac0bb81':
        raise ValueError('exact-large-task-required')
    if hashlib.sha256(R1.read_bytes()).hexdigest() != EXPECTED_R1_SHA or not OUT.is_dir():
        raise ValueError('probe-source-or-root-drift')
    config = {'schema_version': 'are.g01-large-index-probe-config/v2',
              'parent_script_sha256': EXPECTED_R1_SHA,
              'variant_script_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'limits': vars(LargerLimits()), 'memory_limit_bytes': 512 * 1024**2,
              'deadline_seconds': 60, 'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Isolated capacity test only; no production index or quality result'}
    config_path = OUT / 'CONFIG.json'
    descriptor = os.open(config_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(config, indent=2, sort_keys=True) + '\n').encode())
    spec = importlib.util.spec_from_file_location('g01_large_probe_r1', R1)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    module.ExpandedLimits = LargerLimits
    module.OUT = OUT
    module.main()


if __name__ == '__main__':
    main()
