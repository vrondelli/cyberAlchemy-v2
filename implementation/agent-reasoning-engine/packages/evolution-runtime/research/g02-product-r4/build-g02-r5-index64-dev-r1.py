#!/usr/bin/env python3
"""Derive a 64 MiB source-index G02 development tool snapshot, no model calls."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-dsh-maxout-r2'
OUTPUT = BASE / 'g02-r5-index64-development-tools-r1'
BUILDER = 'build-own-expansions-base.mjs'
BUILDER_SHA = '93fe6dc21e801cac9784f6a28a02e60cb1af59a95bc3e642f280bc440408a229'
SOURCE_MANIFEST_SHA = 'a457558786523967da41a0a502c70963e85c390ebb550e27d64b7df39dbcfbe7'
BEFORE = 'writeFileSync(outputPath,output,{flag:\'wx\',mode:0o644});\nconsole.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));'
AFTER = '''const budgetAnchor='maximum_index_bytes = 32 * 1024 * 1024';
if(output.split(budgetAnchor).length!==2)throw Error('g02-index64.budget-anchor-drift');
const budgetOutput=output.replace(budgetAnchor,'maximum_index_bytes = 64 * 1024 * 1024');
writeFileSync(outputPath,budgetOutput,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(budgetOutput),index_budget_mib:64}));'''


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: build-g02-r5-index64-dev-r1.py check|build')
    if sha(SOURCE / BUILDER) != BUILDER_SHA or \
            sha(SOURCE / 'DSH-MAXOUT-SOURCE.json') != SOURCE_MANIFEST_SHA:
        raise ValueError('g02-index64.source-drift')
    original = (SOURCE / BUILDER).read_text()
    if original.count(BEFORE) != 1:
        raise ValueError('g02-index64.builder-anchor-drift')
    modified = original.replace(BEFORE, AFTER)
    result = {'status': 'checked-no-model' if sys.argv[1] == 'check'
              else 'built-no-model',
              'builder_sha256': hashlib.sha256(modified.encode()).hexdigest()}
    if sys.argv[1] == 'check':
        print(json.dumps(result, sort_keys=True))
        return
    if OUTPUT.exists():
        raise ValueError('g02-index64.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / BUILDER).write_text(modified)
    manifest = {
        'schema_version': 'are.g02-r5-index64-development-source/v1',
        'posture': 'exposed-development-not-superiority-campaign',
        'source_root': str(SOURCE),
        'source_manifest_sha256': SOURCE_MANIFEST_SHA,
        'original_builder_sha256': BUILDER_SHA,
        'builder_script_sha256': sha(__file__),
        'changed_setting': {'ranked_source_maximum_index_bytes':
                            [32 * 1024 * 1024, 64 * 1024 * 1024]},
        'derived_builder_sha256': sha(OUTPUT / BUILDER),
        'unchanged_dsh_cap': 16384,
        'claim_ceiling': 'Versioned no-model development source; not a paired result or superiority claim.',
        'open_questions': ['Does the live container stay within its 1 GiB memory limit?',
                           'Does increased source reachability produce useful selection?']}
    (OUTPUT / 'INDEX64-DEV-SOURCE.json').write_text(
        json.dumps(manifest, sort_keys=True, indent=2) + '\n')
    result['source_manifest_sha256'] = sha(OUTPUT / 'INDEX64-DEV-SOURCE.json')
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    main()
