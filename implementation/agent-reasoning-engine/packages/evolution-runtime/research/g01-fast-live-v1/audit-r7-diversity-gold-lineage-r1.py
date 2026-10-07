#!/usr/bin/env python3
"""Evaluator-only positional gold audit for additional untouched repositories."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


PRIOR_SCRIPT = Path(__file__).with_name('audit-r7-cgojs-gold-lineage-r1.py')
EXPECTED_PRIOR_SHA = 'cbf4487a8c171c386a36f6c3bc2055fd8052019514401b21bc6bfd5188679092'
EXPECTED_CACHE_SCRIPT_SHA = '00dccd5bd90d33c8587ace13dd2b3f6946361486322d42603f71602d23a8ec6e'
TARGETS = {
    'serverless/serverless': ('javascript', 12),
    'future-architect/vuls': ('go', 4),
    'iamkun/dayjs': ('javascript', 9),
    'prettier/prettier': ('javascript', 11),
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True, choices=sorted(TARGETS))
    args = parser.parse_args()
    if sha(PRIOR_SCRIPT) != EXPECTED_PRIOR_SHA:
        raise ValueError('prior-script-drift')
    spec = importlib.util.spec_from_file_location('g01_r7_cgojs_audit', PRIOR_SCRIPT)
    prior = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(prior)
    prior.TARGETS = TARGETS
    prior.EXPECTED_CACHE_SCRIPT_SHA = EXPECTED_CACHE_SCRIPT_SHA
    result = prior.audit(args.repo)
    result['schema_version'] = 'are.g01-r7-diversity-gold-lineage-eligibility/v1'
    result['prior_script_sha256'] = EXPECTED_PRIOR_SHA
    result['script_sha256'] = sha(Path(__file__))
    result['cache_script_sha256'] = EXPECTED_CACHE_SCRIPT_SHA
    output = prior.OUTPUT_ROOT / (args.repo.replace('/', '--') + '-GOLD-LINEAGE-ELIGIBILITY.json')
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'receipt_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
