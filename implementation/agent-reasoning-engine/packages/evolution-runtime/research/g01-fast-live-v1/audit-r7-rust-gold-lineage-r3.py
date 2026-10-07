#!/usr/bin/env python3
"""Evaluator-only Rust eligibility after resolving source formatting conventions."""

import hashlib
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g01-r7-rust-gold-lineage-r3'
PRIOR = BASE / 'g01-r7-rust-gold-lineage-r2/GOLD-LINEAGE-ELIGIBILITY.json'
PRIOR_SCRIPT = Path(__file__).with_name('audit-r7-rust-gold-lineage-r1.py')
EXPECTED_PRIOR_SHA = 'aeb97d0845d26a5fa17606c9119e69e7468c846c212ad24033dd35584f50c03a'
EXPECTED_PRIOR_SCRIPT_SHA = '71ecec21548c5a8a565d0974db4cb338c8a2ccf60501ea2495eb196d4807321a'


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


def classify(item, cache, commit, normalize):
    path = normalize(item.get('file', ''))
    if not path or path.startswith('/') or '..' in Path(path).parts or '\\' in path:
        return 'invalid-path'
    try:
        data = subprocess.check_output(['git', '-C', str(cache), 'show', f'{commit}:{path}'],
                                       timeout=30, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        return 'file-absent-from-base'
    lines = data.decode('utf8', errors='replace').splitlines()
    start, end = item.get('start_line'), item.get('end_line')
    if (type(start) is not int or type(end) is not int or
            not 1 <= start <= end or start > len(lines) or end > len(lines) + 1):
        return 'range-beyond-base'
    observed, numbers = content_lines(item.get('content'))
    if not observed:
        return 'content-absent'
    if numbers is not None and numbers != list(range(start, start + len(observed))):
        return 'content-numbering-mismatch'
    expected = lines[start - 1:min(end, len(lines))]
    if observed == expected:
        return 'verified-exact'
    if len(observed) == len(expected) and all(a.strip() == b.strip() for a, b in zip(observed, expected)):
        return 'verified-whitespace-only'
    if end == len(lines) + 1 and observed[-1] == '' and observed[:-1] == expected:
        return 'verified-eof-empty-sentinel'
    if (len(observed) == len(expected) - 1 and expected[-1].strip() == '' and
            observed == expected[:-1]):
        return 'verified-omitted-terminal-blank'
    return 'content-source-mismatch'


def main():
    if sha(PRIOR) != EXPECTED_PRIOR_SHA or sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SCRIPT_SHA:
        raise ValueError('prior-result-or-script-drift')
    spec = importlib.util.spec_from_file_location('g01_r7_rust_gold_r1', PRIOR_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.classify = classify
    result = module.audit()
    result['schema_version'] = 'are.g01-r7-rust-gold-lineage-eligibility/v3'
    result['prior_result_sha256'] = EXPECTED_PRIOR_SHA
    result['prior_script_sha256'] = EXPECTED_PRIOR_SCRIPT_SHA
    result['script_sha256'] = sha(Path(__file__))
    result['method_change'] = 'Allow in-position whitespace differences, omitted terminal blank lines, and the scorer EOF sentinel; reject shifted coordinates and absent files.'
    if not ROOT.is_dir():
        raise ValueError('exact output root must exist')
    output = ROOT / 'GOLD-LINEAGE-ELIGIBILITY.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    if sys.argv[1:] != ['audit']:
        raise SystemExit('usage: audit-r7-rust-gold-lineage-r3.py audit')
    main()
