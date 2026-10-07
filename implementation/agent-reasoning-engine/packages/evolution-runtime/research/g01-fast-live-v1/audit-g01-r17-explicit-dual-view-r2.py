#!/usr/bin/env python3
"""Evaluator-only line overlap for the sealed two-native-view projection."""

import hashlib
import json
import os
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE=Path('/home/vlad_/are-benchmark-archive')
SOURCE=ARCHIVE/'g01-r17-explicit-dual-view-r2-20261004/SOURCE-SEAL.json'
SOURCE_SHA='67ca94bc226e424aa50d57adbf8f91727e490f1538c7f9c0e189285a057ad892'
PACKETS=ARCHIVE/'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json'
PACKETS_SHA='1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148'
DEFINITION=ARCHIVE/'g01-product-replication-input-r16-r2/DEFINITION.json'
DEFINITION_SHA='2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e'
PARQUET=ARCHIVE/'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA='2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
OUTPUT=SOURCE.parent/'EVALUATOR-AUDIT.json'


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
    pins={SOURCE:SOURCE_SHA,PACKETS:PACKETS_SHA,DEFINITION:DEFINITION_SHA,PARQUET:PARQUET_SHA}
    if OUTPUT.exists() or any(sha(p)!=v for p,v in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    source=json.loads(SOURCE.read_text())
    packets={p['ordinal']:p for p in json.loads(PACKETS.read_text())['ordered_packets']}
    tasks=json.loads(DEFINITION.read_text())['ordered_tasks']
    refs=parquet.read_table(PARQUET,columns=['instance_id','base_commit','gold_context']).to_pylist()
    by_id={r['instance_id']:r for r in refs}
    if len(by_id)!=len(refs) or [r['ordinal'] for r in source['rows']]!=[19,20,21,22]:
        raise SystemExit('cohort-drift')
    rows=[]
    for row in source['rows']:
        ordinal=row['ordinal'];packet=packets[ordinal];task=tasks[ordinal-1]
        reference=by_id[packet['instance_id']]
        if reference['base_commit']!=task['base_commit']:
            raise SystemExit('commit-drift')
        spans=[g for g in json.loads(reference['gold_context']) if norm(g['file'])==row['path']]
        if not spans:raise SystemExit('no-gold-selected-file')
        gold=set().union(*(set(range(g['start_line'],g['end_line']+1)) for g in spans))
        read=set().union(*(set(range(r['start_line'],r['end_line']+1)) for r in row['ranges']))
        if len(read)!=row['unique_read_lines'] or len(read)>24:raise SystemExit('read-budget-drift')
        overlap=len(read&gold)
        rows.append({'ordinal':ordinal,'repo':row['repo'],'native_read_views':len(row['ranges']),
                     'read_lines_unique':len(read),'gold_lines_in_file':len(gold),
                     'overlap_lines':overlap,'read_line_precision':overlap/len(read),
                     'gold_line_recall_in_file':overlap/len(gold)})
    total_read=sum(r['read_lines_unique'] for r in rows)
    total_overlap=sum(r['overlap_lines'] for r in rows)
    summary={'tasks':4,'native_read_views':sum(r['native_read_views'] for r in rows),
             'tasks_with_gold_line_overlap':sum(r['overlap_lines']>0 for r in rows),
             'read_lines_unique':total_read,'overlap_lines':total_overlap,
             'aggregate_read_line_precision':total_overlap/total_read}
    gate=source['policy']['advancement_gate']
    passed=(summary['tasks_with_gold_line_overlap']==4 and
            summary['aggregate_read_line_precision']>=gate['aggregate_read_line_precision_min'])
    report={'schema_version':'g01.r17-explicit-dual-view-evaluator-r2/v1',
            'posture':'evaluator-only-post-hoc-exposed-line-diagnostic-not-native-span-f1',
            'input_sha256':{str(p):v for p,v in pins.items()},
            'script_sha256':sha(Path(__file__)),'gate':gate,'gate_pass':passed,
            'summary':summary,'rows':rows,
            'claim_ceiling':'Exposed line overlap only; not native Span-F1, live ARE behavior, independent transfer or superiority.'}
    data=(json.dumps(report,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'summary':summary,'gate_pass':passed,'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__':main()
