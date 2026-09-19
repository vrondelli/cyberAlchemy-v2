"""Pure producer translation and handle construction; no consumer imports or IO."""
import hashlib
import json
import re

class Invalid(ValueError):
    pass

def require(ok, reason):
    if not ok:
        raise Invalid(reason)

def canonical(value):
    def string(s):
        s.encode('utf-8', errors='strict')
        return '"' + ''.join('\\u%04x' % ord(c) if ord(c) < 32 else '\\' + c if c in ('"', '\\') else c for c in s) + '"'
    if value is None: return b'null'
    if type(value) is bool: return b'true' if value else b'false'
    if type(value) is int:
        require(abs(value) <= 2**53 - 1, 'INTEGER_RANGE')
        return str(value).encode()
    if isinstance(value, str): return string(value).encode()
    if isinstance(value, list): return b'[' + b','.join(canonical(v) for v in value) + b']'
    require(type(value) is dict and all(type(k) is str for k in value), 'CANONICAL_TYPE')
    return b'{' + b','.join(canonical(k) + b':' + canonical(value[k]) for k in sorted(value)) + b'}'

def sha(data): return hashlib.sha256(data).hexdigest()

def decode(data):
    require(type(data) is bytes and len(data) <= 16*1024*1024, 'BUFFER_LIMIT')
    def unique(pairs):
        d = {}
        for k, v in pairs:
            require(k not in d, 'DUPLICATE_KEY')
            d[k] = v
        return d
    result = json.loads(data.decode('utf-8'), object_pairs_hook=unique,
                        parse_constant=lambda _: (_ for _ in ()).throw(Invalid('NONFINITE')))
    # Canonical metadata deliberately disallows floats and unpaired surrogates.
    return result

def name(value):
    require(type(value) is str and value and not value.startswith('/') and '\\' not in value
            and '\x00' not in value and all(p not in ('', '.', '..') for p in value.split('/')), 'UNSAFE_NAME')
    return value

def file_ref(logical, data):
    require(type(data) is bytes and len(data) <= 16*1024*1024, 'BUFFER_LIMIT')
    return {'logical_name': name(logical), 'sha256': sha(data), 'size_bytes': len(data)}

def project(graph, query):
    require(set(query) == {'schema_version', 'source', 'target'} and query['schema_version'] == 'dsv2.owns-query/v1-candidate', 'QUERY_SCHEMA')
    require(graph.get('schema_version') == 'domainspec.compiled-project-graph/v1' and graph.get('authority_effect') == 'none', 'GRAPH_SCHEMA')
    ids, selectors = {}, set()
    for n in graph['nodes']:
        pair = (n['feature_id'], n['node_id'])
        require(all(type(x) is str and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', x) for x in pair), 'NODE_ID')
        require(pair not in ids and n['selector'] not in selectors and n['selector'] == ':'.join(pair), 'AMBIGUOUS_SELECTOR')
        ids[pair] = n
        selectors.add(n['selector'])
    selected = sorted((t for t,n in ids.items() if n['kind'] == 'Entity'), key=lambda t: (t[0].encode(),t[1].encode()))
    require(1 <= len(selected) <= 64, 'UNSUPPORTED_BOUND')
    for k in ['source', 'target']:
        require(type(query[k]) is list and len(query[k]) == 2 and all(type(x) is str for x in query[k]) and tuple(query[k]) in selected, 'ENDPOINT_INVALID')
    numbered = {t: 'N'+str(i) for i,t in enumerate(selected)}
    edges, refs, seen = set(), [], set()
    for e in graph['relationships']:
        identity = (e['scope'], e['source']['feature_id'], e['edge_id'])
        require(identity not in seen, 'DUPLICATE_EDGE_ID')
        seen.add(identity)
        if e['relationship'] != 'owns': continue
        a = (e['source']['feature_id'], e['source']['node_id']); b = (e['target']['feature_id'], e['target']['node_id'])
        require(a in numbered and b in numbered and e['source']['kind'] == e['target']['kind'] == 'Entity', 'ENDPOINT_INVALID')
        pair = (numbered[a], numbered[b]); edges.add(pair)
        refs.append({'edge_id':e['edge_id'], 'scope':e['scope'], 'source':list(a), 'target':list(b), 'pair':list(pair)})
    pos = {'nodes':list(numbered.values()), 'edges':[list(x) for x in sorted(edges,key=lambda t:(int(t[0][1:]),int(t[1][1:])))],
           'required_sources':[numbered[tuple(query['source'])]], 'target':numbered[tuple(query['target'])]}
    neg = {**pos,'edges':[list(e) for e in pos['edges'] if e[1] != pos['target']]}
    mapping = {'nodes':[{'tuple':list(t),'provider_id':numbered[t], 'selector':ids[t]['selector'], 'kind':'Entity'} for t in selected],
               'edges':sorted(refs, key=lambda e:(e['scope'],e['source'],e['edge_id']))}
    return pos, neg, mapping

def prepare(graph_bytes, query_bytes, limits):
    pos, neg, mapping = project(decode(graph_bytes), decode(query_bytes))
    values = {'positive.json':pos,'negative.json':neg,'identity-map.json':mapping}
    for case in ('positive','negative'):
        values[case+'-request.json'] = {'schema_version':'evf.formal-request/v1','provider':'souffle','source':case+'.json','options':{}}
    values['audit.json'] = {'schema_version':'evf.formal-audit/v1','audit_id':'dsv2-owns-reachability','obligation':'obligation.md','claims':[
        {'id':'owns-reachability','description':'Selected source reaches selected target through explicit owns edges',
         'positive':'positive-request.json','negative':'negative-request.json',
         'assumptions':['Closed-world validated compiled graph','Trusted compiler and host','Positive-length paths'], 'limits':limits}]}
    files = {k:canonical(v) for k,v in values.items()}
    files['obligation.md'] = b'One selected owns reachability claim. No runtime, legal ownership or whole-system claim.\n'
    return files

def handle(expected, buffers, roles):
    require(1 <= len(buffers) <= 256 and sum(len(x) for x in buffers.values()) <= 64*1024*1024, 'COLLECTION_LIMIT')
    require(len(set(roles.values())) == len(roles), 'ROLE_ALIAS')
    body = {'schema_version':'dsv2.owns-evidence-handle/v1-candidate','epoch_sha256':sha(canonical(expected)),
            'provider':'souffle','consumer':'dsv2-owns-reachability-consumer-v1','claim_id':'owns-reachability',
            'files':[file_ref(k,buffers[k]) for k in sorted(buffers,key=lambda n:n.encode())], 'roles':roles}
    return {'body':body,'sha256':sha(canonical(body))}
