#!/usr/bin/env python3
"""Run only G02 r10 source preparation on all 24 development tasks."""

from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g02-r10-dev-pool-r1'
CANDIDATE = ROOT / 'CANDIDATE.json'
CACHES = ROOT / 'TASK-CACHE-PREFLIGHT-R3.json'
TOOLS = BASE / 'g02-r10-selection-only-tools-r2'
MANIFEST = TOOLS / 'R10-TOOLS-CANDIDATE.json'
OUTPUT = ROOT / 'PREPARE-PREFLIGHT-R2.json'
JOURNAL = ROOT / 'PREPARE-PREFLIGHT-R2-JOURNAL.jsonl'
RUNS = Path('/tmp/are-g02-r4-runs')
NODE = Path('/opt/cyberalchemy-are-tools/node-24.10.0/node')
PINS = {
    CANDIDATE: '1139a5877bcd686a63468bc75ff490963d4416313d1968ea64cc7dd43bc621dd',
    CACHES: '6b45df00666864ecd32bda22eb3312ef3ff64514fc0bafe1bcc766cb0cba04ad',
    MANIFEST: '358f6519583370b1cfb967c3271c56bcae48749815449bc5aad1005390dfddf7',
    TOOLS / 'prepare-prospective.mjs': 'dc42ce45d5df39f89e485f5f94d75eb0fdb076cf4f944b6258b1dd02aacfca66',
    TOOLS / 'run-and-score-pair.mjs': '49cd5d5a877ff42493dbdbe46ac439a291c01901b839fecad33285f958386282',
}


def sha(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g02-r10-prepare-preflight.' + reason)


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
        suffix = 'pr10-mixed-p2-' + format(ordinal, '02d')
        run_root = RUNS / ('g02-cross-layer-' + suffix)
        need(ordinal == cache['ordinal'] == len(rows) + 1 and
             task['instance_id'] == cache['instance_id'] and
             task['base_commit'] == cache['base_commit'] and
             cache['cache_path'] ==
             '/tmp/are-g02-r10-task-caches-r3/cache/' + cache['cache_leaf'] and
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
             binding['cache_base'] == '/tmp/are-g02-r10-task-caches-r3' and
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
        'schema_version': 'are.g02-r10-prepare-preflight/v2',
        'status': 'passed', 'posture': 'source-only-no-model-no-gold-path-no-score',
        'candidate_sha256': PINS[CANDIDATE],
        'cache_receipt_sha256': PINS[CACHES],
        'tools_manifest_sha256': PINS[MANIFEST],
        'script_sha256': sha(__file__), 'journal_sha256': sha(JOURNAL),
        'prepared_count': len(rows),
        'by_repo': dict(sorted(Counter(row['repo'] for row in rows).items())),
        'rows': rows, 'model_calls': 0,
        'claim_ceiling': 'No-model task preparation only; arm execution, full driver, native scores, and superiority unproven.',
        'open_questions': [
            'Can the complete post-arm driver path be qualified across all three prefixes?',
            'Do storage and same-account provider checks permit a separately frozen run?',
        ],
    }
    with OUTPUT.open('x') as stream:
        json.dump(receipt, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': 'passed', 'sha256': sha(OUTPUT),
                      'prepared_count': len(rows)}, sort_keys=True))


if __name__ == '__main__':
    main()
