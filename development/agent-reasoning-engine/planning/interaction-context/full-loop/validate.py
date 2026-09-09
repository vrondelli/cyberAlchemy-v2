"""Check the frozen full-loop candidate and optionally rerun local ARE tests; no repo writes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[5]
RUNTIME = ROOT / 'cyberAlchemy-v2/implementation/agent-reasoning-engine'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--test', action='store_true')
    parser.add_argument('--node', default=shutil.which('node'))
    args = parser.parse_args()
    if not args.node:
        raise ValueError('Node v26.8.1 must be on PATH or supplied with --node')
    node = str(Path(args.node).resolve())
    version = subprocess.check_output([node, '--version'], text=True).strip()
    if version != 'v26.8.1':
        raise ValueError(f'Exact candidate runtime required: v26.8.1; observed {version}')
    manifest = json.loads((BASE / 'SOURCE-MANIFEST.json').read_text())
    expected_digest = manifest['candidate_digest']
    material = {key: value for key, value in manifest.items() if key != 'candidate_digest'}
    if hashlib.sha256(json.dumps(material, sort_keys=True, separators=(',', ':')).encode()).hexdigest() != expected_digest:
        raise ValueError('Candidate manifest digest invalid')
    seen = set()
    for entry in manifest['files']:
        relative = entry['path']
        path = (ROOT / relative).resolve()
        if relative in seen or not path.is_relative_to(ROOT):
            raise ValueError(f'Invalid candidate path: {relative}')
        seen.add(relative)
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError(f'Candidate source changed: {relative}')
    env = dict(os.environ, PATH=str(Path(node).parent) + os.pathsep + os.environ.get('PATH', ''))
    loader = ROOT / 'projects/domainspec-v2/impl/node_modules/tsx/dist/loader.mjs'
    subprocess.run([node, '--import', str(loader), str(BASE / 'build.ts'), '--check'], cwd=ROOT, env=env, check=True)
    import jsonschema
    schema = json.loads((ROOT / 'cyberAlchemy-v2/capability/schemas/capability.schema.json').read_text())
    schema['$ref'] = '#/$defs/productCapability'
    jsonschema.Draft202012Validator(schema).validate(json.loads((ROOT / 'cyberAlchemy-v2/agent-reasoning-engine/capabilities/interaction-context/product-capability.json').read_text()))
    print(f'PASS: {len(seen)} exact source files; candidate {expected_digest}', flush=True)
    if args.test:
        tests = sorted(RUNTIME.glob('packages/*/test/*.test.mjs')) + sorted(RUNTIME.glob('test/*.test.mjs')) + sorted(RUNTIME.glob('benchmarks/*/test/*.test.mjs'))
        frozen_tests = sorted(manifest['test_paths'])
        if sorted(str(path.relative_to(ROOT)) for path in tests) != frozen_tests:
            raise ValueError('Test discovery differs from frozen candidate')
        subprocess.run([node, '--test', *(str(path) for path in tests)], cwd=ROOT, env=env, check=True)
        result = subprocess.run([node, str(RUNTIME / 'benchmarks/real-reasoning-v1/interaction-learning/run.mjs')], cwd=ROOT, env=env, check=True, capture_output=True, text=True)
        benchmark = json.loads(result.stdout)
        if benchmark['status'] != 'PASS':
            raise ValueError('Interaction benchmark failed')
        print(f"PASS: {benchmark['run_count']} synthetic benchmark runs; {benchmark['determinism_mismatches']} mismatches")
    print('authority_effect=none; product approval and activation not granted')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        print(f'BLOCK: {error}', file=sys.stderr)
        sys.exit(1)
