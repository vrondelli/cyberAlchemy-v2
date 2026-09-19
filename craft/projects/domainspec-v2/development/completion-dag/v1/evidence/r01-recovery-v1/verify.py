"""Read-only R01 definition-packet checks; no runtime conformance evaluation."""
from pathlib import Path
import hashlib, json, sys
HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[7]
def read(path): return json.loads(path.read_text())
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def require(value, message):
    if not value: raise ValueError(message)
def core():
    source = read(HERE / 'source-manifest.json')
    for row in source['files']:
        require(sha(ROOT / row['path']) == row['sha256'], 'source drift: ' + row['path'])
    pack = read(HERE / 'definition-pack.json')
    product = read(HERE / 'product-profile.json')
    business = read(HERE / 'business-scaffold.json')
    matrix = read(HERE / 'failure-matrix.json')
    concepts = pack['concepts']
    ids = [x['concept_id'] for x in concepts]
    require(len(ids) == len(set(ids)) == 15, 'concept coverage')
    require({x['concept_id'] for x in concepts if x['disposition'] == 'reuse'} == {'domainspec-v2-D' + str(n) for n in range(36, 50)}, 'D36-D49 reuse')
    for c in concepts:
        require(c['owner_role'] and c['consumer'], 'concept owner/consumer')
        require(c['disposition'] in ['reuse', 'specialize', 'propose', 'open'], 'disposition')
        if c['disposition'] == 'reuse':
            s = c['source']; require(sha(ROOT / s['path']) == s['sha256'], 'definition source drift')
            text = (ROOT / s['path']).read_text()
            require(c['definition_text'] in text, 'definition content drift')
            require(text.splitlines()[s['start_line'] - 1].startswith('## ' + c['concept_id'] + '.'), 'definition selector drift')
        if c['disposition'] == 'propose':
            require(all(c[k] for k in ['normative', 'formal', 'plain_language', 'domain_context', 'boundaries']), 'proposed definition incomplete')
            require(c['authority_effect'] == 'none', 'proposal authority')
    for r in pack['relationships']:
        require(r['source'] in ids and r['target'] in ids, 'definition relationship closure')
    constraints = read(ROOT / 'projects/domainspec-v2/architecture/durable-recovery/constraints.json')['constraints']
    cs = {x['constraint_id']: x for x in constraints}
    scenarios = matrix['scenarios']
    require(len(scenarios) == len({s['scenario_id'] for s in scenarios}) == 30, 'finite scenario identity')
    require({s['constraint_ref'] for s in scenarios} == set(cs), 'invariant coverage')
    for s in scenarios:
        c = cs[s['constraint_ref']]
        require(s['property_ref'] == c['property_ref'] and s['owner_role'] == c['owner_route'], 'invariant ownership join')
        require(s['trigger'] and s['expected_observation'] and s['observe'], 'scenario oracle absent')
        require(s['runtime_result'] == 'not_evaluable' and s['repetitions'] == 2, 'unrun test inflation')
    require(product['language'] == 'python' and product['provider'] == 'sqlite', 'bounded technology selection')
    require(product['bounds']['competing_workers'] == 2 and product['bounds']['attempts_per_occurrence_max'] == 3, 'finite bounds')
    require(len({t['resource'] for t in product['transaction_boundaries']}) == 2, 'transaction separation')
    require(business['ownership'] == product['transaction_boundaries'], 'business ownership drift')
    require(product['claims']['runtime_guarantees_observed'] is False and product['claims']['product_approved'] is False and product['claims']['universal_exactly_once'] is False, 'claim ceiling')
    return {'result':'PASS', 'scope':'R01 definition structure and source currency only', 'source_files':len(source['files']), 'concepts':15, 'scenarios':30, 'runtime_result':'not_evaluable'}
result = core()
if '--core' not in sys.argv:
    outputs = read(HERE / 'output-manifest.json')
    for r in outputs['files']:
        require(sha(HERE / r['path']) == r['sha256'], 'output drift: ' + r['path'])
    receipt = read(HERE / 'receipt.json')
    require(receipt['source_manifest_sha256'] == sha(HERE / 'source-manifest.json'), 'source receipt binding')
    require(receipt['output_manifest_sha256'] == sha(HERE / 'output-manifest.json'), 'output receipt binding')
    for r in receipt['input_receipt_refs']:
        require(sha(ROOT / r['path']) == r['sha256'], 'input receipt drift')
    require(receipt['result'] == 'PASS' and receipt['authority_effect'] == 'none', 'receipt ceiling')
    progress = read(HERE / 'progress.json')
    require(progress['current_attempt']['receipt']['sha256'] == sha(HERE / 'receipt.json'), 'progress binding')
    require(progress['dependency_ready_product_nodes'] == ['R02', 'U00', 'L00'], 'frontier')
    require(progress['program_complete'] is False, 'program overclaim')
    require({p.name for p in HERE.iterdir()} == {r['path'] for r in outputs['files']} | {'output-manifest.json','receipt.json','progress.json'}, 'packet file allowlist')
print(json.dumps(result))
