#!/usr/bin/env python3
"""Guarded serial runner for the frozen r8 mixed-source G02 cohort."""

import argparse
import hashlib
import json
import os
import re
import shlex
import subprocess
import time
from pathlib import Path


HOST = 'root@187.77.163.194'
ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r8-20261001')
DEFINITION = ARCHIVE / 'definition/DEFINITION.json'
DEFINITION_SHA = '20a60393c1125894965c759b3138c5997c55c9792fa752cc6506831aa602ae57'
REMOTE_DEFINITION = '/opt/are/evolution-runtime/g02-product-replication-r8/DEFINITION.json'
AUDITOR = '/opt/are/evolution-runtime/g02-r4-cohort-code-r1/audit-g02-r8-fresh-pair-r1.py'
AUDITOR_SHA = 'faeb5019813f7330d1876a2f532055f17b5909ed62634b6307e587fe9334574d'
NODE = '/opt/cyberalchemy-are-tools/node-24.10.0/node'
READINESS = '/opt/are/evolution-runtime/g01-r8-readiness-code-r1/probe-provider-readiness-r1.mjs'
HELPER = ('/opt/are/evolution-runtime/hen-11-contextbench-intent-anchor-r3-v22-dev/repo/'
          'implementation/agent-reasoning-engine/packages/evolution-runtime/research/'
          'hen-11-live-contextbench-v1/vps-local-glm-v1.mjs')
HELPER_SHA = 'deafaf7bc91d5cac29c070781519a996975d6c684d2035c83d09dd2dd584194e'
PROGRESS = ARCHIVE / 'SERIAL-PROGRESS.jsonl'
TMPFS_FLOOR = 2 * 1024**3
ROOT_FLOOR = 500 * 1024**2
RAM_FLOOR = 3 * 1024**3


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError(f'g02-r8-serial.{reason}')


def command(*argv, timeout=60):
    return subprocess.run(argv, capture_output=True, text=True, timeout=timeout)


def remote(*argv, timeout=60):
    line = ' '.join(shlex.quote(str(value)) for value in argv)
    return command('ssh', '-o', 'BatchMode=yes', HOST, line, timeout=timeout)


def append_progress(value):
    with PROGRESS.open('a') as stream:
        stream.write(json.dumps(value, sort_keys=True) + '\n')
        stream.flush()
        os.fsync(stream.fileno())
    print(json.dumps(value, sort_keys=True), flush=True)


def preflight(pair, definition):
    need(sha(DEFINITION) == DEFINITION_SHA and
         definition['status'] == 'frozen-before-model-dispatch', 'definition-drift')
    root = pair['root']
    need(re.fullmatch(r'/tmp/are-g02-r4-runs/g02-cross-layer-pr8-mixed-[0-9]{2}', root) and
         pair['suffix'] == Path(root).name.removeprefix('g02-cross-layer-') and
         re.fullmatch(r'(?:SWE-Bench-Pro|SWE-Bench-Verified|Multi-SWE-Bench)__[A-Za-z0-9_-]+', pair['instance_id']) and
         pair['repo'] in ('ansible/ansible', 'django/django',
                          'astropy/astropy', 'sveltejs/svelte'),
         'pair-scope')
    target = ARCHIVE / 'pairs' / f"{pair['ordinal']:02d}-{pair['suffix']}"
    need(not target.exists(), 'archive-already-exists')
    script = ('import hashlib,json,os,shutil,sys;'
              'from pathlib import Path;'
              'd=Path(sys.argv[1]);r=Path(sys.argv[2]);a=Path(sys.argv[3]);'
              'h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();'
              'm={x.split()[0]:int(x.split()[1])*1024 for x in '
              'Path(\"/proc/meminfo\").read_text().splitlines() if x.startswith(\"MemAvailable:\")};'
              'print(json.dumps({\"definition_sha\":h(d),\"auditor_sha\":h(a),'
              '\"mount\":os.path.ismount(r.parent),\"root_absent\":not r.exists(),'
              '\"scratch_free\":shutil.disk_usage(r.parent).free,'
              '\"root_free\":shutil.disk_usage(\"/\").free,'
              '\"ram_available\":m[\"MemAvailable:\"]}))')
    result = remote('python3', '-c', script, REMOTE_DEFINITION, root, AUDITOR)
    need(result.returncode == 0, 'remote-preflight-exec:' + result.stderr[-500:])
    state = json.loads(result.stdout)
    need(state['definition_sha'] == DEFINITION_SHA and
         state['auditor_sha'] == AUDITOR_SHA and state['mount'] and
         state['root_absent'] and state['scratch_free'] >= TMPFS_FLOOR and
         state['root_free'] >= ROOT_FLOOR and state['ram_available'] >= RAM_FLOOR,
         f'resource-or-source-guard:{state}')
    return target, state


