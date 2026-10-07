#!/usr/bin/env python3
"""Audit sealed top-300 r5 citation reach against r4 and unchanged BM25."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
AUDITOR = HERE / 'audit-beam-500k-dev-ie-citations-r1.py'
SELECTIONS = ROOT / 'CROSS-R5-ALL-SELECTIONS.json'
R4_AUDIT = ROOT / 'CROSS-R4-CITATION-AUDIT.json'
AUDITOR_SHA = '49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799'
R4_AUDIT_SHA = '4ae69ed08a8e21c500e7eda23ddd84bc768921e4cfb6ce85d3aaeb53aa234c6f'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-cross-r5-audit.' + reason)


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
        sha(R4_AUDIT) == R4_AUDIT_SHA and
        sha(SELECTIONS) == args.selection_sha256, 'pinned-input-drift')
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] == 'are.g03-beam-500k-dev-ie-cross-r5/v1'
        and sealed['status'] == 'sealed-source-only-before-citation-audit'
        and sealed['information_extraction_questions'] == 60 and
        sealed['evaluator_fields_read'] is False, 'selection-boundary')
    spec = importlib.util.spec_from_file_location('g03_beam_500k_ie_auditor_r5',
        AUDITOR)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.SELECTIONS = SELECTIONS
    result = auditor.run()
    need(result['sealed_selections_sha256'] == args.selection_sha256 and
        result['aggregate']['questions'] == 60, 'audit-binding')
    r4 = json.loads(R4_AUDIT.read_text())
    old = {row['probe_id']: row for row in r4['per_question']}
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
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-cross-citation-audit-r5/v1'
    result['status'] = 'development-top-300-citation-reach-audited'
    result['auditor_code_sha256'] = AUDITOR_SHA
    result['r4_audit_sha256'] = R4_AUDIT_SHA
    result['paired_r5_vs_r4_cited_turn_counts'] = {
        'wins': wins, 'losses': losses, 'ties': ties}
    result['claim_ceiling'] = ('BEAM 500K exposed-development citation reach '
        'for top-300 cross-encoder versus top-100 and unchanged BM25; no '
        'answer quality, native score, cost parity, holdout, or superiority')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'aggregate': result['aggregate'],
        'paired_r5_vs_r4_cited_turn_counts':
            result['paired_r5_vs_r4_cited_turn_counts'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
