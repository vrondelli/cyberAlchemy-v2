"""E04 live campaign. Every output is new; failed runs are retained, never retried."""
import argparse
import copy
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
E03 = HERE.parent / 'e03-reachability-v1'
E02 = HERE.parent / 'e02-reachability-v1'
sys.path.insert(0, str(E03))
import adapter
import producer

COMPILER = '/home/vrondelli/projects/domainspec-v2-c04-f01-successor/projects/domainspec-v2/impl/cli'
KIT = '/tmp/evf-v4-check-BWhmj5/final-validation/extracted/evf-audit-kit-0.4.0'
RUNTIME = '/tmp/evf-v2-owner-check-clx7At/tools/souffle'

def save(path, value):
    adapter.record(path, value)

def fixture(name, nodes, edges, source, target, relation='owns'):
    root = HERE / 'fixtures' / name
    save(root/'project.json', {'schema_version':'domainspec.project/v1', 'project_id':'e04-'+name,
        'features':['audit'], 'cross_feature_edges':[]})
    save(root/'specs/audit/feature.json', {'schema_version':'domainspec.feature/v1', 'feature_id':'audit',
        'nodes':nodes, 'edges':['edge-'+str(i) for i in range(len(edges))]})
    template = json.loads((E02/'example-project/specs/audit/nodes/a.json').read_text())
    for node in nodes:
        value = copy.deepcopy(template); value['node_id'] = node
        save(root/('specs/audit/nodes/'+node+'.json'), value)
    for i, (a,b) in enumerate(edges):
        save(root/('specs/audit/edges/edge-'+str(i)+'.json'), {'schema_version':'domainspec.edge/v1',
            'edge_id':'edge-'+str(i), 'feature_id':'audit', 'relationship':relation,
            'source_node_id':a, 'target_node_id':b, 'scope':'feature'})
    query = HERE/'queries'/(name+'.json')
    save(query, {'schema_version':'dsv2.owns-query/v1-candidate', 'source':['audit',source], 'target':['audit',target]})
    return root, query

def prepare_fixtures():
    cases = [
        ('replay',list('abc'), [('a','b'),('b','c')], 'a','c','owns'),
        ('broken-chain',list('abc'), [('a','b')], 'a','c','owns'),
        ('wrong-relation',list('abc'), [('a','b'),('b','c')], 'a','c','belongs-to'),
        ('reversed-edge',list('abc'), [('b','a'),('b','c')], 'a','c','owns'),
        ('zero-length',['a'], [], 'a','a','owns'),
        ('nonempty-cycle',list('ab'), [('a','b'),('b','a')], 'a','a','owns'),
        ('valid-boundary',['n'+str(i) for i in range(64)], [('n'+str(i),'n'+str(i+1)) for i in range(63)], 'n0','n63','owns'),
        ('over-bound',['n'+str(i) for i in range(65)], [], 'n0','n64','owns'),
    ]
    for args in cases:
        name=args[0]; root,query=fixture(*args)
        try:
            result=adapter.prepare(root,query,COMPILER,HERE/name)
        except (ValueError,OSError) as e:
            result={'state':'BLOCK','reason':str(e),'authority_effect':'none'}
        save(HERE/'preparation'/(name+'.json'),result)
        print(name, result, flush=True)

def run(name):
    result=adapter.capture(['/usr/bin/python3.12','-B',str(E03/'adapter.py'),'run',
        '--prepared',str(HERE/name),'--kit',KIT,'--runtime-lock',str(HERE/'runtime-tree-lock.json')],timeout=1200)
    save(HERE/'processes'/(name+'-run.json'),result)
    print(name,result,flush=True)

def collect(name):
    result=adapter.capture(['/usr/bin/python3.12','-B',str(E03/'adapter.py'),'collect',
        '--prepared',str(HERE/name),'--consumer-manifest',str(E03/'consumer-source-manifest.json')])
    save(HERE/'processes'/(name+'-collect.json'),result)
    print(name,result,flush=True)
    if result['exit_code'] or result['failure']: return
    out=json.loads(result['stdout'])
    if 'expected_sha256' not in out: return
    consume(HERE/name, out['expected_sha256'], HERE/'processes'/(name+'-consume.json'))

def consume(root, expected_sha, output):
    result=adapter.capture(['/usr/bin/python3.12','-B',str(E03/'consume.py'),
        '--expected',str(root/'trusted/expected.json'),'--expected-sha256',expected_sha,
        '--handle',str(root/'handle.json'),'--transfer',str(root/'transfer')])
    save(output,result)
    print(output.name,result,flush=True)
    return json.loads(result['stdout'])

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('action',choices=['prepare','run','collect']);p.add_argument('name',nargs='?');a=p.parse_args()
    if a.action=='prepare':prepare_fixtures()
    elif a.action=='run':run(a.name)
    else:collect(a.name)
