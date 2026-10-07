#!/usr/bin/env python3
"""Audit sealed short-window r6 citation reach against r5 and unchanged BM25."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
AUDITOR = HERE / 'audit-beam-500k-dev-ie-citations-r1.py'
SELECTIONS = ROOT / 'CROSS-R6-ALL-SELECTIONS.json'
R5_AUDIT = ROOT / 'CROSS-R5-CITATION-AUDIT.json'
AUDITOR_SHA = '49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799'
R5_AUDIT_SHA = '36be9a2ed373dad33441323660babf3a1a010699491f2accbdf8575c59929558'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-cross-r6-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and
        len(args.selection_sha256) == 64 and
        all(char in '0123456789abcdef' for char in args.selection_sha256),
        'arguments')
    need(sha(AUDITOR) == AUDITOR_SHA and
        sha(R5_AUDIT) == R5_AUDIT_SHA and
        sha(SELECTIONS) == args.selection_sha256, 'pinned-input-drift')
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] == 'are.g03-beam-500k-dev-ie-cross-r6/v1'
        and sealed['status'] == 'sealed-source-only-before-citation-audit'
        and sealed['information_extraction_questions'] == 60 and
        sealed['evaluator_fields_read'] is False, 'selection-boundary')
    spec = importlib.util.spec_from_file_location('g03_beam_500k_ie_auditor_r6',
        AUDITOR)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.SELECTIONS = SELECTIONS
    result = auditor.run()
    need(result['sealed_selections_sha256'] == args.selection_sha256 and
        result['aggregate']['questions'] == 60, 'audit-binding')
    r5 = json.loads(R5_AUDIT.read_text())
    old = {row['probe_id']: row for row in r5['per_question']}
    need(len(old) == 60 and
        set(old) == {row['probe_id'] for row in result['per_question']},
        'paired-population')
    wins = losses = ties = 0
    for row in result['per_question']:
        prior = old[row['probe_id']]
        need(row['control'] == prior['control'] and
            row['cited_turns'] == prior['cited_turns'],
            'unchanged-control-and-citations')
        now = row['treatment']['cited_turns_reached']
        before = prior['treatment']['cited_turns_reached']
        wins += now > before
        losses += now < before
        ties += now == before
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-cross-citation-audit-r6/v1'
    result['status'] = 'development-short-window-citation-reach-audited'
    result['auditor_code_sha256'] = AUDITOR_SHA
    result['r5_audit_sha256'] = R5_AUDIT_SHA
    result['paired_r6_vs_r5_cited_turn_counts'] = {
        'wins': wins, 'losses': losses, 'ties': ties}
    result['claim_ceiling'] = ('BEAM 500K exposed-development citation reach '
        'for short-window cross-encoder versus top-300 long-window and unchanged BM25; no '
        'answer quality, native score, cost parity, holdout, or superiority')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'aggregate': result['aggregate'],
        'paired_r6_vs_r5_cited_turn_counts':
            result['paired_r6_vs_r5_cited_turn_counts'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
