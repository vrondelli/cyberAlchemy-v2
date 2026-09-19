"""Freeze E04 successor completion from actual review and consumer replay evidence."""
import json
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
E04=HERE.parent/'e04-reachability-v1'
E03=HERE.parent/'e03-reachability-v3'
REPO=HERE.parents[6]
sys.path.insert(0,str(E03))
import adapter
import producer

def load(p):return json.loads(p.read_text())
def ref(p,root=HERE):return {'path':p.relative_to(root).as_posix(),'sha256':producer.sha(p.read_bytes())}

def main():
    review=load(HERE/'reviewer-final/review.json');original=load(HERE/'reviewer/review.json')
    checks=load(HERE/'CHECKS.json')
    assert original['result']=='BLOCK' and review['result']=='PASS' and checks['result']=='PASS'
    assert len(checks['cases'])==18 and all(x['test_result']=='PASS' for x in checks['cases'])
    assert len(checks['consumer_replays'])==24
    assert review['consumer_source_sha256']==producer.sha((E03/'consumer-source-manifest.json').read_bytes())
    assert checks['review_sha256']==producer.sha((HERE/'reviewer-final/review.json').read_bytes())
    for x in load(E03/'candidate.json')['files']:assert producer.sha((E03/x['path']).read_bytes())==x['sha256']
    old=E03.parent/'e03-reachability-v1'
    for n in ['producer.py','adapter.py','compile_bridge.mjs','consume.py']:
        assert (E03/n).read_bytes()==(old/n).read_bytes()
    sources=[E04/'receipt.json',E04/'CHECKS.json',E04/'progress.json',E04/'REVIEW-REQUEST.json',
        E03/'candidate.json',*[E03/x['path'] for x in load(E03/'candidate.json')['files']],
        E03.parent/'e01-reachability-v1/DEFINITION-PACK.json',E03.parent/'e02-reachability-v1/contracts.json']
    adapter.record(HERE/'sources.json',{'schema_version':'domainspec.e04-review-closure-sources/v1-candidate',
        'files':[ref(p,REPO) for p in sources],'authority_effect':'none'})
    report='''# E04 review closure

**PASS for E04 integration product-test completion.** The separate native reviewer
blocked the original consumer, three findings across two repair reviews were fixed in the
successor candidate, and the same reviewer assessed that exact repair separately.
Both BLOCK reviews and final review evidence are preserved in this package.

Only consumer.py implementation bytes changed. The successor joins native claim
source/results and scope-bearing fields, and checks verifier authority/reasons and stage details including exact
positive/negative repetition results, replay equality and killed-control status.
The compiler, producer, IO shell and provider are unchanged. E01/E02 design and
definition bytes are preserved. The implementation candidate is
DSV2-E03-OWNS-REACHABILITY-003; candidate.json and the source manifests identify it.

All 18 E01 fixture outcomes are now established for this bounded campaign.
Twenty-four fresh consumer processes cover six positive/replay transfers, nine
evidence mutations and nine partial graph diagnostics. Every positive transfer
passes all six consumer conditions with the separately selected review digest.
Negative, stale, mixed-run and corrupt inputs still BLOCK. Missing evidence,
provider and containment cases still remain not_evaluable as specified. Exact
offline replay produces the same complete consumer receipt.

Native run evidence is retained from the original E04 campaign: five positive
audits and the deliberately broken run. This turn performed fresh consumer
validation and independent review, not fresh compiler/provider execution. Changing
the consumer manifest creates new caller-selected epochs and new handles; native
records and the execution dependency lock are preserved. Frozen E01-E04 evidence,
including the first replay-fixture failure, remains historical and unchanged.

The reviewer reports its own adversarial probes and limitations in
reviewer-final/REPORT.md. Its original report and five reproduced semantic
contradictions remain in reviewer/REPORT.md. No root-authored review or synthetic
PASS decision was substituted for the separate review.

The construction frontier is E05 final integration product review and owner
approval. E04 PASS is product-test evidence, not that approval. R00/U00/L00 remain
independently runnable. Operational residue remains separate: O01 Repository/
release owner for compiler-release preparation, O06 portable EVF owner for
distribution publication, and the EVF/TLC owner for unrelated TLC stability.

No publication, activation, release, deployment, cross-host portability,
hostile-host authenticity or whole-system correctness claim is granted.
Run `python3 -B <this-directory>/verify_closure.py` for frozen evidence/source
reconciliation and the explicit E04-versus-product-approval boundary.
'''
    adapter.write_new(HERE/'REPORT.md',report.encode())
    outputs=[ref(p) for p in sorted(HERE.rglob('*')) if p.is_file()]
    receipt={'schema_version':'domainspec.dag-node-candidate-receipt/v1-candidate','node_id':'E04',
        'candidate_id':'DSV2-E04-OWNS-REACHABILITY-002','implementation_candidate_id':'DSV2-E03-OWNS-REACHABILITY-003',
        'lane':'product_construction','state':'independently-reviewed-and-consumer-replayed','result':'PASS','done':True,
        'source_manifest_sha256':producer.sha((HERE/'sources.json').read_bytes()),
        'input_receipt_refs':[ref(E04/'receipt.json',REPO)],'output_manifest':outputs,
        'output_manifest_sha256':producer.sha(producer.canonical(outputs)),
        'checks_with_observed_results':ref(HERE/'CHECKS.json'),
        'independent_review':ref(HERE/'reviewer-final/review.json'),
        'historical_blocked_review':ref(HERE/'reviewer/review.json'),
        'unresolved_findings':[],'integration_product_approved':False,
        'claim_ceiling':'E04 bounded integration product-test completion; E05 final product review and human approval remain separate',
        'authority_effect':'none'}
    adapter.record(HERE/'receipt.json',receipt)
    progress=load(E04/'progress.json')
    progress.update(prior_progress=ref(E04/'progress.json',REPO),
        newly_completed=[{'node_id':'E04','receipt':'receipt.json','sha256':producer.sha((HERE/'receipt.json').read_bytes())}],
        current_attempt={'node_id':'E04','result':'PASS','receipt':ref(HERE/'receipt.json')},
        product_construction_frontier='E04 complete for repaired consumer candidate; E05 final integration product review and owner approval next',
        dependency_ready_product_nodes=['E05','R00','U00','L00'],causal_construction_blockers=[],
        upcoming_product_prerequisites=[{'id':'E05-final-product-review-and-approval','lane':'product_construction',
            'required_before':'integration product approval','status':'pending'}])
    adapter.record(HERE/'progress.json',progress)
    print(json.dumps({'result':'PASS','node_id':'E04','outputs':len(outputs),'integration_product_approved':False,'authority_effect':'none'}))

if __name__=='__main__':main()
