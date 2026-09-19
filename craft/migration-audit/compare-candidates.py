#!/usr/bin/env python3
"""Read-only byte comparison of pre-existing mirrors; writes audit evidence only."""
import hashlib
import json
import os
from pathlib import Path
from audit import CYBER, OUT, SKIP, SENSITIVE

manifest = json.loads((OUT / 'source-manifest.json').read_text())
prefix = 'projects/domainspec-v2/'
baseline = {r['source'][len(prefix):]: r for r in manifest['files'] if r['source'].startswith(prefix)}
mirror = CYBER / 'implementation/domainspec-v2'
children = sorted(p for p in mirror.iterdir() if p.is_dir() and ('candidate' in p.name))
reports = []
for root in [mirror, *children]:
    identical, different, unique, excluded = [], [], [], []
    seen = set()
    for folder, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP and d not in {'dist', 'coverage'}
                         and not (Path(folder) / d).is_symlink()
                         and not (root == mirror and Path(folder) == root and 'candidate' in d))
        for name in sorted(files):
            p = Path(folder) / name
            rel = str(p.relative_to(root))
            if p.is_symlink() or p.suffix.lower() in SENSITIVE or name.startswith('.env'):
                excluded.append(rel)
                continue
            seen.add(rel)
            digest = hashlib.sha256(p.read_bytes()).hexdigest()
            if rel not in baseline:
                unique.append({'path': rel, 'sha256': digest})
            elif digest != baseline[rel]['sha256']:
                different.append({'path': rel, 'sha256': digest, 'craft_sha256': baseline[rel]['sha256']})
            else:
                identical.append(rel)
    reports.append({'root': str(root), 'identical_count': len(identical), 'different': different,
                    'unique': unique, 'excluded': excluded, 'baseline_paths_not_compared': sorted(set(baseline)-seen)})
    print(json.dumps({'root': str(root), 'identical': len(identical), 'different': len(different), 'unique': len(unique)}), flush=True)
(OUT / 'candidate-comparison.json').write_text(json.dumps(reports, indent=2) + '\n')
