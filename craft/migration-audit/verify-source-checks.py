#!/usr/bin/env python3
"""Record source-only checks without borrowing dependencies from the old checkout."""
import json
import shlex
import subprocess
from audit import CYBER, OUT

root = CYBER / 'craft/projects/domainspec-v2/impl/cli'
scripts = json.loads((root / 'package.json').read_text())['scripts']
names = ['catalog:check', 'relationships:check', 'integration-profile:check',
         'reconciled-sources:check', 'cross-generator-sources:check',
         'atomic-publication:check', 'schemas:check']
results = []
for name in names:
    result = subprocess.run(shlex.split(scripts[name]), cwd=root, capture_output=True, text=True)
    results.append({'check': name, 'command': scripts[name], 'cwd': str(root),
                    'exit_code': result.returncode, 'stdout': result.stdout, 'stderr': result.stderr})
    print(name, result.returncode, flush=True)
(OUT / 'source-checks.json').write_text(json.dumps({'results': results,
    'clean_build_verified': False, 'dependency_cutover_verified': False}, indent=2) + '\n')
raise SystemExit(any(r['exit_code'] for r in results))
