import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {buildCorpus} from './build-corpus.ts';
import {loadCompiledProjectGraph} from '../../../../../impl/cli/src/input/project-model.ts';
import {createCompiledProjectCertificate} from '../../../../../impl/cli/src/compilation/certificate.ts';
import {fieldValueKey} from '../../../../../impl/cli/src/input/field-reference-model.ts';
import {decodeReconciledCompilationSelection, planCompiledReconciledProject} from '../../../../../impl/cli/src/generation/reconciled-project.ts';
import {compileCompositionBoundary, COMPOSITION_BOUNDARY_VERSION, COMPOSITION_BOUNDARY_CONTRACT_SHA256} from '../../../../../impl/cli/src/input/composition-boundary.ts';
import {compileSelectedProjectFields, EXACT_PROJECT_FIELD_SELECTION_VERSION, EXACT_FIELD_CONTRACT_SHA256} from '../../../../../impl/cli/src/input/compiled-field-model.ts';
import {compileOperationActionBindings} from '../../../../../impl/cli/src/typed-operation/action-bindings.ts';
import {compileWorkflowBindings, WORKFLOW_BINDINGS_VERSION} from '../../../../../impl/cli/src/typed-operation/workflow-bindings.ts';
import {getReconciledSource, getReconciledSourceCapsule} from '../../../../../impl/cli/src/generation/reconciled-sources.ts';

