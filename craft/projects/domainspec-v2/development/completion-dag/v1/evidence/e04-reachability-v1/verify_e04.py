"""Read-only reconciliation of the frozen E04 result and its selected source bytes."""
import hashlib
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[6]
sys.path.insert(0,str(HERE.parent/'e03-reachability-v1'))
import producer

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    receipt=load(HERE/'receipt.json');checks=load(HERE/'CHECKS.json');sources=load(HERE/'sources.json')
    assert receipt['node_id']=='E04' and receipt['result']=='not_evaluable' and receipt['done'] is False
    assert receipt['authority_effect']=='none'
    assert receipt['source_manifest_sha256']==sha(HERE/'sources.json')
    assert receipt['output_manifest_sha256']==producer.sha(producer.canonical(receipt['output_manifest']))
    for item in receipt['output_manifest']:
        p=HERE/item['path'];assert not p.is_symlink() and sha(p)==item['sha256'],str(p)
    actual={p.relative_to(HERE).as_posix() for p in HERE.rglob('*') if p.is_file()}
    assert actual=={x['path'] for x in receipt['output_manifest']}|{'receipt.json','progress.json'}
    for item in sources['files']:assert sha(REPO/item['path'])==item['sha256'],item['path']
    for name in ['e02-reachability-v1','e03-reachability-v1']:
        root=HERE.parent/name
        for item in load(root/'receipt.json')['output_manifest']:
            assert sha(root/item['path'])==item['sha256'],str(root/item['path'])
    assert len(checks['cases'])==18 and len({x['id'] for x in checks['cases']})==18
    assert sum(x['test_result']=='PASS' for x in checks['cases'])==15
    assert sum(x['test_result']=='not_evaluable' for x in checks['cases'])==3
    assert all(x['technical_exercise_result']=='PASS' for x in checks['cases'])
    for case in checks['cases']:
        assert sha(HERE/case['evidence']['path'])==case['evidence']['sha256']
        if case['test_result']=='PASS':assert case['expected_consumer_result']==case['observed_consumer_result']
        else:assert case['expected_consumer_result']=='PASS' and case['causal_blocker']
    for run in checks['native_positive_runs']:
        process=load(HERE/run['consumer_process']['path']);out=json.loads(process['stdout'])
        assert process['exit_code']==2 and process['failure'] is None
        assert [x['result'] for x in out['conditions']]==['PASS']*5+['not_evaluable']
        assert out['aggregate']=='not_evaluable' and out['conditions'][-1]['reason_code']=='INDEPENDENCE_UNREVIEWED'
        assert load(HERE/run['native_result']['path'])['status']=='passed'
    assert len(checks['native_positive_runs'])==5
    assert all(load(HERE/x['evidence']['path'])['test_result']=='PASS' for x in checks['supplemental'])
    assert load(HERE/'semantic-replay.json')['test_result']=='BLOCK'
    assert load(HERE/'semantic-replay-exact.json')['test_result']=='PASS'
    review=load(HERE/'REVIEW-REQUEST.json');assert review['state']=='unassigned-not-a-review'
    for key in ['consumer_manifest','execution_dependency_lock']:
        assert sha(REPO/review[key]['path'])==review[key]['sha256']
    progress=load(HERE/'progress.json')
    assert progress['newly_completed']==[] and progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json')
    assert not progress['program_complete'] and 'E04' in progress['dependency_ready_product_nodes']
    print(json.dumps({'verification':'PASS','outputs_verified':len(receipt['output_manifest']),
        'E04_result':'not_evaluable','remaining':'Independent consumer-source review','authority_effect':'none'}))

if __name__=='__main__':main()
