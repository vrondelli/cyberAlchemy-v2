"""Mutations of actual E04 native evidence, never fabricated passing evidence."""
import base64
import copy
import json
from pathlib import Path
import sys
import campaign as c
import adapter
import producer

def native(v): return (json.dumps(v,sort_keys=True,indent=2)+'\n').encode()
def sign(v, key):
    v.pop(key,None); v[key]=producer.sha(native(v)); return native(v)

def mutate(name):
    base=c.HERE/'positive-chain'
    expected=json.loads((base/'trusted/expected.json').read_text())
    handle=json.loads((base/'handle.json').read_text())
    roles=handle['body']['roles']
    buffers={r['logical_name']:(base/'transfer'/r['logical_name']).read_bytes() for r in handle['body']['files']}
    wanted='BLOCK'; condition=None; code=None; rehandle=True
    if name=='stale-evidence':
        for role in ['compiled_graph','compiler_certificate','source_manifest','query']:
            data=(c.HERE/'broken-chain/trusted'/(role+'.json')).read_bytes()
            expected[role]=producer.file_ref(roles[role],data)
        rehandle=False;condition='input-identity';code='INPUT_STALE'
    elif name=='missing-evidence':
        del buffers[roles['positive_raw_1']];rehandle=False;wanted='not_evaluable';condition='positive-evidence';code='EVIDENCE_MISSING'
    elif name=='corrupt-model':
        n=roles['positive_graph'];v=json.loads(buffers[n]);v['edges'].pop();buffers[n]=native(v)
        condition='graph-correspondence';code='MAPPING_MISMATCH'
    elif name in ['surviving-control','provider-disagreement']:
        negative=name=='surviving-control';n=roles['negative_raw_1' if negative else 'positive_raw_1']
        v=json.loads(buffers[n]);v['native_evidence']['artifacts']['Violation.csv']='' if negative else base64.b64encode(b'N0\n').decode()
        buffers[n]=sign(v,'receipt_digest');condition='negative-control' if negative else 'positive-evidence';code='NEGATIVE_SURVIVED' if negative else 'COUNTEREXAMPLE'
    elif name=='extra-claim':
        n=roles['formal_bundle'];v=json.loads(buffers[n]);v['claims'].append({'whole_system_claim':True,'claim_id':'runtime-correctness'})
        buffers[n]=sign(v,'bundle_digest');condition='evidence-integrity';code='DENOMINATOR_MISMATCH'
    elif name=='empty-denominator':
        n=roles['query'];buffers[n]=native({'schema_version':'dsv2.owns-query/v1-candidate','queries':[]})
        expected['query']=producer.file_ref(n,buffers[n]);condition='graph-correspondence';code='INVALID_SCHEMA'
    elif name=='substituted-bytes':
        buffers[roles['positive_raw_1']]+=b' ';rehandle=False;condition='input-identity';code='EVIDENCE_CORRUPT'
    else:raise ValueError(name)
    if rehandle:handle=producer.handle(expected,buffers,roles)
    root=c.HERE/'mutations'/name
    for n,data in buffers.items():adapter.write_new(root/'transfer'/n,data)
    c.save(root/'trusted/expected.json',expected);c.save(root/'handle.json',handle)
    out=c.consume(root,producer.sha(producer.canonical(expected)),root/'consumer-process.json')
    item=next(x for x in out['conditions'] if x['id']==condition)
    passed=out['aggregate']==wanted and item['reason_code']==code
    result={'id':name,'expected':wanted,'observed':out['aggregate'],'condition':condition,'expected_reason':code,
        'observed_reason':item['reason_code'],'test_result':'PASS' if passed else 'BLOCK',
        'evidence_origin':'copy of real E04 positive-chain transfer; deliberately mutated','authority_effect':'none'}
    c.save(root/'check.json',result)
    return result

def diagnose(name, graph, query, root):
    gb=native(graph);qb=native(query)
    adapter.write_new(root/'graph.json',gb);adapter.write_new(root/'query.json',qb)
    result=adapter.capture(['/usr/bin/python3.12','-B',str(c.E03/'consume.py'),'diagnose',
        '--graph',str(root/'graph.json'),'--query',str(root/'query.json'),
        '--graph-sha256',producer.sha(gb),'--query-sha256',producer.sha(qb),'--reason','NATIVE_EVIDENCE_NOT_REQUESTED'])
    c.save(root/'consumer-process.json',result)
    out=json.loads(result['stdout'])
    c.save(root/'check.json',{'id':name,'test_result':'PASS' if out['aggregate']=='BLOCK' else 'BLOCK',
        'observed':out,'boundary':'caller-pinned compiled graph diagnostic; no native evidence claim','authority_effect':'none'})

