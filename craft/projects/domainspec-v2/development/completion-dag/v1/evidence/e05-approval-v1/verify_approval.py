"""Reconcile recorded human approval, exact candidate and completion evidence."""
import hashlib
import json
from pathlib import Path

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[6]
PACKET=HERE.parent/'e05-integration-v1'
APPROVED_SHA='39380ca2c5ee2c7111b1339dac3df7ae0910df1d8554a1db6a8a2e969648864a'

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    d=load(HERE/'OWNER-DECISION.json');r=load(HERE/'receipt.json');p=load(HERE/'progress.json')
    assert d['candidate_manifest']['sha256']==APPROVED_SHA==sha(PACKET/'candidate-manifest.json')
    assert d['decision']=='approved' and d['user_statement']=='approved'
    assert d['decision_source']=='explicit user message in this conversation'
    assert d['product_scope']==load(PACKET/'APPROVAL-REQUEST.json')['question']
    for k in ['candidate_manifest','approval_request','independent_review','product_description']:
        assert sha(REPO/d[k]['path'])==d[k]['sha256'],k
    assert load(REPO/d['independent_review']['path'])['result']=='PASS'
    manifest=load(PACKET/'candidate-manifest.json')
    failures=[]
    for f in manifest['files']:
        file=REPO/f['path']
        if not file.is_file() or file.is_symlink() or sha(file)!=f['sha256'] or file.stat().st_size!=f['size_bytes']:
            failures.append(f['path'])
    assert not failures,failures
    for f in load(PACKET/'receipt.json')['output_manifest']:
        assert sha(PACKET/f['path'])==f['sha256'],f['path']
    assert r['result']=='PASS' and r['done'] is True and r['integration_product_approved'] is True
    assert r['owner_decision']['sha256']==sha(HERE/'OWNER-DECISION.json')
    for f in r['output_manifest']:assert sha(HERE/f['path'])==f['sha256'],f['path']
    assert hashlib.sha256(json.dumps(r['output_manifest'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==r['output_manifest_sha256']
    assert p['current_attempt']['receipt']['sha256']==sha(HERE/'receipt.json')
    assert p['product_milestones_complete']==['M-COMPILER','M-EVIDENCE'] and p['program_complete'] is False
    assert p['dependency_ready_product_nodes']==['R00','U00','L00']
    assert all(x['authority_effect']=='none' for x in [d,r,p])
    assert d['operational_authorizations']==[]
    print(json.dumps({'verification':'PASS','candidate_manifest_sha256':APPROVED_SHA,'files_verified':len(manifest['files']),
        'E05':'complete','M-EVIDENCE':'product-approved','program_complete':False,'authority_effect':'none'}))

if __name__=='__main__':main()
