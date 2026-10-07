#!/usr/bin/env python3
"""Version only the exact Git trust repair for one exposed r7 reliability test."""

import hashlib
import json
import shutil
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-r7-mixed-source-tools-r1'
OUTPUT = BASE / 'g02-r7-cache-access-dev-tools-r1'
ROOT = BASE / 'g02-r7-screening-pool-r1'
SOURCE_SHA = 'ebd522264e431e8b68016ca22607c059dc9e7d188d06ca043c0f52963b2d5973'
GITCONFIG_SHA = '8cb8fd0057dc7e9b9901da99a225bcfbdfa374a39bb90cd23d9e33627dedd83a'
CANDIDATE_SHA = '6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d'
HYDRATION_SHA = '8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(SOURCE / 'MIXED-SOURCE-TOOLS.json') != SOURCE_SHA or \
            sha(SOURCE / 'product-replication-gitconfig') != GITCONFIG_SHA or \
            sha(ROOT / 'CANDIDATE.json') != CANDIDATE_SHA or \
            sha(ROOT / 'TASK-CACHE-HYDRATION.json') != HYDRATION_SHA:
        raise ValueError('g02-r7-cache-access-dev.input-or-output-drift')
    rows = json.loads((ROOT / 'TASK-CACHE-HYDRATION.json').read_text())['results']
    if len(rows) != 24:
        raise ValueError('g02-r7-cache-access-dev.row-count')
    shutil.copytree(SOURCE, OUTPUT)
    config = (SOURCE / 'product-replication-gitconfig').read_text()
    if not config.endswith('\n'):
        raise ValueError('g02-r7-cache-access-dev.config-shape')
    config += ''.join(' directory = /cache/' + row['cache_leaf'] + '\n'
                      for row in rows)
    target = OUTPUT / 'product-replication-gitconfig'
    target.write_text(config)
    payload = {'schema_version': 'are.g02-r7-cache-access-dev-tools/v1',
               'posture': 'evaluator-exposed-development-not-r7-campaign-change',
               'predecessor_manifest_sha256': SOURCE_SHA,
               'candidate_sha256': CANDIDATE_SHA,
               'hydration_sha256': HYDRATION_SHA,
               'builder_sha256': sha(__file__),
               'gitconfig_old_sha256': GITCONFIG_SHA,
               'gitconfig_new_sha256': sha(target),
               'exact_safe_directory_count': len(rows),
               'unchanged_policy': 'All model, ranker, index, projector, DSH and scorer sources are byte-identical to r7; only Git trust entries added.',
               'claim_ceiling': 'One exposed reliability diagnostic only; cannot repair the terminal r7 campaign or support superiority.',
               'open_questions': ['Does the full matched pair settle after cache-access repair?']}
    manifest = OUTPUT / 'CACHE-ACCESS-DEV-TOOLS.json'
    manifest.write_text(json.dumps(payload, sort_keys=True, indent=2) + '\n')
    print(json.dumps({'status': 'built-exposed-development',
                      'sha256': sha(manifest),
                      'gitconfig_sha256': sha(target)}))


if __name__ == '__main__':
    main()
