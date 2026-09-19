"""Independent read-only campaign probes; mutations exist in memory only.
No producer, adapter, EVF imports. No review record is invented for evaluator input.
"""
import copy
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[8]
EVIDENCE = ROOT / 'projects/domainspec-v2/development/completion-dag/v1/evidence'
E03 = EVIDENCE / 'e03-reachability-v1'
RUN = EVIDENCE / 'e04-reachability-v1/positive-chain'
spec = importlib.util.spec_from_file_location('reviewed_consumer', E03/'consumer.py')
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
sha = lambda b: hashlib.sha256(b).hexdigest()
def dump(d): return (json.dumps(d,sort_keys=True,indent=2)+'\n').encode()
def sign(d,k,pretty=False):
    d.pop(k,None)
    b=dump(d) if pretty else json.dumps(d,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode()
    d[k]=sha(b)

def baseline():
    e=json.loads((RUN/'trusted/expected.json').read_bytes())
    h=json.loads((RUN/'handle.json').read_bytes())
    b={r['logical_name']:(RUN/'transfer'/r['logical_name']).read_bytes() for r in h['body']['files']}
    return e,h,b

def refresh_refs(x,b):
    if isinstance(x,dict):
        if {'path','location','sha256','size_bytes'}<=x.keys() and x['location']=='repository':
            raw=b[x['path']];x.update(sha256=sha(raw),size_bytes=len(raw))
        else:
            for v in x.values():refresh_refs(v,b)
    elif isinstance(x,list):
        for v in x:refresh_refs(v,b)

def finish(h,b):
    for r in h['body']['files']:
        n=r['logical_name']
        if n in b:r.update(sha256=sha(b[n]),size_bytes=len(b[n]))
    # This fixture contains ASCII integration keys/values; standard compact sorted
    # JSON equals its specified integration encoding. Assert via baseline digest.
    h['sha256']=sha(json.dumps(h['body'],sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())

def update_bundle(h,b):
    n=h['body']['roles']['formal_bundle'];d=json.loads(b[n]);refresh_refs(d,b);sign(d,'bundle_digest',True);b[n]=dump(d)

def run_case(name,mutate=None):
    e,h,b=baseline();before=copy.deepcopy(e)
    if mutate:mutate(e,h,b)
    assert e==before, 'Probe must preserve caller-selected expected epoch'
    out=c.evaluate(e,h,b)
    return {'name':name,'receipt':out,'expected_inputs_unchanged':True}

def bundle_mutation(fn):
    def go(e,h,b):
        n=h['body']['roles']['formal_bundle'];d=json.loads(b[n]);fn(d,h,b);sign(d,'bundle_digest',True);b[n]=dump(d);finish(h,b)
    return go

def stage_mutation(fn):
    def go(e,h,b):
        n=h['body']['roles']['evf_evidence'];d=json.loads(b[n]);fn(d)
        prev={}
        for s in d['stage_receipts']:
            s['input_stage_receipt_digests']=prev;sign(s,'receipt_payload_digest');prev={s['stage_id']:s['receipt_payload_digest']}
        sign(d['verification_receipt'],'receipt_payload_digest');sign(d,'evidence_payload_digest');b[n]=dump(d)
        update_bundle(h,b);finish(h,b)
    return go

cases=[run_case('native_baseline_no_review')]
cases.append(run_case('claim_reports_positive_violation',bundle_mutation(lambda d,h,b:d['claims'][0].update(observed_details={'violations':['N0']}))))
cases.append(run_case('claim_source_ref_is_negative_graph',bundle_mutation(lambda d,h,b:d['claims'][0].update(source_ref={'path':h['body']['roles']['negative_graph'],'sha256':sha(b[h['body']['roles']['negative_graph']]),'size_bytes':len(b[h['body']['roles']['negative_graph']]),'location':'repository','current':True}))))
cases.append(run_case('positive_stage_contradicts_raw',stage_mutation(lambda d:d['stage_receipts'][6]['details']['observations']['owns-reachability'][0].update(exit_code=19,matched_expected=False,timed_out=True,error_code='TIMEOUT',output={'provider':'souffle','evidence_kind':'closed-world-datalog','outcome':'fail','reason_code':'COUNTEREXAMPLE'}))))
cases.append(run_case('negative_stage_survived',stage_mutation(lambda d:d['stage_receipts'][7]['details']['mutations'][0].update(killed_for_declared_cause=False))))
cases.append(run_case('positive_stage_observations_empty',stage_mutation(lambda d:d['stage_receipts'][6]['details'].update(observations={},replay_equal=False))))
def missing(e,h,b):del b[h['body']['roles']['positive_raw_1']]
cases.append(run_case('missing_raw',missing))
def stale(e,h,b):h['body']['epoch_sha256']='0'*64;finish(h,b)
cases.append(run_case('stale_epoch',stale))
def invalid_raw(e,h,b):b[h['body']['roles']['positive_raw_1']]+=b' '
cases.append(run_case('unrehashed_raw_tamper',invalid_raw))
e,h,b=baseline();cases.append({'name':'missing_handle','receipt':c.evaluate(e,None,{})})
# Exhaust all directed 3-vertex graphs against an independent iterative traversal.
graph=json.loads(b[h['body']['roles']['compiled_graph']]);nodes=graph['nodes'];possible=list(itertools.product(range(3),repeat=2));checked=0
for mask in range(512):
    edges=[p for i,p in enumerate(possible) if mask&(1<<i)]
    g=copy.deepcopy(graph)
    g['relationships']=[{'edge_id':'probe'+str(i),'scope':'feature','relationship':'owns','source':{'feature_id':nodes[a]['feature_id'],'node_id':nodes[a]['node_id'],'kind':'Entity'},'target':{'feature_id':nodes[z]['feature_id'],'node_id':nodes[z]['node_id'],'kind':'Entity'}} for i,(a,z) in enumerate(edges)]
    for a,z in possible:
        q={'schema_version':'dsv2.owns-query/v1-candidate','source':[nodes[a]['feature_id'],nodes[a]['node_id']],'target':[nodes[z]['feature_id'],nodes[z]['node_id']]}
        todo=[y for x,y in edges if x==a];seen=set()
        while todo:
            v=todo.pop()
            if v in seen:continue
            seen.add(v);todo.extend(y for x,y in edges if x==v)
        pos,neg,mapping,got=c.reconstruct(g,q)
        assert got==(z in seen),(mask,a,z)
        assert all(edge[1]!=neg['target'] for edge in neg['edges'])
        assert len(mapping['edges'])==len(edges)
        checked+=1
result={'schema_version':'dsv2.independent-consumer-probes/v1-candidate','authority_effect':'none','native_execution_rerun':False,'externally_selected_review_digest':None,'graph_exhaustion':{'cases':checked,'result':'PASS'},'cases':cases}
print(json.dumps(result,indent=2))
