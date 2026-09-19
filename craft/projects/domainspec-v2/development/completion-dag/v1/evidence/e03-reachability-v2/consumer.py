"""Independent, pure bytes-in consumer. No producer, EVF, filesystem or process imports."""
import base64
import hashlib
import json
import re

CONDITIONS = ('input-identity','graph-correspondence','positive-evidence','negative-control','evidence-integrity','consumer-independence')
INPUTS = ('source_manifest','compiled_graph','compiler_certificate','query','definition','profile','dependency_lock','consumer_source_manifest')
ROLES = INPUTS + ('identity_map','positive_graph','negative_graph','audit_spec','positive_request','negative_request','obligation_text','formal_bundle','formal_tools','evf_profile','evf_evidence','positive_raw_1','positive_raw_2','negative_raw_1','negative_raw_2','consumer_independence_review','containment_context')
QUERY = '.decl SelectedEdge(x:symbol, y:symbol)\n.input SelectedEdge\n.decl RequiredSource(x:symbol)\n.input RequiredSource\n.decl Target(x:symbol)\n.input Target\n.decl Reach(x:symbol, y:symbol)\nReach(x,y) :- SelectedEdge(x,y).\nReach(x,z) :- SelectedEdge(x,y), Reach(y,z).\n.decl Violation(x:symbol)\nViolation(x) :- RequiredSource(x), Target(y), !Reach(x,y).\n.output Violation\n'

class Rejected(ValueError):
    pass
class Absent(ValueError):
    pass

def check(condition, reason='INVALID_SCHEMA'):
    if not condition: raise Rejected(reason)

def keys(value, required):
    check(type(value) is dict and set(value) == set(required))

def encode(value):
    """Integration canonical encoding, independently implemented."""
    if isinstance(value, str):
        value.encode('utf-8')
        escaped = []
        for ch in value:
            code = ord(ch)
            escaped.append(('\\u%04x' % code) if code < 32 else ('\\'+ch) if ch in ['\\','"'] else ch)
        return ('"'+''.join(escaped)+'"').encode('utf-8')
    if value is None: return b'null'
    if isinstance(value, bool): return str(value).lower().encode()
    if type(value) is int:
        check(-(2**53-1) <= value <= 2**53-1)
        return str(value).encode()
    if type(value) is list: return b'['+b','.join(map(encode,value))+b']'
    check(type(value) is dict and all(type(k) is str for k in value))
    parts = [encode(k)+b':'+encode(value[k]) for k in sorted(value.keys())]
    return b'{'+b','.join(parts)+b'}'

def hash_bytes(value): return hashlib.sha256(value).hexdigest()
def parse(value):
    check(type(value) is bytes and len(value) <= 16*1024*1024, 'BUFFER_LIMIT')
    def pairs(items):
        out = {}
        for k,v in items:
            check(k not in out, 'DUPLICATE_KEY'); out[k] = v
        return out
    doc = json.loads(value.decode('utf-8'), object_pairs_hook=pairs,
                     parse_constant=lambda _: (_ for _ in ()).throw(Rejected('NONFINITE')))
    def strings(x):
        if isinstance(x,str): x.encode('utf-8')
        elif isinstance(x,list):
            for y in x: strings(y)
        elif isinstance(x,dict):
            for k,v in x.items(): strings(k); strings(v)
    strings(doc)
    return doc

def safe_name(s):
    check(type(s) is str and bool(s) and not s.startswith('/') and '\\' not in s and '\x00' not in s
          and all(x not in ('','.','..') for x in s.split('/')), 'UNSAFE_NAME')
    return s

def native_hash(value, pretty=False):
    text = json.dumps(value, sort_keys=True, indent=2, allow_nan=False)+'\n' if pretty else json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False)
    return hash_bytes(text.encode())

def signed_fields(doc, field, pretty=False):
    check(type(doc) is dict and field in doc, 'EVIDENCE_CORRUPT')
    check(doc[field] == native_hash({k:v for k,v in doc.items() if k != field},pretty), 'EVIDENCE_CORRUPT')

