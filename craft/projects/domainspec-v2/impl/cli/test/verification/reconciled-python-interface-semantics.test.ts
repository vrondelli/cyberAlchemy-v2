import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {getReconciledSource} from '../../src/generation/reconciled-sources.ts';
import {pythonInterfaceFixture, scalar, local, wrap, publicField} from './reconciled-python-interface-fixture.ts';
import {loadCompiledProjectGraph} from '../../src/input/project-model.ts';
import {getPythonInterfaceVerificationContext, planCompiledReconciledPythonProject} from '../../src/generation/reconciled-python-project.ts';
import {RECONCILED_PYTHON_COMPILATION_VERSION, RECONCILED_PYTHON_PROFILE} from '../../src/generation/reconciled-python-selection.ts';
import {createPythonInterfaceControls} from '../../src/verification/reconciled-python-interface-controls.ts';
import {createPythonSemanticControls} from '../../src/verification/reconciled-python-semantic-controls.ts';
import {createInterfaceSemanticCases} from '../../src/verification/reconciled-interface-controls.ts';
import {executeReconciledPythonSemanticVerification as execute} from '../../src/verification/reconciled-python-native.ts';
import {canonicalJson, sha256} from '../../src/input/source-manifest.ts';

test('Python Interface replay detects value, key, identity, mutability, version and effect substitutions', t => {
  const f = pythonInterfaceFixture(t), {graph, plan} = selected(f), controls = createPythonSemanticControls(graph, plan);
  const root = path.join(f.temp, 'sensitivity');
  for (const a of plan.artifacts) {const file = path.join(root, a.relative_path); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, a.content);}
  const load = (name: string, source: string, bindings = '') => name + "={'__name__':'observer'" + bindings + '}\nexec(' + JSON.stringify(source) + ',' + name + ')\n';
  const program = 'import types\n' + load('observer_base', getReconciledSource('python_operation_observer'))
    + load('observer', getReconciledSource('python_interface_observer'), ", 'base':types.SimpleNamespace(**observer_base)")
    + load('owned', getReconciledSource('python_owned_semantics'))
    + load('facts', getReconciledSource('python_state_machine_semantics'), ", 'owned':types.SimpleNamespace(**owned)")
    + load('operations', getReconciledSource('python_operation_semantics'), ", 'owned':types.SimpleNamespace(**owned), 'facts':types.SimpleNamespace(**facts)")
    + load('runner', getReconciledSource('python_interface_semantics'), ", 'owned':types.SimpleNamespace(**owned), 'facts':types.SimpleNamespace(**facts), 'operations':types.SimpleNamespace(**operations)") + String.raw`
import dataclasses,importlib,json,sys
d=json.load(sys.stdin);sys.path.insert(0,d['root'])
def preceding(value):
    return {'rows':[{'selector':r['selector'],'kind':r['kind'],'result':'not_evaluable','executed':False} for r in value['controls']['rows']], 'toolchain_files':{}}
row=next(r for r in d['controls']['rows'] if r['kind']=='Interface')
module=importlib.import_module(row['module']['import_name'])
normal,key,version=module.BoundaryValue.normalize,module.BoundaryValue.key,module.accepts_consumer_version
# Full baseline and the same complete Interface cases for each substitution.
runner['run'](d,preceding,observer['observe'])
rejected=[]
for mutation in ('wrong-value','wrong-key','identity-collapse','mutable-value','wrong-version','unexpected-effect'):
    if mutation=='wrong-value':
        def wrong(self,value):
            result=normal(self,value)
            return result+1 if type(result) is int else result
        module.BoundaryValue.normalize=wrong
    elif mutation=='wrong-key': module.BoundaryValue.key=lambda self,value:'wrong-key'
    elif mutation=='identity-collapse':
        def collapsed(self,value):
            result=key(self,value)
            return result.replace('6:shadow','8:response')
        module.BoundaryValue.key=collapsed
    elif mutation=='mutable-value':
        def mutable(self,value):
            result=normal(self,value)
            return dict(result.entries) if dataclasses.is_dataclass(result) and hasattr(result,'entries') else result
        module.BoundaryValue.normalize=mutable
    elif mutation=='wrong-version': module.accepts_consumer_version=lambda value:True
    else:
        def effect(self,value):
            sys.audit('socket.__new__')
            return normal(self,value)
        module.BoundaryValue.normalize=effect
    try: runner['run'](d,preceding,observer['observe'])
    except ValueError as error:
        assert any(s in str(error) for s in ('outcome:','immutable public fact','effect or coercion','stable normalized key')),str(error)
        rejected.append(mutation)
    else: raise AssertionError('survived:'+mutation)
    finally:
        module.BoundaryValue.normalize=normal;module.BoundaryValue.key=key;module.accepts_consumer_version=version
# Public boundaries have no runtime dependency on their declared application member.
# Poison that member after the native module has been unloaded; Interface-only
# replay must still work, and a source-level import would fail whole-source observation.
member=next(r for r in d['controls']['rows'] if r['kind']=='Operation')['module']['import_name']
sys.modules[member]=None
importlib.reload(module)
runner['run'](d,preceding,observer['observe'])
print(json.dumps(rejected))
`;
  const launcher = "import io,json,sys\ne=json.load(sys.stdin)\nsys.stdin=io.StringIO(json.dumps(e['request']))\nexec(e['program'])\n";
  const result = spawnSync('/usr/bin/python3', ['-I', '-S', '-B', '-c', launcher], {input: JSON.stringify({program, request: {root, controls}}), encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024});
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).length, 6);
});

