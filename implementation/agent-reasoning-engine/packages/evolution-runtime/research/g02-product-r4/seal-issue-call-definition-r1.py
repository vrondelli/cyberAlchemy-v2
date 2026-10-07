#!/usr/bin/env python3
"""Gold-blind issue-anchored cross-file Python call-definition proposals."""

import ast
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
PACKETS = BASE / 'g02-r4-reviewer-packets-r1/SEAL.json'
PACKETS_SHA = '11cc658044a9429d4a8a77682460336c578eb65c39db6a5cdc0192a38685682d'
OUTPUT = BASE / 'g02-cross-file-call-r1/SOURCE-SEAL.json'
IDENT = re.compile(r'\b[A-Za-z][A-Za-z0-9_]*\b')
EXCLUDE = {'__init__', '__str__', 'set_up', 'tear_down'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def need(ok, reason):
    if not ok:
        raise ValueError('g02-issue-call-definition.' + reason)


def git(base, *args):
    return subprocess.run(['git', '-c', f'safe.directory={base}', '-C', str(base), *args],
                          capture_output=True, text=True)


def anchors(issue):
    return sorted({token.casefold() for token in IDENT.findall(issue)
                   if '_' in token and len(token) >= 6 and token.casefold() not in EXCLUDE
                   and all(len(part) >= 2 for part in token.split('_'))})


def matches(name, anchor):
    return ('_' + anchor + '_') in ('_' + name.casefold() + '_')


def common_depth(a, b):
    left, right = Path(a).parts[:-1], Path(b).parts[:-1]
    return sum(x == y for x, y in zip(left, right) if x == y)


def row_for(packet_row):
    packet_path = Path(packet_row['path'])
    need(sha(packet_path) == packet_row['sha256'], 'packet-hash')
    packet = json.loads(packet_path.read_text())
    root = Path('/opt/are-benchmark-runs/g02-cross-layer-' + packet_row['pair'])
    base = root / 'sources/session/base'
    pred_path = root / 'evidence/run/prediction.json'
    need(base.is_dir() and sha(pred_path) == packet['prediction_sha256'],
         'source-or-prediction-drift:' + packet_row['pair'])
    prediction = json.loads(pred_path.read_text())
    need(prediction['instance_id'] == packet['instance_id'] and
         git(base, 'rev-parse', 'HEAD').stdout.strip() == prediction['commit'] and
         git(base, 'status', '--porcelain', '--untracked-files=no').stdout.strip() == '',
         'checkout-drift:' + packet_row['pair'])
    issue_anchors = anchors(packet['issue'])
    selected = prediction['traj_data']['pred_spans']
    delivered = {item['path'] for item in packet['delivered_reads']}
    calls = []
    for path, spans in selected.items():
        if not path.endswith('.py'):
            continue
        source = base / path
        need(source.is_file() and not source.is_symlink() and source.stat().st_size <= 262144,
             'selected-source-shape:' + path)
        try:
            tree = ast.parse(source.read_text(errors='replace'))
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                continue
            method = node.func.attr
            matched = [a for a in issue_anchors if matches(method, a)]
            if not matched or not any(s['start'] <= node.lineno <= s['end'] for s in spans):
                continue
            calls.append({'selected_path': path, 'line': node.lineno,
                          'method': method, 'anchors': matched,
                          'source_sha256': sha(source)})
    proposals = []
    for call in sorted(calls, key=lambda x: (-max(map(len, x['anchors'])),
                                             x['selected_path'], x['line'], x['method'])):
        method = call['method']
        pattern = r'^[[:space:]]*(async[[:space:]]+)?def[[:space:]]+' + re.escape(method) + r'[[:space:]]*\('
        found = git(base, 'grep', '-n', '-E', pattern, 'HEAD', '--', '*.py')
        need(found.returncode in (0, 1), 'git-grep-error:' + method)
        targets = []
        for line in found.stdout.splitlines():
            parts = line.split(':', 3)
            if len(parts) != 4:
                continue
            _, path, number, _ = parts
            source = base / path
            if (path in delivered or not source.is_file() or source.is_symlink() or
                source.stat().st_size > 262144 or '/tests/' in '/' + path or
                Path(path).name.startswith('test_')):
                continue
            targets.append((path, int(number)))
        targets.sort(key=lambda item: (0 if 'base' in Path(item[0]).parts else 1,
                                       -common_depth(call['selected_path'], item[0]),
                                       item[0], item[1]))
        for path, line in targets:
            if path not in {item['path'] for item in proposals}:
                proposals.append({'path': path, 'definition_line': line,
                                  'method': method, 'call': call,
                                  'source_sha256': sha(base / path)})
            if len(proposals) == 2:
                break
        if len(proposals) == 2:
            break
    return {'cohort': packet_row['cohort'], 'pair': packet_row['pair'],
            'instance_id': packet['instance_id'], 'packet_sha256': packet_row['sha256'],
            'prediction_sha256': packet['prediction_sha256'], 'base_commit': prediction['commit'],
            'issue_anchors': issue_anchors, 'selected_python': any(p.endswith('.py') for p in selected),
            'matched_calls': calls, 'proposals': proposals}


def main():
    need(sha(PACKETS) == PACKETS_SHA and not OUTPUT.exists(), 'input-or-output-drift')
    packet_seal = json.loads(PACKETS.read_text())
    need(len(packet_seal['packets']) == 32, 'packet-count')
    rows = [row_for(row) for row in packet_seal['packets']
            if any(path.endswith('.py') for path in json.loads(Path(row['path']).read_text())['current_selected_files'])]
    need(len(rows) == 17, 'python-population-drift')
    payload = {'schema_version': 'are.g02-issue-call-definition-seal/v1',
               'posture': 'source-only-exposed-development-no-native-gold-or-dsh-opened',
               'packet_seal_sha256': PACKETS_SHA, 'script_sha256': sha(__file__),
               'selection_rule': 'For each selected Python span, exact issue snake_case anchor within an AST attribute-call name; locate exact tracked definition, exclude delivered/test files; prefer base implementation, then directory affinity; at most two reads per task.',
               'rows': rows,
               'claim_ceiling': 'Source-only proposed reads, not delivered reads, native scores, cost, or superiority.',
               'open_questions': ['What proportion of proposed reads are native reference files on exposed cohorts?',
                                  'Does a live agent actually use these leads without losing token/time efficiency?']}
    OUTPUT.parent.mkdir(mode=0o700, exist_ok=False)
    fd = os.open(OUTPUT, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'rows': len(rows), 'matched_tasks': sum(bool(x['matched_calls']) for x in rows),
                      'proposing_tasks': sum(bool(x['proposals']) for x in rows),
                      'proposals': sum(len(x['proposals']) for x in rows),
                      'seal_sha256': sha(OUTPUT)}))


if __name__ == '__main__':
    main()