def reconstruct(graph, query):
    """Consumer reconstruction uses independent tuple tables and transitive closure."""
    keys(query, ['schema_version','source','target'])
    check(query['schema_version']=='dsv2.owns-query/v1-candidate')
    check(graph['schema_version']=='domainspec.compiled-project-graph/v1' and graph['authority_effect']=='none')
    table, names = {}, set()
    for node in graph['nodes']:
        key = (node['feature_id'],node['node_id'])
        check(all(type(x) is str and re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*',x) for x in key), 'ENDPOINT_INVALID')
        check(key not in table and node['selector'] not in names and node['selector']==key[0]+':'+key[1], 'MAPPING_MISMATCH')
        table[key] = node; names.add(node['selector'])
    vertices = [k for k,v in table.items() if v['kind']=='Entity']
    vertices.sort(key=lambda k:(bytes(k[0],'utf-8'),bytes(k[1],'utf-8')))
    check(0 < len(vertices) < 65, 'UNSUPPORTED_BOUND')
    for endpoint in [query['source'],query['target']]:
        check(type(endpoint) is list and len(endpoint)==2 and all(type(x) is str for x in endpoint) and tuple(endpoint) in vertices, 'ENDPOINT_INVALID')
    labels = ['N%d'%i for i in range(len(vertices))]
    pairs, provenance, edge_ids = set(), [], set()
    for edge in graph['relationships']:
        eid = (edge['scope'],edge['source']['feature_id'],edge['edge_id'])
        check(eid not in edge_ids,'MAPPING_MISMATCH'); edge_ids.add(eid)
        if edge['relationship']!='owns': continue
        a=(edge['source']['feature_id'],edge['source']['node_id']);b=(edge['target']['feature_id'],edge['target']['node_id'])
        check(a in vertices and b in vertices and edge['source']['kind']==edge['target']['kind']=='Entity','ENDPOINT_INVALID')
        pair=(vertices.index(a),vertices.index(b));pairs.add(pair)
        provenance.append({'edge_id':edge['edge_id'],'scope':edge['scope'],'source':list(a),'target':list(b),'pair':[labels[pair[0]],labels[pair[1]]]})
    s=vertices.index(tuple(query['source']));t=vertices.index(tuple(query['target']))
    positive={'nodes':labels,'edges':[[labels[a],labels[b]] for a,b in sorted(pairs)],'required_sources':[labels[s]],'target':labels[t]}
    negative={**positive,'edges':[[labels[a],labels[b]] for a,b in sorted(pairs) if b!=t]}
    closure=set(pairs)
    for pivot in range(len(vertices)):
        closure |= {(a,b) for a in range(len(vertices)) for b in range(len(vertices)) if (a,pivot) in closure and (pivot,b) in closure}
    mapping={'nodes':[{'tuple':list(k),'provider_id':labels[i],'selector':table[k]['selector'],'kind':'Entity'} for i,k in enumerate(vertices)],
             'edges':sorted(provenance,key=lambda e:(e['scope'],e['source'],e['edge_id']))}
    return positive,negative,mapping,(s,t) in closure

def evaluate(expected, handle, buffers, review_digest=None):
    """Expected identities and optional review digest MUST come from the caller."""
    observations={k:{'id':k,'result':'not_evaluable','reason_code':'DEPENDENCY_UNEVALUABLE','evidence_names':[],'causal_conditions':['input-identity']} for k in CONDITIONS}
    context={}; touched=set()
    def perform(key, action):
        try:
            action(); observations[key].update(result='PASS',reason_code='SATISFIED',causal_conditions=[])
        except Absent as e:
            observations[key].update(result='not_evaluable',reason_code=str(e),causal_conditions=[])
        except (Rejected,ValueError,TypeError,KeyError,IndexError,UnicodeError,RecursionError,OverflowError,AttributeError,StopIteration) as e:
            reason=str(e) if isinstance(e,Rejected) else 'INVALID_SCHEMA'
            observations[key].update(result='BLOCK',reason_code=reason,causal_conditions=[])
    def blob(n):
        safe_name(n)
        if n not in buffers: raise Absent('EVIDENCE_MISSING')
        touched.add(n);return buffers[n]
    def doc(role):
        return parse(blob(context['roles'][role]))
    def identity():
        keys(expected, ['schema_version',*INPUTS]);check(expected['schema_version']=='dsv2.owns-expected/v1-candidate')
        if handle is None: raise Absent('EVIDENCE_MISSING')
        keys(handle,['body','sha256']);body=handle['body']
        keys(body,['schema_version','epoch_sha256','provider','consumer','claim_id','files','roles'])
        check(body['schema_version']=='dsv2.owns-evidence-handle/v1-candidate' and body['provider']=='souffle' and body['consumer']=='dsv2-owns-reachability-consumer-v1' and body['claim_id']=='owns-reachability','CLAIM_OUT_OF_SCOPE')
        check(handle['sha256']==hash_bytes(encode(body)),'EVIDENCE_CORRUPT')
        check(body['epoch_sha256']==hash_bytes(encode(expected)),'INPUT_STALE')
        keys(body['roles'],ROLES);roles=body['roles'];check(len(set(roles.values()))==len(roles),'DENOMINATOR_MISMATCH')
        context['roles']=roles
        check(type(buffers) is dict and len(buffers)<=256 and all(type(x) is bytes for x in buffers.values()) and sum(map(len,buffers.values()))<=64*1024*1024,'BUFFER_LIMIT')
        check(type(body['files']) is list and 1<=len(body['files'])<=256,'DENOMINATOR_MISMATCH')
        refs={}
        for r in body['files']:
            keys(r,['logical_name','sha256','size_bytes']);n=safe_name(r['logical_name']);check(n not in refs,'DENOMINATOR_MISMATCH')
            check(type(r['size_bytes']) is int and 0<=r['size_bytes']<=16*1024*1024 and type(r['sha256']) is str and re.fullmatch('[0-9a-f]{64}',r['sha256']),'INVALID_SCHEMA');refs[n]=r
            if n in buffers: check(len(buffers[n])==r['size_bytes'] and hash_bytes(buffers[n])==r['sha256'],'EVIDENCE_CORRUPT')
        check(list(refs)==sorted(refs,key=lambda n:n.encode()) and set(buffers)<=set(refs),'DENOMINATOR_MISMATCH')
        check(all(safe_name(n) in refs for n in roles.values()),'DENOMINATOR_MISMATCH');context['refs']=refs
        for k in INPUTS:
            check(expected[k]==refs[roles[k]],'INPUT_STALE');blob(roles[k])
        graph=doc('compiled_graph');cert=doc('compiler_certificate');manifest=doc('source_manifest')
        check(graph['source_manifest']==manifest and cert['source_manifest_sha256']==manifest['manifest_sha256'],'INPUT_STALE')
        check(cert['schema_version']=='domainspec.compiled-project-certificate/v1' and cert['compiler']['version']=='1.0.0' and cert['authority_effect']=='none','INPUT_STALE')
        # Graph/certificate bytes are selected by the trusted compiler collector.
        # Native certificate semantic digest is validated there using the compiler.
        check(cert['node_count']==len(graph['nodes']) and cert['edge_count']==len(graph['relationships']),'INPUT_STALE')
        for f in manifest['sources']:
            n='source/'+safe_name(f['relative_path']);data=blob(n);check(hash_bytes(data)==f['sha256'] and len(data)==f['size_bytes'],'INPUT_STALE')
        context.update(graph=graph,query=doc('query'),lock=doc('dependency_lock'))
        profile=doc('profile');definition=doc('definition')
        check(profile['id']=='dsv2.owns-reachability.v1-candidate' and profile['provider']=='souffle' and profile['obligation_count']==1 and profile['max_nodes']==64,'CLAIM_OUT_OF_SCOPE')
        check(context['lock']['e02_dependency_sha256']==profile['dependency_lock_sha256'],'INPUT_STALE')
        check(profile['definition_sha256']==expected['definition']['sha256'] and definition['profile']['id']==profile['id'],'INPUT_STALE')
        context['ready']=True
        observations['input-identity']['evidence_names']=[roles[k] for k in INPUTS]
    perform('input-identity',identity)
    def correspondence():
        pos,neg,mapping,reachable=reconstruct(context['graph'],context['query'])
        check(doc('positive_graph')==pos and doc('negative_graph')==neg and doc('identity_map')==mapping,'MAPPING_MISMATCH')
        context.update(positive=pos,negative=neg,reachable=reachable)
        for case in ['positive','negative']:
            request=doc(case+'_request');keys(request,['schema_version','provider','source','options'])
            check(request=={'schema_version':'evf.formal-request/v1','provider':'souffle','source':context['roles'][case+'_graph'],'options':{}},'MAPPING_MISMATCH')
        audit=doc('audit_spec');keys(audit,['schema_version','audit_id','obligation','claims']);check(audit['schema_version']=='evf.formal-audit/v1' and len(audit['claims'])==1,'CLAIM_OUT_OF_SCOPE')
        claim=audit['claims'][0];keys(claim,['id','description','positive','negative','assumptions','limits']);check(claim['id']=='owns-reachability' and claim['positive']==context['roles']['positive_request'] and claim['negative']==context['roles']['negative_request'] and audit['obligation']==context['roles']['obligation_text'],'CLAIM_OUT_OF_SCOPE')
        check(claim['limits']==doc('definition')['excluded_claims'],'CLAIM_OUT_OF_SCOPE');blob(audit['obligation']);context['audit']=audit
        observations['graph-correspondence']['evidence_names']=[context['roles'][k] for k in ['positive_graph','negative_graph','identity_map']]
    if context.get('ready'):perform('graph-correspondence',correspondence)
    def native_ref(r):
        check(type(r) is dict and {'path','sha256','size_bytes','location','current'}<=set(r) and r['current'] is True,'EVIDENCE_CORRUPT')
        if r['location']=='host':
            matches=[x for x in context['lock']['host_refs'] if x['path']==r['path']]
            check(len(matches)==1 and all(matches[0][k]==r[k] for k in ['sha256','size_bytes']),'TOOL_MISMATCH');return None
        check(r['location']=='repository','EVIDENCE_CORRUPT');data=blob(r['path']);check(hash_bytes(data)==r['sha256'] and len(data)==r['size_bytes'],'EVIDENCE_CORRUPT');return parse(data) if r['path'].endswith('.json') else None
    def all_refs(value):
        if type(value) is dict:
            if {'path','sha256','size_bytes','location'}<=set(value): native_ref(value)
            else:
                for v in value.values():all_refs(v)
        elif type(value) is list:
            for v in value:all_refs(v)
    def raw_case(case):
        if observations['graph-correspondence']['result']!='PASS':raise Absent('DEPENDENCY_UNEVALUABLE')
        if case=='positive' and not context['reachable']:raise Rejected('COUNTEREXAMPLE')
        profile=doc('evf_profile');check(len(profile['checks'])==1 and len(profile['mutations'])==1 and profile['repetitions']==2,'DENOMINATOR_MISMATCH')
        runtime=profile['checks'][0]['runtime'];record_dir=runtime['argv'][7]
        names=[context['roles'][case+'_raw_'+str(i)] for i in [1,2]]
        for n in names:
            check(n.rsplit('/',1)[0]==record_dir,'MIXED_RUN');record=parse(blob(n));signed_fields(record,'receipt_digest',True)
            keys(record,['schema_version','provider','request_ref','source_ref','tools_ref','dependency_refs','native_evidence','normalized_outcome','details','summary','receipt_digest'])
            check(record['schema_version']=='evf.formal-provider-evidence/v1' and record['provider']=='souffle' and record['dependency_refs']==[],'EVIDENCE_CORRUPT')
            check(record['request_ref']['path']==context['roles'][case+'_request'] and record['source_ref']['path']==context['roles'][case+'_graph'] and record['tools_ref']['path']==context['roles']['formal_tools'],'MIXED_RUN');all_refs(record)
            evidence=record['native_evidence'];keys(evidence,['artifacts','processes','translation']);check(evidence['translation']==QUERY and len(evidence['processes'])==1,'EVIDENCE_CORRUPT');proc=evidence['processes'][0]
            keys(proc,['argv','exit_code','failure','stderr','stdout'])
            if proc['failure'] is not None:raise Absent('EXECUTION_UNAVAILABLE')
            check(type(proc['exit_code']) is int and proc['exit_code']==0,'EVIDENCE_CORRUPT')
            argv=proc['argv'];check(type(argv) is list and len(argv)==7,'TOOL_MISMATCH');base=argv[-1].rsplit('/',1)[0]
            souffle=next(x for x in context['lock']['host_refs'] if x.get('id')=='souffle')
            check(argv==[souffle['path'],'--no-preprocessor','-F',base+'/facts','-D',base+'/output',base+'/model.dl'],'TOOL_MISMATCH')
            keys(evidence['artifacts'],['Violation.csv'])
            rows=base64.b64decode(evidence['artifacts']['Violation.csv'],validate=True).decode('utf-8').splitlines()
            expected_rows=[] if case=='positive' else context['positive']['required_sources']
            check(rows==expected_rows,'COUNTEREXAMPLE' if case=='positive' else 'NEGATIVE_SURVIVED')
            for stream in ['stdout','stderr']:base64.b64decode(proc[stream],validate=True)
            outcome='supported' if case=='positive' else 'counterexample'
            summary={'evidence_kind':'closed-world-datalog','provider':'souffle','outcome':'pass' if case=='positive' else 'fail','reason_code':'PROPERTY_SUPPORTED' if case=='positive' else 'COUNTEREXAMPLE'}
            check(record['normalized_outcome']==outcome and record['details']=={'violations':expected_rows} and record['summary']==summary,'EVIDENCE_CORRUPT')
        observations['positive-evidence' if case=='positive' else 'negative-control']['evidence_names']=names
    if context.get('ready'):
        perform('positive-evidence',lambda:raw_case('positive'))
        perform('negative-control',lambda:raw_case('negative'))
    def integrity():
        if observations['graph-correspondence']['result']!='PASS':raise Absent('DEPENDENCY_UNEVALUABLE')
        bundle=doc('formal_bundle');keys(bundle,['schema_version','status','spec_ref','tools_ref','jobs','claims','authority_effect','bundle_digest']);signed_fields(bundle,'bundle_digest',True)
        check(bundle['schema_version']=='evf.formal-audit-bundle/v1' and bundle['authority_effect']=='none','CLAIM_OUT_OF_SCOPE')
        if bundle['status']!='passed':raise Absent('EXECUTION_UNAVAILABLE')
        check(len(bundle['jobs'])==len(bundle['claims'])==1,'DENOMINATOR_MISMATCH');job=bundle['jobs'][0];claim=bundle['claims'][0]
        keys(claim,['schema_version','status','claim_id','provider','whole_system_claim','authority_effect',
                    'machine_property','limits','evf_evidence_ref','raw_evidence_refs','assumptions',
                    'author_description','dependency_refs','evidence_kind','observed_details','source_ref'])
        check(job['id']==claim['claim_id']=='owns-reachability' and job['status']=='passed','CLAIM_OUT_OF_SCOPE')
        check(claim['schema_version']=='evf.portable-formal-claim/v1-candidate' and claim['status']=='supported-for-declared-scope' and claim['provider']=='souffle' and claim['whole_system_claim'] is False and claim['authority_effect']=='none' and claim['machine_property']==context['positive'] and claim['limits']==context['audit']['claims'][0]['limits'],'CLAIM_OUT_OF_SCOPE')
        check(bundle['spec_ref']['path']==context['roles']['audit_spec'] and bundle['tools_ref']['path']==context['roles']['formal_tools'],'MIXED_RUN')
        check(job['profile_ref']['path']==context['roles']['evf_profile'] and job['evidence_ref']['path']==context['roles']['evf_evidence'] and claim['evf_evidence_ref']==job['evidence_ref'],'MIXED_RUN')
        raws=[context['roles'][k] for k in ['positive_raw_1','positive_raw_2','negative_raw_1','negative_raw_2']]
        check(len(job['records'])==4 and set(r['path'] for r in job['records'])==set(raws) and claim['raw_evidence_refs']==job['records'],'MIXED_RUN')
        profile=doc('evf_profile');evidence=doc('evf_evidence');signed_fields(evidence,'evidence_payload_digest')
        check(profile['schema_version']=='evf.enforcement-profile/v1' and profile['profile_id']==context['audit']['audit_id']+'.owns-reachability' and profile['route']=='executable' and profile['obligation_denominator']==1 and profile['obligation_ids']==['owns-reachability'] and profile['authority_effect']=='none','DENOMINATOR_MISMATCH')
        check([stage['stage_id'] for stage in profile['stages']]==['S'+str(i) for i in range(13)],'DENOMINATOR_MISMATCH')
        positive_check=profile['checks'][0];negative_check=profile['mutations'][0]
        check(positive_check['check_id']=='owns-reachability' and positive_check['provider_id']=='souffle' and positive_check['input_ref']['path']==context['roles']['positive_request'],'MIXED_RUN')
        check(negative_check['check_id']=='owns-reachability' and negative_check['input_ref']['path']==context['roles']['negative_request'] and negative_check['expected_rejection_code']=='COUNTEREXAMPLE','MIXED_RUN')
        for item,outcome,reason in [(positive_check,'pass','PROPERTY_SUPPORTED'),(negative_check,'fail','COUNTEREXAMPLE')]:
            check(item['expected_output']=={'provider':'souffle','evidence_kind':'closed-world-datalog','outcome':outcome,'reason_code':reason},'EVIDENCE_CORRUPT')
        rt=positive_check['runtime']
        check(rt['network']=='forbidden' and rt['working_directory']=='.' and rt['environment']=={'LANG':'C','LC_ALL':'C'} and rt['max_output_bytes']==4096 and rt['timeout_ms']==180000,'TOOL_MISMATCH')
        check(rt['isolation']['mechanism']=='linux-user-and-network-namespace','TOOL_MISMATCH')
        argv=rt['argv'];check(len(argv)==8 and argv[0]=='-B' and argv[1].endswith('/adapters/driver.py') and argv[2:7]==['--input','{input}','--tools',context['roles']['formal_tools'],'--records'],'TOOL_MISMATCH')
        tools=doc('formal_tools');check(tools['schema_version']=='evf.formal-tools/v1' and set(tools['tools'])=={'python','souffle'},'TOOL_MISMATCH')
        positive_name=context['roles']['positive_graph'];positive_ref=context['refs'][positive_name]
        check(claim['source_ref']=={'path':positive_name,'sha256':positive_ref['sha256'],
              'size_bytes':positive_ref['size_bytes'],'location':'repository','current':True},'MIXED_RUN')
        check(claim['observed_details']=={'violations':[]} and claim['dependency_refs']==[]
              and claim['evidence_kind']=='closed-world-datalog','EVIDENCE_CORRUPT')
        authored=context['audit']['claims'][0]
        check(claim['author_description']==authored['description']
              and claim['assumptions']==authored['assumptions']+tools['trust_assumptions'],'CLAIM_OUT_OF_SCOPE')
        check(rt['executable_ref']==tools['tools']['python']['file'],'TOOL_MISMATCH')
        native_ref(rt['executable_ref']);native_ref(rt['isolation']['unshare_ref'])
        check(any(x['path']==argv[1] for x in rt['tool_refs']),'TOOL_MISMATCH')
        check(evidence['schema_version']=='evf.evolvable-validation-receipt/v1','EVIDENCE_CORRUPT')
        check(evidence['profile_ref']==job['profile_ref'] and evidence['profile_id']==profile['profile_id'] and evidence['route']=='executable' and evidence['denominator']=={'stages':13,'checks':1,'mutations':1},'MIXED_RUN')
        check(evidence['authority_effect']=='none' and evidence['release_admission']=='not-granted','CLAIM_OUT_OF_SCOPE')
        check(evidence['all_required_stages_present'] is True and evidence['aggregate_state']=='passed','EVIDENCE_CORRUPT')
        # Validate stage contents against the checked profile and raw-outcome
        # protocol. A recomputed hash chain does not establish semantic agreement.
        def observation(summary):
            return {'check_id':'owns-reachability','provider_id':'souffle','error_code':None,
                    'exit_code':0,'timed_out':False,'matched_expected':True,'output':summary,
                    'stdout_sha256':native_hash(summary,True),'stderr_sha256':hash_bytes(b'')}
        positive_observations=[observation(positive_check['expected_output']) for _ in range(2)]
        negative_observations=[observation(negative_check['expected_output']) for _ in range(2)]
        check(negative_check['mutant_id']=='owns-reachability.negative','DENOMINATOR_MISMATCH')
        check(profile['composition']['mode']=='single' and profile['composition']['provider_ids']==['souffle']
              and profile['composition']['compare_fields']==[],'DENOMINATOR_MISMATCH')
        detail_contracts=[
            {'semantic_ref_count':len(profile['semantic_refs'])},
            {'selected_route':'executable'},
            {'obligation_denominator':1,'obligation_ids':['owns-reachability']},
            {'binding_ref_count':len(profile['binding_refs'])},
            {'check_ids':['owns-reachability']},
            {'isolation':'linux-user-and-network-namespace','network':'forbidden','provider_count':1},
            {'observations':{'owns-reachability':positive_observations},'replay_equal':True},
            {'mutation_denominator':1,'mutations':[{'check_id':'owns-reachability',
              'expected_rejection_code':'COUNTEREXAMPLE','killed_for_declared_cause':True,
              'mutant_id':'owns-reachability.negative','observations':negative_observations}],'replay_equal':True},
            {'normalized_outcome':'PASS_BOUNDED'},
            {'mode':'single','provider_ids':['souffle'],'compare_fields':[]},
            {'constructed_stage_receipts':10},
            {'verified_stage_ids':['S'+str(i) for i in range(11)]},
            {'all_refs_current':True,'replay_equal':True}]
        check(len(evidence['stage_receipts'])==13,'DENOMINATOR_MISMATCH');previous={}
        for i,stage in enumerate(evidence['stage_receipts']):
            keys(stage,['schema_version','stage_id','profile_id','route','state','input_stage_receipt_digests',
                        'evidence_refs','reason_codes','residue','details','claim_ceiling','authority_effect','receipt_payload_digest'])
            signed_fields(stage,'receipt_payload_digest')
            check(stage['schema_version']=='evf.stage-receipt/v1' and stage['stage_id']=='S'+str(i) and stage['profile_id']==profile['profile_id'] and stage['route']=='executable','MIXED_RUN')
            check(stage['state']=='passed' and stage['input_stage_receipt_digests']==previous and stage['authority_effect']=='none','EVIDENCE_CORRUPT');previous={stage['stage_id']:stage['receipt_payload_digest']}
            check(stage['details']==detail_contracts[i] and stage['reason_codes']==[] and stage['residue']==[]
                  and stage['claim_ceiling']==profile['claim_ceiling'],'EVIDENCE_CORRUPT')
            if i in (6,7):
                check(stage['evidence_refs']==[(positive_check if i==6 else negative_check)['input_ref']],'MIXED_RUN')
        signed_fields(evidence['verification_receipt'],'receipt_payload_digest')
        check(evidence['verification_receipt']['schema_version']=='evf.verification-receipt/v1' and evidence['verification_receipt']['verdict']=='passed' and evidence['verification_receipt']['verified_stage_ids']==['S'+str(i) for i in range(11)] and evidence['verification_receipt']['recomputed_aggregate_state']=='passed' and evidence['verification_receipt']['all_refs_current'] is True and evidence['verification_receipt']['replay_equal'] is True,'EVIDENCE_CORRUPT')
        # Traverse every native repository/host reference, including transitive JSON refs.
        all_refs(bundle);all_refs(profile);all_refs(evidence);all_refs(doc('formal_tools'))
        pending=list(touched);visited=set()
        while pending:
            n=pending.pop()
            if n in visited:continue
            visited.add(n)
            if n.endswith('.json'):all_refs(parse(blob(n)))
            pending.extend(touched-visited)
        ctx=doc('containment_context');check(ctx['authority_effect']=='none' and ctx['network']=='isolated' and ctx['persistent_writes']=='selected-audit-workspace-only','CONTAINMENT_UNAVAILABLE')
        check(context['lock']['runtime_closure_status']=='frozen','TOOL_MISMATCH')
        check(set(context['refs'])-touched <= {context['roles']['consumer_independence_review']},'UNUSED_EVIDENCE')
        observations['evidence-integrity']['evidence_names']=[context['roles']['formal_bundle'],context['roles']['evf_evidence']]
    if context.get('ready'):perform('evidence-integrity',integrity)
    def independence():
        if review_digest is None:raise Absent('INDEPENDENCE_UNREVIEWED')
        name=context['roles']['consumer_independence_review'];data=blob(name);check(hash_bytes(data)==review_digest,'INPUT_STALE');review=parse(data)
        keys(review,['schema_version','consumer_source_sha256','dependency_lock_sha256','reviewer','result','authority_effect'])
        check(review['schema_version']=='dsv2.consumer-source-review/v1-candidate' and review['consumer_source_sha256']==expected['consumer_source_manifest']['sha256'] and review['dependency_lock_sha256']==expected['dependency_lock']['sha256'] and type(review['reviewer']) is str and bool(review['reviewer']) and review['result']=='PASS' and review['authority_effect']=='none','INDEPENDENCE_UNREVIEWED')
        observations['consumer-independence']['evidence_names']=[name]
    if context.get('ready'):perform('consumer-independence',independence)
    states=[v['result'] for v in observations.values()]
    aggregate='BLOCK' if 'BLOCK' in states else 'not_evaluable' if 'not_evaluable' in states else 'PASS'
    return {'schema_version':'dsv2.owns-consumer-receipt/v1-candidate','expected_epoch_sha256':epoch_or_none(expected),
            'observed_handle_sha256':handle.get('sha256') if type(handle) is dict else None,
            'consumer_source_sha256':expected.get('consumer_source_manifest',{}).get('sha256') if type(expected) is dict and type(expected.get('consumer_source_manifest',{})) is dict else None,
            'conditions':list(observations.values()),'aggregate':aggregate,'claim_id':'owns-reachability','authority_effect':'none'}


def epoch_or_none(expected):
    try: return hash_bytes(encode(expected))
    except (ValueError,TypeError,UnicodeError,RecursionError): return None


def diagnose_unavailable(graph_bytes, query_bytes, graph_sha256, query_sha256, reason):
    """Partial evidence diagnostic. It cannot produce PASS or certify native execution."""
    try:
        check(hash_bytes(graph_bytes)==graph_sha256 and hash_bytes(query_bytes)==query_sha256,'INPUT_STALE')
        _,_,_,reachable=reconstruct(parse(graph_bytes),parse(query_bytes))
        result='not_evaluable' if reachable else 'BLOCK'
        code=reason if reachable else 'COUNTEREXAMPLE'
    except (ValueError,KeyError,TypeError,UnicodeError,IndexError,RecursionError):
        result,code='BLOCK','INVALID_OR_STALE_INPUT'
    return {'schema_version':'dsv2.owns-partial-diagnostic/v1-candidate','aggregate':result,'reason_code':code,
            'native_execution':'not_evaluable','claim_ceiling':'Caller-pinned graph diagnostic only; incomplete evidence never PASS',
            'authority_effect':'none'}
