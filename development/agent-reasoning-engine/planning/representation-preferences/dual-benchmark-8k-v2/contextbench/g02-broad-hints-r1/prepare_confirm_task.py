"""Extract the predeclared source-only NodeBB confirmation task; never read gold."""
import hashlib
import json
import pathlib
import sys

import pyarrow.parquet as pq

INSTANCE = 'SWE-Bench-Pro__javascript__maintenance__bugfix__e31ec45c'
COLUMNS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
           'base_commit', 'problem_statement', 'source')


def main(parquet, output):
    rows = pq.read_table(parquet, columns=list(COLUMNS)).to_pylist()
    selected = [row for row in rows if row['instance_id'] == INSTANCE]
    if len(selected) != 1:
        raise RuntimeError('missing-or-duplicate-task')
    row = selected[0]
    if row['repo'] != 'NodeBB/NodeBB' or row['language'].lower() != 'javascript' or row['source'] != 'Pro':
        raise RuntimeError('task-source-drift')
    root = pathlib.Path(output)
    root.mkdir(parents=True, exist_ok=False)
    data = (json.dumps(row, indent=2, ensure_ascii=False) + '\n').encode()
    path = root / (INSTANCE + '.json')
    path.write_bytes(data)
    manifest = {
        'selection': 'predeclared unexposed NodeBB JavaScript task after exposed G02 screen passed; source-only columns read before gold',
        'instance_id': INSTANCE,
        'source_columns': list(COLUMNS),
        'excluded_columns': ['gold_context', 'patch', 'test_patch', 'f2p', 'p2p'],
        'task_sha256': hashlib.sha256(data).hexdigest(),
        'base_commit': row['base_commit'],
    }
    (root / 'SOURCE-ONLY-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
