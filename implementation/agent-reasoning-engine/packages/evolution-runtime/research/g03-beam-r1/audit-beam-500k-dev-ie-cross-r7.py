#!/usr/bin/env python3
"""Audit sealed r7 citation reach against r6 and unchanged BM25 on all 60 IE probes."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
AUDITOR = HERE / 'audit-beam-500k-dev-ie-citations-r1.py'
SELECTIONS = ROOT / 'CROSS-R7-ALL-SELECTIONS.json'
R6_AUDIT = ROOT / 'CROSS-R6-CITATION-AUDIT.json'
AUDITOR_SHA = '49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799'
R6_AUDIT_SHA = 'b732fcf2c7a6089b47e1fe5386b33d868f2eddd301a59ca1fb483230033f4891'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-cross-r7-audit.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--selection-sha256', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and len(args.selection_sha256) == 64 and
        all(char in '0123456789abcdef' for char in args.selection_sha256),
        'arguments')
    need(sha(AUDITOR) == AUDITOR_SHA and sha(R6_AUDIT) == R6_AUDIT_SHA and
        sha(SELECTIONS) == args.selection_sha256, 'pinned-input-drift')
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] == 'are.g03-beam-500k-dev-ie-cross-r7/v1'
        and sealed['status'] == 'sealed-source-only-before-citation-audit'
        and sealed['information_extraction_questions'] == 60
        and sealed['evaluator_fields_read'] is False
        and sealed['glm_model_calls'] == 0, 'selection-boundary')
    spec = importlib.util.spec_from_file_location('g03_ie_r7_citation_auditor',
        AUDITOR)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.SELECTIONS = SELECTIONS
    result = auditor.run()
    need(result['sealed_selections_sha256'] == args.selection_sha256 and
        result['aggregate']['questions'] == 60, 'audit-binding')
    prior = json.loads(R6_AUDIT.read_text())
    old = {row['probe_id']: row for row in prior['per_question']}
    need(len(old) == 60 and set(old) == {
        row['probe_id'] for row in result['per_question']}, 'paired-population')
    wins = losses = ties = 0
    for row in result['per_question']:
        previous = old[row['probe_id']]
        need(row['control'] == previous['control'] and
            row['cited_turns'] == previous['cited_turns'],
            'unchanged-control-and-citations')
        now = row['treatment']['cited_turns_reached']
        before = previous['treatment']['cited_turns_reached']
        wins += now > before
        losses += now < before
        ties += now == before
    result['schema_version'] = 'are.g03-beam-500k-dev-ie-cross-citation-audit-r7/v1'
    result['status'] = 'development-600-char-citation-reach-audited'
    result['auditor_code_sha256'] = AUDITOR_SHA
    result['r6_audit_sha256'] = R6_AUDIT_SHA
    result['paired_r7_vs_r6_cited_turn_counts'] = {
        'wins': wins, 'losses': losses, 'ties': ties}
    result['claim_ceiling'] = ('BEAM 500K exposed-development IE citation '
        'reach for 600-character-window cross-encoder versus r6 and unchanged '
        'BM25; no answer quality, native score, holdout, or superiority')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'status': result['status'],
        'aggregate': result['aggregate'],
        'paired_r7_vs_r6_cited_turn_counts':
            result['paired_r7_vs_r6_cited_turn_counts'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
