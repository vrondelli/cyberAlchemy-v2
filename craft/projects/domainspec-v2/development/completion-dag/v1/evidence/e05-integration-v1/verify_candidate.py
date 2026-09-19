"""Read-only E05 candidate identity, evidence and claim-boundary reconciliation."""
import hashlib
import json
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[6]
BASE=HERE.parent

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    m=load(HERE/'candidate-manifest.json')
    assert m['candidate_id']=='DSV2-E05-OWNS-REACHABILITY-001' and m['authority_effect']=='none' and m['approval_inferred'] is False
    paths=[x['path'] for x in m['files']];assert paths==sorted(set(paths))
    for x in m['files']:
        p=REPO/x['path'];assert p.is_file() and not p.is_symlink() and p.resolve()==p.absolute()
        assert sha(p)==x['sha256'] and p.stat().st_size==x['size_bytes'],x['path']
    current=BASE/'e04-review-v1';receipt=load(current/'receipt.json');checks=load(current/'CHECKS.json')
    assert receipt['result']=='PASS' and receipt['done'] is True and not receipt['integration_product_approved']
    assert receipt['implementation_candidate_id']==m['implementation_candidate_id']
    assert len(checks['cases'])==18 and all(x['test_result']=='PASS' and x['expected_consumer_result']==x['observed_consumer_result'] for x in checks['cases'])
    assert len(checks['consumer_replays'])==24
    review=load(current/'reviewer-final/review.json');assert review['result']=='PASS'
    assert review['consumer_source_sha256']==sha(BASE/'e03-reachability-v3/consumer-source-manifest.json')
    assert review['dependency_lock_sha256']==sha(BASE/'e04-reachability-v1/positive-chain/transfer/inputs/dependency_lock.json')
    roles={r for f in m['files'] for r in f['roles']}
    assert {'approval-scope','selected-implementation','completed-integration-tests','pinned-dependency-archive','design-and-prototypes','definition'}<=roles
    print(json.dumps({'verification':'PASS','candidate_id':m['candidate_id'],'candidate_manifest_sha256':sha(HERE/'candidate-manifest.json'),
        'files_verified':len(paths),'E04':'PASS','owner_product_decision':'not_recorded_by_this_verifier','authority_effect':'none'}))

if __name__=='__main__':main()
