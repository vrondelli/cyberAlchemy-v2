"""Materialize development inputs by an allowlist; never export gold or reference tests.
Open questions: README.md. No checkout, provider dispatch or benchmark scoring.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from score_native import verify_sources

FIELDS = ('instance_id', 'original_inst_id', 'repo', 'repo_url', 'language',
          'base_commit', 'problem_statement', 'source')

def project_task(row, identity):
    for key in FIELDS:
        if not isinstance(row.get(key), str) or not row[key].strip():
            raise ValueError(f'task.invalid-field:{key}')
    for key in FIELDS:
        if key != 'problem_statement' and row[key] != identity[key]:
            raise ValueError(f'task.identity-mismatch:{key}')
    if not re.fullmatch(r'[A-Za-z0-9_-]+', row['instance_id']):
        raise ValueError('task.unsafe-instance-id')
    if not re.fullmatch(r'[a-f0-9]{40}', row['base_commit']):
        raise ValueError('task.invalid-commit')
    if not re.fullmatch(r'https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git', row['repo_url']):
        raise ValueError('task.invalid-repository')
    return {key: row[key] for key in FIELDS}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--upstream',type=Path,required=True)
    p.add_argument('--acceptance',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    manifest=json.loads(Path(__file__).with_name('source-manifest.json').read_text())
    verify_sources(a.upstream,manifest)
    acceptance=json.loads(a.acceptance.read_text())
    if acceptance['benchmark_revision'] != manifest['revision']:
        raise ValueError('task.acceptance-revision-mismatch')
    dataset=a.upstream/'data/full.parquet'
    if hashlib.sha256(dataset.read_bytes()).hexdigest()!=acceptance['dataset_sha256']:
        raise ValueError('task.acceptance-dataset-mismatch')
    wanted=acceptance['scope']['development_instances']
    if len(set(wanted))!=len(wanted): raise ValueError('task.duplicate-selection')
    identities={x['instance_id']:x for x in manifest['dataset']['instances']}
    import pyarrow.parquet as pq
    # Parquet column projection excludes gold, patch, test_patch, f2p and p2p.
    rows=pq.read_table(dataset,columns=list(FIELDS),filters=[('instance_id','in',wanted)]).to_pylist()
    if len(rows)!=len(wanted) or {r['instance_id'] for r in rows}!=set(wanted):
        raise ValueError('task.partition-mismatch')
    tasks=[project_task(row,identities[row['instance_id']]) for row in rows]
    tasks.sort(key=lambda t:t['instance_id'])
    # All input checks precede materialization; existing output is never overwritten.
    a.out.mkdir(parents=True,exist_ok=False)
    refs=[]
    for task in tasks:
        name=task['instance_id']+'.json'
        data=(json.dumps(task,ensure_ascii=False,indent=2)+'\n').encode()
        (a.out/name).write_bytes(data)
        refs.append({'instance_id':task['instance_id'],'file':name,'sha256':hashlib.sha256(data).hexdigest()})
    report={'status':'prepared-development-inputs','task_count':len(tasks),'partition':'development',
            'acceptance_sha256':hashlib.sha256(a.acceptance.read_bytes()).hexdigest(),
            'dataset_sha256':acceptance['dataset_sha256'],'fields':list(FIELDS),'tasks':refs,
            'provider_calls':0,'benchmark_cleared':False,'authority_effect':'none','open_questions_ref':'../README.md'}
    (a.out/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'tasks':len(tasks),'provider_calls':0}))

if __name__=='__main__':main()
