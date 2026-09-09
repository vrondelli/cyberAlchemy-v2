#!/usr/bin/env python3
"""Validate the existing exact candidate; do not rebuild or refresh its manifest."""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import host

ROOT = Path(__file__).resolve().parent


def main():
    binding = host.current_binding()
    completed = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                               cwd=ROOT, capture_output=True, timeout=180)
    log = completed.stdout + completed.stderr
    (ROOT / 'test-results.log').write_bytes(log)
    match = re.search(rb'Ran (\d+) tests', log)
    links = []
    for path in [ROOT / 'README.md', *list((ROOT / 'definitions').glob('*.md'))]:
        for ref in re.findall(r'\]\(([^)]+)\)', path.read_text()):
            if not ref.startswith(('https:', 'http:', '#')):
                target = (path.parent / ref.split('#')[0]).resolve()
                # This receipt is written below on both PASS and FAIL; it need
                # not already exist when validating a fresh checkout.
                if target != ROOT / 'validation.json' and not target.exists():
                    links.append(ref)
    unchanged = binding == host.current_binding()
    result = {'status': 'PASS' if completed.returncode == 0 and not links and unchanged else 'FAIL',
              'schema_version': 'alch-host-provisioning-validation/v1',
              'tested_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'product_construction': 'local-provisioning-candidate', 'authority_effect': 'none',
              'candidate': binding, 'tests': int(match.group(1)) if match else 0,
              'exit_code': completed.returncode, 'broken_links': links,
              'source_unchanged_during_validation': unchanged,
              'test_log_sha256': hashlib.sha256(log).hexdigest(),
              'effect_scope': 'real Ansible writes to test-owned temporary directories, cleaned by tests',
              'not_evaluable': ['cloud provisioning', 'Alch service activation', 'multi-host recovery',
                                'power-loss survival', 'typed ORODI runtime evidence'],
              'causal_blockers': 'Those adapters and operational environments are outside this local candidate.',
              'open_questions_ref': 'README.md#open-questions'}
    (ROOT / 'validation.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    return 0 if result['status'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
