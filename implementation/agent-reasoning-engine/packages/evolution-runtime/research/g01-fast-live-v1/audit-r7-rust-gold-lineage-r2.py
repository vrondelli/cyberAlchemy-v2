#!/usr/bin/env python3
"""R7 Rust label audit successor: recognize numbered blank EOF lines."""

import hashlib
import importlib.util
import json
import re
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PRIOR_RESULT = BASE / 'g01-r7-rust-gold-lineage-r1/GOLD-LINEAGE-ELIGIBILITY.json'
OUTPUT_ROOT = BASE / 'g01-r7-rust-gold-lineage-r2'
PRIOR_SCRIPT = Path(__file__).with_name('audit-r7-rust-gold-lineage-r1.py')
EXPECTED_PRIOR_RESULT = '9126728ee7071de6e471101c61485e89814e6dab5b0dced02c76a59c182a9b98'
EXPECTED_PRIOR_SCRIPT = '71ecec21548c5a8a565d0974db4cb338c8a2ccf60501ea2495eb196d4807321a'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def content_lines(content):
    if not isinstance(content, str) or not content:
        return None, None
    raw = content.splitlines()
    parsed = [re.match(r'^(\d+)(?:\t(.*))?$', line) for line in raw]
    if raw and all(parsed):
        return [match.group(2) or '' for match in parsed], [int(match.group(1)) for match in parsed]
    return raw, None


def main():
    if sha(PRIOR_RESULT) != EXPECTED_PRIOR_RESULT or sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT:
        raise ValueError('prior-result-or-script-drift')
    spec = importlib.util.spec_from_file_location('g01_r7_rust_gold_r1', PRIOR_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.content_lines = content_lines
    result = module.audit()
    result['schema_version'] = 'are.g01-r7-rust-gold-lineage-eligibility/v2'
    result['prior_result_sha256'] = EXPECTED_PRIOR_RESULT
    result['prior_script_sha256'] = EXPECTED_PRIOR_SCRIPT
    result['script_sha256'] = sha(Path(__file__))
    result['method_change'] = 'A bare decimal line in otherwise numbered annotation content is an empty numbered source line.'
    if not OUTPUT_ROOT.is_dir():
        raise ValueError('exact output root must exist')
    output = OUTPUT_ROOT / 'GOLD-LINEAGE-ELIGIBILITY.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
