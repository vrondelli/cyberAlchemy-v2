"""Freeze a reviewable E05 candidate manifest without recording an owner decision."""
import hashlib
import json
from pathlib import Path
HERE=Path(__file__).resolve().parent
BASE=HERE.parent
REPO=HERE.parents[6]

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    files={}
    def bind(path, role):
        path=path.absolute();logical=path.relative_to(REPO).as_posix()
        assert not path.is_symlink() and path.is_file(),logical
        entry={'path':logical,'sha256':sha(path),'size_bytes':path.stat().st_size,'roles':[role]}
        if logical in files:
            assert files[logical]['sha256']==entry['sha256']
            if role not in files[logical]['roles']:files[logical]['roles'].append(role)
        else:files[logical]=entry
    bind(HERE/'PRODUCT.md','approval-scope')
    bind(HERE/'verify_candidate.py','candidate-verification')
    bind(HERE/'build_candidate.py','candidate-construction-record')
    for epoch,role in [('e01-reachability-v1','definition'),('e02-reachability-v1','design-and-prototypes'),
        ('e03-reachability-v1','historical-implementation'),('e04-reachability-v1','retained-native-campaign'),
        ('e04-review-v1','completed-integration-tests')]:
        root=BASE/epoch;r=load(root/'receipt.json');bind(root/'receipt.json',role)
        if (root/'progress.json').exists():bind(root/'progress.json',role)
        for item in r['output_manifest']:
            p=root/item['path'];assert sha(p)==item['sha256'],str(p);bind(p,role)
    for epoch,role in [('e03-reachability-v2','historical-repair'),('e03-reachability-v3','selected-implementation')]:
        root=BASE/epoch;bind(root/'candidate.json',role)
        for item in load(root/'candidate.json')['files']:
            p=root/item['path'];assert sha(p)==item['sha256'],str(p);bind(p,role)
    lock=load(BASE/'e02-reachability-v1/dependency-lock.json')
    for key in ['compiler_package','portable_archive']:
        p=REPO/lock[key]['path'];assert sha(p)==lock[key]['sha256'];bind(p,'pinned-dependency-archive')
    m={'schema_version':'domainspec.e05-product-candidate/v1-candidate','candidate_id':'DSV2-E05-OWNS-REACHABILITY-001',
        'product':'DomainSpec to EVF owns-reachability integration','lane':'product_construction',
        'implementation_candidate_id':'DSV2-E03-OWNS-REACHABILITY-003',
        'integration_test_candidate_id':'DSV2-E04-OWNS-REACHABILITY-002',
        'design_profile_role':'historical definition/design source; implemented status is established by selected v3 sources and E04 evidence',
        'decision_scope':'Exact bounded product only; no inherited compiler/package approval or operational effects',
        'native_evidence':'retained E04 native runs; no new provider execution or current runtime claim',
        'files':sorted(files.values(),key=lambda x:x['path']),
        'authority_effect':'none','approval_inferred':False}
    with (HERE/'candidate-manifest.json').open('x') as stream:json.dump(m,stream,indent=2);stream.write('\n')
    print(json.dumps({'candidate_id':m['candidate_id'],'sha256':sha(HERE/'candidate-manifest.json'),'files':len(files)}))

if __name__=='__main__':main()
