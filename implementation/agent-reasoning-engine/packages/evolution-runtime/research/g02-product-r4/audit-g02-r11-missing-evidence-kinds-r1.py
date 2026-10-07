#!/usr/bin/env python3
"""Evaluator-only exposed evidence inventory, never model input. Open Questions: G02-R11-BOUND-CALL-EXPOSED-R1.md."""
import json
from collections import Counter
from hashlib import sha256
from pathlib import Path
import pyarrow.parquet as parquet

ROOT = Path('/home/vlad_/are-benchmark-archive')
OUT = ROOT/'g02-r11-bound-call-exposed-r1-20261006'


def kind(path):
    parts = Path(path).parts
    if any(p.lower() in {'test', 'tests', 'testing', 'testcases'} for p in parts) or Path(path).name.startswith('test_'):
        return 'test'
    if any(p.lower() in {'doc', 'docs', 'documentation'} for p in parts) or Path(path).suffix in {'.rst', '.md'}:
        return 'documentation'
    if Path(path).suffix == '.py':
        return 'python-implementation'
    if Path(path).suffix in {'.h', '.hpp', '.hh', '.hxx', '.c', '.cpp', '.cc', '.cxx'}:
        return 'native-implementation'
    return 'other'


def normalize(path):
    path = path.replace('\\', '/')
    if path.startswith('/testbed/'):
        path = path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        path = path[len('/workspace/'):].split('/', 1)[-1]
    return path.lstrip('/').removeprefix('./')


def main():
    assert not (OUT/'MISSING-EVIDENCE-KINDS.json').exists()
    source_bytes = (OUT/'SOURCE-SEAL.json').read_bytes()
    audit = json.loads((OUT/'EVALUATOR-AUDIT.json').read_bytes())
    assert sha256(source_bytes).hexdigest() == audit['source_seal_sha256']
    source = json.loads(source_bytes)['rows']
    ids = [r['instance_id'] for r in source]
    refs = parquet.read_table(ROOT/'g01-r8-eight-task-evaluator-r1/full.parquet',
                             columns=['instance_id', 'base_commit', 'gold_context'],
                             filters=[('instance_id', 'in', ids)]).to_pylist()
    by_id = {r['instance_id']: r for r in refs}; assert len(refs) == len(by_id) == len(source) == 12
    rows, counts, absent = [], Counter(), Counter()
    for s in source:
        ref = by_id[s['instance_id']]; assert ref['base_commit'] == s['base_commit']
        gold = {normalize(g['file']) for g in json.loads(ref['gold_context'])}
        selected, delivered = [{normalize(p) for p in s[name]} for name in ['selected_paths', 'delivered_paths']]
        base = ROOT/f"g02-product-replication-r11-20261002/pairs/{s['ordinal']:02d}-pr11-mixed-{s['ordinal']:02d}/raw/sources/session/base"
        missing = []
        for path in sorted(gold-delivered):
            p = Path(path); assert not p.is_absolute() and '..' not in p.parts
            file = base/p; exists = file.is_file() and not file.is_symlink() and file.resolve().is_relative_to(base.resolve())
            category = kind(path); counts[category] += 1
            if not exists:
                absent[category] += 1
            missing.append({'path': path, 'kind': category, 'present_in_base': exists,
                            'source_sha256': sha256(file.read_bytes()).hexdigest() if exists else None})
        rows.append({'ordinal': s['ordinal'], 'repo': s['repo'], 'gold_files': len(gold),
                     'gold_not_selected': len(gold-selected), 'undelivered_gold': len(gold-delivered),
                     'undelivered': missing})
    result = {'schema': 'are.g02-exposed-missing-evidence-kinds/v1',
              'posture': 'evaluator-only exposed inventory; labels/paths must not become retrieval hints or claim evidence',
              'tasks': 12, 'undelivered_gold': sum(counts.values()), 'by_kind': dict(counts),
              'absent_from_base_by_kind': dict(absent), 'rows': rows,
              'source_seal_sha256': sha256(source_bytes).hexdigest(),
              'implementation_sha256': sha256(Path(__file__).read_bytes()).hexdigest(),
              'open_questions_owner': 'G02-R11-BOUND-CALL-EXPOSED-R1.md'}
    with (OUT/'MISSING-EVIDENCE-KINDS.json').open('x') as stream:
        json.dump(result, stream, indent=2); stream.write('\n')
    print(json.dumps({'undelivered_gold': result['undelivered_gold'], 'by_kind': dict(counts),
                      'absent_from_base_by_kind': dict(absent), 'sha256': sha256((OUT/'MISSING-EVIDENCE-KINDS.json').read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
