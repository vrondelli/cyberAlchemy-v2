#!/usr/bin/env python3
"""Evaluator-only G01 r6 gold-to-base-source lineage audit.

No selector input, model call, prediction mutation, or task substitution occurs.
Only paths/counts/hashes and mismatch categories are emitted, not source text.
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path


BASE = Path('/opt/are/evolution-runtime')
ROOT = BASE / 'g01-product-replication-r6'
SCORER_BASE = BASE / 'hen-11-contextbench-intent-anchor-r3-v22-dev'
UPSTREAM = SCORER_BASE / 'upstream'
GOLD = UPSTREAM / 'data/full.parquet'
MANIFEST = SCORER_BASE / 'repo/implementation/agent-reasoning-engine/benchmarks/contextbench-v1/source-manifest.json'
EXPECTED_FREEZE = 'ca6369131496e64ef670c4cd01feada4f00538a283d452b0c4f2b2e2b0e849e6'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_numbered_content(content):
    """Return numbered lines, or None when the dataset did not embed such lines."""
    if not isinstance(content, str) or not content:
        return None
    result = []
    for raw in content.splitlines():
        number, tab, text = raw.partition('\t')
        if not tab or not number.isdecimal():
            return None
        result.append((int(number), text))
    return result or None


def audit():
    if sha(ROOT / 'CAMPAIGN-FREEZE.json') != EXPECTED_FREEZE:
        raise ValueError('campaign-freeze-drift')
    manifest = json.loads(MANIFEST.read_text())
    expected_gold = next(x['sha256'] for x in manifest['files'] if x['path'] == 'data/full.parquet')
    if sha(GOLD) != expected_gold:
        raise ValueError('gold-parquet-drift')
    sys.path.insert(0, str(UPSTREAM))
    from contextbench.parsers.gold import GoldLoader, _normalize_rel_path

    freeze = json.loads((ROOT / 'CAMPAIGN-FREEZE.json').read_text())
    if len(freeze['ordered_tasks']) != 24:
        raise ValueError('frozen-task-count')
    loader = GoldLoader(str(GOLD))
    rows = []
    for task in freeze['ordered_tasks']:
        pair = ROOT / task['slug']
        base = pair / 'candidate/source/00/base'
        if not base.is_dir():
            raise ValueError(f'base-missing:{task["slug"]}')
        commit = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                          'rev-parse', 'HEAD'], text=True).strip()
        if commit != task['base_commit']:
            raise ValueError(f'base-commit-drift:{task["slug"]}')
        modified = subprocess.check_output(['git', '-c', f'safe.directory={base}', '-C', str(base),
                                            'status', '--porcelain', '--untracked-files=no'], text=True).strip()
        if modified:
            raise ValueError(f'base-tracked-drift:{task["slug"]}')
        gold = loader.get(task['instance_id'])
        if gold is None or gold.commit != task['base_commit']:
            raise ValueError(f'gold-identity-drift:{task["slug"]}')
        annotations = gold.init + gold.add
        issues = []
        checked_lines = 0
        checked_annotations = 0
        for index, item in enumerate(annotations):
            path = _normalize_rel_path(item.get('file', ''))
            if not path or path.startswith('/') or '..' in Path(path).parts:
                issues.append({'annotation': index, 'path': path, 'kind': 'invalid-path'})
                continue
            source = base / path
            if not source.is_file():
                issues.append({'annotation': index, 'path': path, 'kind': 'file-missing'})
                continue
            lines = source.read_text(errors='replace').splitlines()
            start, end = item.get('start_line'), item.get('end_line')
            if not isinstance(start, int) or not isinstance(end, int) or not 1 <= start <= end <= len(lines):
                issues.append({'annotation': index, 'path': path, 'kind': 'range-out-of-bounds',
                               'start': start, 'end': end, 'base_line_count': len(lines)})
                continue
            numbered = parse_numbered_content(item.get('content'))
            if numbered is None:
                issues.append({'annotation': index, 'path': path, 'kind': 'content-uncheckable'})
                continue
            if [number for number, _ in numbered] != list(range(start, end + 1)):
                issues.append({'annotation': index, 'path': path, 'kind': 'content-numbering-mismatch'})
                continue
            if any(lines[number - 1] != text for number, text in numbered):
                issues.append({'annotation': index, 'path': path, 'kind': 'content-source-mismatch'})
                continue
            checked_annotations += 1
            checked_lines += len(numbered)
        rows.append({'slug': task['slug'], 'instance_id': task['instance_id'],
                     'base_commit': commit, 'gold_id': gold.id,
                     'gold_file_count': len(gold.files()), 'annotation_count': len(annotations),
                     'checked_annotations': checked_annotations, 'checked_lines': checked_lines,
                     'issues': issues})
    summary = {'tasks': len(rows), 'annotations': sum(x['annotation_count'] for x in rows),
               'checked_annotations': sum(x['checked_annotations'] for x in rows),
               'checked_lines': sum(x['checked_lines'] for x in rows),
               'tasks_with_issues': sum(bool(x['issues']) for x in rows),
               'issue_count': sum(len(x['issues']) for x in rows)}
    return {'schema_version': 'are.g01-r6-evaluator-gold-lineage-audit/v1',
            'posture': 'evaluator-only-post-score; no cohort change',
            'campaign_freeze_sha256': EXPECTED_FREEZE, 'gold_sha256': expected_gold,
            'script_sha256': sha(Path(__file__)), 'summary': summary, 'rows': rows,
            'claim_ceiling': 'Mechanical gold annotation-to-base-source consistency only; semantic label validity and publication review remain separate.'}


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] != 'audit':
        raise SystemExit('usage: audit-gold-lineage-r6.py audit')
    result = audit()
    output = ROOT / 'GOLD-LINEAGE-AUDIT.json'
    with output.open('x') as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write('\n')
    print(json.dumps({'summary': result['summary'], 'result_sha256': sha(output)}, sort_keys=True))
