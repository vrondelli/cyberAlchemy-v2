#!/usr/bin/env python3
"""Audit the terminal G02 r11 campaign without treating partial scores as a result."""

import hashlib
import json
from pathlib import Path


ARCHIVE = Path('/home/vlad_/are-benchmark-archive/g02-product-replication-r11-20261002')
DEFINITION_SHA = '0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf'
OUTPUT = ARCHIVE / 'TERMINAL-AUDIT-R11.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(condition, reason):
    if not condition:
        raise ValueError('g02-r11-terminal.' + reason)


def main():
    definition_path = ARCHIVE / 'definition/DEFINITION.json'
    progress_path = ARCHIVE / 'SERIAL-PROGRESS.jsonl'
    need(sha(definition_path) == DEFINITION_SHA and not OUTPUT.exists(),
         'definition-or-output-drift')
    definition = json.loads(definition_path.read_text())
    need(definition['status'] == 'frozen-before-model-dispatch' and
         len(definition['ordered_pairs']) == 24, 'definition-shape')
    progress = [json.loads(line) for line in progress_path.read_text().splitlines()]
    started = [item for item in progress if item['status'] == 'started']
    finished = [item for item in progress if item['status'] == 'archived-and-reclaimed']
    need([item['ordinal'] for item in started] == list(range(1, 14)) and
         [item['ordinal'] for item in finished] == list(range(1, 13)) and
         len(progress) == 25, 'serial-progress-shape')
    evidence = []
    for ordinal, pair in enumerate(definition['ordered_pairs'], 1):
        need(pair['ordinal'] == ordinal, 'definition-ordinal')
        root = ARCHIVE / 'pairs' / f"{ordinal:02d}-{pair['suffix']}"
        if ordinal > 13:
            need(not root.exists(), f'unattempted-{ordinal}-has-archive')
            continue
        receipt_path = root / 'ARCHIVE-RECEIPT.json'
        need(receipt_path.is_file(), f'pair-{ordinal}-receipt-missing')
        receipt = json.loads(receipt_path.read_text())
        need(receipt['raw_archive_verified'] is True, f'pair-{ordinal}-archive-unverified')
        item = {'ordinal': ordinal, 'instance_id': pair['instance_id'],
                'receipt_sha256': sha(receipt_path)}
        if ordinal <= 12:
            audit_path = root / 'raw/INDEPENDENT-AUDIT.json'
            decision_path = root / 'raw/PAIR-DECISION.json'
            need(audit_path.is_file() and decision_path.is_file(),
                 f'pair-{ordinal}-score-missing')
            audit = json.loads(audit_path.read_text())
            decision = json.loads(decision_path.read_text())
            need(receipt['audit_exit'] == 0 and
                 receipt['audit']['status'] == 'valid-scored' and
                 receipt['audit_sha256'] == sha(audit_path) and
                 receipt['decision_sha256'] == sha(decision_path) and
                 audit['status'] == 'independent-audit-passed' and
                 audit['definition_sha256'] == DEFINITION_SHA and
                 audit['row']['ordinal'] == ordinal and
                 audit['row']['repo'] == pair['repo'] and
                 audit['row']['instance_id'] == pair['instance_id'] and
                 audit['row']['quality'] == decision['quality'],
                 f'pair-{ordinal}-audit-invalid')
            item.update({'status': 'valid-scored', 'audit_sha256': sha(audit_path),
                         'decision_sha256': sha(decision_path)})
        else:
            need(receipt['audit_exit'] != 0 and receipt['audit'] is None and
                 receipt['decision_sha256'] is None and
                 receipt['audit_sha256'] is None and
                 not (root / 'raw/PAIR-DECISION.json').exists() and
                 not (root / 'raw/INDEPENDENT-AUDIT.json').exists(),
                 'failed-pair-score-or-audit-present')
            are = json.loads((root / 'raw/ARE-SETTLEMENT.json').read_text())
            dsh = json.loads((root / 'raw/dsh-control/SETTLEMENT.json').read_text())
            driver_error = (root / 'driver.stderr.txt').read_text()
            dsh_error = (root / 'raw/dsh-control/stderr.txt').read_text()
            need(are['status'] == 'completed' and are['exit_code'] == 0 and
                 dsh['exit_code'] == 1 and dsh['scoring_pending'] is True and
                 'sealed-export.unsettled' in driver_error and
                 'benchmark_transport_error' in dsh_error and
                 'SERVER: 502:' in dsh_error,
                 'failed-pair-transport-shape')
            item.update({'status': 'invalid-unscored-dsh-transport-502',
                         'are_settlement_sha256': sha(root / 'raw/ARE-SETTLEMENT.json'),
                         'dsh_settlement_sha256': sha(root / 'raw/dsh-control/SETTLEMENT.json'),
                         'driver_stderr_sha256': sha(root / 'driver.stderr.txt'),
                         'dsh_stderr_sha256': sha(root / 'raw/dsh-control/stderr.txt')})
        evidence.append(item)
    need(not (ARCHIVE / 'AGGREGATE-R11.json').exists(), 'aggregate-present-after-failure')
    result = {
        'schema_version': 'are.g02-r11-terminal-audit/v1',
        'status': 'terminal-failed-strict-24-validity',
        'definition_sha256': DEFINITION_SHA,
        'progress_sha256': sha(progress_path),
        'counts': {'scored_audited': 12, 'invalid_unscored': 1,
                   'unattempted': 11, 'total_planned': 24},
        'failure': {'ordinal': 13, 'arm': 'dsh',
                    'observed': 'benchmark transport HTTP 502; sealed export unsettled',
                    'provider_root_cause': 'not established'},
        'strict_claim_gate_passed': False,
        'claim_ceiling': 'partial private development observations only; no aggregate or superiority',
        'pair_evidence': evidence,
        'open_questions': ['What stopped the DSH benchmark transport on pair 13?',
                           'How should a separately selected successor cohort address the 12-pair quality and cost deficits?'],
    }
    OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    print(json.dumps({'status': result['status'], 'counts': result['counts'],
                      'terminal_audit_sha256': sha(OUTPUT)}, sort_keys=True))


if __name__ == '__main__':
    main()
