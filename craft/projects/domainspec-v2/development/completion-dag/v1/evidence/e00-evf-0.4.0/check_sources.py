"""Read-only E00 reconciliation; emits JSON to stdout and never executes providers."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[7]
P = Path('projects/domainspec-v2/development/evolvable-validation-framework')
V = P / 'evidence/production-stability/v3-candidate'
D = P / 'distribution/portable-audit-v4'
B = Path('projects/domainspec-v2/development/completion-dag/v1')
A = Path('projects/auth-foundation/development/auth-service-d65-r2-plan/evf-production-v2')
F = Path('projects/domainspec-v2/impl/architecture-conformance/factory')
rows = []

def observe(path, group, expected=None, size=None):
    path = Path(path)
    actual = path if path.is_absolute() else ROOT / path
    row = {'path': str(path), 'group': group}
    try:
        data = actual.read_bytes()
        row.update(sha256=hashlib.sha256(data).hexdigest(), size_bytes=len(data))
        row['result'] = 'PASS' if (expected is None or row['sha256'] == expected) and (size is None or size == len(data)) else 'FAIL'
    except OSError as error:
        row.update(result='not_evaluable', reason=str(error))
    if expected is not None:
        row['expected_sha256'] = expected
    rows.append(row)
    return actual

def read(path, group):
    return json.loads(observe(path, group).read_text())

def refs(value, group):
    if isinstance(value, dict):
        if isinstance(value.get('path'), str) and isinstance(value.get('sha256'), str):
            observe(value['path'], group, value['sha256'], value.get('size_bytes'))
        else:
            for child in value.values():
                refs(child, group)
    elif isinstance(value, list):
        for child in value:
            refs(child, group)

m = read(P / 'production/CANDIDATE-MANIFEST.v3-candidate.json', 'evf-manifest')
refs(m['artifact_groups'], 'evf-frozen-reference')
refs(m['runtime_refs'], 'evf-frozen-reference')
for name in ['PRODUCT-TEST-RECEIPT.json', 'PRODUCT-APPROVAL-DECISION.2026-09-03.json',
             'ADOPTION-ENFORCEMENT-DECISION.2026-09-03.json',
             'INDEPENDENT-PRODUCT-ASSESSMENT.2026-09-03.fresh-context.json',
             'reference-enforcement/sha256/db04078de50b06aa273ffc303e913fdd220baf4894caeb593b5eb68bf06e1589/REHEARSAL-RECEIPT.json']:
    record = read(V / name, 'evf-selected-record')
    refs(record, 'evf-selected-record-direct-reference')
read(V / 'IMPLEMENTATION-STATUS.json', 'evf-status-record')
auth0 = read(A / 'auth-evf-00/FREEZE-RECEIPT.json', 'auth-freeze-record')
refs(auth0, 'auth-freeze-direct-reference')
auth1 = read(A / 'auth-evf-01/ontology/receipts/sha256/56b09612e439a3ca423160f677b12dfcfb05664d8f0cb7675f40adbd36b5be19/VALIDATION-RECEIPT.json', 'auth-structure-record')
refs(auth1['material_files'], 'auth-selected-material-opaque-hash-only')
portable = read(D / 'VALIDATION.json', 'portable-validation-record')
c = portable['candidate']
observe(D / c['archive'], 'portable-archive', c['sha256'], c['size_bytes'])
for key in ['result', 'formal_claims']:
    observe(portable['evidence'][key + '_path'], 'portable-retained-evidence', portable['evidence'][key + '_sha256'])
for path in [P / 'README.md', D / 'README.md', D / 'template/README.md', D / 'template/CONTAINMENT.md',
             F / 'README.md', F / 'contracts/factory-node-provider-v1.ts',
             Path('projects/domainspec-v2/development/implementation-conformance/ARCHITECTURE.md'),
             Path('projects/domainspec-v2/development/evf-reference-consumer/README.md'),
             B / 'plan.json', B / 'sources.json', B / 'TASKS.md']:
    observe(path, 'research-source')
registry = observe(F / 'registry/factory-node-registry-v1.ts', 'factory-registry').read_text()
providers = re.search(r'const providers = Object.freeze\(\[(.*?)\] as const\)', registry, re.S).group(1)
providers = [value.strip() for value in providers.split(',') if value.strip()]
for imported in re.findall(r'from\s+"(\./providers/[^"]+)"', registry):
    observe(F / 'registry' / imported.replace('.js', '.ts'), 'factory-registered-provider-source')
prior = B / 'evidence/c05-cd1ec3272'
for name in ['decision.json', 'receipt.json', 'CHECKS.json', 'progress.json']:
    read(prior / name, 'compiler-approved-record')
sm = read(B / 'evidence/c04-f01-successor/source-manifest.json', 'compiler-source-manifest')
compiler_root = Path('/home/vrondelli/projects/domainspec-v2-c04-f01-successor')
for entry in sm['sources']:
    if entry['path'].startswith('projects/domainspec-v2/impl/cli/src/'):
        observe(compiler_root / entry['path'], 'approved-compiler-source', entry['sha256'])
summary = {}
for row in rows:
    counts = summary.setdefault(row['group'], {'PASS': 0, 'FAIL': 0, 'not_evaluable': 0})
    counts[row['result']] += 1
print(json.dumps({'schema_version': 'domainspec.e00-source-checks/v1-candidate',
                  'scope': 'Selected source and direct-reference hashes; no product test or ontology admission rerun',
                  'authority_effect': 'none', 'groups': summary, 'factory_provider_symbols': providers,
                  'sources': rows}, indent=2))
