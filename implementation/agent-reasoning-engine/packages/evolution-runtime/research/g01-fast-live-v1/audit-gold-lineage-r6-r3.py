#!/usr/bin/env python3
"""Evaluator-only G01 r6 label-lineage refinement; preserve earlier audits."""

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g01-product-replication-r6'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
PRIOR = ROOT / 'GOLD-LINEAGE-AUDIT-R2.json'
EXPECTED_PRIOR_SHA = 'f95a765b1c1539fbcfa9d0cf4f19effe214139a04afb067de044a96577f4bd76'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit():
    if sha(PRIOR) != EXPECTED_PRIOR_SHA:
        raise ValueError('prior-audit-drift')
    prior = json.loads(PRIOR.read_text())
    if len(prior['rows']) != 24:
        raise ValueError('prior-task-count')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader

    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for old in prior['rows']:
        gold = loader.get(old['instance_id'])
        if gold is None:
            raise ValueError('gold-missing')
        annotations = gold.init + gold.add
        classified = []
        for issue in old['classifications']:
            kind = issue['kind']
            if kind == 'raw-content-mismatch':
                item = annotations[issue['annotation']]
                source = ROOT / old['slug'] / 'candidate/source/00/base' / issue['path']
                lines = source.read_text(errors='replace').splitlines()
                start, end = item['start_line'], item['end_line']
                content = item.get('content')
                if (isinstance(content, str) and content.splitlines() == lines[start - 1:end - 1]
                        and end <= len(lines) and lines[end - 1] == ''):
                    kind = 'content-matches-base-omitting-terminal-blank'
            classified.append({**issue, 'kind': kind})
        rows.append({'slug': old['slug'], 'instance_id': old['instance_id'],
                     'annotation_count': old['annotation_count'], 'classifications': classified})
    counts = Counter(item['kind'] for row in rows for item in row['classifications'])
    unresolved = {'range-beyond-base', 'raw-content-mismatch', 'content-absent',
                  'patch-referenced-file-absent-from-base', 'unexplained-file-absent-from-base',
                  'invalid-path'}
    return {'schema_version': 'are.g01-r6-evaluator-gold-lineage-audit/v3',
            'posture': 'evaluator-only-post-score; no cohort, prediction, or score change',
            'prior_audit_sha256': EXPECTED_PRIOR_SHA, 'script_sha256': sha(Path(__file__)),
            'method_change': 'Recognize content that matches source except an omitted terminal blank line.',
            'summary': {'tasks': len(rows), 'categories': dict(counts),
                        'unresolved_count': sum(counts[k] for k in unresolved),
                        'tasks_with_unresolved': sum(any(i['kind'] in unresolved for i in row['classifications'])
                                                     for row in rows)},
            'rows': rows,
            'claim_ceiling': 'Mechanical consistency only; unresolved discrepancies still block the frozen headline gate.'}


if __name__ == '__main__':
    if sys.argv[1:] != ['audit']:
        raise SystemExit('usage: audit-gold-lineage-r6-r3.py audit')
    result = audit()
    output = ROOT / 'GOLD-LINEAGE-AUDIT-R3.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'result_sha256': sha(output)}, sort_keys=True))
