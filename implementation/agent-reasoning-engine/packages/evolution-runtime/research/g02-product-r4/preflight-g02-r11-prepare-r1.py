#!/usr/bin/env python3
"""Run only G02 r11 source preparation on all 24 development tasks."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r11-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-CLONE-PREFLIGHT-R1.json'
TOOLS = BASE / 'g02-r11-selection-only-tools-r1'
MANIFEST = TOOLS / 'R11-TOOLS-CANDIDATE.json'
OUTPUT = ROOT / 'PREPARE-PREFLIGHT-R1.json'
JOURNAL = ROOT / 'PREPARE-PREFLIGHT-R1-JOURNAL.jsonl'
RUNS = Path('/tmp/are-g02-r4-runs')
NODE = Path('/opt/cyberalchemy-are-tools/node-24.10.0/node')
PINS = {
    CANDIDATE: '6150685f909ba7ee2d83154375e5599511620aae3a9c820e1178c29c1e7c8b42',
    CACHES: '42c3388b27fb22f59ff1acfa41d4d2fb6b0df6ab41a536e16d10b82f1fb85620',
    MANIFEST: '63f51bd80ea791697821bcf4a0091100c7ca9f5e9ffa9f4fdafd1a3a7abc2501',
    TOOLS / 'prepare-prospective.mjs': 'ea65e4cab52ba1dbcb2ec1b3014aed7c4acf47f13b0b248de65b181fe46e41ec',
    TOOLS / 'run-and-score-pair.mjs': '080328888115a1c033033413fd0b487921ad076febb8ca360268751a44e3dd81',
    TOOLS / 'project-g02-r11-mixed-pruning-r1.py': '843ecb33048e13117d7bde337f3b54d7a1fc1717b8cd0cd36d5371064a7c08c3',
}


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r11-prepare-preflight.' + reason)


def main():
    need(not OUTPUT.exists() and not JOURNAL.exists() and
         all(path.is_file() and sha(path) == digest for path, digest in PINS.items()) and
         NODE.is_file() and RUNS.is_dir() and
         shutil.disk_usage('/tmp').free >= 2 * 1024**3,
         'input-output-or-storage-boundary')
    tasks = json.loads(CANDIDATE.read_text())['ordered_tasks']
    caches = json.loads(CACHES.read_text())['results']
    manifest = json.loads(MANIFEST.read_text())
    need(len(tasks) == len(caches) == len(manifest['safe_directories']) == 24 and
         manifest['candidate_sha256'] == PINS[CANDIDATE] and
         manifest['task_cache_receipt_sha256'] == PINS[CACHES],
         'manifest-shape')
    rows = []
    for task, cache in zip(tasks, caches):
        ordinal = task['ordinal']
        suffix = 'pr11-mixed-pf-' + format(ordinal, '02d')
        run_root = RUNS / ('g02-cross-layer-' + suffix)
        need(ordinal == cache['ordinal'] == len(rows) + 1 and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             cache['cache_path'] ==
             '/tmp/are-g02-r11-task-caches-r1/cache/' + cache['cache_leaf'] and
             manifest['safe_directories'][ordinal - 1] == '/cache/' + cache['cache_leaf'] and
             not run_root.exists() and
             shutil.disk_usage('/tmp').free >= 2 * 1024**3,
             'task-binding-or-storage:' + str(ordinal))
        env = {
            'PATH': os.environ.get('PATH', '/usr/bin:/bin'),
            'G02_PAIR_SUFFIX': suffix, 'G02_INSTANCE': task['instance_id'],
            'G02_REPO': task['repo'], 'G02_TOOLS_ROOT': str(TOOLS),
            'G02_OWN_EXPANSIONS': '1', 'G02_EXPOSED': '0',
            'G02_RETENTION': '0', 'G02_SELECTIVE_RETENTION': '0',
            'G02_GO_PACKET': '0',
        }
        prepared = subprocess.run([str(NODE), str(TOOLS / 'prepare-prospective.mjs')],
                                  capture_output=True, text=True, timeout=180, env=env)
        need(prepared.returncode == 0, 'prepare:' + str(ordinal) +
             ':' + prepared.stderr[-300:])
        binding_file = run_root / 'tasks/binding.json'
        freeze_file = run_root / 'FREEZE.json'
        task_file = run_root / 'tasks' / (task['instance_id'] + '.json')
        need(binding_file.is_file() and freeze_file.is_file() and task_file.is_file() and
             not (run_root / 'evidence').exists(), 'prepared-root-shape:' + str(ordinal))
        binding = json.loads(binding_file.read_text())
        freeze = json.loads(freeze_file.read_text())
        projected = json.loads(task_file.read_text())
        need(binding['instance_id'] == freeze['instance_id'] ==
             projected['instance_id'] == task['instance_id'] and
             binding['base_commit'] == projected['base_commit'] == task['base_commit'] and
             projected['repo'] == task['repo'] and projected['source'] == task['source'] and
             binding['cache'] == cache['cache_leaf'] and
             binding['cache_base'] == '/tmp/are-g02-r11-task-caches-r1' and
             binding['task_sha256'] == sha(task_file) and
             freeze['status'] == 'frozen-before-model-dispatch' and
             freeze['task_posture'] == 'source-only-development-pair' and
             'evaluator-only native-nonempty and base-reference reachability counts' in freeze['selection'] and
             'native score unopened until both predictions and costs are sealed' in freeze['gold_posture'] and
             freeze['source_hashes']['code/run_dsh_control.py'] ==
             sha(TOOLS / 'run_dsh_control.py'),
             'prepared-binding:' + str(ordinal))
        row = {'ordinal': ordinal, 'instance_id': task['instance_id'],
               'repo': task['repo'], 'source': task['source'],
               'suffix': suffix, 'root': str(run_root),
               'cache_leaf': cache['cache_leaf'],
               'task_sha256': sha(task_file),
               'binding_sha256': sha(binding_file),
               'freeze_sha256': sha(freeze_file),
               'no_model_evidence_present': True}
        with JOURNAL.open('a') as stream:
            stream.write(json.dumps(row, sort_keys=True) + '\n')
            stream.flush()
            os.fsync(stream.fileno())
        rows.append(row)
        print(json.dumps({'ordinal': ordinal, 'repo': task['repo'],
                          'prepare': 'passed'}), flush=True)
    receipt = {
        'schema_version': 'are.g02-r11-prepare-preflight/v1',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold-path-no-score',
        'candidate_sha256': PINS[CANDIDATE],
        'cache_receipt_sha256': PINS[CACHES],
        'tools_manifest_sha256': PINS[MANIFEST],
        'script_sha256': sha(__file__), 'journal_sha256': sha(JOURNAL),
        'prepared_count': len(rows),
        'by_repo': dict(sorted(Counter(row['repo'] for row in rows).items())),
        'rows': rows, 'model_calls': 0,
        'claim_ceiling': 'No-model task preparation only; arm execution, full driver, native scores, and superiority unproven.',
        'open_questions': ['Can the complete post-arm driver path be qualified across all three prefixes?',
                           'Do storage and same-account provider checks permit a separately frozen run?'],
    }
    with OUTPUT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'prepared_count': len(rows)}, sort_keys=True))


if __name__ == '__main__':
    main()
