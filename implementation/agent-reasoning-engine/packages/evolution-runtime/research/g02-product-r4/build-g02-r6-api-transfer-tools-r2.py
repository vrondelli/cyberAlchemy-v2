#!/usr/bin/env python3
"""Apply one exact cache Git trust repair symmetrically to exposed ARE arms."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ARMS = {
    'baseline': (BASE / 'g02-r6-mixed-source-tools-r4',
                 BASE / 'g02-r6-api-transfer-baseline-tools-r2',
                 'MIXED-SOURCE-TOOLS-R4.json',
                 '7e7186b7273ece0ebf66b86718d17c4c6800dee7f2d3fb2bab4bd40ab9c32e3b'),
    'api_contract': (BASE / 'g02-r6-api-transfer-tools-r1',
                     BASE / 'g02-r6-api-transfer-candidate-tools-r2',
                     'API-TRANSFER-TOOLS.json',
                     '410195055f17592f4ed1070d6724d6628ee705ed35578bf5e9a1e9868d66483e'),
}
CONFIG = 'product-replication-gitconfig'
CONFIG_SHA = '8cb8fd0057dc7e9b9901da99a225bcfbdfa374a39bb90cd23d9e33627dedd83a'
ENTRY = ' directory = /cache/ansible-e094d48b\n'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    for arm, (source, output, manifest_name, expected) in ARMS.items():
        if output.exists() or sha(source / manifest_name) != expected or \
                sha(source / CONFIG) != CONFIG_SHA:
            raise ValueError('g02-r6-api-transfer-tools-r2.input-or-output-drift:' + arm)
    for arm, (source, output, manifest_name, expected) in ARMS.items():
        shutil.copytree(source, output)
        old = (source / CONFIG).read_text()
        if ENTRY in old or not old.endswith('\n'):
            raise ValueError('g02-r6-api-transfer-tools-r2.config-shape:' + arm)
        (output / CONFIG).write_text(old + ENTRY)
        payload = {
            'schema_version': 'are.g02-r6-api-transfer-tools-r2/v1',
            'posture': 'symmetric-exposed-ARE-only-harness-repair',
            'arm': arm,
            'predecessor_manifest_sha256': expected,
            'predecessor_config_sha256': CONFIG_SHA,
            'config_sha256': sha(output / CONFIG),
            'builder_sha256': sha(__file__),
            'changed_setting': 'Add only /cache/ansible-e094d48b to container Git safe.directory.',
            'unchanged': 'Ranker per arm, task, model, source index, token caps, deletion-only policy, scorer.',
            'claim_ceiling': 'No-model harness repair after failed zero-call attempt; no quality result.',
            'open_questions': ['Will both repaired ARE arms complete on the same exposed task?'],
        }
        (output / 'TRANSFER-TOOLS-R2.json').write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
        print(json.dumps({'arm': arm, 'manifest_sha256': sha(output / 'TRANSFER-TOOLS-R2.json'),
                          'config_sha256': payload['config_sha256']}))


if __name__ == '__main__':
    main()
