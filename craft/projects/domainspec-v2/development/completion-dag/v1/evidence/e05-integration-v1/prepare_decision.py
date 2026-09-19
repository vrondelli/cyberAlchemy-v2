"""Prepare the owner decision only after independent review of the exact candidate."""
import hashlib
import json
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[6]
BASE=HERE.parent

def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ref(p,root=HERE):return {'path':p.relative_to(root).as_posix(),'sha256':sha(p)}
def write(name,obj):
    with (HERE/name).open('x') as stream:json.dump(obj,stream,indent=2);stream.write('\n')

def main():
    m=load(HERE/'candidate-manifest.json');digest=sha(HERE/'candidate-manifest.json')
    review=load(HERE/'reviewer/review.json')
    assert review['result']=='PASS' and review['candidate_manifest_sha256']==digest
    assert review['candidate_id']==m['candidate_id'] and review['authority_effect']=='none' and review['unresolved_findings']==[]
    for f in m['files']:assert sha(REPO/f['path'])==f['sha256'],f['path']
    request={'schema_version':'domainspec.e05-product-decision-request/v1-candidate',
        'candidate_id':m['candidate_id'],'candidate_manifest':ref(HERE/'candidate-manifest.json'),
        'product_description':ref(HERE/'PRODUCT.md'),'independent_review':ref(HERE/'reviewer/review.json'),
        'state':'awaiting-explicit-owner-product-decision','owner_role':'DomainSpec conformance owner plus EVF owner',
        'question':'Do you approve this exact tested candidate as satisfying the bounded DomainSpec-to-EVF owns-reachability integration scope in PRODUCT.md?',
        'approval_effect':'Product acceptance for this exact candidate only; completes E05/M-EVIDENCE when recorded after currency check',
        'no_inherited_approval':['Stable 1.0 compiler product approval','portable EVF package reference or adoption'],
        'excluded_effects':['publication','release','deployment','activation','cross-host or production claims','remaining DomainSpec v2 products'],
        'decision':None,'authority_effect':'none'}
    write('APPROVAL-REQUEST.json',request)
    report=f'''# E05 final product review

The independent product review and exact candidate checks PASS. The remaining
step is an explicit owner product decision. **E05 is not complete and M-EVIDENCE
is not yet approved.** No decision has been inferred from the instruction to
prepare this review or from earlier compiler approval.

Product: DomainSpec → EVF owns-reachability integration. It checks one selected
positive-length owns path over all 1–64 Entity nodes in a compiled project, using
the approved CLI 1.0.0 package, pinned EVF 0.4.0/Souffle, killed negative controls
and an independently reviewed consumer. PRODUCT.md defines the exact scope.

Candidate: `{m['candidate_id']}`

Manifest SHA-256: `{digest}`

The manifest binds {len(m['files'])} files: the current adapter/consumer, historical
definition/design profile and compiled prototypes, dependency archives/locks,
E04 tests and prior findings/repairs. Its verifier reports PASS. The independent
review is in reviewer/REPORT.md and reviewer/review.json; it binds this same digest
and reports no unresolved blocking finding.

E04 established all 18 fixture outcomes, including intentional BLOCK and
not_evaluable cases, with 24 final consumer processes. Its retained native audits
are not represented as fresh E05 provider executions. The source review also
records 21 focused cases, 15 replays and 4,608 graph/query checks.

Approval would accept this bounded repository-local integration product. It
would not approve the EVF package generally, complete all DomainSpec v2 tracks,
publish or deploy anything. APPPROVAL-REQUEST.json is a pending decision request,
not an owner decision. Changed manifest-bound bytes invalidate this review epoch.

Construction frontier: E05 owner product decision. R00/U00/L00 remain independently
runnable. Operational residue: O01 Repository/release owner for release preparation;
O06 portable EVF owner for distribution publication; EVF/TLC owner for unrelated
TLC stability. Future native execution needs fresh runtime checks by its execution
owner. These do not block the current bounded product decision.
'''.replace('APPPROVAL-REQUEST','APPROVAL-REQUEST')
    with (HERE/'REPORT.md').open('x') as stream:stream.write(report)
    checks=[{'id':'exact-candidate-currency','result':'PASS','files':len(m['files'])},
        {'id':'independent-product-review','result':'PASS','evidence':ref(HERE/'reviewer/review.json')},
        {'id':'owner-product-decision','result':'not_evaluable','reason':'Explicit decision on the exact candidate has not been supplied'}]
    outputs=[ref(p) for p in sorted(HERE.rglob('*')) if p.is_file()]
    receipt={'schema_version':'domainspec.dag-node-candidate-receipt/v1-candidate','node_id':'E05',
        'candidate_id':m['candidate_id'],'lane':'product_construction','stage':'product-approval',
        'state':'review-passed-owner-decision-pending','result':'not_evaluable','done':False,
        'source_manifest_sha256':digest,'input_receipt_refs':[ref(BASE/'e04-review-v1/receipt.json',REPO)],
        'output_manifest':outputs,'output_manifest_sha256':hashlib.sha256(json.dumps(outputs,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
        'manifest_encoding':'UTF-8 JSON, sorted keys, compact separators; output entries contain ASCII paths and digests',
        'checks_with_observed_results':checks,'unresolved_findings':[],
        'pending_decisions':[ref(HERE/'APPROVAL-REQUEST.json')],'integration_product_approved':False,
        'claim_ceiling':'Independent review ready for owner product decision; no acceptance or operational authority',
        'authority_effect':'none'}
    write('receipt.json',receipt)
    progress=load(BASE/'e04-review-v1/progress.json')
    progress.update(prior_progress=ref(BASE/'e04-review-v1/progress.json',REPO),newly_completed=[],
        current_attempt={'node_id':'E05','result':'not_evaluable','receipt':ref(HERE/'receipt.json')},
        product_construction_frontier='E05 independent product review PASS; exact owner product decision pending',
        causal_construction_blockers=[{'id':'E05-owner-product-decision','owner_role':'DomainSpec conformance owner plus EVF owner','blocks':'M-EVIDENCE product approval'}],
        upcoming_product_prerequisites=[{'id':'E05-owner-product-decision','lane':'product_construction','status':'pending','request':ref(HERE/'APPROVAL-REQUEST.json')}])
    write('progress.json',progress)
    print(json.dumps({'review':'PASS','candidate_manifest_sha256':digest,'owner_decision':'pending','E05':'not_evaluable','authority_effect':'none'}))

if __name__=='__main__':main()
