"""Freeze observed E04 results without converting a missing review into PASS."""
import json
from pathlib import Path
import campaign as c
import producer

def load(p):return json.loads(p.read_text())
def ref(p, root=c.HERE):return {'path':p.relative_to(root).as_posix(),'sha256':producer.sha(p.read_bytes())}
def process(p):
    d=load(p);assert d['failure'] is None,d
    return json.loads(d['stdout'])

def main():
    fixture_intent=c.E02.parent/'e01-reachability-v1/FIXTURE-INTENT.json'
    cases=[];native=[]
    for name in ['positive-chain','nonempty-cycle','valid-boundary','replay','replay-exact']:
        result=process(c.HERE/'processes'/(name+'-consume.json'))
        assert [x['result'] for x in result['conditions']]==['PASS']*5+['not_evaluable'],result
        assert result['conditions'][-1]['reason_code']=='INDEPENDENCE_UNREVIEWED'
        run=load(c.HERE/name/'trusted/run-result.json');assert run['status']=='passed'
        native.append({'id':name,'technical_result':'PASS','consumer_aggregate':result['aggregate'],
            'consumer_process':ref(c.HERE/'processes'/(name+'-consume.json')),
            'expected':ref(c.HERE/name/'trusted/expected.json'),'handle':ref(c.HERE/name/'handle.json'),
            'native_result':ref(c.HERE/name/'trusted/run-result.json')})
    broken=process(c.HERE/'processes/broken-chain-collect.json')
    assert broken['aggregate']=='BLOCK' and broken['reason_code']=='COUNTEREXAMPLE'
    bpath=Path(load(c.HERE/'broken-chain/trusted/run-result.json')['formal_claims'])
    b=load(bpath);assert b['status']=='not_established' and b['claims']==[]
    raw=list((bpath.parent/'owns-reachability/raw').glob('*.json'))
    assert len(raw)==2 and all(load(p)['normalized_outcome']=='counterexample' for p in raw)
    c.save(c.HERE/'broken-chain-check.json',{'id':'broken-chain','test_result':'PASS','consumer':broken,
        'native_bundle':ref(bpath),'native_positive_counterexamples':[ref(p) for p in sorted(raw)],
        'boundary':'Native run failed as intended; no complete positive bundle or negative-control completion inferred', 'authority_effect':'none'})
    for intended in load(fixture_intent)['cases']:
        name=intended['id'];expected=intended['expected_consumer_result']
        if name in ['positive-chain','nonempty-cycle','valid-boundary']:
            item=next(x for x in native if x['id']==name)
            observed=item['consumer_aggregate'];test='not_evaluable';evidence=item['consumer_process'];technical='PASS'
            cause='Separate consumer-source review is absent; all five technical conditions PASS'
        elif name=='broken-chain':
            observed='BLOCK';test='PASS';evidence=ref(c.HERE/'broken-chain-check.json');technical='PASS';cause=None
        else:
            paths=[c.HERE/sub/name/'check.json' for sub in ['mutations','diagnostics','unavailable']]
            p=next(p for p in paths if p.exists());d=load(p)
            observed=d['observed']['aggregate'] if isinstance(d['observed'],dict) else d['observed']
            test=d['test_result'];assert test=='PASS' and observed==expected,d
            evidence=ref(p);technical='PASS';cause=None
        cases.append({'id':name,'expected_consumer_result':expected,'observed_consumer_result':observed,
            'test_result':test,'technical_exercise_result':technical,'evidence':evidence,'causal_blocker':cause})
    supplemental=[]
    for rel in ['unavailable/absent-provider/check.json','mutations/substituted-bytes/check.json',
                'mutations/mixed-run/check.json','offline-replay/check.json','semantic-replay-exact.json']:
        p=c.HERE/rel;d=load(p);assert d['test_result']=='PASS',d
        supplemental.append({'id':d['id'],'test_result':'PASS','evidence':ref(p)})
    assert len(cases)==18 and sum(x['test_result']=='PASS' for x in cases)==15
    assert load(c.HERE/'semantic-replay.json')['test_result']=='BLOCK'
    checks={'schema_version':'domainspec.e04-integration-checks/v1-candidate','declared_fixture_count':18,
        'expected_results_observed':15,'positive_cases_pending_review':3,'technical_exercises_passed':18,
        'cases':cases,'native_positive_runs':native,'supplemental':supplemental,
        'retained_failure':{'evidence':ref(c.HERE/'semantic-replay.json'),
            'cause':'Harness generated different authored edge IDs, so provenance maps were unequal',
            'resolution':ref(c.HERE/'semantic-replay-exact.json'),'implementation_changed':False},
        'independent_consumer_processes':'executed','independent_source_review':'not_evaluable',
        'result':'not_evaluable','authority_effect':'none'}
    c.save(c.HERE/'CHECKS.json',checks)
    repo=c.E03.parents[6]
    selected=[fixture_intent,c.E02/'receipt.json',c.E02/'contracts.json',c.E02/'profile.json',c.E02/'dependency-lock.json',
        c.E03/'receipt.json',c.E03/'progress.json',c.E03/'producer-source-manifest.json',c.E03/'consumer-source-manifest.json']
    selected += [c.E03/n for n in ['producer.py','adapter.py','compile_bridge.mjs','consumer.py','consume.py']]
    lock=load(c.E02/'dependency-lock.json')
    selected += [repo/lock[k]['path'] for k in ['compiler_package','portable_archive']]
    c.save(c.HERE/'sources.json',{'schema_version':'domainspec.e04-source-manifest/v1-candidate',
        'files':[ref(p,repo) for p in selected], 'runtime_tree':ref(c.HERE/'runtime-tree-lock.json'),
        'ontology_semantic_dependencies':[], 'authority_effect':'none'})
    for name in ['positive-chain','nonempty-cycle','valid-boundary','replay','replay-exact']:
        assert load(c.HERE/name/'trusted/expected.json')['dependency_lock']==load(c.HERE/'positive-chain/trusted/expected.json')['dependency_lock']
    c.save(c.HERE/'REVIEW-REQUEST.json',{'schema_version':'domainspec.e04-review-request/v1-candidate',
        'state':'unassigned-not-a-review','owner_role':'Separate consumer-source reviewer',
        'consumer_manifest':ref(c.E03/'consumer-source-manifest.json',repo),
        'consumer_sources':[ref(c.E03/n,repo) for n in ['consumer.py','consume.py']],
        'execution_dependency_lock':ref(c.HERE/'positive-chain/transfer/inputs/dependency_lock.json',repo),
        'definition':ref(c.E02.parent/'e01-reachability-v1/DEFINITION-PACK.json',repo),
        'contracts':ref(c.E02/'contracts.json',repo),'runtime_tree':ref(c.HERE/'runtime-tree-lock.json',repo),
        'implementation_context':[ref(c.E03/n,repo) for n in ['producer.py','adapter.py','compile_bridge.mjs']],
        'test_evidence':ref(c.HERE/'CHECKS.json',repo),
        'review_questions':['Does the consumer independently reconstruct tuple mapping and positive-length owns closure?',
            'Do exact-epoch, native evidence, negative-control and dependency joins reject substituted or incomplete receipts?',
            'Are the pure consumer and IO shell independent of producer and EVF implementation?',
            'Do missing execution evidence and missing review preserve not_evaluable without unsupported claims?'],
        'expected_review_fields':['schema_version','consumer_source_sha256','dependency_lock_sha256','reviewer','result','authority_effect'],
        'review_schema_version':'dsv2.consumer-source-review/v1-candidate',
        'forbidden_effects':['edit frozen candidate or evidence','invent owner acceptance','publish','activate','deploy'],
        'next_step_after_real_review':'Create a successor transfer/handle with externally selected review digest, rerun consumer checks, and issue successor E04 receipt. Preserve this epoch.',
        'authority_effect':'none'})
    report='''# E04 live integration test result

The unchanged E03 adapter worked against the approved DomainSpec 1.0.0 compiler
and the pinned portable EVF 0.4.0 kit with Souffle. **E04 remains not_evaluable
overall because the separate consumer-source review has not been performed.**

All 18 declared fixture intents were exercised. Fifteen produced their specified
consumer outcome. The positive chain, nonempty cycle and 64-Entity boundary passed
all five technical consumer conditions; their required sixth condition, independent
source review, remains not_evaluable. This is not 18 complete product-test PASSes.

Five fresh positive native audits passed: the three positive fixtures, the initial
replay fixture and a corrected exact-source replay. Each contains two positive
and two killed-control raw records. The live broken chain retained two native
counterexamples and produced BLOCK in the separate consumer diagnostic. Its failed
EVF job is retained as not_established, not converted into a completed bundle.

Real-transfer mutations rejected stale inputs, missing records, a corrupt model,
surviving control, provider disagreement, an empty query, extra claims, substituted
bytes and mixed runs. Missing provider and unavailable Bubblewrap search path were
tested through the public launcher and remained not_evaluable. Wrong relation,
reversed edges, zero-length reachability, ambiguous cross-feature identity,
non-Entity endpoint and 65-node bound cases used compiler-valid sources followed
by independent graph diagnostics. These diagnostics do not claim native execution.

The exact original transfer produced an identical consumer receipt in a separate
store/process. A fresh native replay from byte-identical source files preserved
source manifest, compiler certificate, graph semantics, tuple/edge provenance and
condition results while producing distinct native raw records. The first replay
comparison failed because the harness generated different edge IDs. That failure
is retained; its corrected successor passes the original comparison. No adapter,
consumer, EVF, compiler or frozen E01-E03 bytes changed.

The explicit runtime lock covers 17,424 entries in the granted kit, Souffle and
fixed support trees; the adapter checked it before and after each native run.
This is same-host, quiescent-runtime product evidence. It is not cross-host,
hostile-host authenticity, production, release, deployment or whole-system proof.

The construction frontier is the separate review bound in REVIEW-REQUEST.json,
then consumer replay in a new evidence epoch. E05 final review/product approval
remains downstream. R00/U00/L00 are independently runnable. Operational residue
O01 belongs to the Repository/release owner (compiler release preparation), O06
to the portable EVF owner (distribution publication), and the unrelated TLC issue
to the EVF/TLC owner (TLC stability). None blocks the remaining source review.

Validation: all fixture and supplemental checks are in CHECKS.json. Run
`python3 -B <this-directory>/verify_e04.py` for frozen-byte and result reconciliation.
Run-local evidence and report generation grant no acceptance or operational effect.
'''
    c.adapter.write_new(c.HERE/'REPORT.md',report.encode())
    outputs=[ref(p) for p in sorted(c.HERE.rglob('*')) if p.is_file()]
    receipt={'schema_version':'domainspec.dag-node-candidate-receipt/v1-candidate','node_id':'E04',
        'candidate_id':'DSV2-E04-OWNS-REACHABILITY-001','implementation_candidate_id':'DSV2-E03-OWNS-REACHABILITY-001',
        'lane':'product_construction','state':'live-tests-recorded-review-pending','result':'not_evaluable','done':False,
        'source_manifest_sha256':producer.sha((c.HERE/'sources.json').read_bytes()),
        'input_receipt_refs':[ref(c.E03/'receipt.json',repo)],'output_manifest':outputs,
        'output_manifest_sha256':producer.sha(producer.canonical(outputs)),
        'checks_with_observed_results':{'path':'CHECKS.json','sha256':producer.sha((c.HERE/'CHECKS.json').read_bytes())},
        'unresolved_findings':[{'id':'consumer-source-review','state':'not_evaluable','owner_role':'Separate consumer-source reviewer',
            'required_before':'E04 overall PASS','request':ref(c.HERE/'REVIEW-REQUEST.json')}],
        'claim_ceiling':'Live same-host compiler-to-EVF technical test evidence; no independent source review or integration product approval',
        'authority_effect':'none'}
    c.save(c.HERE/'receipt.json',receipt)
    prior=load(c.E03/'progress.json')
    prior.update(prior_progress=ref(c.E03/'progress.json',repo),newly_completed=[],
        current_attempt={'node_id':'E04','result':'not_evaluable','receipt':ref(c.HERE/'receipt.json')},
        product_construction_frontier='E04 live campaign tested; separate consumer-source review and successor consumer replay remain',
        causal_construction_blockers=[{'id':'consumer-source-review','blocks':'E04 overall PASS','owner_role':'Separate consumer-source reviewer'}],
        upcoming_product_prerequisites=[{'id':'consumer-source-review','lane':'product_construction','required_before':'E04 overall PASS','status':'pending'}])
    for residue in prior['operational_support_residue']:
        if residue.get('id')=='portable-execution-environment':residue['state']='verified-for-recorded-E04-runs'
    c.save(c.HERE/'progress.json',prior)
    print(json.dumps({'result':'not_evaluable','technical_cases':18,'expected_results_observed':15,
        'source_review_pending_cases':3,'outputs':len(outputs),'authority_effect':'none'}))

if __name__=='__main__':main()