def semantic_rejections():
    for name in ['wrong-relation','reversed-edge','zero-length']:
        t=c.HERE/name/'trusted'
        diagnose(name,json.loads((t/'compiled_graph.json').read_text()),json.loads((t/'query.json').read_text()),c.HERE/'diagnostics'/name)
    root=c.HERE/'fixtures/cross-feature-identities'
    c.save(root/'project.json',{'schema_version':'domainspec.project/v1','project_id':'e04-tuple-identities','features':['a','a-b'],'cross_feature_edges':[]})
    template=json.loads((c.E02/'example-project/specs/audit/nodes/a.json').read_text())
    for f,n in [('a','b-c'),('a-b','c')]:
        c.save(root/'specs'/f/'feature.json',{'schema_version':'domainspec.feature/v1','feature_id':f,'nodes':[n],'edges':[]})
        v=copy.deepcopy(template);v.update(feature_id=f,node_id=n);c.save(root/'specs'/f/'nodes'/(n+'.json'),v)
    node=adapter.verify_package(c.COMPILER)
    for name,source,query in [
        ('cross-feature-identities',root,{'schema_version':'dsv2.owns-query/v1-candidate','source':'a-b-c','target':['a-b','c']}),
        ('source-not-entity',c.E02/'system-model',{'schema_version':'dsv2.owns-query/v1-candidate','source':['audit','run-provider'],'target':['audit','evidence-bundle']}),
        ('over-bound',c.HERE/'fixtures/over-bound',json.loads((c.HERE/'queries/over-bound.json').read_text()))]:
        out=adapter.capture([node,str(c.E03/'compile_bridge.mjs'),c.COMPILER,str(source)])
        c.save(c.HERE/'diagnostics'/name/'compile-process.json',out)
        assert out['exit_code']==0 and not out['failure'],out
        graph=json.loads(out['stdout'])['graph']
        if name=='cross-feature-identities':
            good={**query,'source':['a','b-c']};pos,neg,mapping=producer.project(graph,good)
            assert len(mapping['nodes'])==2 and len({tuple(x['tuple']) for x in mapping['nodes']})==2
            c.save(c.HERE/'diagnostics'/name/'tuple-map.json',mapping)
        diagnose(name,graph,query,c.HERE/'diagnostics'/name)

def unavailable():
    for name in ['absent-provider','unavailable-containment']:
        root=c.HERE/'unavailable'/name;workspace=root/'workspace';workspace.mkdir(parents=True)
        argv=['/usr/bin/python3.12','-B',c.KIT+'/evf','--runtime',c.RUNTIME,'formal-tools','--workspace',str(workspace),
            '--souffle',c.RUNTIME+('/bin/missing-e04-provider' if name=='absent-provider' else '/bin/souffle'),'--trust-local-tools']
        if name=='unavailable-containment':argv=['/usr/bin/env','PATH=/e04-no-runtime-search-path',*argv]
        out=adapter.capture(argv);c.save(root/'launcher-process.json',out)
        text=out['stdout']+out['stderr']
        expected_reason='No such file' if name=='absent-provider' else 'Bubblewrap not found'
        # Real launcher failure, then a separate graph diagnostic; never a mocked provider receipt.
        t=c.HERE/'positive-chain/trusted'
        gb=(t/'compiled_graph.json').read_bytes();qb=(t/'query.json').read_bytes()
        result=adapter.capture(['/usr/bin/python3.12','-B',str(c.E03/'consume.py'),'diagnose',
            '--graph',str(t/'compiled_graph.json'),'--query',str(t/'query.json'),
            '--graph-sha256',producer.sha(gb),'--query-sha256',producer.sha(qb),'--reason',name.upper().replace('-','_')])
        c.save(root/'consumer-process.json',result);value=json.loads(result['stdout'])
        c.save(root/'check.json',{'id':name,'expected':'not_evaluable','observed':value['aggregate'],
            'test_result':'PASS' if out['exit_code']!=0 and expected_reason in text and value['aggregate']=='not_evaluable' else 'BLOCK',
            'injection':'nonexistent provider path' if name=='absent-provider' else 'empty launcher runtime search path',
            'authority_effect':'none'})

if __name__=='__main__':
    for name in ['stale-evidence','missing-evidence','corrupt-model','surviving-control','provider-disagreement','empty-denominator','extra-claim','substituted-bytes']:
        print(mutate(name),flush=True)
    semantic_rejections();unavailable()
