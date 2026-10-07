#!/usr/bin/env python3
"""Version the G02 pair driver to project fixed pruning before native scores."""

import hashlib
import json
import shutil
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
SOURCE = BASE / 'g02-product-replication-tools-r4-adapter-r1'
POLICY = BASE / 'g02-r4-cohort-code-r1/project-g02-r4-selected-pruning-r1.py'
OUTPUT = BASE / 'g02-product-replication-tools-r4-policy-r1'
DRIVER_SHA = '3d3645fa41e2d408b59cd74aea9ecfc79aeafc777368e64de77c8d95d32d6194'
POLICY_SHA = '4107f9f5e805ec8ce20b6b099fcd876cf5abed3bf045bb70e2b6798089a1ebe2'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def replace_once(source, before, after, label):
    count = source.count(before)
    if count != 1:
        raise ValueError(f'g02-r4-policy-driver.{label}:expected-one-found-{count}')
    return source.replace(before, after)


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('check', 'build'):
        raise ValueError('usage: derive-g02-r4-policy-driver-r1.py check|build')
    driver = SOURCE / 'run-and-score-pair.mjs'
    if sha(driver) != DRIVER_SHA or sha(POLICY) != POLICY_SHA:
        raise ValueError('g02-r4-policy-driver.source-drift')
    code = driver.read_text()
    code = replace_once(code,
        "checked('pre-score-seal',node,[join(tools,'seal-prospective.mjs')],{env});",
        "checked('pre-score-seal',node,[join(tools,'seal-prospective.mjs')],{env});\n"
        "const rawSeal=parse(join(root,'PAIR-PRE-SCORE-SEAL.json'));\n"
        "checked('policy-projection','python3',[join(tools,'project-g02-r4-selected-pruning-r1.py'),"
        "'produce-fresh','--root',root]);\n"
        "const policySeal=parse(join(root,'policy-pruning/POLICY-SEAL.json'));\n"
        "need(policySeal.status==='prediction-sealed-before-native-score'&&"
        "policySeal.source_prediction_sha256===rawSeal.predictions.are.sha256&&"
        "policySeal.prediction_sha256===sha(readFileSync(join(root,'policy-pruning/prediction.json'))),"
        "'policy-seal-drift');",
        'pre-score-projection')
    code = replace_once(code,
        "score('are','evidence/run');score('dsh','dsh-export');",
        "score('are','policy-pruning');score('dsh','dsh-export');",
        'score-policy-output')
    code = replace_once(code,
        "[['are','evidence/run/native-score.json'],['dsh','dsh-export/native-score.json']]",
        "[['are','policy-pruning/native-score.json'],['dsh','dsh-export/native-score.json']]",
        'quality-policy-score')
    code = replace_once(code,
        "pre_score_seal_sha256:sha(readFileSync(join(root,'PAIR-PRE-SCORE-SEAL.json'))),quality,",
        "pre_score_seal_sha256:sha(readFileSync(join(root,'PAIR-PRE-SCORE-SEAL.json'))),"
        "policy_seal_sha256:sha(readFileSync(join(root,'policy-pruning/POLICY-SEAL.json'))),"
        "policy_prediction_sha256:policySeal.prediction_sha256,quality,",
        'decision-policy-binding')
    if sys.argv[1] == 'check':
        print(json.dumps({'status': 'checked-no-write',
                          'driver_sha256': hashlib.sha256(code.encode()).hexdigest()}))
        return
    if OUTPUT.exists():
        raise ValueError('g02-r4-policy-driver.output-exists')
    shutil.copytree(SOURCE, OUTPUT)
    (OUTPUT / 'run-and-score-pair.mjs').write_text(code)
    shutil.copy2(POLICY, OUTPUT / POLICY.name)
    payload = {'schema_version': 'are.g02-r4-policy-driver-source/v1',
               'posture': 'candidate-not-campaign-frozen',
               'base_driver_sha256': DRIVER_SHA, 'policy_source_sha256': POLICY_SHA,
               'builder_sha256': sha(__file__),
               'driver_sha256': sha(OUTPUT / 'run-and-score-pair.mjs'),
               'policy_copy_sha256': sha(OUTPUT / POLICY.name),
               'scoring_order': 'raw arms -> raw pair seal -> fixed pruning projection and seal -> native ARE policy score and DSH score',
               'claim_ceiling': 'Versioned driver source; no model run or superiority result.',
               'open_questions': ['Does a no-generation integration test pass the projection/scoring order?',
                                  'Can the 24-pair campaign freeze and run under scratch/archive guards?']}
    with (OUTPUT / 'POLICY-DRIVER-SOURCE.json').open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': 'built-no-model',
                      'manifest_sha256': sha(OUTPUT / 'POLICY-DRIVER-SOURCE.json'),
                      'driver_sha256': payload['driver_sha256']}))


if __name__ == '__main__':
    main()
