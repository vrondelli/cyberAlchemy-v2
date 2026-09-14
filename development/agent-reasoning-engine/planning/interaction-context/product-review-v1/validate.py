"""Freeze/check the exact local interaction-review candidate; optionally rerun its required tests."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[4]
RUNTIME = ROOT / 'implementation/agent-reasoning-engine'
PACKAGES = ('request-intent-runtime', 'codex-app-server-wrapper', 'evolution-runtime')
EXCLUDED = {'SOURCE-MANIFEST.json', 'TEST-RESULT.json', 'TEST-REPORT.md', 'DEMO-RESULT.json', 'BASELINE-RESULT.json'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def tests():
    return sorted(str(p.relative_to(ROOT)) for name in PACKAGES for p in (RUNTIME / 'packages' / name / 'test').glob('*.test.mjs'))


def command(args, **kw):
    result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, **kw)
    if result.returncode:
        raise ValueError(f"Command failed ({result.returncode}): {' '.join(args)}\n{result.stdout[-12000:]}\n{result.stderr[-3000:]}")
    return result


def collect_sources(node):
    paths = set()
    # Include all package source/test data; this is a source identity closure,
    # not a claim that every package is covered by this candidate's test contract.
    for p in (RUNTIME / 'packages').rglob('*'):
        if p.is_file() and not any(part.startswith('.') or part in ('node_modules', '__pycache__') for part in p.relative_to(RUNTIME / 'packages').parts):
            paths.add(p)
    for p in BASE.rglob('*'):
        if p.is_file() and p.name not in EXCLUDED and p.suffix not in ('.tap', '.log', '.pyc') and '__pycache__' not in p.parts:
            paths.add(p)
    paths.add(ROOT / 'agent-reasoning-engine/REASONING-AND-LEARNING.md')
    paths.add(BASE.parent / 'full-loop/DEFINITION-PACK.v1-candidate.json')
    paths.add(ROOT / 'agent-reasoning-engine/capabilities/interaction-context/product-capability.json')
    paths.add(ROOT / 'agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json')
    paths.add(RUNTIME / 'bin/are.mjs')
    # Observe the real demo and prototype compiler, including their dynamic
    # source reads. No inferred whole-repository dependency scan is required.
    with tempfile.TemporaryDirectory(prefix='are-review-trace-') as temp:
        trace = Path(temp) / 'trace.json'
        for script, args in [(RUNTIME / 'packages/codex-app-server-wrapper/bin/are-interaction.mjs', ['demo', '--json']), (BASE / 'build.mjs', ['--check'])]:
            env = dict(os.environ, ARE_REVIEW_TRACE_PATH=str(trace))
            command([node, '--import', str(BASE / 'source-trace.mjs'), str(script), *args], env=env)
            paths.update(ROOT / rel for rel in json.loads(trace.read_text()))
    return sorted(paths)


def verify(manifest):
    material = {k: v for k, v in manifest.items() if k != 'candidate_digest'}
    if digest(canonical(material)) != manifest['candidate_digest']:
        raise ValueError('Candidate manifest digest invalid')
    if manifest['test_paths'] != tests():
        raise ValueError('Required test discovery changed')
    seen = set()
    for entry in manifest['files']:
        path = (ROOT / entry['path']).resolve()
        if not path.is_relative_to(ROOT) or entry['path'] in seen:
            raise ValueError('Invalid/duplicate candidate path')
        seen.add(entry['path'])
        if digest(path.read_bytes()) != entry['sha256']:
            raise ValueError(f"Candidate source changed: {entry['path']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--freeze', action='store_true', help='write a new construction snapshot before testing')
    parser.add_argument('--test', action='store_true')
    parser.add_argument('--node', default='node')
    args = parser.parse_args()
    version = command([args.node, '--version']).stdout.strip()
    if version != 'v26.8.1':
        raise ValueError(f'Expected Node v26.8.1, observed {version}')
    if args.freeze:
        paths = collect_sources(args.node)
        material = {'schema_version': 'are.interaction-review-candidate/v1', 'construction_id': 'ARE-INTERACTION-REVIEW-001',
                    'node': version, 'files': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p.read_bytes())} for p in paths],
                    'test_paths': tests(), 'authority_effect': 'none', 'product_approval': 'not-granted'}
        manifest = {**material, 'candidate_digest': digest(canonical(material))}
        (BASE / 'SOURCE-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
    else:
        manifest = json.loads((BASE / 'SOURCE-MANIFEST.json').read_text())
    verify(manifest)
    build = command([args.node, str(BASE / 'build.mjs'), '--check'])
    if args.test:
        run = command([args.node, '--test', '--test-reporter=tap', *manifest['test_paths']])
        (BASE / 'tests.tap').write_text(run.stdout)
        counts = {k: int(re.search(rf'^# {k} (\d+)$', run.stdout, re.M).group(1)) for k in ['tests', 'pass', 'fail', 'skipped', 'cancelled']}
        if counts['tests'] == 0 or counts['fail'] or counts['skipped'] or counts['cancelled']:
            raise ValueError(f'Test contract did not pass: {counts}')
        demo = json.loads(command([args.node, str(RUNTIME / 'bin/are.mjs'), 'interaction', 'demo', '--json']).stdout)
        if demo['status'] != 'PASS' or not all(demo['checks'].values()):
            raise ValueError('Review demo did not pass')
        (BASE / 'DEMO-RESULT.json').write_text(json.dumps(demo, indent=2) + '\n')
        verify(manifest)
        result = {'schema_version': 'are.interaction-review-test-result/v1', 'candidate_digest': manifest['candidate_digest'],
                  'status': 'PASS', 'node': version, 'tests': counts, 'demo_checks': demo['checks'],
                  'live_model_test': 'NOT_RUN', 'evidence_kind': demo['evidence_kind'],
                  'test_log_sha256': digest(run.stdout.encode()), 'demo_sha256': digest((BASE / 'DEMO-RESULT.json').read_bytes()),
                  'build_check': build.stdout.strip(), 'authority_effect': 'none', 'product_approval': 'not-granted'}
        (BASE / 'TEST-RESULT.json').write_text(json.dumps(result, indent=2) + '\n')
        print(f"PASS: {counts['pass']} required tests, {len(demo['checks'])} joined demo checks, no skips")
    else:
        result_path = BASE / 'TEST-RESULT.json'
        if result_path.exists():
            result = json.loads(result_path.read_text())
            if result['candidate_digest'] != manifest['candidate_digest'] or result['status'] != 'PASS':
                raise ValueError('Test receipt does not match candidate')
            if digest((BASE / 'tests.tap').read_bytes()) != result['test_log_sha256'] or digest((BASE / 'DEMO-RESULT.json').read_bytes()) != result['demo_sha256']:
                raise ValueError('Test evidence changed')
    print(f"PASS: {len(manifest['files'])} exact sources; candidate {manifest['candidate_digest']}; authority_effect=none")


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.TimeoutExpired) as error:
        raise SystemExit(str(error))
