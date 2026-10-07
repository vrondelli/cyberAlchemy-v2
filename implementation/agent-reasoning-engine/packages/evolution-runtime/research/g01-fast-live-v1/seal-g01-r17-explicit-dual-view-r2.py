#!/usr/bin/env python3
"""Score-blind dual-view projection of two sealed native read probes."""

import hashlib
import json
import os
from pathlib import Path


ARCHIVE=Path('/home/vlad_/are-benchmark-archive')
BASE=ARCHIVE/'g01-r17-explicit-native-read-probe-r1-20261004/READ-PROBE.json'
BASE_SHA='43b6f55896d11f77f602727abf334b589289e16478c56f5ba4c449f0e41c3f01'
CITED=ARCHIVE/'g01-r17-issue-line-native-read-probe-r1-20261004/READ-PROBE.json'
CITED_SHA='d69b90931df6fa429b4ea037c22289d0b5bd33cb1dc4d6b62205cfdcb9d329c9'
OUTPUT=ARCHIVE/'g01-r17-explicit-dual-view-r2-20261004/SOURCE-SEAL.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if OUTPUT.exists() or sha(BASE)!=BASE_SHA or sha(CITED)!=CITED_SHA:
        raise SystemExit('output-exists-or-input-drift')
    base=json.loads(BASE.read_text())['rows']
    cited=json.loads(CITED.read_text())['rows']
    if [r['ordinal'] for r in base]!=[19,20,21,22] or [r['ordinal'] for r in cited]!=[19,20,21,22]:
        raise SystemExit('cohort-drift')
    rows=[]
    for old,new in zip(base,cited):
        if (old['ordinal'],old['path'],old['repo'])!=(new['ordinal'],new['path'],new['repo']):
            raise SystemExit('identity-drift')
        last=new['reads'][-1]
        if last['anchor_kind']=='fallback-first-code-window' or old['source_sha256']!=last['source_sha256']:
            raise SystemExit('cited-view-missing-or-content-drift')
        ranges=[{'kind':'first-code-window','start_line':old['start_line'],
                 'end_line':old['end_line'],'source_sha256':old['source_sha256'],
                 'native_output_sha256':old['output_sha256']},
                {'kind':last['anchor_kind'],'start_line':last['start_line'],
                 'end_line':last['end_line'],'source_sha256':last['source_sha256'],
                 'native_output_sha256':last['output_sha256']}]
        lines=set().union(*(set(range(r['start_line'],r['end_line']+1)) for r in ranges))
        if len(ranges)!=2 or len(lines)>24:
            raise SystemExit('range-budget')
        rows.append({'ordinal':old['ordinal'],'repo':old['repo'],'path':old['path'],
                     'ranges':ranges,'unique_read_lines':len(lines)})
    result={'schema_version':'g01.r17-explicit-dual-view-r2/v1',
            'posture':'post-hoc-exposed-source-only-projection-no-gold-in-sealer',
            'input_sha256':{'first_native_probe':BASE_SHA,'cited_native_probe':CITED_SHA},
            'script_sha256':sha(Path(__file__)),
            'policy':{'native_reads_per_task':2,'maximum_unique_lines_per_task':24,
                      'views':['first sealed code window','last matching issue-cited line'],
                      'advancement_gate':{'all_4_tasks_with_gold_line_overlap':True,
                                          'aggregate_read_line_precision_min':0.4}},
            'rows':rows,
            'claim_ceiling':'Exposed dual-view line projection only; no new native/model calls, native Span-F1, independent test or superiority.'}
    data=(json.dumps(result,sort_keys=True,indent=2)+'\n').encode()
    OUTPUT.parent.mkdir(mode=0o700,parents=True,exist_ok=False)
    fd=os.open(OUTPUT,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as f:f.write(data)
    print(json.dumps({'tasks':len(rows),'unique_read_lines':sum(r['unique_read_lines'] for r in rows),
                      'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__':main()
