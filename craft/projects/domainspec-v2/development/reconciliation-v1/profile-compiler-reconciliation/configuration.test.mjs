import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {here, project, canonical, sha256, loadConfiguration, mergeProfiles, resolveConfiguration, previewLocations} from './configuration.mjs';

// Independent contract expectations, not snapshots of resolver output.
// Open questions: CONFIGURATION.md. No compiler/runtime effects are admitted here.
const config = JSON.parse(fs.readFileSync(path.join(here, 'configuration.json'), 'utf8'));
const sourceSelection = JSON.parse(fs.readFileSync(path.join(here, 'configuration-input-boundary-sources.json'), 'utf8'));
const loaded = loadConfiguration(config, project, sourceSelection);
const selection = {schema_version: 'domainspec.compilation-selection/v1-candidate', language: 'typescript', module_root: 'commerce'};
const resolve = (change = {}) => resolveConfiguration({...selection, ...change}, loaded);
const changeConfig = mutate => { const c = structuredClone(config); mutate(c); return () => loadConfiguration(c, project, sourceSelection); };

test('exact existing 13 by 3 matrix; no new metatype registry or generation claim', () => {
  assert.equal(loaded.matrix.length, 39);
  assert.equal(new Set(loaded.matrix.map(c => c.meta_type_id)).size, 13);
  assert.equal(new Set(loaded.matrix.map(c => `${c.meta_type_id}/${c.language}`)).size, 39);
  const expected = ['Entity', 'Value Object', 'Enum', 'Operation', 'Query', 'Calculation', 'Rule', 'Policy', 'Workflow', 'Interface', 'Event', 'Mapping', 'State Machine'];
  for (const language of ['typescript', 'python', 'rust']) {
    const plan = resolve({language});
    assert.deepEqual(plan.cells.map(c => c.kind).sort(), expected.sort());
    assert.equal(plan.compile_ready, false);
    assert.equal(plan.authority_effect, 'none');
    for (const c of plan.cells) {
      assert.equal(c.generation_state, 'not-implemented-by-PCR-05');
      assert.equal(c.input.body_selector, `BODY_CONTRACTS.${c.kind}`);
      assert.ok(c.semantic_obligations.length >= 4);
      assert.ok(c.verification_required.includes('native-execution'));
    }
  }
});

test('language forms preserve native distinctions and Rule has no fabricated overlay', () => {
  const cell = (kind, language) => loaded.matrix.find(c => c.kind === kind && c.language === language);
  assert.equal(cell('Entity', 'typescript').representation.form_id, 'typescript.entity-factory-record');
  assert.equal(cell('Entity', 'python').representation.form_id, 'python.entity-dataclass');
  assert.equal(cell('Entity', 'rust').representation.form_id, 'rust.entity-struct');
  assert.equal(cell('Enum', 'typescript').representation.form_id, 'typescript.owned-const-object-enum');
  assert.equal(cell('Enum', 'python').representation.form_id, 'python.enum-class');
  assert.equal(cell('Enum', 'rust').representation.form_id, 'rust.native-enum');
  assert.ok(cell('Enum', 'typescript').constraints.some(c => c.constraint_id === 'typescript.enum-provider-digest'));
  assert.ok(cell('Enum', 'typescript').overlay_selection_evidence.activation_binding);
  for (const [lang, form] of [['typescript', 'arrow-function'], ['python', 'function-definition'], ['rust', 'function-item']]) {
    assert.equal(cell('Rule', lang).representation.protocol_id, null);
    assert.equal(cell('Rule', lang).representation.form_id, form);
    assert.ok(cell('Rule', lang).constraints.some(c => c.property_id === 'callable.return_semantics' && c.expected === 'boolean'));
  }
});

