#!/usr/bin/env python3
"""Evaluator-only G01 r10 r4 native-gold file admission; exports counts, never paths."""

import hashlib
import importlib.util
import json
import os
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g01-post-r8-index-gold-coverage-r2/audit-post-r8-index-gold-coverage-r2.py'
SOURCE_SHA = '6a67e3c43738fd1b97ab283c161a8aa5751a3de6b04c2b50b4fe3bae8afab602'
CANDIDATE = BASE / 'g01-r10-clean-cohort-candidate-r4/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-r10-source-caches-r4/SOURCE-CACHES.json'
PREFLIGHT = BASE / 'g01-r10-runner-index-preflight-r4/RUNNER-INDEX-PREFLIGHT.json'
OUTPUT = BASE / 'g01-r10-index-gold-coverage-r4/GOLD-INDEX-COVERAGE.json'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def main():
    if sha(SOURCE) != SOURCE_SHA:
        raise ValueError('auditor-source-drift')
    if not OUTPUT.parent.is_dir() or OUTPUT.exists():
        raise ValueError('fresh-exact-output-required')
    spec = importlib.util.spec_from_file_location('g01_post_r8_coverage', SOURCE)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.CANDIDATE = CANDIDATE
    auditor.CACHES = CACHES
    auditor.PREFLIGHT = PREFLIGHT
    auditor.PINS = {
        CANDIDATE: '653c7d558c66ce7d80b4246405e3606e4a8b2a42e1d84d76af7a0fbdabd3d26f',
        CACHES: '4f334f7ff8defa8f1741a984238ded4dea12b731077f19738041c2848eab1c07',
        PREFLIGHT: '43247cad96b2c5383aba87cde14c9c003795fb9883a7d2b432a94aa1c83e0be0',
        auditor.WORKER: 'c682a449cfc336f93e58ed1a87221178af17bdb0ab6d1904f63125dfb5a2536b',
        auditor.HINTS: '7f7e9d0299bd138fdde8f4a3c55869098cde5c57b0015481926e993510b4025a',
        auditor.UPSTREAM / 'data/full.parquet': '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8',
    }
    result = auditor.audit()
    result['schema_version'] = 'are.g01-r10-index-gold-coverage/v4'
    result['auditor_source_sha256'] = SOURCE_SHA
    result['script_sha256'] = sha(Path(__file__))
    result['status'] = ('passed' if result['summary']['audited'] == 24 and
                        result['summary']['admitted'] == result['summary']['gold_files'] and
                        result['summary']['excluded'] == 0 and result['summary']['absent'] == 0
                        else 'failed')
    descriptor = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write((json.dumps(result, indent=2, sort_keys=True) + '\n').encode())
    print(json.dumps({'status': result['status'], 'summary': result['summary'],
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))
    if result['status'] != 'passed':
        raise SystemExit(2)


if __name__ == '__main__':
    main()
