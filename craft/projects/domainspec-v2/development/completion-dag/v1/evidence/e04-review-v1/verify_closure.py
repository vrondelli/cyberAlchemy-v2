"""Read-only verification of final E04 review closure and retained evidence."""
import hashlib
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[6]
E03=HERE.parent/'e03-reachability-v3'
E04=HERE.parent/'e04-reachability-v1'
sys.path.insert(0,str(E03))
import producer

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    receipt=load(HERE/'receipt.json');checks=load(HERE/'CHECKS.json')
    assert receipt['result']=='PASS' and receipt['done'] is True and receipt['node_id']=='E04'
    assert receipt['integration_product_approved'] is False and receipt['authority_effect']=='none'
    assert sha(HERE/'sources.json')==receipt['source_manifest_sha256']
    assert producer.sha(producer.canonical(receipt['output_manifest']))==receipt['output_manifest_sha256']
    for x in receipt['output_manifest']:
        p=HERE/x['path'];assert not p.is_symlink() and sha(p)==x['sha256'],str(p)
    actual={p.relative_to(HERE).as_posix() for p in HERE.rglob('*') if p.is_file()}
    assert actual=={x['path'] for x in receipt['output_manifest']}|{'receipt.json','progress.json'}
    for x in load(HERE/'sources.json')['files']:assert sha(REPO/x['path'])==x['sha256'],x['path']
    for epoch in ['e02-reachability-v1','e03-reachability-v1','e04-reachability-v1']:
        root=HERE.parent/epoch
        for x in load(root/'receipt.json')['output_manifest']:assert sha(root/x['path'])==x['sha256'],str(root/x['path'])
    for epoch in ['e03-reachability-v2','e03-reachability-v3']:
        root=HERE.parent/epoch
        for x in load(root/'candidate.json')['files']:assert sha(root/x['path'])==x['sha256'],str(root/x['path'])
    assert load(HERE/'reviewer/review.json')['result']=='BLOCK'
    assert load(HERE/'reviewer-successor/review.json')['result']=='BLOCK'
    review=load(HERE/'reviewer-final/review.json')
    assert review['result']=='PASS' and review['authority_effect']=='none'
    assert review['consumer_source_sha256']==sha(E03/'consumer-source-manifest.json')
    assert review['dependency_lock_sha256']==sha(E04/'positive-chain/transfer/inputs/dependency_lock.json')
    assert checks['review_sha256']==sha(HERE/'reviewer-final/review.json')
    assert len(checks['cases'])==18 and len({x['id'] for x in checks['cases']})==18
    for case in checks['cases']:
        assert case['test_result']=='PASS' and case['expected_consumer_result']==case['observed_consumer_result']
        assert sha(HERE/case['evidence']['path'])==case['evidence']['sha256']
    for run in checks['consumer_replays']:
        p=load(HERE/run['consumer_process']);v=json.loads(p['stdout'])
        assert p['failure'] is None and v['aggregate']==run['expected']
        if run['expected']=='PASS':assert p['exit_code']==0 and all(x['result']=='PASS' for x in v['conditions'])
        else:assert p['exit_code']==2
    assert len(checks['consumer_replays'])==24 and checks['exact_offline_replay_equal'] is True
    # Final handles change consumer/review metadata only. Verify every transferred
    # native byte against its frozen original, including intentional faults.
    for root in sorted((HERE/'replays').iterdir()):
        name=root.name;old=E04/name if (E04/name/'handle.json').exists() else E04/'mutations'/name
        h=load(root/'handle.json');oh=load(old/'handle.json')
        exceptions={h['body']['roles'][k] for k in ['consumer_source_manifest','consumer_independence_review']}
        for item in h['body']['files']:
            n=item['logical_name'];p=root/'transfer'/n
            if n not in exceptions:
                original=old/'transfer'/n
                assert p.exists()==original.exists()
                if p.exists():assert p.read_bytes()==original.read_bytes(),n
        assert h['body']['roles']==oh['body']['roles']
    progress=load(HERE/'progress.json')
    assert progress['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json')
    assert progress['current_attempt']['result']=='PASS' and 'E05' in progress['dependency_ready_product_nodes']
    assert progress['product_milestones_complete']==['M-COMPILER'] and progress['program_complete'] is False
    print(json.dumps({'verification':'PASS','E04':'PASS','outputs_verified':len(receipt['output_manifest']),
        'fixture_outcomes':18,'consumer_processes':24,'integration_product_approved':False,'authority_effect':'none'}))

if __name__=='__main__':main()
