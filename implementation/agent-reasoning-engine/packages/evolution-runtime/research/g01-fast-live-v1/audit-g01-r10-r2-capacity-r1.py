#!/usr/bin/env python3
"""Score-blind language capacity after pinned evaluator-only eligibility exclusions."""

from collections import Counter, defaultdict
import importlib.util
import json
from pathlib import Path

import pyarrow.parquet as pq


BASE = Path('/opt/are/evolution-runtime')
SELECTOR = BASE / 'g01-r10-clean-cohort-candidate-r2/propose-g01-r10-clean-cohort-r2.py'


def main():
    spec = importlib.util.spec_from_file_location('g01_r10_r2_selector', SELECTOR)
    source = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(source)
    if source.sha(source.PARQUET) != source.PARQUET_SHA or source.sha(source.INDEX_ADMISSION) != source.INDEX_ADMISSION_SHA:
        raise ValueError('source-drift')
    clean = set()
    for path, digest in source.RECEIPTS.values():
        if source.sha(path) != digest:
            raise ValueError('eligibility-receipt-drift')
        clean.update(row['instance_id'] for row in json.loads(path.read_text())['tasks'] if row['gold_lineage_clean'])
    admission = json.loads(source.INDEX_ADMISSION.read_text())
    clean.difference_update({source.KNOWN_INDEX_INELIGIBLE})
    clean.difference_update(row['instance_id'] for row in admission['rows']
                            if row['excluded_gold_files'] or row['absent_gold_files'])
    spec = importlib.util.spec_from_file_location('g01_r10_exposure', source.EXPOSURE_HELPER)
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    clean.difference_update(helper.exposure())
    if len(clean) != 60:
        raise ValueError('eligible-supply-drift')
    rows = pq.read_table(source.PARQUET, columns=['instance_id', 'repo', 'repo_url', 'language']).to_pylist()
    by_language = defaultdict(list)
    for row in rows:
        if row['instance_id'] in clean:
            by_language[row['language']].append(row)
    output = {}
    for language, selected in sorted(by_language.items()):
        by_origin = Counter(row['repo_url'] for row in selected)
        by_repo = Counter(row['repo'] for row in selected)
        output[language] = {'tasks': len(selected), 'origins': len(by_origin),
                            'repositories': len(by_repo),
                            'two_per_origin_capacity': sum(min(count, 2) for count in by_origin.values()),
                            'two_per_repo_capacity': sum(min(count, 2) for count in by_repo.values())}
    print(json.dumps({'posture': 'score-blind-source-and-eligibility-counts-only',
                      'eligible_tasks': len(clean), 'by_language': output}, sort_keys=True))


if __name__ == '__main__':
    main()
