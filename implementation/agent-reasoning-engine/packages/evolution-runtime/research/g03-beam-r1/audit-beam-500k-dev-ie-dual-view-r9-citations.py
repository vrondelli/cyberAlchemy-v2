#!/usr/bin/env python3
"""Secondary citation audit of sealed r9 dual-view projections versus r7."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


HERE = Path(__file__).resolve().parent
ROOT = Path('/home/vlad_/are-benchmark-archive/g03-beam-500k-dev-r1')
AUDITOR = HERE / 'audit-beam-500k-dev-ie-citations-r1.py'
SELECTIONS = ROOT / 'DUAL-VIEW-R9-ALL-SELECTIONS.json'
R7_AUDIT = ROOT / 'CROSS-R7-CITATION-AUDIT.json'
AUDITOR_SHA = '49c98d81c6e5aa87c60f8903f3decaf057074ab13ad5ad05d3d07fbd0db3d799'
SELECTION_SHA = '5d9107da49b1fa90016f1e84d9a99a36f839af9cae7aeb053b9348e7363a8e6a'
R7_AUDIT_SHA = '6160535be09b538ba0aa91693254f7d9ec4c300b6ea6d449274e3339457f4388'


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def need(value, reason):
    if not value:
        raise ValueError('g03-beam-500k-ie-dual-view-r9-citations.' + reason)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    need(not args.output.exists() and sha(AUDITOR) == AUDITOR_SHA and
        sha(SELECTIONS) == SELECTION_SHA and
        sha(R7_AUDIT) == R7_AUDIT_SHA, 'pinned-input-drift')
    sealed = json.loads(SELECTIONS.read_text())
    need(sealed['schema_version'] == 'are.g03-beam-500k-dev-ie-dual-view-r9/v1'
        and sealed['status'] == 'sealed-source-only-before-citation-audit'
        and sealed['information_extraction_questions'] == 60
        and sealed['evaluator_fields_read'] is False
        and sealed['glm_model_calls'] == 0, 'source-only-seal')
    spec = importlib.util.spec_from_file_location('g03_ie_r9_secondary_audit',
        AUDITOR)
    auditor = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(auditor)
    auditor.SELECTIONS = SELECTIONS
    result = auditor.run()
    need(result['sealed_selections_sha256'] == SELECTION_SHA and
        result['aggregate']['questions'] == 60, 'audit-binding')
    old = {row['probe_id']: row for row in
        json.loads(R7_AUDIT.read_text())['per_question']}
    need(len(old) == 60 and set(old) == {
        row['probe_id'] for row in result['per_question']},
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
    result['schema_version'] = 'are.g03-beam-500k-ie-dual-view-r9-citation-audit/v1'
    result['status'] = 'secondary-exposed-development-citation-audited'
    result['auditor_code_sha256'] = AUDITOR_SHA
    result['r7_audit_sha256'] = R7_AUDIT_SHA
    result['paired_r9_vs_r7_cited_turn_counts'] = {
        'wins': wins, 'losses': losses, 'ties': ties}
    result['claim_ceiling'] = ('Secondary exposed-development citation reach '
        'only; no answer quality, native BEAM score, independent holdout or superiority')
    data = (json.dumps(result, sort_keys=True, indent=2) + '\n').encode()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('xb') as stream:
        stream.write(data)
    print(json.dumps({'aggregate': result['aggregate'],
        'paired_r9_vs_r7_cited_turn_counts':
            result['paired_r9_vs_r7_cited_turn_counts'],
        'receipt_sha256': hashlib.sha256(data).hexdigest()}, sort_keys=True))


if __name__ == '__main__':
    main()
