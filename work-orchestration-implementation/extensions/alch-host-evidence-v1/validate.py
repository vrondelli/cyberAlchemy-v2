#!/usr/bin/env python3
"""Test one exact local adapter candidate and retain a typed example."""
import datetime as dt
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import adapter as a

ROOT = Path(__file__).resolve().parent


def sources():
    paths = [ROOT / name for name in ('adapter.py', 'validate.py', 'policy.json', 'PLAN.json', 'ontology.json', 'README.md', 'tests/test_evidence.py')]
    paths += [a.SCHEMA, a.PROVISION / 'source-manifest.json', a.PROVISION / 'host.py',
              a.PROVISION / 'generated/dag.json', a.PROVISION / 'domainspec.json']
    return {str(p.relative_to(a.REPO)): a.host.digest(p.read_bytes()) for p in paths}


def main():
    before = sources()
    provisioning = a.host.current_binding()
    result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                            cwd=ROOT, capture_output=True, timeout=90)
    log = result.stdout + result.stderr
    (ROOT / 'test-results.log').write_bytes(log)
    match = re.search(rb'Ran (\d+) tests', log)
    example = None
    if result.returncode == 0:
        with tempfile.TemporaryDirectory(prefix='alch-provision-') as root:
            if a.host.run(root)['status'] != 'Succeeded':
                raise RuntimeError('EXAMPLE_PROVISIONING_FAILED')
            now = dt.datetime.now(dt.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
            example = a.observe(root, now, now)
        (ROOT / 'example.json').write_text(json.dumps(example, indent=2) + '\n')
    broken = []
    for ref in re.findall(r'\]\(([^)]+)\)', (ROOT / 'README.md').read_text()):
        target = (ROOT / ref.split('#')[0]).resolve()
        if target.name not in ('source-manifest.json', 'validation.json') and not target.exists():
            broken.append(ref)
    same = before == sources() and provisioning == a.host.current_binding()
    manifest = {'schema_version': 'alch-evidence-source-manifest/v1', 'sources': before,
                'predecessor_binding': provisioning, 'authority_effect': 'none', 'open_questions_ref': 'README.md#open-questions'}
    (ROOT / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    receipt = {'status': 'PASS' if result.returncode == 0 and same and not broken and example and example['evaluation']['verdict'] == 'pass' else 'FAIL',
               'tests': int(match.group(1)) if match else 0, 'test_exit_code': result.returncode,
               'source_manifest_sha256': a.host.digest((ROOT / 'source-manifest.json').read_bytes()),
               'test_log_sha256': a.host.digest(log), 'example_sha256': a.sha(example) if example else None,
               'source_unchanged': same, 'predecessor_unchanged': provisioning == a.host.current_binding(),
               'broken_links': broken, 'authority_effect': 'none',
               'effect_scope': 'test-owned temporary Ansible fixtures, removed after validation',
               'claim_scope': 'historical-local-fixture',
               'not_evaluable': ['live host readiness', 'full ORODI C01-C16 evaluation', 'cloud deployment'],
               'open_questions_ref': 'README.md#open-questions'}
    (ROOT / 'validation.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))
    return 0 if receipt['status'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
