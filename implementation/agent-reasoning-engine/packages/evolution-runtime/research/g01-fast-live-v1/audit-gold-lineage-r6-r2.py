#!/usr/bin/env python3
"""Refine G01 r6 gold audit using the pinned scorer's EOF semantics."""

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g01-product-replication-r6'
UPSTREAM = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev/upstream'
FIRST = ROOT / 'GOLD-LINEAGE-AUDIT.json'
EXPECTED_FIRST_SHA = 'ccade593a5dbe8c4676ff339469d2c9b64626c9e24c23de995ed10be6ec3f5a0'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit():
    if sha(FIRST) != EXPECTED_FIRST_SHA:
        raise ValueError('first-audit-drift')
    first = json.loads(FIRST.read_text())
    if len(first['rows']) != 24:
        raise ValueError('first-pair-count')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader
    loader = GoldLoader(str(UPSTREAM / 'data/full.parquet'))
    rows = []
    for old in first['rows']:
        gold = loader.get(old['instance_id'])
        if gold is None or gold.id != old['gold_id']:
            raise ValueError(f'gold-drift:{old["slug"]}')
        annotations = gold.init + gold.add
        base = ROOT / old['slug'] / 'candidate/source/00/base'
        classified = []
        for issue in old['issues']:
            item = annotations[issue['annotation']]
            path = issue['path']
            if issue['kind'] == 'range-out-of-bounds':
                n, start, end = issue['base_line_count'], issue['start'], issue['end']
                kind = 'scorer-clamped-eof-sentinel' if start <= n and end == n + 1 else 'range-beyond-base'
            elif issue['kind'] == 'content-uncheckable':
                lines = (base / path).read_text(errors='replace').splitlines()
                start, end = item['start_line'], item['end_line']
                embedded = item.get('content')
                if not isinstance(embedded, str) or not embedded:
                    kind = 'content-absent'
                elif embedded.splitlines() == lines[start - 1:end]:
                    kind = 'raw-content-matches-base'
                else:
                    kind = 'raw-content-mismatch'
            elif issue['kind'] == 'file-missing':
                patch = (gold._data.get('patch') or '') + '\n' + (gold._data.get('test_patch') or '')
                kind = 'patch-referenced-file-absent-from-base' if f'b/{path}' in patch else 'unexplained-file-absent-from-base'
            else:
                kind = issue['kind']
            classified.append({'annotation': issue['annotation'], 'path': path, 'kind': kind})
        rows.append({'slug': old['slug'], 'instance_id': old['instance_id'],
                     'annotation_count': old['annotation_count'],
                     'initially_checked_annotations': old['checked_annotations'],
                     'classifications': classified})
    categories = dict(Counter(x['kind'] for row in rows for x in row['classifications']))
    unresolved = {'range-beyond-base', 'raw-content-mismatch', 'content-absent',
                  'patch-referenced-file-absent-from-base', 'unexplained-file-absent-from-base',
                  'invalid-path'}
    return {'schema_version': 'are.g01-r6-evaluator-gold-lineage-audit/v2',
            'posture': 'evaluator-only-post-score; no cohort change',
            'first_audit_sha256': EXPECTED_FIRST_SHA, 'script_sha256': sha(Path(__file__)),
            'summary': {'tasks': len(rows), 'categories': categories,
                        'tasks_with_unresolved': sum(any(x['kind'] in unresolved for x in row['classifications']) for row in rows),
                        'unresolved_count': sum(x['kind'] in unresolved for row in rows for x in row['classifications'])},
            'rows': rows,
            'claim_ceiling': 'Mechanical refinement only. Missing base files or mismatched ranges/content remain unresolved; no publication decision.'}


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] != 'audit':
        raise SystemExit('usage: audit-gold-lineage-r6-r2.py audit')
    result = audit()
    output = ROOT / 'GOLD-LINEAGE-AUDIT-R2.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'result_sha256': sha(output)}, sort_keys=True))