test('all 13 source roles are explicitly selected and language-spelled', () => {
  const expected = {Entity: 'domain/entities', 'Value Object': 'domain/value-objects', Enum: 'domain/enums', Rule: 'domain/rules', Calculation: 'domain/calculations', Policy: 'domain/policies', Query: 'application/queries', Operation: 'application/operations', Workflow: 'application/workflows', 'State Machine': 'domain/state-machines', Mapping: 'application/mappings', Event: 'domain/events', Interface: 'application/interfaces'};
  for (const [kind, role] of Object.entries(expected)) for (const language of ['typescript', 'python', 'rust']) {
    const node = {kind, feature_id: 'orders', node_id: 'order-item'};
    const [result] = previewLocations(resolve({language}), [node]);
    const ext = {typescript: 'ts', python: 'py', rust: 'rs'}[language];
    const spelling = language === 'typescript' ? `${role}/order-item` : `${role}/order-item`.replaceAll('-', '_');
    assert.equal(result.source_path, `commerce/features/orders/src/${spelling}.${ext}`);
  }
});

test('source-root orthogonality, stable digest, order independence and mutation isolation', () => {
  const first = resolve(), other = resolve({module_root: 'other-root'});
  assert.deepEqual(first.cells, other.cells);
  assert.notEqual(first.configuration_plan_sha256, other.configuration_plan_sha256);
  assert.equal(first.configuration_plan_sha256, resolve().configuration_plan_sha256);
  const {configuration_plan_sha256, ...body} = first;
  assert.equal(sha256(canonical(body)), configuration_plan_sha256);
  const nodes = [{kind: 'Entity', feature_id: 'orders', node_id: 'order'}, {kind: 'Entity', feature_id: 'billing', node_id: 'order'}];
  assert.deepEqual(previewLocations(first, nodes), previewLocations(first, [...nodes].reverse()));
  assert.equal(new Set(previewLocations(first, nodes).map(n => n.source_path)).size, 2);
  assert.throws(() => { first.cells[0].semantic_obligations.length = 0; }, TypeError);
  assert.ok(resolve().cells[0].semantic_obligations.length >= 4);
  assert.throws(() => resolveConfiguration(selection, structuredClone(loaded)), /PCR_CONFIG_UNCHECKED/);
  assert.throws(() => previewLocations(structuredClone(first), nodes), /PCR_CONFIG_UNCHECKED/);
  const reordered = structuredClone(config); reordered.types.reverse(); reordered.languages.reverse();
  assert.deepEqual(loadConfiguration(reordered, project, sourceSelection).matrix, loaded.matrix);
});

test('selection is closed: no semantic, profile, language or path bypass overrides', () => {
  for (const change of [{schema_version: 'v2'}, {language: 'java'}, {module_root: '/tmp/a'}, {module_root: '../a'}, {module_root: 'a/../b'}, {module_root: 'a\\b'}, {module_root: 'a//b'}, {module_root: 'A'}, {module_root: 'a%2fb'}, {module_root: 'é'}]) assert.throws(() => resolve(change), /PCR_CONFIG_/);
  for (const field of ['profile', 'obligations', 'realizationProfile', 'outputLayout', 'source_role', 'compile_ready']) assert.throws(() => resolve({[field]: false}), /PCR_CONFIG_SHAPE/);
  assert.throws(() => resolveConfiguration({}, loaded), /PCR_CONFIG_SHAPE/);
});

test('configuration rejects missing/duplicate types, unknown fields and mismatched input decoders', () => {
  for (const mutate of [c => c.types.pop(), c => c.types[0] = c.types[1], c => c.types[0].kind = 'Record', c => c.languages.pop(), c => c.languages.push('java'), c => c.status = 'admitted', c => c.authority_effect = 'granted', c => c.types[0].allow_class = true, c => c.types[0].obligations = [], c => c.types[0].input.typed_schema = 'domainspec.typed-rule/v1', c => c.types[0].input.decoder = 'decodeTypedRuleContract', c => c.types[0].blocked_by.push('DSR-999')]) assert.throws(changeConfig(mutate), /PCR_CONFIG_/);
  assert.throws(changeConfig(c => c.types.find(t => t.kind === 'Rule').role = 'application/rules'), /PCR_CONFIG_ROLE_CONFLICT/);
});