def readiness(ordinal):
    attempt = f'probe_20261001_g02_r8_pair{ordinal:02d}'
    result = remote(NODE, READINESS, attempt, HELPER, HELPER_SHA, timeout=90)
    need(result.returncode == 0, 'provider-not-ready:' + result.stdout[-400:])
    value = json.loads(result.stdout)
    need(value['status'] == 'ready' and value['tokenizer_status'] == 200 and
         value['generation_status'] == 200, 'readiness-shape')
    return value


def run_pair(pair, definition, target):
    env = {**definition['environment'], 'G02_REPO': pair['repo']}
    argv = ['env', *[f'{key}={value}' for key, value in sorted(env.items())],
            NODE, str(Path(definition['tools_root']) / 'run-and-score-pair.mjs'),
            pair['suffix'], pair['instance_id']]
    target.mkdir(parents=True, mode=0o700)
    started = time.time()
    result = remote(*argv, timeout=3600)
    (target / 'driver.stdout.txt').write_text(result.stdout)
    (target / 'driver.stderr.txt').write_text(result.stderr)
    return result.returncode, time.time() - started


def audit_and_archive(pair, target):
    root = pair['root']
    audited = remote('python3', AUDITOR, '--root', root, '--definition-sha', DEFINITION_SHA, timeout=300)
    audit_result = json.loads(audited.stdout) if audited.returncode == 0 else None
    copy = command('rsync', '-a', '-e', 'ssh -o BatchMode=yes',
                   f'{HOST}:{root}/', str(target / 'raw') + '/', timeout=1200)
    need(copy.returncode == 0, 'archive-copy-failed:' + copy.stderr[-300:])
    verified = command('rsync', '-a', '-n', '--checksum', '--itemize-changes',
                       '-e', 'ssh -o BatchMode=yes', f'{HOST}:{root}/',
                       str(target / 'raw') + '/', timeout=1200)
    need(verified.returncode == 0 and not verified.stdout.strip(),
         'archive-checksum-diff:' + verified.stdout[:300])
    summary = {'audit': audit_result, 'audit_exit': audited.returncode,
               'audit_stderr_tail': audited.stderr[-300:],
               'raw_archive': str(target / 'raw'),
               'raw_archive_verified': True,
               'decision_sha256': sha(target / 'raw/PAIR-DECISION.json')
               if (target / 'raw/PAIR-DECISION.json').exists() else None,
               'audit_sha256': sha(target / 'raw/INDEPENDENT-AUDIT.json')
               if (target / 'raw/INDEPENDENT-AUDIT.json').exists() else None}
    (target / 'ARCHIVE-RECEIPT.json').write_text(json.dumps(summary, indent=2) + '\n')
    need(audited.returncode == 0 and audit_result is not None,
         'independent-audit-failed')
    active = remote('docker', 'ps', '--format', '{{.Names}}', timeout=30)
    need(active.returncode == 0 and
         not any(pair['suffix'] in name for name in active.stdout.splitlines()),
         'pair-container-still-running')
    checked = remote('realpath', root, timeout=30)
    need(checked.returncode == 0 and checked.stdout.strip() == root,
         'reclaim-target-drift')
    reclaimed = remote('rm', '-rf', '--', root, timeout=120)
    need(reclaimed.returncode == 0, 'exact-scratch-reclaim-failed')
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--from-ordinal', type=int, default=1)
    parser.add_argument('--to-ordinal', type=int, default=24)
    args = parser.parse_args()
    need(1 <= args.from_ordinal <= args.to_ordinal <= 24 and
         sha(DEFINITION) == DEFINITION_SHA, 'arguments-or-definition')
    definition = json.loads(DEFINITION.read_text())
    need(len(definition['ordered_pairs']) == 24 and
         definition['private_cold_archive_root'] == str(ARCHIVE), 'definition-shape')
    for pair in definition['ordered_pairs'][args.from_ordinal - 1:args.to_ordinal]:
        target, state = preflight(pair, definition)
        ready = readiness(pair['ordinal'])
        append_progress({'ordinal': pair['ordinal'], 'status': 'started',
                         'instance_id': pair['instance_id'],
                         'ready_sha256': ready['sha256'],
                         'scratch_free_before': state['scratch_free']})
        exit_code, seconds = run_pair(pair, definition, target)
        summary = audit_and_archive(pair, target)
        append_progress({'ordinal': pair['ordinal'], 'status': 'archived-and-reclaimed',
                         'driver_exit': exit_code, 'elapsed_seconds': seconds,
                         'audit_status': summary['audit']['status'],
                         'decision_sha256': summary['decision_sha256'],
                         'audit_sha256': summary['audit_sha256']})
        if exit_code != 0:
            raise ValueError(f'g02-r8-serial.pair-nonzero:{pair["ordinal"]}:{exit_code}')


if __name__ == '__main__':
    main()
