#!/usr/bin/env python3
"""Isolated, no-model capacity probe; does not modify the pinned source worker."""

from dataclasses import dataclass
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import resource
import signal
import subprocess
import sys
import time


BASE = Path('/opt/are/evolution-runtime')
CANDIDATE = BASE / 'g01-post-r8-clean-cohort-candidate-r3/COHORT-CANDIDATE.json'
CACHES = BASE / 'g01-post-r8-source-caches-r2/SOURCE-CACHES.json'
MODULE = BASE / 'g01-source-combined-candidate-r10/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked_source_hints_r3.py'
OUT = BASE / 'g01-post-r8-large-index-probe-r1'
PINS = {CANDIDATE: '9f7005a59071aa5c25bfcd8942874dd7c910e6315791d455bb3465a09dee8194',
        CACHES: '5ae0ea5dc5b71a49e4ece613b25810dfb0ce48f407ee8e861cc7cd48a9e728a9',
        MODULE: 'c34852f142edacd5575c35fd798ee69548830996206b372b3a875df11bc7fa65'}
TARGETS = {'Multi-SWE-Bench__typescript__maintenance__bugfix__1ac0bb81',
           'SWE-PolyBench__typescript__maintenance__bugfix__7dfdbbd1'}


@dataclass(frozen=True)
class ExpandedLimits:
    entries: int = 50000
    file_bytes: int = 8 * 1024**2
    admitted_bytes: int = 64 * 1024**2
    postings: int = 2000000
    manifest_bytes: int = 8 * 1024**2


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def timed_out(_signal, _frame):
    raise TimeoutError('probe-60-second-deadline')


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in TARGETS:
        raise ValueError('exact-target-required')
    identifier = sys.argv[1]
    for path, digest in PINS.items():
        if sha(path) != digest:
            raise ValueError(f'input-drift:{path}')
    candidate = json.loads(CANDIDATE.read_text())
    caches = json.loads(CACHES.read_text())
    task = next(task for task in candidate['ordered_tasks'] if task['instance_id'] == identifier)
    binding = next(row for row in caches['task_bindings'] if row['instance_id'] == identifier)
    if (task['base_commit'] != binding['base_commit'] or task['repo_url'] != binding['origin'] or
            caches['gold_loaded'] is not False or candidate['gold_values_or_paths_used'] is not False):
        raise ValueError('source-binding')
    path = Path(binding['repository_path'])
    if not path.is_absolute() or path.resolve() != path or not path.is_dir():
        raise ValueError('unsafe-cache-path')
    output = OUT / f'{identifier[-8:]}-RESULT.json'
    if not OUT.is_dir() or output.exists():
        raise ValueError('fresh-output-required')
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024**2, 512 * 1024**2))
    signal.signal(signal.SIGALRM, timed_out)
    signal.alarm(60)
    started = time.monotonic()
    report = {'schema_version': 'are.g01-large-index-capacity-probe/v1', 'task_id': identifier,
              'commit': task['base_commit'], 'source_module_sha256': PINS[MODULE],
              'maximum_entries': 50000, 'memory_limit_bytes': 512 * 1024**2,
              'deadline_seconds': 60, 'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Isolated source-only capacity diagnostic; not a production index, model quality or superiority result'}
    env = {**os.environ, 'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': '/dev/null',
           'GIT_NO_LAZY_FETCH': '1', 'GIT_ALLOW_PROTOCOL': '', 'GIT_TERMINAL_PROMPT': '0'}
    try:
        spec = importlib.util.spec_from_file_location('ranked_source_hints_r3', MODULE)
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        module.Limits = ExpandedLimits
        inventory = subprocess.check_output(['git', '-C', str(path), 'ls-tree', '-rlz', task['base_commit']],
                                             timeout=20, env=env)
        if len(inventory) > 8 * 1024**2:
            raise ValueError('inventory-byte-limit')
        rows = []
        for raw in inventory.split(b'\0'):
            if not raw:
                continue
            head, name = raw.split(b'\t', 1)
            mode, kind, oid, size = head.split()
            rows.append((name, mode.decode('ascii'), oid.decode('ascii'), int(size) if kind == b'blob' else 0))
        rows.sort(key=lambda row: row[0])
        def load(oid, size):
            body = subprocess.check_output(['git', '-C', str(path), 'cat-file', 'blob', oid], timeout=20, env=env)
            if len(body) != size:
                raise ValueError('blob-size-mismatch')
            return body
        records = (module.Blob(name, mode, size, lambda oid=oid, size=size: load(oid, size))
                   for name, mode, oid, size in rows)
        index = module.SourceHintIndex(records, task['base_commit'], ExpandedLimits())
        query = task['problem_statement'].encode()[:1024].decode('utf-8', 'ignore').strip()
        result = index.query(query)
        report.update(status='passed', inventory_entries=len(rows), inventory_bytes=len(inventory),
                      manifest_entries=len(index.manifest['entries']),
                      admitted_files=index.manifest['admitted_files'],
                      admitted_bytes=index.manifest['admitted_bytes'],
                      postings=index.manifest['postings'], partial=index.manifest['partial'],
                      index_digest=index.index_digest, query_result_sha256=hashlib.sha256(module.encoded(result)).hexdigest())
    except (Exception, MemoryError) as error:
        report.update(status='failed', error_type=type(error).__name__, error=str(error)[:200])
    finally:
        signal.alarm(0)
        report['elapsed_ms'] = round((time.monotonic() - started) * 1000)
        report['max_rss_kib'] = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'wb') as stream:
            stream.write((json.dumps(report, indent=2, sort_keys=True) + '\n').encode())
        print(json.dumps({'status': report['status'], 'task_id': identifier,
                          'elapsed_ms': report['elapsed_ms'], 'error': report.get('error'),
                          'result_sha256': sha(output)}, sort_keys=True))


if __name__ == '__main__':
    main()
