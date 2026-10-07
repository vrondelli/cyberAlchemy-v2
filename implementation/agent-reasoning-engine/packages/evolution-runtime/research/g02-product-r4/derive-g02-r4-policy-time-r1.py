#!/usr/bin/env python3
"""Include candidate-only pruning compute in the G02 paired arm-time metric."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-policy-gitfix-r1'
OUTPUT = BASE / 'g02-product-replication-tools-r4-policy-time-r1'
DRIVER_SHA = 'bb5395a20834d97bab19b8571025b1fedcac91dc9d3d46249856a7b49423c50a'
SOURCE_MANIFEST_SHA = '925b163bc9d2fa44ec2c47793bd186928d5d2ff8f119a7b75d5bb2826a9aba60'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def replace_once(value, before, after, label):
    count = value.count(before)
    if count != 1:
        raise ValueError(f'g02-r4-policy-time.{label}:expected-one-found-{count}')
    return value.replace(before, after)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: derive-g02-r4-policy-time-r1.py check|build')
    driver = SOURCE / 'run-and-score-pair.mjs'
    if sha(driver) != DRIVER_SHA or sha(SOURCE / 'GITFIX-SOURCE.json') != SOURCE_MANIFEST_SHA:
        raise ValueError('g02-r4-policy-time.source-drift')
    code = driver.read_text()
    code = replace_once(code,
        "checked('policy-projection','python3',[join(tools,'project-g02-r4-selected-pruning-r1.py'),",
        "const policyProjectionStarted=process.hrtime.bigint();\n"
        "checked('policy-projection','python3',[join(tools,'project-g02-r4-selected-pruning-r1.py'),",
        'projection-start')
    code = replace_once(code,
        "'produce-fresh','--root',root]);\n"
        "const policySeal=parse(join(root,'policy-pruning/POLICY-SEAL.json'));",
        "'produce-fresh','--root',root]);\n"
        "const policyProjectionSeconds=Number(process.hrtime.bigint()-policyProjectionStarted)/1e9;\n"
        "need(Number.isFinite(policyProjectionSeconds)&&policyProjectionSeconds>=0,'policy-time');\n"
        "const policySeal=parse(join(root,'policy-pruning/POLICY-SEAL.json'));",
        'projection-end')
    code = replace_once(code,
        "'policy-seal-drift');\nconst score=(arm,work)=>{",
        "'policy-seal-drift');\n"
        "writeFileSync(join(root,'POLICY-PROJECTION-TIMING.json'),JSON.stringify({"
        "schema_version:'are.g02-r4-policy-projection-timing/v1',"
        "policy_seal_sha256:sha(readFileSync(join(root,'policy-pruning/POLICY-SEAL.json'))),"
        "raw_pair_seal_sha256:sha(readFileSync(join(root,'PAIR-PRE-SCORE-SEAL.json'))),"
        "projection_seconds:policyProjectionSeconds},null,2)+'\\n',{flag:'wx'});\n"
        "const score=(arm,work)=>{",
        'timing-receipt')
    code = replace_once(code,
        "arm_seconds:seal.arm_seconds[arm],",
        "arm_seconds:seal.arm_seconds[arm]+(arm==='are'?policyProjectionSeconds:0),",
        'all-in-arm-seconds')
    code = replace_once(code,
        "policy_prediction_sha256:policySeal.prediction_sha256,quality,",
        "policy_prediction_sha256:policySeal.prediction_sha256,"
        "policy_projection_timing_sha256:sha(readFileSync(join(root,'POLICY-PROJECTION-TIMING.json'))),"
        "policy_projection_seconds:policyProjectionSeconds,raw_arm_seconds:seal.arm_seconds,quality,",
        'decision-timing-binding')
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'checked-no-write',
                          'driver_sha256': hashlib.sha256(code.encode()).hexdigest()}))
        return
    if OUTPUT.exists():
        raise ValueError('g02-r4-policy-time.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'run-and-score-pair.mjs').write_text(code)
    payload = {'schema_version': 'are.g02-r4-policy-time-source/v1',
               'posture': 'candidate-not-campaign-frozen',
               'base_driver_sha256': DRIVER_SHA,
               'gitfix_source_sha256': SOURCE_MANIFEST_SHA,
               'builder_sha256': sha(__file__),
               'driver_sha256': sha(OUTPUT / 'run-and-score-pair.mjs'),
               'candidate_arm_time': 'ARE settlement seconds plus measured pruning projection seconds; DSH settlement seconds unchanged',
               'claim_ceiling': 'Prospective all-in time accounting source; no fresh model result.',
               'open_questions': ['Does the next frozen matched cohort remain complete?',
                                  'Do paired quality and all-in efficiency intervals support a claim?']}
    with (OUTPUT / 'TIME-SOURCE.json').open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'built-no-model',
                      'manifest_sha256': sha(OUTPUT / 'TIME-SOURCE.json'),
                      'driver_sha256': payload['driver_sha256']}))


if __name__ == '__main__':
    main()
