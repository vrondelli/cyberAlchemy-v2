#!/usr/bin/env python3
"""Evaluator-only line-overlap diagnostic for sealed native base reads."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE=Path('/home/vlad_/are-benchmark-archive')
PROBE=ARCHIVE/'g01-r17-explicit-native-read-probe-r1-20261004/READ-PROBE.json'
PROBE_SHA='43b6f55896d11f77f602727abf334b589289e16478c56f5ba4c449f0e41c3f01'
PACKETS=ARCHIVE/'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json'
PACKETS_SHA='1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148'
PARQUET=ARCHIVE/'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA='2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
DEFINITION=ARCHIVE/'g01-product-replication-input-r16-r2/DEFINITION.json'
DEFINITION_SHA='2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e'
OUTPUT=PROBE.parent/'SPAN-OVERLAP-AUDIT.json'


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()


def norm(path):
    path=path.replace('\\','/')
    if path.startswith('/testbed/'):path=path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts=path[len('/workspace/'):].split('/',1)
        path=parts[1] if len(parts)==2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    pins={PROBE:PROBE_SHA,PACKETS:PACKETS_SHA,PARQUET:PARQUET_SHA,
          DEFINITION:DEFINITION_SHA}
    if OUTPUT.exists() or any(sha(path)!=pin for path,pin in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    probe=json.loads(PROBE.read_text())['rows']
    packets={p['ordinal']:p for p in json.loads(PACKETS.read_text())['ordered_packets']}
    tasks=json.loads(DEFINITION.read_text())['ordered_tasks']
    refs=parquet.read_table(PARQUET,columns=['instance_id','base_commit','gold_context']).to_pylist()
    by_id={r['instance_id']:r for r in refs}
    if len(by_id)!=len(refs) or [r['ordinal'] for r in probe]!=[19,20,21,22]:
        raise SystemExit('cohort-drift')
    rows=[]
    for read in probe:
        packet=packets[read['ordinal']]
        ref=by_id[packet['instance_id']]
        if ref['base_commit']!=tasks[read['ordinal']-1]['base_commit']:
            raise SystemExit(f'commit-drift:{read["ordinal"]}')
        gold=json.loads(ref['gold_context'])
        same=[g for g in gold if norm(g['file'])==read['path']]
        if not same:raise SystemExit(f'no-gold-in-selected-file:{read["ordinal"]}')
        gold_lines=set().union(*(set(range(g['start_line'],g['end_line']+1)) for g in same))
        read_lines=set(range(read['start_line'],read['end_line']+1))
        overlap=len(gold_lines&read_lines)
        rows.append({'ordinal':read['ordinal'],'repo':read['repo'],
                     'gold_spans_in_file':len(same),'gold_lines_in_file':len(gold_lines),
                     'read_lines':len(read_lines),'overlap_lines':overlap,
                     'read_line_precision':overlap/len(read_lines),
                     'gold_line_recall_in_file':overlap/len(gold_lines)})
    report={'schema_version':'g01.r17-explicit-native-span-overlap-r1/v1',
            'posture':'evaluator-only-exposed-line-diagnostic-not-native-span-f1',
            'input_sha256':{str(path):pin for path,pin in pins.items()},
            'script_sha256':sha(Path(__file__)),
            'summary':{'native_reads':len(rows),'reads_with_any_gold_line':sum(r['overlap_lines']>0 for r in rows),
                       'total_read_lines':sum(r['read_lines'] for r in rows),
                       'total_overlap_lines':sum(r['overlap_lines'] for r in rows)},
            'rows':rows,
            'claim_ceiling':'Line overlap only; not native ContextBench Span-F1, live ARE behavior, independent result or superiority.'}
    data=(json.dumps(report,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'summary':report['summary'],'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__':main()
