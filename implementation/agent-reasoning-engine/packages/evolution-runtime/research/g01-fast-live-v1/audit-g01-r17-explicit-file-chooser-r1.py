#!/usr/bin/env python3
"""Evaluator-only audit of the frozen four-task explicit-file chooser."""

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as parquet


ARCHIVE = Path('/home/vlad_/are-benchmark-archive')
ROOT = ARCHIVE/'g01-r17-explicit-file-chooser-exposed-r1-20261004'
SEAL = ROOT/'SEALED-RESPONSES.json'
SEAL_SHA = '66bd577b61a5be337a7306a568b5b60dbee1651aca888ce2a5792b2204dd8da8'
SOURCE = ARCHIVE/'g01-r17-explicit-file-exposed-r1-20261004/SOURCE-SEAL.json'
SOURCE_SHA = '2a3ccd5b7546b4f7d0f6f878a3f66e3dc2aaef0a98ecd4701f0d81191f2ea18e'
PARQUET = ARCHIVE/'g01-r8-eight-task-evaluator-r1/full.parquet'
PARQUET_SHA = '2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8'
OUTPUT = ROOT/'EVALUATOR-AUDIT.json'


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(1024*1024),b''):h.update(block)
    return h.hexdigest()


def norm(path):
    path=path.replace('\\','/')
    if path.startswith('/testbed/'):path=path[len('/testbed/'):]
    elif path.startswith('/workspace/'):
        parts=path[len('/workspace/'):].split('/',1)
        path=parts[1] if len(parts)==2 else parts[0]
    return path.lstrip('/').removeprefix('./')


def main():
    pins={SEAL:SEAL_SHA,SOURCE:SOURCE_SHA,PARQUET:PARQUET_SHA}
    if OUTPUT.exists() or any(sha(path)!=pin for path,pin in pins.items()):
        raise SystemExit('output-exists-or-input-drift')
    sealed=json.loads(SEAL.read_text())
    source={r['ordinal']:r for r in json.loads(SOURCE.read_text())['rows']}
    references=parquet.read_table(PARQUET,columns=['instance_id','base_commit','gold_context']).to_pylist()
    by_id={r['instance_id']:r for r in references}
    if len(by_id)!=len(references) or [r['ordinal'] for r in sealed['rows']]!=[19,20,21,22]:
        raise SystemExit('cohort-drift')
    rows=[];hits_by_repo=defaultdict(int)
    for row in sealed['rows']:
        ordinal=row['ordinal'];input_row=source[ordinal];reference=by_id[row['instance_id']]
        if (input_row['instance_id']!=row['instance_id'] or input_row['repo']!=row['repo'] or
                input_row['base_commit']!=reference['base_commit']):
            raise SystemExit(f'identity-drift:{ordinal}')
        eligible={norm(item['path']) for item in input_row['resolved_candidates']}
        selected={norm(path) for path in row['selected_paths']}
        if len(selected)!=len(row['selected_paths']) or not selected.issubset(eligible):
            raise SystemExit(f'selection-invalid:{ordinal}')
        gold={norm(item['file']) for item in json.loads(reference['gold_context'])}
        hits=len(selected&gold)
        hits_by_repo[row['repo']]+=hits
        rows.append({'ordinal':ordinal,'repo':row['repo'],'selected_files':len(selected),
                     'gold_hits':hits,'false_positive_files':len(selected)-hits,
                     'gold_files':len(gold)})
    selected=sum(r['selected_files'] for r in rows);hits=sum(r['gold_hits'] for r in rows)
    summary={'valid_responses':sealed['valid_responses'],'selected_files':selected,
             'new_gold_hits':hits,'false_positive_files':selected-hits,
             'proposal_precision':hits/selected if selected else 0,
             'repositories_with_hit':sum(value>0 for value in hits_by_repo.values()),
             'known_chooser_tokens':sealed['known_chooser_tokens']}
    gate=json.loads((ROOT/'FREEZE.json').read_text())['advancement_gate']
    passed=(summary['valid_responses']==4 and hits>=gate['minimum_new_gold_hits'] and
            summary['proposal_precision']>=gate['minimum_proposal_precision'] and
            summary['repositories_with_hit']>=gate['minimum_repositories_with_hit'])
    report={'schema_version':'g01.r17-explicit-file-chooser-evaluator-r1/v1',
            'posture':'evaluator-only-exposed-development-no-actual-reads',
            'input_sha256':{str(path):pin for path,pin in pins.items()},
            'script_sha256':sha(Path(__file__)),'gate':gate,'gate_pass':passed,
            'summary':summary,'rows':rows,
            'claim_ceiling':'Exposed proposal precision only; no actual ARE read, native F1, all-in cost, independent transfer or superiority.'}
    data=(json.dumps(report,sort_keys=True,indent=2)+'\n').encode()
    fd=os.open(OUTPUT,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
    with os.fdopen(fd,'wb') as stream:stream.write(data)
    print(json.dumps({'summary':summary,'gate_pass':passed,'sha256':hashlib.sha256(data).hexdigest()}))


if __name__=='__main__':main()
