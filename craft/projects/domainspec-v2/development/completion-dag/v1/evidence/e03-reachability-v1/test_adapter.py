"""Unit evidence only. Native records and review records below are SYNTHETIC."""
import ast
import base64
import copy
import itertools
import json
from pathlib import Path
import tempfile
import unittest
import producer
import consumer
import adapter

ROOT=Path(__file__).resolve().parent
E02=ROOT.parent/'e02-reachability-v1'

def native(value):return (json.dumps(value,sort_keys=True,indent=2)+'\n').encode()
def sign(value,key,pretty=False):return {**value,key:consumer.native_hash(value,pretty)}


def fixture():
    graph=json.loads((E02/'compiled/example-project/graph.json').read_text())
    query=json.loads((E02/'query.json').read_text())
    definition=json.loads((E02.parent/'e01-reachability-v1/DEFINITION-PACK.json').read_text())
    buffers=producer.prepare(native(graph),native(query),definition['excluded_claims'])
    roles={'positive_graph':'positive.json','negative_graph':'negative.json','identity_map':'identity-map.json','positive_request':'positive-request.json','negative_request':'negative-request.json','audit_spec':'audit.json','obligation_text':'obligation.md'}
    def add(role,value,path=None):
        path=path or role+'.json';buffers[path]=native(value);roles[role]=path
    add('compiled_graph',graph);add('query',query);add('definition',definition);add('source_manifest',graph['source_manifest'])
    buffers[roles['definition']]=(E02.parent/'e01-reachability-v1/DEFINITION-PACK.json').read_bytes()
    add('profile',json.loads((E02/'profile.json').read_text()));add('compiler_certificate',json.loads((E02/'compiled/example-project/certificate.json').read_text()))
    for source in graph['source_manifest']['sources']:buffers['source/'+source['relative_path']]=(E02/'example-project'/source['relative_path']).read_bytes()
    add('consumer_source_manifest',{'files':[],'test_fixture':'synthetic'})
    hosts=[{'path':path,'id':kind,'sha256':'a'*64,'size_bytes':1} for kind,path in [('souffle','/test/souffle'),('python','/test/python'),('unshare','/test/unshare'),('driver','/test/adapters/driver.py')]]
    add('dependency_lock',{'runtime_closure_status':'frozen','host_refs':hosts,'e02_dependency_sha256':json.loads((E02/'profile.json').read_text())['dependency_lock_sha256']})
    def host(kind): return {k:v for k,v in next(x for x in hosts if x['id']==kind).items() if k!='id'} | {'location':'host','current':True}
    add('containment_context',{'authority_effect':'none','network':'isolated','persistent_writes':'selected-audit-workspace-only'})
    def ref(n):return {'path':n,'sha256':producer.sha(buffers[n]),'size_bytes':len(buffers[n]),'location':'repository','current':True}
    add('formal_tools',{'schema_version':'evf.formal-tools/v1','tools':{k:{'file':host(k),'version_output':'synthetic'} for k in ['python','souffle']}})
    records=[]
    for case in ['positive','negative']:
        for i in [1,2]:
            request=case+'-request.json';source=case+'.json';rows=[] if case=='positive' else ['N0'];outcome='supported' if case=='positive' else 'counterexample'
            r={'schema_version':'evf.formal-provider-evidence/v1','provider':'souffle','request_ref':ref(request),'source_ref':ref(source),'tools_ref':ref(roles['formal_tools']),'dependency_refs':[],
               'native_evidence':{'translation':consumer.QUERY,'processes':[{'argv':['/test/souffle','--no-preprocessor','-F','/tmp/test/facts','-D','/tmp/test/output','/tmp/test/model.dl'],'exit_code':0,'failure':None,'stdout':'','stderr':''}],
                'artifacts':{'Violation.csv':base64.b64encode(('\n'.join(rows)+'\n' if rows else '').encode()).decode()}},
               'normalized_outcome':outcome,'details':{'violations':rows},'summary':{'provider':'souffle','evidence_kind':'closed-world-datalog','outcome':'pass' if case=='positive' else 'fail','reason_code':'PROPERTY_SUPPORTED' if case=='positive' else 'COUNTEREXAMPLE'}}
            name='raw/'+case+str(i)+'.json';add(case+'_raw_'+str(i),sign(r,'receipt_digest',True),name);records.append(ref(name))
    rt={'argv':['-B','/test/adapters/driver.py','--input','{input}','--tools',roles['formal_tools'],'--records','raw'],
        'network':'forbidden','working_directory':'.','environment':{'LANG':'C','LC_ALL':'C'},'max_output_bytes':4096,'timeout_ms':180000,
        'executable_ref':host('python'),'isolation':{'mechanism':'linux-user-and-network-namespace','unshare_ref':host('unshare')},'tool_refs':[host('driver')]}
    summary=lambda outcome,reason:{'provider':'souffle','evidence_kind':'closed-world-datalog','outcome':outcome,'reason_code':reason}
    profile={'schema_version':'evf.enforcement-profile/v1','profile_id':'dsv2-owns-reachability.owns-reachability','route':'executable','obligation_denominator':1,'obligation_ids':['owns-reachability'],'authority_effect':'none',
             'checks':[{'check_id':'owns-reachability','provider_id':'souffle','input_ref':ref(roles['positive_request']),'expected_output':summary('pass','PROPERTY_SUPPORTED'),'runtime':rt}],
             'mutations':[{'check_id':'owns-reachability','input_ref':ref(roles['negative_request']),'expected_rejection_code':'COUNTEREXAMPLE','expected_output':summary('fail','COUNTEREXAMPLE')}],
             'repetitions':2,'stages':[{'stage_id':'S'+str(i)} for i in range(13)]}
    add('evf_profile',profile)
    stages=[];previous={}
    for i in range(13):
        stage=sign({'schema_version':'evf.stage-receipt/v1','stage_id':'S'+str(i),'profile_id':profile['profile_id'],'route':'executable','state':'passed','input_stage_receipt_digests':previous,'authority_effect':'none'},'receipt_payload_digest')
        stages.append(stage);previous={stage['stage_id']:stage['receipt_payload_digest']}
    e={'schema_version':'evf.evolvable-validation-receipt/v1','profile_id':profile['profile_id'],'profile_ref':ref(roles['evf_profile']),'route':'executable','denominator':{'stages':13,'checks':1,'mutations':1},'authority_effect':'none','release_admission':'not-granted','all_required_stages_present':True,'aggregate_state':'passed','stage_receipts':stages,'verification_receipt':sign({'schema_version':'evf.verification-receipt/v1','verdict':'passed','verified_stage_ids':['S'+str(i) for i in range(11)],'recomputed_aggregate_state':'passed','all_refs_current':True,'replay_equal':True},'receipt_payload_digest')}
    add('evf_evidence',sign(e,'evidence_payload_digest'))
    claim={'schema_version':'evf.portable-formal-claim/v1-candidate','status':'supported-for-declared-scope','claim_id':'owns-reachability','provider':'souffle','whole_system_claim':False,'authority_effect':'none','machine_property':json.loads(buffers['positive.json']),'limits':definition['excluded_claims'],'evf_evidence_ref':ref(roles['evf_evidence']),'raw_evidence_refs':records}
    bundle={'schema_version':'evf.formal-audit-bundle/v1','status':'passed','spec_ref':ref('audit.json'),'tools_ref':ref(roles['formal_tools']),'jobs':[{'id':'owns-reachability','status':'passed','profile_ref':ref(roles['evf_profile']),'evidence_ref':ref(roles['evf_evidence']),'records':records}],'claims':[claim],'authority_effect':'none'}
    add('formal_bundle',sign(bundle,'bundle_digest',True))
    review={'schema_version':'dsv2.consumer-source-review/v1-candidate','consumer_source_sha256':producer.sha(buffers[roles['consumer_source_manifest']]),'dependency_lock_sha256':producer.sha(buffers[roles['dependency_lock']]),'reviewer':'SYNTHETIC UNIT FIXTURE, NOT AN ACTUAL REVIEW','result':'PASS','authority_effect':'none'}
    add('consumer_independence_review',review)
    expected={'schema_version':'dsv2.owns-expected/v1-candidate',**{k:producer.file_ref(roles[k],buffers[roles[k]]) for k in consumer.INPUTS}}
    handle=producer.handle(expected,buffers,roles)
    return expected,handle,buffers,producer.sha(buffers[roles['consumer_independence_review']])