test('source identity rejects changed bytes, missing paths and symlinked inputs', t => {
  assert.throws(changeConfig(c => c.sources.base.sha256 = '0'.repeat(64)), /PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(changeConfig(c => c.sources.base.path = 'absent-profile.json'), /PCR_CONFIG_SOURCE_MISSING/);
  assert.throws(changeConfig(c => c.sources.base.path = '../outside'), /PCR_CONFIG_PATH/);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pcr05-source-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const c = structuredClone(config);
  fs.symlinkSync(path.join(project, c.sources.baseline.path), path.join(root, 'baseline.json'));
  c.sources.baseline.path = 'baseline.json';
  assert.throws(() => loadConfiguration(c, root), /PCR_CONFIG_SOURCE_SYMLINK/);
});

test('inheritance is parent-first, rejects cycles, missing parents and repeated constraint identity', () => {
  const base = {schema_version: 'domainspec-architecture-profile/v1', extends: [], constraints: [{constraint_id: 'base'}]};
  const child = {schema_version: base.schema_version, extends: ['base'], constraints: [{constraint_id: 'child'}]};
  assert.deepEqual(mergeProfiles({base, child}, 'child').order, ['base', 'child']);
  assert.throws(() => mergeProfiles({child}, 'child'), /PCR_CONFIG_PARENT_MISSING/);
  assert.throws(() => mergeProfiles({base: {...base, extends: ['child']}, child}, 'child'), /PCR_CONFIG_INHERITANCE_CYCLE/);
  assert.throws(() => mergeProfiles({base, child: {...child, constraints: [{constraint_id: 'base'}]}}, 'child'), /PCR_CONFIG_CONSTRAINT_CONFLICT/);
  assert.throws(() => mergeProfiles({base: {...base, schema_version: 'future'}}, 'base'), /PCR_CONFIG_PROFILE_VERSION/);
});

test('preview rejects duplicate identities, unsafe identifiers and unsupported kinds', () => {
  const good = {kind: 'Entity', feature_id: 'orders', node_id: 'order'};
  assert.throws(() => previewLocations(resolve(), [good, {...good, kind: 'Rule'}]), /PCR_CONFIG_COLLISION/);
  for (const id of ['../x', 'Order', 'order_item', 'é', 'a/b', 'a..b', 'a--b', 'mod', 'class', 'con', 'lpt1']) assert.throws(() => previewLocations(resolve(), [{...good, node_id: id}]), /PCR_CONFIG_IDENTIFIER/);
  assert.throws(() => previewLocations(resolve(), [{...good, kind: 'record'}]), /PCR_CONFIG_TYPE/);
});

test('semantic non-collapse and unresolved dependencies stay visible in every language', () => {
  for (const language of ['typescript', 'python', 'rust']) {
    const byKind = Object.fromEntries(resolve({language}).cells.map(c => [c.kind, c]));
    assert.ok(byKind.Entity.semantic_obligations.includes('identity-only-equality-and-hash'));
    assert.ok(byKind['Value Object'].semantic_obligations.includes('complete-normalized-value-equality-and-hash'));
    assert.ok(byKind.Policy.semantic_obligations.includes('select-declared-target-without-executing'));
    assert.ok(byKind.Mapping.semantic_obligations.includes('computed-values-passed-explicitly'));
    assert.ok(byKind.Workflow.semantic_obligations.includes('step-occurrence-not-operation-identity'));
    assert.ok(byKind['State Machine'].semantic_obligations.includes('trigger-guard-output-intent-distinct'));
    assert.ok(byKind.Entity.blockers.some(b => b.id === 'DSR-009'));
    assert.ok(byKind.Mapping.blockers.some(b => b.id === 'DSR-011'));
    assert.equal(byKind.Entity.input_bounds.reference_semantics.includes('not automatically'), true);
  }
});

test('read-only check CLI succeeds and rejects unsupported arguments', () => {
  const result = JSON.parse(execFileSync(process.execPath, [path.join(here, 'configuration.mjs'), '--source-selection', path.join(here, 'configuration-input-boundary-sources.json')], {encoding: 'utf8'}));
  assert.equal(result.cells, 39); assert.equal(result.compile_ready, false);
  assert.throws(() => execFileSync(process.execPath, [path.join(here, 'configuration.mjs'), '--activate'], {encoding: 'utf8', stdio: 'pipe'}), /PCR_CONFIG_ARGUMENT/);
});

test('source successor is explicit predecessor-bound drift-checked and present in plan identity', () => {
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-calculation-v2-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  for(const key of ['relationship_identity','project_composition','finite_projection','interchange_decoder','input_boundary_definition']){
    const changed=structuredClone(sourceSelection);changed.support_sources[key].sha256='0'.repeat(64);assert.throws(()=>loadConfiguration(config,project,changed),/PCR_CONFIG_SOURCE_DRIFT/);
    const missing=structuredClone(sourceSelection);delete missing.support_sources[key];assert.throws(()=>loadConfiguration(config,project,missing),/PCR_CONFIG_SHAPE/);
  }
  assert.throws(() => loadConfiguration(config), /PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(() => execFileSync(process.execPath, [path.join(here, 'configuration.mjs')], {encoding:'utf8',stdio:'pipe'}), /PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-rule-v2-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-mapping-v2-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-policy-v2-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-state-machine-v1-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-interface-v1-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-workflow-v1-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  assert.throws(()=>loadConfiguration(config,project,JSON.parse(fs.readFileSync(path.join(here,'configuration-public-mapping-v1-sources.json'),'utf8'))),/PCR_CONFIG_SOURCE_DRIFT/);
  for(const key of ['policy_rules','value_bindings','state_machine','named_interface','interface_version_policy','interface_definition','workflow_occurrences','workflow_definition','mapping_public','public_mapping_definition','calculation_exact','calculation_definition']){
    const s=structuredClone(sourceSelection);s.support_sources[key].sha256='0'.repeat(64);assert.throws(()=>loadConfiguration(config,project,s),/PCR_CONFIG_SOURCE_DRIFT/);
    const missing=structuredClone(sourceSelection);delete missing.support_sources[key];assert.throws(()=>loadConfiguration(config,project,missing),/PCR_CONFIG_SHAPE/);
  }
  for(const change of [(s)=>s.predecessor_selection.sha256='0'.repeat(64),(s)=>s.support_sources.mapping_inputs.sha256='0'.repeat(64),(s)=>s.support_sources.mapping_inputs.path='impl/cli/src/input/project-model.ts',(s)=>delete s.support_sources.mapping_inputs]){
    const s=structuredClone(sourceSelection);change(s);assert.throws(()=>loadConfiguration(config,project,s),/PCR_CONFIG_/);
  }
  assert.equal(loaded.predecessor_configuration_sha256,sha256(canonical(config)));
  assert.deepEqual(resolve().source_selection,sourceSelection);
  assert.notEqual(resolve().configuration_sha256,sha256(canonical(config)));
  for(const mutate of [s=>s.schema_version='future',s=>s.authority_effect='admitted',s=>s.sources.extra=s.sources.project_model,s=>delete s.sources.typed_operations,s=>s.sources.project_model.path='../escape',s=>s.sources.project_model.predecessor_sha256='0'.repeat(64),s=>s.sources.typed_operations.sha256='0'.repeat(64),s=>s.sources.typed_operations.sha256='not-a-digest']){
    const changed=structuredClone(sourceSelection);mutate(changed);assert.throws(()=>loadConfiguration(config,project,changed),/PCR_CONFIG_/);
  }
  const reordered=structuredClone(sourceSelection);reordered.sources=Object.fromEntries(Object.entries(reordered.sources).reverse());
  assert.deepEqual(resolveConfiguration(selection,loadConfiguration(config,project,reordered)),resolve());
});
