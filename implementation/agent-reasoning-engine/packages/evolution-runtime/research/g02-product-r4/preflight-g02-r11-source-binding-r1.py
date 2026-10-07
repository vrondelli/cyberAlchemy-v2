#!/usr/bin/env python3
"""Exercise the future driver's named-source guard on all r11 tasks."""

from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import subprocess


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r11-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-CLONE-PREFLIGHT-R1.json'
PREPARE = ROOT / 'PREPARE-PREFLIGHT-R1.json'
DRIVER = BASE / 'g02-r11-selection-only-tools-r1/run-and-score-pair.mjs'
OUTPUT = ROOT / 'SOURCE-BINDING-PREFLIGHT-R1.json'
PINS = {
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    PREPARE: 'dd277fd9ff2b022eb5764002f438b7203f41e67934fe0ec7b586f7b07776bf70',
    DRIVER: '080328888115a1c033033413fd0b487921ad076febb8ca360268751a44e3dd81',
}
PATTERN = re.compile(r'\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-source-binding.' + reason)


def main():
    need(not OUTPUT.exists() and all(path.is_file() and sha(path) == digest
         for path, digest in PINS.items()) and
         'unbound-named-objective' in DRIVER.read_text(),
         'input-output-or-driver-drift')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())['results']
    prepared = json.loads(PREPARE.read_text())['rows']
    need(len(tasks) == len(caches) == len(prepared) == 24, 'denominator')
    rows = []
    for task, cache, prep in zip(tasks, caches, prepared):
        ordinal = task['ordinal']
        root = Path(prep['root'])
        task_file = root / 'tasks' / (task['instance_id'] + '.json')
        need(ordinal == cache['ordinal'] == prep['ordinal'] == len(rows) + 1 and
             task['instance_id'] == cache['instance_id'] == prep['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             sha(task_file) == prep['task_sha256'],
             'task-binding:' + str(ordinal))
        projected = json.loads(task_file.read_text())
        names = list(dict.fromkeys(PATTERN.findall(projected['problem_statement'])))[:12]
        found = 0
        for name in names:
            result = subprocess.run(['git', '-C', cache['cache_path'], 'grep',
                                     '-q', '-F', name, task['base_commit'], '--'],
                                    capture_output=True, timeout=90)
            need(result.returncode in (0, 1), 'git-grep:' + str(ordinal))
            found += result.returncode == 0
        disposition = 'unbound-named-objective' if len(names) >= 2 and found == 0 else 'admissible'
        rows.append({'ordinal': ordinal, 'repo': task['repo'],
                     'named_identifiers': len(names), 'found_in_base': found,
                     'disposition': disposition})
        print(json.dumps(rows[-1], sort_keys=True), flush=True)
    counts = Counter(row['disposition'] for row in rows)
    payload = {
        'schema_version': 'are.g02-r11-source-binding-preflight/v1',
        'status': 'passed' if counts['unbound-named-objective'] == 0 else 'failed',
        'posture': 'source-only-no-model-no-gold',
        'source_sha256': {str(path): digest for path, digest in PINS.items()},
        'script_sha256': sha(__file__), 'task_count': len(rows),
        'dispositions': dict(sorted(counts.items())),
        'rows': rows, 'model_calls': 0,
        'claim_ceiling': 'Driver source-binding guard only; arm execution, paired scores, and superiority unproven.',
        'open_questions': ['Will the full live driver settle all 24 pairs?',
                           'Will ARE improve native quality and efficiency?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': payload['status'], 'sha256': sha(OUTPUT),
                      'dispositions': payload['dispositions']}))


if __name__ == '__main__':
    main()