function selected(f: ReturnType<typeof pythonInterfaceFixture>) {
  const graph = loadCompiledProjectGraph(f.source), s = f.selection;
  const plan = planCompiledReconciledPythonProject(graph, {schema_version: RECONCILED_PYTHON_COMPILATION_VERSION, profile_id: RECONCILED_PYTHON_PROFILE, language: 'python',
    module_root: s.module_root, layout_version: s.layout_version, field_bindings: s.field_bindings, factories: s.factories, operations: s.operations, workflows: []});
  return {graph, plan};
}
const variants = [
  {name: 'scalar', mode: 'backward', type: scalar('UInt64'), domain: false},
  {name: 'containers', mode: 'exact', type: {kind: 'sum', variants: [{name: 'None', ontology_variant: 'TEST-OPTION#None', payload: null}, {name: 'Some', ontology_variant: 'TEST-OPTION#Some', payload: wrap('list', local('detail'))}]}, domain: false},
  {name: 'domain', mode: 'backward', type: wrap('set', {kind: 'named', selector: 'alpha:choice'}), domain: true},
];
const baselines = [{"name":"scalar","cases":283,"suite_sha256":"251a4947a4d9a956ee2d88e25a1c134e34da9c282644ada9596bc4743371903c","artifacts_sha256":"6b66b8ea261a062c6765279a69d929609a2de4870800b28606df2812c9da406b"},{"name":"containers","cases":900,"suite_sha256":"6b745b19df7f5d93204a42eaac9d5a4d894aa8268fe7b72dbb76a5b736ac248d","artifacts_sha256":"9adfe992f27994e7c2cd8b31a8b375d3678d5cd35e8a2e01f231f3aff8e2e488"},{"name":"domain","cases":1023,"suite_sha256":"69c4548abbe34e7bab47af569044a6ff73d76ed8d1a5cf5c04bddc893652785f","artifacts_sha256":"5691721f21f0ce17bfa4eea1e151d16d09e57e232f8643e83d53a7e6492f0363"}];
for (const [index, variant] of variants.entries()) test('Python Interface shared cases and native boundaries: ' + variant.name, t => {
  const f = pythonInterfaceFixture(t, variant.mode, variant.type, variant.domain), {graph, plan} = selected(f);
  const node = graph.nodes.find(n => n.kind === 'Interface')!, row = createPythonInterfaceControls(node, graph, plan);
  assert.equal(row.state, 'ready', (row as any).reason); if (row.state !== 'ready') return;
  assert.equal(row.cases.length, baselines[index].cases);
  assert.equal(sha256(canonicalJson({cases: row.cases, recipes: row.recipes})), baselines[index].suite_sha256);
  assert.equal(sha256(canonicalJson(plan.artifacts)), baselines[index].artifacts_sha256);
  assert.equal(canonicalJson(getPythonInterfaceVerificationContext(plan)).includes('"artifacts"'), false);
  assert.throws(() => getPythonInterfaceVerificationContext(structuredClone(plan)), /registered/);
  assert.throws(() => createPythonInterfaceControls(structuredClone(node), graph, plan), /registered Interface/);
  assert.throws(() => createInterfaceSemanticCases(node, structuredClone(graph), plan.field_compilation_sha256), /unvalidated/);
  const shared = createInterfaceSemanticCases(node, graph, plan.field_compilation_sha256);
  assert.equal(shared.state, 'ready'); if (shared.state === 'ready') assert.deepEqual(row.cases, shared.cases);
  const before = fs.readdirSync(f.temp), controls = createPythonSemanticControls(graph, plan);
  const report = execute(graph, plan, {python_executable: '/usr/bin/python3', temporary_parent: f.temp});
  assert.equal(report.native_stage_result, 'pass', JSON.stringify(report.checks.filter(c => c.result === 'fail')));
  const actual = report.semantic_rows!.find(r => r.selector === node.selector);
  assert.deepEqual(actual, {selector: node.selector, kind: 'Interface', result: 'pass', executed: true, case_count: row.cases.length, native_form: 'pass', binding_controls: 3, compiling_substitutions: 2}, JSON.stringify(report.checks.filter(c => c.result === 'fail')));
  assert.equal(report.residue, null); assert.equal(report.result, 'not_evaluable'); assert.deepEqual(fs.readdirSync(f.temp), before);
  // The domain's deliberately false factory invariant must not prevent its
  // public structural Interface normalization from passing.
  if (!variant.domain) assert.equal(report.semantic_rows!.filter(r => r.result === 'pass').length, graph.nodes.length);
  t.diagnostic(JSON.stringify({name: variant.name, nodes: graph.nodes.length, interface_cases: row.cases.length, cases: controls.case_count, control_bytes: Buffer.byteLength(canonicalJson(controls))}));
});

