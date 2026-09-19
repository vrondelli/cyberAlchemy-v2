from pathlib import Path
import json, hashlib
ROOT = Path(__file__).resolve().parents[7]
HERE = Path(__file__).resolve().parent
def read(p): return json.loads(p.read_text())
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
sources = read(HERE / 'source-manifest.json')
for row in sources['files']:
    assert sha(ROOT / row['path']) == row['sha256'], row['path']
inv = read(HERE / 'INVENTORY.json')
arch = ROOT / 'projects/domainspec-v2/architecture/durable-recovery'
concepts = read(arch / 'concepts.json')['concepts']
assert {r['component_id'] for r in inv['components']} == {c['concept_id'] for c in concepts}
findings = {f['finding_id']: f for f in read(arch / 'findings.json')['findings']}
constraints = {c['constraint_id']: c for c in read(arch / 'constraints.json')['constraints']}
assert {r['finding_id'] for r in inv['invariants']} == set(findings)
for row in inv['components']:
    if row['disposition'] == 'designed-runtime-gap': assert row['finding_refs']
    for fid in row['finding_refs']: assert row['component_id'] in findings[fid]['subject_refs']
for row in inv['invariants']:
    f = findings[row['finding_id']]
    assert row['property_ref'] == f['property_ref'] == constraints[row['constraint_ref']]['property_ref']
assert inv['provider_selection'] is None and inv['runtime_language_selection'] is None
for row in read(HERE / 'output-manifest.json')['files']:
    assert sha(HERE / row['path']) == row['sha256'], row['path']
receipt = read(HERE / 'receipt.json')
assert receipt['source_manifest_sha256'] == sha(HERE / 'source-manifest.json')
assert receipt['output_manifest_sha256'] == sha(HERE / 'output-manifest.json')
progress = read(HERE / 'progress.json')
assert progress['current_attempt']['receipt']['sha256'] == sha(HERE / 'receipt.json')
assert progress['dependency_ready_product_nodes'] == ['R01', 'U00', 'L00']
assert receipt['result'] == 'PASS' and receipt['authority_effect'] == 'none'
print(json.dumps({'verification':'PASS','source_files':len(sources['files']),'components':len(inv['components']),'invariants':len(inv['invariants']),'historical_drift':len(inv['source_drift']),'claim':'R00 source baseline only'}))
