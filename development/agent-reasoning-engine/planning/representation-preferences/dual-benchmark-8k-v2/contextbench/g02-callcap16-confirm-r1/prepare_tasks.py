"""Extract two preselected, source-only ContextBench inputs; never load gold."""
import hashlib
import json
import pathlib
import sys

import pyarrow.parquet as pq

IDS = (
    'SWE-Bench-Pro__go__maintenance__bugfix__997c7afd',
    'SWE-Bench-Pro__javascript__maintenance__bugfix__93b583ae',
)
COLUMNS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
           'base_commit', 'problem_statement', 'source')


def main(parquet, output):
    root = pathlib.Path(output)
    rows = pq.read_table(parquet, columns=list(COLUMNS)).to_pylist()
    selected = [row for row in rows if row['instance_id'] in IDS]
    if len(selected) != len(IDS) or {row['instance_id'] for row in selected} != set(IDS):
        raise RuntimeError('missing-or-duplicate-task')
    root.mkdir(parents=True, exist_ok=False)
    manifest = {'selection': 'lowest SHA-256 rank of g02-callcap-confirm-v1\\0 plus ID '
                'within each of the two cached repositories after excluding prior pair IDs; '
                'literal-ID search found only generic acceptance-list hits',
                'source_columns': list(COLUMNS), 'excluded_columns':
                ['gold_context', 'patch', 'test_patch', 'f2p', 'p2p'], 'tasks': {}}
    for row in selected:
        if row['source'] != 'Pro' or row['repo'] not in ('flipt-io/flipt', 'NodeBB/NodeBB'):
            raise RuntimeError('task-source-drift')
        filename = row['instance_id'] + '.json'
        data = (json.dumps(row, indent=2, ensure_ascii=False) + '\n').encode()
        (root / filename).write_bytes(data)
        manifest['tasks'][row['instance_id']] = {
            'file': filename, 'sha256': hashlib.sha256(data).hexdigest(),
            'repo': row['repo'], 'base_commit': row['base_commit']}
    (root / 'SOURCE-ONLY-MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