test('Python Interface overflow retains every source node and no passing prefix', t => {
  const f = pythonInterfaceFixture(t);
  f.contract.contracts = Array.from({length: 128}, (_, i) => ({contract_id: 'value-' + i, ontology_contract: 'TEST-VALUE-' + i, fields: [publicField('amount', scalar('UInt64'))]}));
  f.contract.operations[0].result = local('value-0'); f.save();
  const {graph, plan} = selected(f), row = createPythonInterfaceControls(graph.nodes.find(n => n.kind === 'Interface')!, graph, plan);
  assert.equal(row.state, 'not_evaluable'); assert.equal('cases' in row, false);
  assert.match((row as any).reason, /bounded Interface/);
  assert.equal(plan.node_selectors.length, graph.nodes.length);
});

test('Python Interface optional, Bool, Unicode metadata and exact named boundaries preserve all cases', t => {
  const f = pythonInterfaceFixture(t, 'backward', wrap('optional', scalar('Bool')));
  f.contract.contracts.find((c: any) => c.contract_id === 'detail').fields[0].meaning = 'Public 😀 e\u0301 and lone surrogate \ud800';
  f.save();
  const {graph, plan} = selected(f), controls = createPythonSemanticControls(graph, plan);
  const report = execute(graph, plan, {python_executable: '/usr/bin/python3', temporary_parent: f.temp});
  assert.equal(report.native_stage_result, 'pass', JSON.stringify(report.checks.filter(c => c.result === 'fail')));
  assert.equal(report.semantic_rows!.filter(r => r.result === 'pass').length, graph.nodes.length, JSON.stringify(report.checks.filter(c => c.result === 'fail')));
  const row = controls.rows.find(r => r.kind === 'Interface') as any;
  assert.ok(row.cases.some((c: any) => c.mode === 'interface-value' && c.expected.kind === 'value' && c.expected.value.includes('boolean')));
  assert.ok(row.cases.some((c: any) => c.mode === 'interface-value' && c.expected.kind === 'value' && c.expected.value.includes('null')));
});
