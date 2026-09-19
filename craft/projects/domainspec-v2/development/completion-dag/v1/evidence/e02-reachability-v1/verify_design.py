"""Read-only E02 design verification. Does not execute EVF or write artifacts."""
import ast
import copy
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
def read(name):
    return json.loads((ROOT / name).read_text())
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

for entry in read('sources.json')['files']:
    assert digest(Path(entry['path'])) == entry['sha256'], entry['path']
lock = read('dependency-lock.json')
for item in [lock['compiler_package'], lock['portable_archive'], *lock['tools']]:
    assert digest(Path(item['path'])) == item['sha256'], item['path']
profile = read('profile.json')
assert profile['contracts_sha256'] == digest(ROOT / 'contracts.json')
assert profile['dependency_lock_sha256'] == digest(ROOT / 'dependency-lock.json')
contracts = read('contracts.json')
assert contracts['dependency_lock_ref']['sha256'] == digest(ROOT / 'dependency-lock.json')
assert len(contracts['required_roles']) == len(set(contracts['required_roles'])) == 25
assert contracts['protocol_denominator'] == dict(claims=1, semantic_obligations=1,
                                               cases=2, repetitions_per_case=2,
                                               native_records=4, conditions=6)
trace = read('trace.json')
assert digest(ROOT / 'compiled/system-model/graph.json') == trace['compiled_graph']['sha256']
selectors = {n['selector'] for n in read('compiled/system-model/graph.json')['nodes']}
assert all(s in selectors for group in trace['business_concept_to_system_selectors'].values() for s in group)

spec = importlib.util.spec_from_file_location('prototype', ROOT / 'verdict_prototype.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
for states in itertools.product(['PASS', 'BLOCK', 'not_evaluable'], repeat=6):
    observations = dict(zip(module.CONDITIONS, states))
    original = copy.deepcopy(observations)
    expected = 'BLOCK' if 'BLOCK' in states else 'not_evaluable' if 'not_evaluable' in states else 'PASS'
    result = module.aggregate(observations)
    assert result['result'] == expected and result['conditions'] == original and observations == original
assert module.aggregate({})['result'] == 'BLOCK'
assert module.aggregate(dict.fromkeys(module.CONDITIONS, 'skipped'))['result'] == 'BLOCK'
tree = ast.parse((ROOT / 'verdict_prototype.py').read_text())
assert not any(isinstance(n, (ast.Import, ast.ImportFrom, ast.Global, ast.Nonlocal)) for n in ast.walk(tree))

node = next(t['path'] for t in lock['tools'] if t['id'] == 'node')
compiler = '/home/vrondelli/projects/domainspec-v2-c04-f01-successor/projects/domainspec-v2/impl/cli'
code = '''
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const [compiler, root] = process.argv.slice(1);
const api = await import(pathToFileURL(compiler + '/dist/index.js'));
for (const name of ['system-model', 'example-project']) {
  const result = api.compileProject(root + '/' + name);
  api.validateCompiledProjectCertificate(result.graph, result.certificate);
  for (const key of ['graph', 'certificate']) {
    const retained = JSON.parse(fs.readFileSync(root + '/compiled/' + name + '/' + key + '.json'));
    if (JSON.stringify(retained) !== JSON.stringify(result[key])) throw Error(name + ' drift');
  }
}
'''
subprocess.run([node, '--input-type=module', '-e', code, compiler, str(ROOT)], check=True)
print(json.dumps({'result': 'PASS', 'compiled_models_rechecked': 2,
                  'aggregate_combinations': 729, 'malformed_rejections': 2,
                  'source_currency': 'PASS', 'contract_and_trace_closure': 'PASS',
                  'native_provider_executed': False, 'authority_effect': 'none'}))
