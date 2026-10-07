#!/usr/bin/env python3
"""Evaluator-only line-overlap audit for issue-cited native reads."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE=Path('/home/vlad_/are-benchmark-archive')
PROBE=ARCHIVE/'g01-r17-issue-line-native-read-probe-r1-20261004/READ-PROBE.json'
PROBE_SHA='d69b90931df6fa429b4ea037c22289d0b5bd33cb1dc4d6b62205cfdcb9d329c9'
PACKETS=ARCHIVE/'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json'
PACKETS_SHA='1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148'
DEFINITION=ARCHIVE/'g01-product-replication-input-r16-r2/DEFINITION.json'
DEFINITION_SHA='2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e'
PARQUET=ARCHIVE/'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA='2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
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
    pins={PROBE:PROBE_SHA,PACKETS:PACKETS_SHA,DEFINITION:DEFINITION_SHA,PARQUET:PARQUET_SHA}
    if OUTPUT.exists() or any(sha(path)!=pin for path,pin in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    probe=json.loads(PROBE.read_text())
    packets={p['ordinal']:p for p in json.loads(PACKETS.read_text())['ordered_packets']}
    tasks=json.loads(DEFINITION.read_text())['ordered_tasks']
    references=parquet.read_table(PARQUET,columns=['instance_id','base_commit','gold_context']).to_pylist()
    by_id={r['instance_id']:r for r in references}
    if len(by_id)!=len(references) or [r['ordinal'] for r in probe['rows']]!=[19,20,21,22]:
        raise SystemExit('cohort-drift')
    rows=[]
    for row in probe['rows']:
        ordinal=row['ordinal'];packet=packets[ordinal];task=tasks[ordinal-1]
        reference=by_id[packet['instance_id']]
        if reference['base_commit']!=row['base_commit'] or task['base_commit']!=row['base_commit']:
            raise SystemExit(f'commit-drift:{ordinal}')
        spans=[g for g in json.loads(reference['gold_context']) if norm(g['file'])==row['path']]
        if not spans:raise SystemExit(f'no-gold-file:{ordinal}')
        gold=set().union(*(set(range(g['start_line'],g['end_line']+1)) for g in spans))
        read=set().union(*(set(range(r['start_line'],r['end_line']+1)) for r in row['reads']))
        overlap=len(gold&read)
        rows.append({'ordinal':ordinal,'repo':row['repo'],'native_reads':len(row['reads']),
                     'read_lines_unique':len(read),'gold_lines_in_file':len(gold),
                     'overlap_lines':overlap,'read_line_precision':overlap/len(read),
                     'gold_line_recall_in_file':overlap/len(gold)})
    passed=all(r['overlap_lines']>0 for r in rows)
    report={'schema_version':'g01.r17-issue-line-native-span-overlap-r1/v1',
            'posture':'evaluator-only-exposed-line-diagnostic-not-native-span-f1',
            'input_sha256':{str(path):pin for path,pin in pins.items()},
            'script_sha256':sha(Path(__file__)),
            'gate':probe['policy']['advancement_gate'],'gate_pass':passed,
            'summary':{'tasks':len(rows),'native_reads':sum(r['native_reads'] for r in rows),
                       'tasks_with_gold_line_overlap':sum(r['overlap_lines']>0 for r in rows),
                       'read_lines_unique':sum(r['read_lines_unique'] for r in rows),
                       'overlap_lines':sum(r['overlap_lines'] for r in rows)},
            'rows':rows,
            'claim_ceiling':'Line overlap only; not native ContextBench Span-F1, live ARE behavior, independent result or superiority.'}
    data=(json.dumps(report,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'summary':report['summary'],'gate_pass':passed,
                      'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__':main()
