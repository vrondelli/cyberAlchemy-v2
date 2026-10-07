#!/usr/bin/env python3
"""Bind the r11 index core to a corrected, versioned scratch-path probe."""

import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
CORE = BASE / 'preflight-g02-r11-index-r1.py'
CORE_SHA = '9f93430cf9f670f59fe2a1edf3a828a692a0f7fa722bef2af1f8867ab303a3b7'
PROBE = BASE / 'g02-r11-index-code-r2/probe-g02-r11-index-capacity-r1.mjs'
PROBE_SHA = '002cec7034ac92f788b8df870f914a9792a11585f8ee124fdf5cded8243125d0'
OUTPUT = BASE / 'g02-r11-dev-pool-r1/SOURCE-INDEX-PREFLIGHT-R2.json'
SCRATCH = Path('/tmp/are-g02-r11-source-index-check-r2')
BINDING = BASE / 'g02-r11-dev-pool-r1/SOURCE-INDEX-PREFLIGHT-R2-BINDING.json'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if (sha(CORE) != CORE_SHA or sha(PROBE) != PROBE_SHA or
            OUTPUT.exists() or SCRATCH.exists() or BINDING.exists()):
        raise ValueError('g02-r11-index-r2.input-output-or-source-drift')
    spec = importlib.util.spec_from_file_location('g02_r11_index_core_r1', CORE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.PROBE = PROBE
    module.OUTPUT = OUTPUT
    module.SCRATCH = SCRATCH
    module.main()
    result = json.loads(OUTPUT.read_text())
    if (result['status'] != 'passed' or result['tested_count'] != 24 or
            result['probe_sha256'] != PROBE_SHA or
            result['script_sha256'] != CORE_SHA):
        raise ValueError('g02-r11-index-r2.core-result-drift')
    payload = {
        'schema_version': 'are.g02-r11-source-index-preflight-binding/v2',
        'status': 'passed', 'core_sha256': CORE_SHA,
        'probe_sha256': PROBE_SHA, 'wrapper_sha256': sha(__file__),
        'source_preflight_sha256': sha(OUTPUT),
        'source_preflight_path': str(OUTPUT), 'scratch_path': str(SCRATCH),
        'previous_attempt': 'r1 stopped on r10 hardcoded probe path before task-1 index; its checkout remains retained',
        'model_calls': 0, 'gold_loaded': False,
        'claim_ceiling': 'No-model source index binding only; native-reference admission, full driver, matched scores, and superiority unproven.',
        'open_questions': ['Do all native base-present reference files fit the bounded indexes?',
                           'Does the full future driver pass no-model qualification?'],
    }
    with BINDING.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    BINDING.chmod(0o600)
    print(json.dumps({'status': 'passed', 'source_preflight_sha256': sha(OUTPUT),
                      'binding_sha256': sha(BINDING)}))


if __name__ == '__main__':
    main()
