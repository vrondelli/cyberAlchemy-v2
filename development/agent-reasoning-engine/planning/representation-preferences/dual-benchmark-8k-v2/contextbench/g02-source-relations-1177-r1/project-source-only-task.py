"""Project one ContextBench task without loading gold, patches, or labels."""
import argparse
import json
from pathlib import Path

import pyarrow.parquet as pq

FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
          'base_commit', 'problem_statement', 'source')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dataset', type=Path, required=True)
    parser.add_argument('--instance', required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    table = pq.read_table(args.dataset, columns=list(FIELDS))
    rows = [row for row in table.to_pylist() if row['instance_id'] == args.instance]
    if len(rows) != 1:
        raise ValueError('task-projection.instance-cardinality')
    with args.out.open('x') as stream:
        json.dump({key: rows[0][key] for key in FIELDS}, stream, indent=2)
        stream.write('\n')
    print(json.dumps({'instance_id': args.instance, 'source_only_fields': list(FIELDS)}))


if __name__ == '__main__':
    main()
