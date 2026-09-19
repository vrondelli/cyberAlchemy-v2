"""Create fresh review-bearing handles and replay the unchanged consumer offline."""
import argparse
import copy
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
E04=HERE.parent/'e04-reachability-v1'
E03=HERE.parent/'e03-reachability-v3'
sys.path.insert(0,str(E03))
import adapter
import producer

def load(path):return json.loads(path.read_text())
def save(path,value):adapter.record(path,value)

def replay(name, source, review_bytes, review_sha, wanted):
    expected_bytes=(source/'trusted/expected.json').read_bytes()
    expected=load(source/'trusted/expected.json');handle=load(source/'handle.json')
    review=producer.decode(review_bytes)
    assert review['consumer_source_sha256']==expected['consumer_source_manifest']['sha256']
    assert review['dependency_lock_sha256']==expected['dependency_lock']['sha256']
    review_name=handle['body']['roles']['consumer_independence_review']
    root=HERE/'replays'/name
    for item in handle['body']['files']:
        n=item['logical_name'];old=source/'transfer'/n
        if n==review_name:
            data=review_bytes;item.update(producer.file_ref(n,data))
        elif old.exists():data=old.read_bytes()
        else:continue  # Deliberately missing evidence remains missing.
        adapter.write_new(root/'transfer'/n,data)
    # Keep every other reference and the original epoch untouched, including
    # deliberately stale epochs and corrupt-file digests in adversarial fixtures.
    handle['sha256']=producer.sha(producer.canonical(handle['body']))
    adapter.write_new(root/'trusted/expected.json',expected_bytes);save(root/'handle.json',handle)
    expected_sha=producer.sha(producer.canonical(expected))
    result=adapter.capture(['/usr/bin/python3.12','-B',str(E03/'consume.py'),
        '--expected',str(root/'trusted/expected.json'),'--expected-sha256',expected_sha,
        '--handle',str(root/'handle.json'),'--transfer',str(root/'transfer'),'--review-sha256',review_sha])
    save(root/'consumer-process.json',result)
    out=json.loads(result['stdout'])
    assert result['failure'] is None and out['aggregate']==wanted,(name,result)
    if wanted=='PASS':assert result['exit_code']==0 and all(x['result']=='PASS' for x in out['conditions'])
    else:assert result['exit_code']==2
    check={'id':name,'test_result':'PASS','expected':wanted,'observed':out['aggregate'],
        'expected_epoch_sha256':expected_sha,'handle_sha256':handle['sha256'],'review_sha256':review_sha,
        'original_handle_sha256':load(source/'handle.json')['sha256'],
        'native_evidence':'unchanged frozen E04 evidence; no provider rerun',
        'consumer_process':'replays/'+name+'/consumer-process.json','authority_effect':'none'}
    save(root/'check.json',check)
    print(name,out['aggregate'],flush=True)
    return check

def main():
    p=argparse.ArgumentParser();p.add_argument('--review-sha256',required=True);args=p.parse_args()
    review_bytes=(HERE/'reviewer-final/review.json').read_bytes()
    assert producer.sha(review_bytes)==args.review_sha256,'REVIEW_DRIFT'
    review=producer.decode(review_bytes)
    assert set(review)=={'schema_version','consumer_source_sha256','dependency_lock_sha256','reviewer','result','authority_effect'}
    assert review['schema_version']=='dsv2.consumer-source-review/v1-candidate' and review['result']=='PASS'
    assert review['authority_effect']=='none' and review['reviewer']
    assert producer.sha((E03/'consumer-source-manifest.json').read_bytes())==review['consumer_source_sha256']
    for item in load(E03/'consumer-source-manifest.json')['files']:
        assert producer.sha((E03/item['path']).read_bytes())==item['sha256']
    runs=[]
    for name in ['positive-chain','nonempty-cycle','valid-boundary','replay','replay-exact','offline-replay']:
        runs.append(replay(name,HERE/'successor-v3-inputs'/name,review_bytes,args.review_sha256,'PASS'))
    for name in ['stale-evidence','missing-evidence','corrupt-model','surviving-control','provider-disagreement',
                 'empty-denominator','extra-claim','substituted-bytes','mixed-run']:
        runs.append(replay(name,HERE/'successor-v3-inputs'/name,review_bytes,args.review_sha256,
            'not_evaluable' if name=='missing-evidence' else 'BLOCK'))
    for name in ['wrong-relation','reversed-edge','zero-length','cross-feature-identities',
                 'source-not-entity','over-bound','broken-chain','unavailable-containment','absent-provider']:
        if name=='broken-chain':source=E04/name/'trusted';gname='compiled_graph.json'
        elif name in ['unavailable-containment','absent-provider']:
            source=E04/'positive-chain/trusted';gname='compiled_graph.json'
        else:source=E04/'diagnostics'/name;gname='graph.json'
        graph=source/gname;query=source/'query.json'
        result=adapter.capture(['/usr/bin/python3.12','-B',str(E03/'consume.py'),'diagnose',
            '--graph',str(graph),'--query',str(query),'--graph-sha256',producer.sha(graph.read_bytes()),
            '--query-sha256',producer.sha(query.read_bytes()),'--reason','RETAINED_NATIVE_E04_EVIDENCE'])
        save(HERE/'diagnostics'/name/'consumer-process.json',result);out=json.loads(result['stdout'])
        wanted='not_evaluable' if name in ['unavailable-containment','absent-provider'] else 'BLOCK'
        assert out['aggregate']==wanted and result['exit_code']==2 and result['failure'] is None,(name,result)
        runs.append({'id':name,'test_result':'PASS','expected':wanted,'observed':out['aggregate'],
            'consumer_process':'diagnostics/'+name+'/consumer-process.json',
            'native_evidence':'Original E04 retained only; this new process is a graph diagnostic','authority_effect':'none'})
    first=json.loads(load(HERE/'replays/positive-chain/consumer-process.json')['stdout'])
    offline=json.loads(load(HERE/'replays/offline-replay/consumer-process.json')['stdout'])
    assert first==offline,'REPLAY_MISMATCH'
    old=load(E04/'CHECKS.json');cases=copy.deepcopy(old['cases'])
    for case in cases:
        matching=next((x for x in runs if x['id']==case['id']),None)
        if matching:
            case.update(test_result=matching['test_result'],observed_consumer_result=matching['observed'],causal_blocker=None,
                evidence={'path':matching['consumer_process'],'sha256':producer.sha((HERE/matching['consumer_process']).read_bytes())})
        else:
            case['evidence']['path']='../e04-reachability-v1/'+case['evidence']['path']
        assert case['expected_consumer_result']==case['observed_consumer_result'] and case['test_result']=='PASS',case
    save(HERE/'CHECKS.json',{'schema_version':'domainspec.e04-review-closure-checks/v1-candidate','result':'PASS',
        'declared_fixture_count':18,'expected_results_observed':18,'review_sha256':args.review_sha256,
        'cases':cases,'consumer_replays':runs,'exact_offline_replay_equal':True,
        'source_review':'separate native reviewer; exact source and execution lock bound','authority_effect':'none'})

if __name__=='__main__':main()
