#!/usr/bin/env python3
"""Read-only candidate identity and evidence checks. Questions: REPORT.md."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tests',action='store_true')
    args=parser.parse_args()
    manifest=json.loads((HERE/'evidence/candidate-v1/manifest.json').read_text())
    for path,sha in manifest['files'].items():
        target=(ROOT/path).resolve()
        if not target.is_relative_to(ROOT) or hashlib.sha256(target.read_bytes()).hexdigest()!=sha:
            raise ValueError('CANDIDATE_DRIFT:'+path)
    protected=json.loads((HERE/'evidence/baseline-v1/protected.json').read_text())
    for path,sha in protected.items():
        if hashlib.sha256((ROOT/path).read_bytes()).hexdigest()!=sha:
            raise ValueError('PROTECTED_SOURCE_DRIFT:'+path)
    result=json.loads((HERE/'evidence/candidate-v1/experiments/experiments.json').read_text())
    assert len(result['results'])==70
    assert all(x['repeat_identical'] for x in result['results'])
    assert all(x['invalid_policy_intents']==0 for x in result['results'] if x['variant']!='legacy')
    subprocess.run(['node','--import',str(ROOT/'agent-routing/node_modules/tsx/dist/loader.mjs'),
                    str(HERE/'domainspec/build.mjs'),'--check'],cwd=ROOT,check=True)
    if args.tests:
        subprocess.run([sys.executable,'-m','unittest','discover','-s',str(HERE.parent/'runtime'),
                        '-p','test_interaction_dynamics.py','-v'],cwd=ROOT,check=True,
                       env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
    print(json.dumps({'identity':'PASS','protected_files':len(protected),'comparisons':70,
                      'full_legacy_regression':'BLOCKED_MISSING_RWO_DEPENDENCY',
                      'product_approval':'not_requested','authority_effect':'none'}))


if __name__=='__main__':main()
