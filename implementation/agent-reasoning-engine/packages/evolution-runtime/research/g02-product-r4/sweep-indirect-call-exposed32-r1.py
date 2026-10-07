#!/usr/bin/env python3
"""Apply unchanged source-only indirect-call probe to 32 sealed G02 packets."""
from collections import Counter
import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess

BASE = Path('/opt/are/evolution-runtime')
PACKETS = BASE / 'g02-r4-reviewer-packets-r1/SEAL.json'
PROBE = BASE / 'probe-indirect-python-calls-r1.py'
OUTPUT = BASE / 'g02-indirect-call-exposed32-r1/SWEEP.json'
PACKETS_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
PROBE_SHA = 'ab5c0ba0eea71e5a9423c6daffe29015a646d8eaa732f7fde55ae1b14776c982'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-indirect-exposed32.' + reason)


def main():
    need(not OUTPUT.parent.exists() and sha(PACKETS) == PACKETS_SHA and
         sha(PROBE) == PROBE_SHA, 'input-or-output-drift')
    spec = importlib.util.spec_from_file_location('g02_indirect_probe', PROBE)
    probe = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(probe)
    packet_seal = json.loads(PACKETS.read_text())
    entries = packet_seal['packets']
    need(len(entries) == 32, 'packet-count')
    results = []
    counts = Counter()
    for entry in entries:
        need(re.fullmatch(r'pr[23]-[a-z0-9-]+', entry['pair']) and
             sha(entry['path']) == entry['sha256'], 'packet-binding')
        packet = json.loads(Path(entry['path']).read_text())
        selected = [path for path in packet['current_selected_files'] if path.endswith('.py')]
        if not selected:
            results.append({'cohort': entry['cohort'], 'pair': entry['pair'],
                            'packet_sha256': entry['sha256'], 'selected_python_files': 0,
                            'findings': [], 'status': 'no-python-selected'})
            counts['no_python_selected'] += 1
            continue
        root = Path('/opt/are-benchmark-runs') / ('g02-cross-layer-' + entry['pair'])
        source = root / 'sources/session/base'
        task = root / 'tasks' / (packet['instance_id'] + '.json')
        binding = root / 'tasks/binding.json'
        need(source.is_dir() and task.is_file() and binding.is_file() and
             sha(task) == packet['task_sha256'], 'source-binding')
        bound = json.loads(binding.read_text())
        need(bound['instance_id'] == packet['instance_id'], 'task-id-binding')
        commit = subprocess.check_output(
            ['git', '-c', 'safe.directory=' + str(source), 'rev-parse', 'HEAD'],
            cwd=source, text=True).strip()
        need(commit == bound['base_commit'], 'commit-binding')
        issue_names = probe.issue_names(packet['issue'])
        findings = []
        for path in selected:
            candidate = (source / path).resolve()
            need(candidate.is_relative_to(source.resolve()) and candidate.is_file(), 'source-path')
            try:
                text = candidate.read_text(errors='replace')
                tree = ast.parse(text)
            except SyntaxError:
                counts['syntax_skipped'] += 1
                continue
            registry = probe.registry_names(tree, issue_names)
            for call in probe.indirect_calls(tree, registry):
                findings.append({'path': path, 'line': call['call_line'],
                                 'resolver': call['resolver'], 'caller': call['caller'],
                                 'issue_names': sorted(set().union(*(
                                     registry[name]['issue_names'] for name in call['registries'])))})
        counts['python_pairs'] += 1
        counts['selected_python_files'] += len(selected)
        counts['findings'] += len(findings)
        counts['triggered_pairs'] += bool(findings)
        results.append({'cohort': entry['cohort'], 'pair': entry['pair'],
                        'packet_sha256': entry['sha256'], 'base_commit': commit,
                        'selected_python_files': len(selected),
                        'findings': sorted(findings, key=lambda row: (row['path'], row['line'])),
                        'status': 'source-only-checked'})
    result = {'schema_version': 'are.g02-indirect-call-exposed32-sweep/v1',
              'status': 'source-only-exposed-development',
              'packet_seal_sha256': PACKETS_SHA, 'probe_sha256': PROBE_SHA,
              'script_sha256': sha(__file__), 'counts': dict(counts), 'rows': results,
              'model_calls': 0, 'gold_loaded': False,
              'claim_ceiling': 'Unchanged source-only probe trigger census on exposed tasks; no delivery, native score, or superiority',
              'open_questions': ['Is trigger frequency sufficient for a live exposed mechanism test?',
                                 'Would focused indirect-call reads preserve other issue requirements and all-in cost?']}
    OUTPUT.parent.mkdir(mode=0o700)
    with OUTPUT.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    OUTPUT.chmod(0o600)
    print(json.dumps({'status': result['status'], 'counts': dict(counts),
                      'receipt_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
