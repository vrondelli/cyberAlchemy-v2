#!/usr/bin/env python3
"""Corrected source derivation after r1 failed Python syntax preflight."""

import hashlib
import json
import shutil
import sys
from pathlib import Path

BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-policy-time-r1'
OUTPUT = BASE / 'g02-product-replication-tools-r4-dsh-maxout-r2'
PROFILE = Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/profile-template.patch.yml')
EXPECTED = {
    SOURCE / 'run_dsh_control.py': '7a25ef6c8d709eeb1656e55d6530099a1211010ff53fed6bcc922adb2d4fb643',
    SOURCE / 'prepare-prospective.mjs': '64918588929a991ccf52481fc13920e40a14157658fcdb8efc2b25f9212249d9',
    PROFILE: 'e9d2ec124ba500b01b67fb17932c839bff538694dcafb8e39155dc357525c5d3',
}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def one(source, before, after):
    if source.count(before) != 1:
        raise ValueError(f'dsh-maxout-r2.expected-one:{before!r}:{source.count(before)}')
    return source.replace(before, after)


def derive(code):
    before = "        (run_root / 'profile.patch.yml').write_text(profile)"
    after = "\n".join([
        "        if (profile.count('        defaultMaxTokens: 8192') != 1 or",
        "                profile.count('            maxTokens: 8192') != 1):",
        "            raise RuntimeError('dsh-maxout.profile-source-drift')",
        "        profile = profile.replace('        defaultMaxTokens: 8192',",
        "                                  '        defaultMaxTokens: 16384').replace(",
        "            '            maxTokens: 8192', '            maxTokens: 16384')",
        before,
    ])
    code = one(code, before, after)
    return one(code, "'-e', 'OUTPUT_CAP=8192'", "'-e', 'OUTPUT_CAP=16384'")


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: build-g02-dsh-maxout-diagnostic-r2.py check|build')
    if any(sha(path) != expected for path, expected in EXPECTED.items()):
        raise ValueError('dsh-maxout-r2.source-drift')
    code = derive((SOURCE / 'run_dsh_control.py').read_text())
    compile(code, str(OUTPUT / 'run_dsh_control.py'), 'exec')
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'checked-no-write',
                          'runner_sha256': hashlib.sha256(code.encode()).hexdigest()}))
        return
    if OUTPUT.exists():
        raise ValueError('dsh-maxout-r2.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'run_dsh_control.py').write_text(code)
    receipt = {
        'schema_version': 'are.g02-dsh-maxout-diagnostic-source/v2',
        'posture': 'exposed-control-only-reliability-diagnostic',
        'supersedes_failed_source': str(BASE / 'g02-product-replication-tools-r4-dsh-maxout-r1'),
        'failed_source_reason': 'derived Python indentation failed syntax preflight; zero model calls',
        'source_digests': {str(path): digest for path, digest in EXPECTED.items()},
        'builder_sha256': sha(__file__),
        'diagnostic_runner_sha256': sha(OUTPUT / 'run_dsh_control.py'),
        'changed_settings': {'dsh_default_max_tokens': [8192, 16384],
                             'dsh_model_max_tokens': [8192, 16384],
                             'control_proxy_output_cap': [8192, 16384]},
        'claim_ceiling': 'One exposed control-only diagnostic; no paired result or superiority claim.',
        'open_questions': ['Does the previously failed task complete?',
                           'What is the cost effect of the larger cap?'],
    }
    (OUTPUT / 'DSH-MAXOUT-SOURCE.json').write_text(json.dumps(receipt, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model',
                      'manifest_sha256': sha(OUTPUT / 'DSH-MAXOUT-SOURCE.json'),
                      'runner_sha256': receipt['diagnostic_runner_sha256']}))


if __name__ == '__main__':
    main()
