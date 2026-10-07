#!/usr/bin/env python3
"""Audit one G02 r9 pair, reusing the pinned r8 receipt verifier."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
DEFINITION = BASE / 'g02-product-replication-r9/DEFINITION.json'
CORE = BASE / 'g02-r4-cohort-code-r1/audit-g02-r8-fresh-pair-r1.py'
CORE_SHA = 'faeb5019813f7330d1876a2f532055f17b5909ed62634b6307e587fe9334574d'
READ_ONLY = {'search', 'read', 'read_file', 'list_files', 'submit_context_selection'}


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read(path):
    return json.loads(Path(path).read_text())


def need(ok, reason):
    if not ok:
        raise ValueError('g02-r9-selection-only-audit.' + reason)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--definition-sha', required=True)
    args = parser.parse_args()
    need(len(args.definition_sha) == 64 and sha(DEFINITION) == args.definition_sha,
         'definition-drift')
    need(sha(CORE) == CORE_SHA, 'pinned-core-drift')
    spec = importlib.util.spec_from_file_location('g02_r8_pinned_core', CORE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.DEFINITION = DEFINITION
    definition = read(DEFINITION)
    root = args.root.resolve()
    planned = next((row for row in definition['ordered_pairs'] if row['root'] == str(root)), None)
    need(planned is not None and root.name.startswith('g02-cross-layer-pr9-mixed-'),
         'unplanned-root')
    audited = module.audit(root, planned)
    tools = root / 'dsh-control/tools'
    calls = []
    if tools.is_dir():
        for path in sorted(tools.glob('*.json')):
            event = read(path)
            if event.get('kind') == 'tool-intent':
                name = event.get('call', {}).get('function', {}).get('name')
                need(isinstance(name, str), 'tool-name-missing')
                calls.append(name)
    if audited['status'] == 'valid-scored':
        need(calls and set(calls) <= READ_ONLY and
             (root / 'dsh-control').is_dir(), 'selection-only-tool-contract')
    payload = {
        'schema_version': 'are.g02-r9-selection-only-pair-audit/v1',
        'status': 'independent-audit-passed',
        'definition_sha256': args.definition_sha,
        'script_sha256': sha(__file__),
        'pinned_r8_core_sha256': CORE_SHA,
        'dsh_tool_calls': len(calls),
        'dsh_tool_names': sorted(set(calls)),
        'row': audited,
        'claim_ceiling': 'One frozen r9 pair audit only; campaign-level intervals and superiority remain unproven.',
        'open_questions': ['Will all 24 pairs settle validly under the fixed budgets?',
                           'Will all four directional intervals pass?'],
    }
    output = root / 'INDEPENDENT-AUDIT.json'
    with output.open('x') as stream:
        json.dump(payload, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'status': audited['status'], 'ordinal': audited['ordinal'],
                      'sha256': sha(output), 'dsh_tool_calls': len(calls),
                      'four_gate_passed': audited.get('four_gate_passed')}))


if __name__ == '__main__':
    main()
