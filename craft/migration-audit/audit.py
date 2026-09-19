#!/usr/bin/env python3
"""Bounded additive Craft source inventory/copy. Never deletes source or overwrites targets."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

CORE = Path('/home/vrondelli/projects/domainspec-core')
CYBER = Path('/home/vrondelli/projects/cyberAlchemy-v2')
OUT = CYBER / 'craft/migration-audit'
ROOTS = [('projects/domainspec-v2', 'projects/domainspec-v2'), ('toolchains', 'toolchains'),
         ('tools', 'tools'), ('research/domainspec', 'research/domainspec'),
         ('research/smt-fol-test-derivation', 'research/smt-fol-test-derivation'),
         ('research/lean-formalization-implications', 'research/lean-formalization-implications'),
         ('research/2026-08-07-domainspec-v2-paper-evidence-refresh', 'research/2026-08-07-domainspec-v2-paper-evidence-refresh'),
         ('research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate', 'research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate'),
         ('development/deterministic-test-derivation-engine', 'development/deterministic-test-derivation-engine'),
         ('projects/framework-unification', 'projects/framework-unification'),
         ('projects/ontology', 'projects/ontology'),
         ('research/projects/domainspec', 'research/projects/domainspec'),
         ('research/2026-08-12-bolina-domainspec-formal-modeling', 'research/2026-08-12-bolina-domainspec-formal-modeling'),
         ('ops/development/domainspec-lean-formalization-glossary-refresh', 'support/core/ops/development/domainspec-lean-formalization-glossary-refresh')]
FILES = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'Cargo.toml', 'Cargo.lock',
         'Makefile', '.node-version', '.gitmodules', 'SUBMODULE-DISCIPLINE.md',
         'docs/decisions/governance-kernel-domainspec-build-path.md',
         'docs/decisions/governance-kernel-domainspec-build-path.admissibility.json',
         'ops/development/domainspec-lean-formalization-validation-ledger.md',
         'ops/development/domainspec-skill-agent-candidate-ledger.md',
         'ops/development/domainspec-skill-agent-canonical-candidate-matrix.md',
         'ops/DOMAINSPEC-SKILL-AGENT-CANONICALIZATION-STRATEGY.md']
SKIP = {'.git', 'node_modules', 'target', '__pycache__', '.venv', 'venv', '.next',
        '.cache', '.pytest_cache', '.mypy_cache', '.turbo', '.lake'}
SENSITIVE = {'.pem', '.key', '.p12', '.pfx', '.sqlite', '.sqlite3', '.db', '.vhdx'}
REF = re.compile(r'(?:/home/vrondelli/projects/domainspec-core[^\s"\x27<>`]*|projects/[A-Za-z0-9_-]+|toolchains/node-typescript|(?:\.\./){3,}[A-Za-z0-9_./-]+)')

def digest(data):
    return hashlib.sha256(data).hexdigest()

def emit(name, value):
    # Audit-generated artifacts; source files are never rewritten.
    (OUT / name).write_text(json.dumps(value, indent=2, sort_keys=True) + '\n')

def scan():
    rows, excluded, links, references = [], [], [], []
    extra_files = []
    context_path = OUT / 'workspace-reference-map.json'
    if context_path.exists():
        for report in json.loads(context_path.read_text()):
            if report['label'] == 'domainspec-core':
                extra_files = [r['path'] for r in report['reference_matches']
                               if r['path'].startswith('.arcanum/handoff-notices/')
                               and any('projects/domainspec-v2' in v for v in r['references'])]
    def visit(source, target):
        relative = str(source.relative_to(CORE))
        if source.is_symlink():
            links.append({'source': relative, 'target': os.readlink(source)})
            return
        if not source.is_file():
            return
        if (source.name.startswith('.env') and source.name not in {'.env.example', '.env.sample', '.env.template'}) or source.suffix.lower() in SENSITIVE:
            excluded.append({'source': relative, 'reason': 'credential-or-local-database-review-required'})
            return
        before = source.stat()
        data = source.read_bytes()
        after = source.stat()
        if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
            raise RuntimeError('source changed while scanning: ' + relative)
        rows.append({'source': relative, 'destination': target, 'bytes': len(data), 'sha256': digest(data), 'mode': before.st_mode & 0o777})
        if b'\x00' not in data and len(data) < 16 * 1024 * 1024:
            try:
                text = data.decode('utf-8')
            except UnicodeDecodeError:
                return
            found = sorted(set(REF.findall(text)))
            if found:
                references.append({'source': relative, 'references': found})
    for rel, destination in ROOTS:
        root = CORE / rel
        for folder, dirs, files in os.walk(root, followlinks=False):
            dirs.sort()
            for name in list(dirs):
                p = Path(folder) / name
                if name in SKIP or p.is_symlink() or str(p.relative_to(CORE)) == 'projects/domainspec-v2/impl/cli/dist':
                    dirs.remove(name)
                    if p.is_symlink():
                        links.append({'source': str(p.relative_to(CORE)), 'target': os.readlink(p)})
                    else:
                        excluded.append({'source': str(p.relative_to(CORE)), 'reason': 'rebuildable-dependencies-or-cache'})
            for name in sorted(files):
                p = Path(folder) / name
                visit(p, str(Path(destination) / p.relative_to(root)))
    for name in [*FILES, *extra_files]:
        if (CORE / name).exists():
            visit(CORE / name, 'support/core/' + name)
    rows.sort(key=lambda r: r['source'])
    body = {'source_root': str(CORE), 'destination_root': str(CYBER / 'craft'), 'authority_effect': 'none',
            'files': rows, 'excluded': excluded, 'symlinks_not_followed': links,
            'file_count': len(rows), 'bytes': sum(r['bytes'] for r in rows)}
    body['manifest_sha256'] = digest(json.dumps(rows, sort_keys=True).encode())
    emit('source-manifest.json', body)
    emit('source-references.json', references)
    state = subprocess.run(['git', 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--',
                            *[r[0] for r in ROOTS], *FILES, *extra_files], cwd=CORE, check=True, capture_output=True).stdout
    emit('source-git-state.json', {'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=CORE, text=True).strip(),
                                 'porcelain_records': state.decode().split('\0'), 'authority_effect': 'none'})
    print(json.dumps({k: body[k] for k in ['file_count', 'bytes', 'manifest_sha256']}))

def copy():
    manifest = json.loads((OUT / 'source-manifest.json').read_text())
    copied = []
    for row in manifest['files']:
        source, target = CORE / row['source'], CYBER / 'craft' / row['destination']
        if source.is_symlink() or digest(source.read_bytes()) != row['sha256']:
            raise RuntimeError('source drift: ' + row['source'])
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.is_symlink():
            raise RuntimeError('destination is a symlink: ' + str(target))
        if target.exists():
            if not target.is_file() or digest(target.read_bytes()) != row['sha256']:
                raise RuntimeError('destination conflicts: ' + str(target))
        else:
            with source.open('rb') as src, target.open('xb') as dst:
                shutil.copyfileobj(src, dst)
            target.chmod(row['mode'])
        if digest(target.read_bytes()) != row['sha256'] or digest(source.read_bytes()) != row['sha256']:
            raise RuntimeError('copy/source drift: ' + row['source'])
        copied.append(row['destination'])
    emit('copy-receipt.json', {'manifest_sha256': manifest['manifest_sha256'], 'files_verified': len(copied),
                             'bytes': manifest['bytes'], 'source_deleted': False, 'dependency_removed': False,
                             'authority_effect': 'none'})
    print(json.dumps({'copied_and_verified': len(copied), 'bytes': manifest['bytes']}))

def context():
    reports = []
    for root, label in [(CORE, 'domainspec-core'), (CYBER, 'cyberAlchemy-v2')]:
        command = ['rg', '--files', '--hidden', '-g', '!.git', '-g', '!node_modules', '-g', '!target',
                   '-g', '!dist', '-g', '!craft', '-g', '!__pycache__', '-g', '!.venv']
        paths = subprocess.check_output(command, cwd=root).decode().splitlines()
        refs = []
        unreadable = []
        for relative in sorted(paths):
            p = root / relative
            if p.is_symlink() or p.suffix.lower() in SENSITIVE or p.name.startswith('.env'):
                continue
            try:
                if p.stat().st_size > 4 * 1024 * 1024:
                    unreadable.append({'path': relative, 'reason': 'over-4MiB-reference-scan-limit'})
                    continue
                data = p.read_bytes()
                if b'\0' in data:
                    continue
                value = data.decode('utf-8')
            except (OSError, UnicodeDecodeError):
                continue
            if re.search(r'domainspec-core|projects/domainspec-v2|DomainSpec v2|toolchains/node-typescript', value):
                matches = sorted(set(REF.findall(value)))
                refs.append({'path': relative, 'sha256': digest(data), 'references': matches})
        reports.append({'root': str(root), 'label': label, 'enumerated_files': len(paths),
                        'reference_matches': refs, 'bounded_scan_exclusions': unreadable})
    emit('workspace-reference-map.json', reports)
    print(json.dumps([{'root': r['label'], 'enumerated_files': r['enumerated_files'],
                       'matching_files': len(r['reference_matches']), 'large_files_not_scanned': len(r['bounded_scan_exclusions'])} for r in reports]))

if __name__ == '__main__':
    if sys.argv[1:] == ['scan']:
        scan()
    elif sys.argv[1:] == ['copy']:
        copy()
    elif sys.argv[1:] == ['context']:
        context()
    else:
        raise SystemExit('usage: audit.py scan|copy|context')