// Source/selection diagnostics only. Open questions are owned by RESULT.md.
const lane = import.meta.dirname, project = path.resolve(lane, '../../../../..');
const read = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));
const digest = (p: string) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rows: any[] = [];
let failed = false;
function check(id: string, run: () => unknown) {
  try {rows.push({id, status: 'pass', evidence: run() ?? null});}
  catch (error: any) {failed = true; rows.push({id, status: 'fail', error: error.stack ?? String(error)});}
}
const source = path.join(lane, 'source');
const files = (dir: string): string[] => fs.readdirSync(dir, {withFileTypes: true}).flatMap(e =>
  e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const identity = read(path.join(lane, 'source-inputs.json'));
const inputDrift = () => identity.files.filter((f: any) => !fs.existsSync(path.join(project, f.path)) || digest(path.join(project, f.path)) !== f.sha256);
const drift = inputDrift();
const selection = read(path.join(lane, 'selection.json'));
let graph: any, certificate: any, boundary: any, fields: any, actions: any;
check('R13-SOURCE-REPRODUCIBLE', () => {
  const rebuilt = buildCorpus();
  assert.deepEqual(selection, rebuilt.selection);
  assert.deepEqual(Object.keys(rebuilt.files).sort(), files(source).map(p => path.relative(source, p)).sort());
  for (const [p, value] of Object.entries(rebuilt.files)) assert.deepEqual(read(path.join(source, p)), value, p);
  return {files: Object.keys(rebuilt.files).length, helper_temporaries: 'cleaned in finally'};
});
check('R13-SOURCE-LOAD', () => {
  graph = loadCompiledProjectGraph(source); certificate = createCompiledProjectCertificate(graph);
  const config = read(path.join(project, 'development/reconciliation-v1/profile-compiler-reconciliation/configuration.json'));
  assert.deepEqual([...new Set(graph.nodes.map((n: any) => n.kind))].sort(), config.types.map((t: any) => t.kind).sort());
  for (const id of ['customer', 'find', 'total']) {
    assert.ok(graph.nodes.some((n: any) => n.selector === 'commerce:' + id));
    assert.ok(graph.nodes.some((n: any) => n.selector === 'billing:' + id));
  }
  return {node_count: graph.nodes.length, metatype_count: 13, relationship_count: graph.relationships.length,
    graph_sha256: certificate.graph_sha256, manifest_sha256: graph.source_manifest.manifest_sha256};
});
check('R13-SELECTION-DECODE', () => {decodeReconciledCompilationSelection(selection); return {language: selection.language};});
check('R13-SOURCE-FIELDS', () => {
  assert.ok(graph, 'source graph prerequisite');
  fields = compileSelectedProjectFields(graph, {schema_version: EXACT_PROJECT_FIELD_SELECTION_VERSION,
    contract_sha256: EXACT_FIELD_CONTRACT_SHA256, graph_sha256: certificate.graph_sha256,
    roots: graph.nodes.filter((n: any) => ['Entity', 'Value Object', 'Enum'].includes(n.kind)).map((n: any) => n.selector),
    bindings: selection.field_bindings}, getReconciledSource('field'));
  assert.equal(fields.model.bindings[0].target, 'billing:customer');
  return {compilation_sha256: fields.compilation_sha256, declarations: fields.model.declarations.map((d: any) => d.selector)};
});
check('R13-SOURCE-ACTIONS', () => {
  assert.ok(graph && fields, 'graph and field prerequisites');
  boundary = compileCompositionBoundary(graph, {schema_version: COMPOSITION_BOUNDARY_VERSION,
    contract_sha256: COMPOSITION_BOUNDARY_CONTRACT_SHA256, graph_sha256: certificate.graph_sha256}, getReconciledSource('composition'));
  actions = selection.operations.map((b: any) => compileOperationActionBindings(graph, boundary, fields, b, getReconciledSource('operation_action')));
  assert.equal(actions.length, 2);
  assert.ok(selection.operations.every((a: any) => a.writes.length === 1 && a.events.length === 1 && a.atomicity === 'state-and-outbox'));
  return actions.map((a: any) => ({selector: a.bindings.selector, action_sha256: a.action_sha256, obligations: a.execution_obligations}));
});
check('R13-SOURCE-VALUE-SHAPES', () => {
  assert.ok(fields, 'compiled field model prerequisite');
  const values = read(path.join(lane, 'values.json'));
  for (const order of [values.order, values.before, ...values.query_orders]) fieldValueKey(fields.model, 'commerce:order', order);
  for (const customer of values.billing_customers) fieldValueKey(fields.model, 'billing:customer', customer);
  const changed = structuredClone(values.order); changed.billing_customer_id = '999';
  fieldValueKey(fields.model, 'commerce:order', changed);
  const duplicate = structuredClone(values.order); duplicate.tags = ['a', 'a'];
  assert.throws(() => fieldValueKey(fields.model, 'commerce:order', duplicate), /FIELD_SET_DUPLICATE/);
  const left = fieldValueKey(fields.model, 'commerce:customer', {id: '2', name: 'same'});
  const right = fieldValueKey(fields.model, 'billing:customer', {id: '2', name: 'same'});
  assert.notEqual(left, right);
  return {vectors: 'typed shape checked', invariant_execution: 'not_run', existence_lookup: 'none'};
});
check('R13-SOURCE-WORKFLOW', () => {
  assert.ok(actions, 'compiled actions prerequisite');
  const {recovery, ...w} = selection.workflows[0];
  const b = compileWorkflowBindings(graph, boundary, fields, actions, {...w, schema_version: WORKFLOW_BINDINGS_VERSION,
    steps: w.steps.map((s: any) => ({...s, action_sha256: actions[0].action_sha256})),
    compensations: w.compensations.map((s: any) => ({...s, action_sha256: actions[1].action_sha256}))}, getReconciledSource('workflow_binding'));
  assert.equal(new Set(w.steps.map((s: any) => s.step_id)).size, 4);
  assert.equal(new Set(w.event_inputs.map((s: any) => s.name)).size, 7);
  return {workflow_sha256: b.workflow_sha256, occurrences: w.steps.map((s: any) => s.step_id), recovery};
});
check('R13-SOURCE-PUBLIC-PLAN', () => {
  assert.ok(graph, 'graph prerequisite');
  const plan = planCompiledReconciledProject(graph, selection);
  assert.deepEqual(plan.node_selectors, graph.nodes.map((n: any) => n.selector).sort());
  return {plan_sha256: plan.plan_sha256, modules: plan.resolved.modules.length, native_execution: 'not_run'};
});
function negative(id: string, relative: string, mutate: (value: any) => void, expected: RegExp) {
  check(id, () => {
    assert.ok(graph, 'valid baseline graph required before interpreting a mutant');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r13-commerce-negative-'));
    try {
      fs.cpSync(source, path.join(root, 'source'), {recursive: true});
      const file = path.join(root, 'source', relative), value = read(file); mutate(value);
      fs.writeFileSync(file, JSON.stringify(value));
      let diagnostic = '';
      assert.throws(() => {try {loadCompiledProjectGraph(path.join(root, 'source'));} catch (e: any) {diagnostic = String(e); throw e;}}, expected);
      return {diagnostic, temporary: 'cleaned in finally'};
    } finally {fs.rmSync(root, {recursive: true, force: true});}
  });
}
negative('R13-NEG-UNRESOLVED-REFERENCE', 'specs/commerce/nodes/order.json',
  n => n.body.typed_contract.properties.find((p: any) => p.name === 'customer').type.selector = 'billing:missing', /missing|unknown|unresolved|not found/i);
negative('R13-NEG-HIDDEN-CALCULATION', 'specs/commerce/nodes/summary.json',
  n => n.body.typed_contract.fields[1].value = {op: 'call', selector: 'commerce:total', arguments: []}, /MAPPING|VALUE|unknown|op/i);
negative('R13-NEG-DUPLICATE-OCCURRENCE', 'specs/commerce/nodes/flow.json',
  n => n.body.typed_contract.steps[1].step_id = 'first', /duplicate|unique|occurrence/i);
negative('R13-NEG-INVENTED-VERB', 'specs/commerce/edges/summary-maps-api.json',
  n => n.relationship = 'calculates-for-mapping', /unknown relationship:calculates-for-mapping/);
check('R13-NEG-WRONG-IDENTITY-PROJECTION', () => {
  assert.ok(graph, 'source graph prerequisite');
  assert.throws(() => compileSelectedProjectFields(graph, {schema_version: EXACT_PROJECT_FIELD_SELECTION_VERSION,
    contract_sha256: EXACT_FIELD_CONTRACT_SHA256, graph_sha256: certificate.graph_sha256,
    roots: ['commerce:order'], bindings: [{...selection.field_bindings[0], projection: ['name']}]},
    getReconciledSource('field')), /IDENTITY|TYPE/);
});
const capsule = getReconciledSourceCapsule();
check('R13-SCENARIO-COVERAGE', () => {
  assert.ok(graph, 'graph prerequisite');
  const manifest = read(path.join(lane, 'scenarios.json'));
  assert.equal(new Set(manifest.scenarios.map((s: any) => s.scenario_id)).size, manifest.scenarios.length);
  const selectors = new Set(graph.nodes.map((n: any) => n.selector));
  const covered = new Set<string>();
  for (const scenario of manifest.scenarios) {
    for (const selector of scenario.selectors) assert.ok(selectors.has(selector), selector);
    for (const type of scenario.metatypes) covered.add(type);
    for (const id of scenario.preparation_checks) assert.ok(rows.some(r => r.id === id), id);
    assert.deepEqual(scenario.execution_status, {typescript: 'not_run', python: 'not_run', rust: 'not_run'});
  }
  assert.equal(covered.size, 13);
  return {scenarios: manifest.scenarios.length, metatypes: covered.size, native_claims: 'none'};
});
const configuration = read(path.join(project, 'development/reconciliation-v1/profile-compiler-reconciliation/configuration.json'));
const configured_source_comparison = Object.entries(configuration.sources).map(([id, row]: any) => ({
  id, path: row.path, configured_sha256: row.sha256, actual_sha256: digest(path.join(project, row.path)),
  matches: row.sha256 === digest(path.join(project, row.path))
}));
check('R13-SOURCE-INPUT-STABILITY', () => {
  assert.deepEqual(drift, [], 'selected inputs changed before checks; do not reuse affected evidence');
  assert.deepEqual(inputDrift(), [], 'selected inputs changed during checks; do not reuse affected evidence');
  return {selected_inputs: identity.files.length, before_and_after: 'exact SHA-256 match'};
});
process.stdout.write(JSON.stringify({schema_version: 'r13.source-check/v1-candidate', authority_effect: 'none',
  evidence_scope: 'source-only', native_execution: {typescript: 'not_run', python: 'not_run', rust: 'not_run'},
  rows, selected_input_drift: drift, source_capsule_sha256: capsule.capsule_sha256,
  configured_source_comparison, source_identities: files(source).sort().map(p => ({path: path.relative(lane, p), sha256: digest(p)})),
  selection_sha256: digest(path.join(lane, 'selection.json')),
  open_questions_ref: 'RESULT.md#open-questions'}, null, 2) + '\n');
process.exitCode = failed ? 1 : 0;