class AdapterTests(unittest.TestCase):
    def test_unit_only_baseline(self):
        e,h,b,r=fixture();result=consumer.evaluate(e,h,b,r)
        self.assertEqual(result['aggregate'],'PASS',result)
    def test_review_not_inferred(self):
        e,h,b,r=fixture();out=consumer.evaluate(e,h,b)
        self.assertEqual(out['aggregate'],'not_evaluable',out)
        self.assertEqual(out['conditions'][-1]['reason_code'],'INDEPENDENCE_UNREVIEWED')
    def test_stale_epoch(self):
        e,h,b,r=fixture();e['query']['sha256']='0'*64
        self.assertEqual(consumer.evaluate(e,h,b,r)['aggregate'],'BLOCK')
    def test_missing_raw_is_unknown(self):
        e,h,b,r=fixture();del b[h['body']['roles']['positive_raw_1']]
        out=consumer.evaluate(e,h,b,r);self.assertEqual(out['aggregate'],'not_evaluable',out)
    def test_missing_handle_is_unknown(self):
        e,h,b,r=fixture();self.assertEqual(consumer.evaluate(e,None,{},r)['aggregate'],'not_evaluable')
    def test_tampered_raw(self):
        e,h,b,r=fixture();b[h['body']['roles']['positive_raw_1']]+=b' '
        self.assertEqual(consumer.evaluate(e,h,b,r)['aggregate'],'BLOCK')
    def test_mixed_run_rehashed_handle(self):
        e,h,b,r=fixture();roles=h['body']['roles'];old=roles['positive_raw_1'];new='foreign/'+old;b[new]=b.pop(old);roles['positive_raw_1']=new;h=producer.handle(e,b,roles)
        out=consumer.evaluate(e,h,b,r);self.assertEqual(out['aggregate'],'BLOCK',out)
        self.assertEqual(out['conditions'][2]['reason_code'],'MIXED_RUN')
    def test_extra_claim_rehashed_bundle_and_handle(self):
        e,h,b,r=fixture();n=h['body']['roles']['formal_bundle'];bundle=json.loads(b[n]);bundle.pop('bundle_digest');bundle['claims'].append(copy.deepcopy(bundle['claims'][0]));b[n]=native(sign(bundle,'bundle_digest',True));h=producer.handle(e,b,h['body']['roles'])
        self.assertEqual(consumer.evaluate(e,h,b,r)['aggregate'],'BLOCK')
    def test_missing_stage_rehashed(self):
        e,h,b,r=fixture();n=h['body']['roles']['evf_evidence'];d=json.loads(b[n]);d.pop('evidence_payload_digest');d['stage_receipts'].pop();b[n]=native(sign(d,'evidence_payload_digest'));h=producer.handle(e,b,h['body']['roles'])
        self.assertEqual(consumer.evaluate(e,h,b,r)['aggregate'],'BLOCK')
    def test_surviving_mutant_rehashed(self):
        e,h,b,r=fixture();n=h['body']['roles']['negative_raw_1'];d=json.loads(b[n]);d.pop('receipt_digest');d['native_evidence']['artifacts']['Violation.csv']='';b[n]=native(sign(d,'receipt_digest',True));h=producer.handle(e,b,h['body']['roles'])
        out=consumer.evaluate(e,h,b,r);self.assertEqual(out['aggregate'],'BLOCK');self.assertEqual(out['conditions'][3]['reason_code'],'NEGATIVE_SURVIVED')
    def test_duplicate_json_and_surrogates(self):
        for text in [b'{"x":1,"x":2}',b'{"x":NaN}',b'"\\ud800"']:
            with self.assertRaises((ValueError,UnicodeError)):consumer.parse(text)
    def test_encoding_matches_exact_spec(self):
        values=[None,True,False,0,-1,2**53-1,'é\n\t\r\b\f\x00"\\',{'z':[1,'ü'],'a':'x'}]
        for v in values:self.assertEqual(producer.canonical(v),consumer.encode(v))
        self.assertEqual(consumer.encode('\n\t'),b'"\\u000a\\u0009"')
        for v in [float('inf'),1.1,2**53]:
            with self.assertRaises(ValueError):consumer.encode(v)
    def test_graph_exhaustive_three_vertices(self):
        base=json.loads((E02/'compiled/example-project/graph.json').read_text());possible=list(itertools.product(range(3),repeat=2))
        for mask in range(512):
            edges=[p for i,p in enumerate(possible) if mask & (1<<i)]
            graph=copy.deepcopy(base);graph['relationships']=[{'edge_id':'e'+str(i),'scope':'feature','relationship':'owns','source':{'feature_id':'audit','node_id':'abc'[a],'kind':'Entity'},'target':{'feature_id':'audit','node_id':'abc'[b],'kind':'Entity'}} for i,(a,b) in enumerate(edges)]
            for source,target in itertools.product(range(3),repeat=2):
                query={'schema_version':'dsv2.owns-query/v1-candidate','source':['audit','abc'[source]],'target':['audit','abc'[target]]}
                pos,neg,mapping=producer.project(graph,query);cpos,cneg,cmap,reachable=consumer.reconstruct(graph,query)
                self.assertEqual((pos,neg,mapping),(cpos,cneg,cmap))
                visited=set();todo=[b for a,b in edges if a==source]
                while todo:
                    n=todo.pop()
                    if n not in visited:visited.add(n);todo.extend(b for a,b in edges if a==n)
                self.assertEqual(reachable,target in visited)
                self.assertFalse(any(e[1]==neg['target'] for e in neg['edges']))
    def test_identity_and_bounds(self):
        g=json.loads((E02/'compiled/example-project/graph.json').read_text());q=json.loads((E02/'query.json').read_text())
        g['nodes'][1]['selector']=g['nodes'][0]['selector']
        for fn in [producer.project,consumer.reconstruct]:
            with self.assertRaises(ValueError):fn(g,q)
    def test_collector_rejects_symlinks(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as d:
            root=Path(d);(root/'target').write_text('x');(root/'alias').symlink_to(root/'target')
            with self.assertRaises(OSError):adapter.safe_read(root,'alias')
            for bad in ['../target','/etc/passwd','a//b','a/./b']:
                with self.assertRaises(ValueError):adapter.safe_read(root,bad)
    def test_partial_evidence_never_passes(self):
        graph=json.loads((E02/'compiled/example-project/graph.json').read_text());query=(E02/'query.json').read_bytes()
        data=native(graph)
        result=consumer.diagnose_unavailable(data,query,producer.sha(data),producer.sha(query),'NO_NATIVE_EVIDENCE')
        self.assertEqual(result['aggregate'],'not_evaluable')
        graph['relationships']=[];data=native(graph)
        result=consumer.diagnose_unavailable(data,query,producer.sha(data),producer.sha(query),'NO_NATIVE_EVIDENCE')
        self.assertEqual(result['aggregate'],'BLOCK');self.assertEqual(result['reason_code'],'COUNTEREXAMPLE')
    def test_failed_run_collector_preserves_counterexample(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as name:
            root=Path(name);trusted=root/'trusted';trusted.mkdir()
            graph=json.loads((E02/'compiled/example-project/graph.json').read_text());graph['relationships']=[]
            (trusted/'compiled_graph.json').write_bytes(native(graph));(trusted/'query.json').write_bytes((E02/'query.json').read_bytes())
            (trusted/'run-result.json').write_bytes(native({'state':'not_evaluable','reason':'TOOL_BINDING_FAILED'}))
            result=adapter.collect(root,'absent-consumer-manifest')
            self.assertEqual(result['aggregate'],'BLOCK');self.assertTrue((trusted/'partial-consumer-process.json').exists())
    def test_collection_timeout_retains_no_success(self):
        result=adapter.capture(['/usr/bin/python3','-c','import time;time.sleep(5)'],timeout=.05)
        self.assertEqual(result['failure'],'timeout');self.assertNotEqual(result['exit_code'],0)
    def test_sixty_four_nodes_and_bound_rejection(self):
        graph=json.loads((E02/'compiled/example-project/graph.json').read_text());graph['relationships']=[];template=graph['nodes'][0]
        graph['nodes']=[dict(template,node_id='n'+str(i),selector='audit:n'+str(i)) for i in range(64)]
        query={'schema_version':'dsv2.owns-query/v1-candidate','source':['audit','n0'],'target':['audit','n63']}
        self.assertEqual(len(producer.project(graph,query)[0]['nodes']),64)
        self.assertEqual(len(consumer.reconstruct(graph,query)[0]['nodes']),64)
        graph['nodes'].append(dict(template,node_id='extra',selector='audit:extra'))
        for fn in [producer.project,consumer.reconstruct]:
            with self.assertRaises(ValueError):fn(graph,query)
    def test_cross_feature_tuple_order(self):
        graph=json.loads((E02/'compiled/example-project/graph.json').read_text());graph['relationships']=[]
        graph['nodes'][1].update(feature_id='other',node_id='a',selector='other:a')
        query={'schema_version':'dsv2.owns-query/v1-candidate','source':['audit','a'],'target':['other','a']}
        pos,_,mapping=producer.project(graph,query)
        self.assertEqual([x['tuple'] for x in mapping['nodes']],[['audit','a'],['audit','c'],['other','a']])
        self.assertEqual(pos['target'],'N2');self.assertEqual(consumer.reconstruct(graph,query)[0],pos)
    def test_pure_consumer_import_boundary(self):
        tree=ast.parse((ROOT/'consumer.py').read_text());allowed={'base64','hashlib','json','re'}
        for node in ast.walk(tree):
            if isinstance(node,ast.Import):self.assertTrue(all(a.name in allowed for a in node.names))
            self.assertNotIsInstance(node,ast.ImportFrom)
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Name):self.assertNotIn(node.func.id,{'open','exec','eval','__import__','input'})
    def test_purity_input_unchanged(self):
        e,h,b,r=fixture();before=copy.deepcopy((e,h,b));consumer.evaluate(e,h,b,r);self.assertEqual((e,h,b),before)

if __name__=='__main__':unittest.main(verbosity=2)
