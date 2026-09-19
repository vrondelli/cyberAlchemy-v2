"""Separate-store replay and cross-run substitution using actual native runs."""
import json
import campaign as c
import adapter
import producer

def load(p):return json.loads(p.read_text())

def main():
    base=c.HERE/'positive-chain';other=c.HERE/'replay'
    expected=load(base/'trusted/expected.json');h=load(base/'handle.json');rh=load(other/'handle.json')
    buffers={r['logical_name']:(base/'transfer'/r['logical_name']).read_bytes() for r in h['body']['files']}
    outroot=c.HERE/'offline-replay'
    for n,data in buffers.items():adapter.write_new(outroot/'transfer'/n,data)
    c.save(outroot/'trusted/expected.json',expected);c.save(outroot/'handle.json',h)
    out=c.consume(outroot,producer.sha(producer.canonical(expected)),outroot/'consumer-process.json')
    original=json.loads(load(c.HERE/'processes/positive-chain-consume.json')['stdout'])
    same_bytes=all((base/'transfer'/n).read_bytes()==(outroot/'transfer'/n).read_bytes() for n in buffers)
    distinct_inodes=all((base/'transfer'/n).stat().st_ino!=(outroot/'transfer'/n).stat().st_ino for n in buffers)
    c.save(outroot/'check.json',{'id':'separate-store-exact-replay','test_result':'PASS' if out==original and same_bytes and distinct_inodes else 'BLOCK',
        'identical_consumer_receipt':out==original,'distinct_file_inodes':distinct_inodes,'identical_transferred_bytes':same_bytes,
        'aggregate':out['aggregate'],'authority_effect':'none'})
    projection_equal=all(load(base/'transfer'/h['body']['roles'][k])==load(other/'transfer'/rh['body']['roles'][k]) for k in ['positive_graph','negative_graph','identity_map'])
    names=lambda handle:{handle['body']['roles'][k] for k in ['positive_raw_1','positive_raw_2','negative_raw_1','negative_raw_2']}
    disjoint=names(h).isdisjoint(names(rh))
    result=json.loads(load(c.HERE/'processes/replay-consume.json')['stdout'])
    conditions_equal=[(x['id'],x['result'],x['reason_code']) for x in out['conditions']]==[(x['id'],x['result'],x['reason_code']) for x in result['conditions']]
    c.save(c.HERE/'semantic-replay.json',{'id':'native-semantic-replay','test_result':'PASS' if projection_equal and disjoint and conditions_equal else 'BLOCK',
        'independent_native_workspaces':True,'disjoint_raw_record_paths':disjoint,'equal_graph_projection':projection_equal,'equal_condition_results':conditions_equal,
        'comparison_scope':'owns graph, tuple map, query and condition semantics; authored project identity and descriptive bodies differ',
        'not_claimed':['identical full compiler graph','cross-host portability','independent source review'],'authority_effect':'none'})
    root=c.HERE/'mutations/mixed-run';roles=h['body']['roles'];old=roles['positive_raw_1'];foreign=rh['body']['roles']['positive_raw_1']
    del buffers[old];buffers[foreign]=(other/'transfer'/foreign).read_bytes();roles['positive_raw_1']=foreign
    mixed=producer.handle(expected,buffers,roles)
    for n,data in buffers.items():adapter.write_new(root/'transfer'/n,data)
    c.save(root/'trusted/expected.json',expected);c.save(root/'handle.json',mixed)
    result=c.consume(root,producer.sha(producer.canonical(expected)),root/'consumer-process.json')
    reason=next(x['reason_code'] for x in result['conditions'] if x['id']=='positive-evidence')
    c.save(root/'check.json',{'id':'mixed-run','test_result':'PASS' if result['aggregate']=='BLOCK' and reason=='MIXED_RUN' else 'BLOCK',
        'observed':result['aggregate'],'reason':reason,'authority_effect':'none'})

if __name__=='__main__':main()
