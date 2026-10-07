"""Deterministically choose one source-only NodeBB task; never read gold columns."""
import hashlib
import json
import pathlib
import sys

import pyarrow.parquet as pq


SEED = b'g02-task-path-filter-prospective-v1\0'
COLUMNS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
           'base_commit', 'problem_statement', 'source')
EXCLUDE = {
    'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae',
    'SWE-Bench-Pro__javascript__maintenance__bugfix__bc5ac89f',
}


def candidates(parquet):
    rows = pq.read_table(parquet, columns=list(COLUMNS)).to_pylist()
    selected = [row for row in rows if row['repo'] == 'NodeBB/NodeBB'
                and row['source'] == 'Pro' and row['instance_id'] not in EXCLUDE]
    return sorted(selected, key=lambda row: hashlib.sha256(
        SEED + row['instance_id'].encode()).hexdigest())


def main(parquet, output, selected_id):
    rows = candidates(parquet)
    if selected_id == '--list':
        for row in rows[:12]:
            print(row['instance_id'], row['base_commit'])
        return
    chosen = [row for row in rows if row['instance_id'] == selected_id]
    if len(chosen) != 1:
        raise RuntimeError('task-not-found-or-duplicate')
    rank = next(index for index, row in enumerate(rows) if row['instance_id'] == selected_id)
    root = pathlib.Path(output)
    root.mkdir(parents=True, exist_ok=False)
    row = chosen[0]
    data = (json.dumps(row, indent=2, ensure_ascii=False) + '\n').encode()
    path = root / (row['instance_id'] + '.json')
    path.write_bytes(data)
    manifest = {
        'selection': 'SHA-256 rank under g02-task-path-filter-prospective-v1; first candidate without prior literal-ID exposure',
        'rank': rank, 'instance_id': row['instance_id'], 'source_columns': list(COLUMNS),
        'excluded_columns': ['gold_context', 'patch', 'test_patch', 'f2p', 'p2p'],
        'task_file': path.name, 'task_sha256': hashlib.sha256(data).hexdigest(),
        'repo': row['repo'], 'base_commit': row['base_commit'],
    }
    (root / 'SOURCE-ONLY-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else '.', sys.argv[3] if len(sys.argv) > 3 else '--list')
