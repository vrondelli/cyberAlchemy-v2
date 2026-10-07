#!/usr/bin/env python3
"""Version the DSH instruction for an exposed source-selection-only test."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r8-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r8-selection-only-dev-tools-r1'
MANIFEST_SHA = 'a0856e7115d66df83e7fd5ff4cb44d583a4bfdc531fe6470f726d18f7d5fc7fa'
RUNNER_SHA = '9289a7c1df22f934eaded83cf8d24246ed83cbf23f315ec7d918b6c09314292b'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    name = 'run_dsh_control.py'
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS.json') != MANIFEST_SHA or \
            sha(SOURCE / name) != RUNNER_SHA:
        raise ValueError('selection-only-dev.input-or-output-drift')
    original = (SOURCE / name).read_text()
    old = 'Investigate this issue and attempt a patch using the repository tools. '
    new = ('Investigate this issue using repository read and search tools only. '
           'Do not edit files or attempt a patch; this episode measures source selection, '
           'not patch production. ')
    if original.count(old) != 1:
        raise ValueError('selection-only-dev.prompt-shape')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / name).write_text(original.replace(old, new))
    payload = {
        'schema_version': 'are.g02-r8-selection-only-dev-tools/v1',
        'posture': 'exposed-comparator-protocol-diagnostic',
        'predecessor_manifest_sha256': MANIFEST_SHA,
        'runner_old_sha256': RUNNER_SHA,
        'runner_new_sha256': sha(OUTPUT / name),
        'builder_sha256': sha(__file__),
        'changed_setting': 'DSH user prompt requests read/search-only source selection, no patch attempt',
        'unchanged_settings': [
            '1M total episode token budget and 1M request context',
            '16K output cap', 'model, transport, tools, task, source, native scorer',
            'ARE source/index/policy'],
        'validity_rule': 'Any DSH apply_edits call invalidates the selection-only diagnostic.',
        'claim_ceiling': 'One exposed DSH-only protocol feasibility test; no paired quality or superiority.',
        'open_questions': [
            'Will DSH refrain from apply_edits and submit a bound final selection?',
            'Can a separately frozen prospective cohort support a fair matched claim?'],
    }
    manifest = OUTPUT / 'SELECTION-ONLY-DEV-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-development',
                      'sha256': sha(manifest), 'runner_sha256': sha(OUTPUT / name)}))


if __name__ == '__main__':
    main()
