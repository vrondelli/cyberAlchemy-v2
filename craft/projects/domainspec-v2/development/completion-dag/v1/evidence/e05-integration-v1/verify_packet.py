"""Read-only check that reviewed candidate and pending human decision stay separate."""
import hashlib
import json
from pathlib import Path
from verify_candidate import main as verify_candidate
HERE=Path(__file__).resolve().parent

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    verify_candidate()
    r=load(HERE/'receipt.json');q=load(HERE/'APPROVAL-REQUEST.json');p=load(HERE/'progress.json')
    review=load(HERE/'reviewer/review.json');digest=sha(HERE/'candidate-manifest.json')
    assert r['node_id']=='E05' and r['done'] is False and r['result']=='not_evaluable'
    assert r['source_manifest_sha256']==digest and r['integration_product_approved'] is False
    assert q['candidate_manifest']['sha256']==digest and q['decision'] is None
    assert q['state']=='awaiting-explicit-owner-product-decision'
    assert review['candidate_manifest_sha256']==digest and review['result']=='PASS' and review['unresolved_findings']==[]
    assert q['independent_review']['sha256']==sha(HERE/'reviewer/review.json')
    assert all(x['authority_effect']=='none' for x in [r,q,review,p])
    for item in r['output_manifest']:
        path=HERE/item['path'];assert path.is_file() and not path.is_symlink() and sha(path)==item['sha256'],item['path']
    assert hashlib.sha256(json.dumps(r['output_manifest'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==r['output_manifest_sha256']
    files={x.relative_to(HERE).as_posix() for x in HERE.rglob('*') if x.is_file()}
    assert files=={x['path'] for x in r['output_manifest']}|{'receipt.json','progress.json'}
    assert p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json') and p['newly_completed']==[]
    assert p['product_milestones_complete']==['M-COMPILER'] and p['program_complete'] is False
    print(json.dumps({'packet_verification':'PASS','independent_product_review':'PASS',
        'E05':'awaiting-owner-product-decision','M-EVIDENCE':'not-approved','candidate_manifest_sha256':digest,'authority_effect':'none'}))

if __name__=='__main__':main()
