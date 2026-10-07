#!/usr/bin/env python3
"""Version the DSH arm for an exposed, control-only 16K-output diagnostic."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-policy-time-r1'
OUTPUT = BASE / 'g02-product-replication-tools-r4-dsh-maxout-r1'
RUNNER_SHA = '7a25ef6c8d709eeb1656e55d6530099a1211010ff53fed6bcc922adb2d4fb643'
PREPARE_SHA = '64918588929a991ccf52481fc13920e40a14157658fcdb8efc2b25f9212249d9'
PROFILE = Path('/opt/are-harness-benchmark/g02-fresh-pair-r3-20260926/profile-template.patch.yml')
PROFILE_SHA = 'e9d2ec124ba500b01b67fb17932c839bff538694dcafb8e39155dc357525c5d3'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def one(source, before, after):
    if source.count(before) != 1:
        raise ValueError(f'dsh-maxout.expected-one:{before!r}:{source.count(before)}')
    return source.replace(before, after)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: build-g02-dsh-maxout-diagnostic-r1.py check|build')
    runner = SOURCE / 'run_dsh_control.py'
    if (sha(runner) != RUNNER_SHA or
            sha(SOURCE / 'prepare-prospective.mjs') != PREPARE_SHA or
            sha(PROFILE) != PROFILE_SHA):
        raise ValueError('dsh-maxout.source-drift')
    code = runner.read_text()
    code = one(code,
               "(run_root / 'profile.patch.yml').write_text(profile)",
               "if (profile.count('        defaultMaxTokens: 8192') != 1 or\n"
               "        profile.count('            maxTokens: 8192') != 1):\n"
               "    raise RuntimeError('dsh-maxout.profile-source-drift')\n"
               "profile = profile.replace('        defaultMaxTokens: 8192',\n"
               "                          '        defaultMaxTokens: 16384').replace(\n"
               "    '            maxTokens: 8192', '            maxTokens: 16384')\n"
               "(run_root / 'profile.patch.yml').write_text(profile)")
    code = one(code, "'-e', 'OUTPUT_CAP=8192'", "'-e', 'OUTPUT_CAP=16384'")
    digest = hashlib.sha256(code.encode()).hexdigest()
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'checked-no-write', 'runner_sha256': digest}))
        return
    if OUTPUT.exists():
        raise ValueError('dsh-maxout.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'run_dsh_control.py').write_text(code)
    receipt = {
        'schema_version': 'are.g02-dsh-maxout-diagnostic-source/v1',
        'posture': 'exposed-control-only-reliability-diagnostic',
        'source_tools_root': str(SOURCE),
        'source_runner_sha256': RUNNER_SHA,
        'source_prepare_sha256': PREPARE_SHA,
        'profile_template_sha256': PROFILE_SHA,
        'builder_sha256': sha(__file__),
        'diagnostic_runner_sha256': sha(OUTPUT / 'run_dsh_control.py'),
        'changed_settings': {
            'dsh_default_max_tokens': [8192, 16384],
            'dsh_model_max_tokens': [8192, 16384],
            'control_proxy_output_cap': [8192, 16384],
        },
        'unchanged': ['DSH image and tools', 'GLM model', '1M context window',
                      '1M control token budget', 'no automatic retries', 'task and commit'],
        'claim_ceiling': 'One exposed control-only diagnostic; no paired result or superiority claim.',
        'open_questions': ['Will the same exposed Ansible task complete without max-tokens?',
                           'Does a larger cap increase cost enough to change a future pair gate?'],
    }
    (OUTPUT / 'DSH-MAXOUT-SOURCE.json').write_text(json.dumps(receipt, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-no-model',
                      'manifest_sha256': sha(OUTPUT / 'DSH-MAXOUT-SOURCE.json'),
                      'runner_sha256': digest}))


if __name__ == '__main__':
    main()
