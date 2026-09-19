import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// PCR-05: read-only candidate configuration resolution, not code generation.
// Open questions and input-contract limits: CONFIGURATION.md.
export const here = path.dirname(fileURLToPath(import.meta.url));
export const project = path.resolve(here, '../../..');
export const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const languages = ['typescript', 'python', 'rust'];
const loadedSnapshots = new WeakSet(), resolvedPlans = new WeakSet();
function immutable(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}
const sourceKeys = ['baseline', 'base', ...languages, 'project_model', 'typed_operations', 'typed_backend', 'composition', 'relationships', 'layout', 'parent_work_items'];
// Adapter discriminators mirror existing BODY_CONTRACTS; they do not define metatypes.
const typedInputs = {Entity: ['typed-record', 'typed_operations', 'decodeTypedRecordContract'], 'Value Object': ['typed-record', 'typed_operations', 'decodeTypedRecordContract'], Enum: ['typed-sum', 'typed_operations', 'decodeTypedSumContract'], Rule: ['typed-rule', 'typed_operations', 'decodeTypedRuleContract'], Operation: ['typed-operation', 'typed_operations', 'decodeTypedOperationContract'], Query: ['typed-query', 'typed_backend', 'decodeTypedQueryContract'], Calculation: ['typed-calculation', 'typed_backend', 'decodeTypedCalculationContract'], Mapping: ['typed-mapping', 'typed_backend', 'decodeTypedMappingContract'], Policy: ['typed-policy', 'typed_backend', 'decodeTypedPolicyContract']};
const reserved = new Set(('as async await break case catch class const continue crate debugger def default del do else enum except export extends false finally fn for from function global if impl import in interface is lambda let loop match mod move mut new nonlocal null package pass private protected pub public raise ref return self static struct super switch this throw trait true try type typeof unsafe use var void while with yield con prn aux nul ' + Array.from({length: 9}, (_, i) => `com${i + 1} lpt${i + 1}`).join(' ')).split(' '));
const fail = (code, detail) => { throw new Error(`${code}: ${detail}`); };
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function keys(value, required, optional = []) {
  if (!object(value) || required.some(k => !Object.hasOwn(value, k)) || Object.keys(value).some(k => ![...required, ...optional].includes(k))) fail('PCR_CONFIG_SHAPE', required.join(','));
}
function strings(value, label, nonempty = true) {
  if (!Array.isArray(value) || (nonempty && !value.length) || value.some(v => typeof v !== 'string' || !v.trim()) || new Set(value).size !== value.length) fail('PCR_CONFIG_SET', label);
}
function safePath(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9._-]+(?:\/[a-zA-Z0-9._-]+)*$/.test(value) || value.split('/').some(p => p === '.' || p === '..')) fail('PCR_CONFIG_PATH', String(value));
  return value;
}
function readBound(root, ref) {
  keys(ref, ['path', 'sha256']); safePath(ref.path);
  if (!/^[a-f0-9]{64}$/.test(ref.sha256)) fail('PCR_CONFIG_DIGEST', ref.path);
  const absolute = path.resolve(root, ref.path);
  // Reject symlinked inputs, even when the bytes currently match.
  let cursor = root;
  for (const part of ref.path.split('/')) {
    cursor = path.join(cursor, part);
    if (!fs.existsSync(cursor)) fail('PCR_CONFIG_SOURCE_MISSING', ref.path);
    if (fs.lstatSync(cursor).isSymbolicLink()) fail('PCR_CONFIG_SOURCE_SYMLINK', ref.path);
  }
  const bytes = fs.readFileSync(absolute);
  if (sha256(bytes) !== ref.sha256) fail('PCR_CONFIG_SOURCE_DRIFT', ref.path);
  return bytes.toString('utf8');
}
const applies = (c, kind) => c.applies_to?.some(t => t === 'architecture.DomainConceptImplementation' || t === `architecture.${kind.replaceAll(' ', '')}Implementation`)
  || c.source_types?.includes(`architecture.${kind.replaceAll(' ', '')}Implementation`);

export function mergeProfiles(profiles, selected) {
  const visiting = new Set(), visited = new Set(), order = [], constraints = new Map();
  const walk = id => {
    if (visiting.has(id)) fail('PCR_CONFIG_INHERITANCE_CYCLE', id);
    if (visited.has(id)) return;
    const p = profiles[id];
    if (!p) fail('PCR_CONFIG_PARENT_MISSING', id);
    if (p.schema_version !== 'domainspec-architecture-profile/v1') fail('PCR_CONFIG_PROFILE_VERSION', id);
    if (!Array.isArray(p.extends) || !Array.isArray(p.constraints)) fail('PCR_CONFIG_PROFILE_SHAPE', id);
    visiting.add(id);
    for (const parent of p.extends) walk(parent);
    visiting.delete(id); visited.add(id); order.push(id);
    for (const c of p.constraints) {
      if (!c.constraint_id) fail('PCR_CONFIG_CONSTRAINT', id);
      if (constraints.has(c.constraint_id)) fail('PCR_CONFIG_CONSTRAINT_CONFLICT', c.constraint_id);
      constraints.set(c.constraint_id, c);
    }
  };
  walk(selected);
  return {order, constraints: [...constraints.values()]};
}

export function loadConfiguration(config = JSON.parse(fs.readFileSync(path.join(here, 'configuration.json'), 'utf8')), root = project, sourceSelection = null) {
  keys(config, ['schema_version', 'status', 'authority_effect', 'sources', 'languages', 'types', 'open_questions_ref']);
  if (config.schema_version !== 'domainspec.compilation-configuration/v1-candidate' || config.status !== 'candidate' || config.authority_effect !== 'none') fail('PCR_CONFIG_VERSION', 'candidate only');
  keys(config.sources, sourceKeys);
  const predecessorConfigurationSha256 = sha256(canonical(config));
  if (sourceSelection !== null) {
    const boundarySuccessor=sourceSelection.schema_version==='domainspec.compilation-source-selection/v9-candidate';
    const calculationSuccessor=boundarySuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v8-candidate';
    const publicMappingSuccessor=calculationSuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v7-candidate';
    const workflowSuccessor=publicMappingSuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v6-candidate';
    const interfaceSuccessor=workflowSuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v5-candidate';
    const stateSuccessor=interfaceSuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v4-candidate';
    const policySuccessor=stateSuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v3-candidate';
    const successor=policySuccessor||sourceSelection.schema_version==='domainspec.compilation-source-selection/v2-candidate';
    keys(sourceSelection, ['schema_version', 'authority_effect', 'sources', 'open_questions_ref',...(successor?['predecessor_selection','support_sources']:[])]);
    if ((!successor&&sourceSelection.schema_version !== 'domainspec.compilation-source-selection/v1-candidate') || sourceSelection.authority_effect !== 'none' || sourceSelection.open_questions_ref !== (boundarySuccessor?'PUBLIC-COMPILER-INTEGRATION.md#remaining-r08-work':calculationSuccessor?'CALCULATION-V2.md#remaining-work':publicMappingSuccessor?'PUBLIC-MAPPING-BINDINGS.md#remaining-work':workflowSuccessor?'WORKFLOW-OCCURRENCES.md#remaining-work':interfaceSuccessor?'NAMED-INTERFACE.md#remaining-work':stateSuccessor?'STATE-MACHINE-GENERATION.md#remaining-construction':policySuccessor?'POLICY-GENERATION.md#remaining-construction':successor?'MAPPING-GENERATION.md#remaining-construction':'EXACT-RULE-LITERALS.md#open-questions')) fail('PCR_CONFIG_SOURCE_SELECTION', 'unsupported source selection');
    keys(sourceSelection.sources, ['project_model', 'typed_operations']);
    let predecessors=config.sources;
    if(successor){
      const rulePredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-rule-v2-sources.json',sha256:'88d31247c1df5b7230462b05f5d52dec1d948cce2b838ed54001a894db7d1701'};
      const mappingPredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-mapping-v2-sources.json',sha256:'b4a3bc2ff6a4665354d32187dddd9c49d04f6693f4e5880786e8d425d75a3cce'};
      const policyPredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-policy-v2-sources.json',sha256:'ba0ab10bbb1bf33f201e21fd131e342e79b3591063f93d905f79bd077c4a83b6'};
      const statePredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-state-machine-v1-sources.json',sha256:'12a0e341f53d01ca3698a3ca38d965fe70ffb54788d773f89d2773cb65f5dde2'};
      const interfacePredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-interface-v1-sources.json',sha256:'56d8dc7942792b0f3c654687ebb74041487a962605af172c26bb0313751767df'};
      const workflowPredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-workflow-v1-sources.json',sha256:'1215978693639b4bda88e1dc86e33ea8e19c9f82ad38627788ee15ad36d4309e'};
      const publicMappingPredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-public-mapping-v1-sources.json',sha256:'44b9cc3ebd70b9fc275905d4236e0cf93b2e5d6fbed602994ee7a76e3e0ac1e6'};
      const calculationPredecessor={path:'development/reconciliation-v1/profile-compiler-reconciliation/configuration-calculation-v2-sources.json',sha256:'0f6ecd3f707f218b26482245564337ea9c6c32c222bb7911609180890907a184'};
      const expected=boundarySuccessor?calculationPredecessor:calculationSuccessor?publicMappingPredecessor:publicMappingSuccessor?workflowPredecessor:workflowSuccessor?interfacePredecessor:interfaceSuccessor?statePredecessor:stateSuccessor?policyPredecessor:policySuccessor?mappingPredecessor:rulePredecessor;
      if(canonical(sourceSelection.predecessor_selection)!==canonical(expected))fail('PCR_CONFIG_SOURCE_PREDECESSOR','exact predecessor selection required');
      const previous=JSON.parse(readBound(root,expected)),ancestor=policySuccessor?JSON.parse(readBound(root,rulePredecessor)):previous;
      const middle=stateSuccessor?JSON.parse(readBound(root,mappingPredecessor)):previous;
      const policy=interfaceSuccessor?JSON.parse(readBound(root,policyPredecessor)):previous;
      const state=workflowSuccessor?JSON.parse(readBound(root,statePredecessor)):previous;
      const namedInterface=publicMappingSuccessor?JSON.parse(readBound(root,interfacePredecessor)):previous;
      const workflow=calculationSuccessor?JSON.parse(readBound(root,workflowPredecessor)):previous;
      const publicMapping=boundarySuccessor?JSON.parse(readBound(root,publicMappingPredecessor)):previous;
      if(boundarySuccessor&&canonical(previous.predecessor_selection)!==canonical(publicMappingPredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','Calculation ancestor selection mismatch');
      if(calculationSuccessor&&canonical(publicMapping.predecessor_selection)!==canonical(workflowPredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','Public Mapping ancestor selection mismatch');
      if(publicMappingSuccessor&&canonical(workflow.predecessor_selection)!==canonical(interfacePredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','Workflow ancestor selection mismatch');
      if(workflowSuccessor&&canonical(namedInterface.predecessor_selection)!==canonical(statePredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','Interface ancestor selection mismatch');
      if(interfaceSuccessor&&canonical(state.predecessor_selection)!==canonical(policyPredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','State Machine ancestor selection mismatch');
      if(stateSuccessor&&canonical(policy.predecessor_selection)!==canonical(mappingPredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','Policy ancestor selection mismatch');
      if(policySuccessor&&canonical(middle.predecessor_selection)!==canonical(rulePredecessor))fail('PCR_CONFIG_SOURCE_PREDECESSOR','ancestor selection mismatch');
      for(const key of ['project_model','typed_operations']){
        if(ancestor.sources[key].path!==config.sources[key].path||ancestor.sources[key].predecessor_sha256!==config.sources[key].sha256)fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(policySuccessor&&(middle.sources[key].path!==ancestor.sources[key].path||middle.sources[key].predecessor_sha256!==ancestor.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(stateSuccessor&&(policy.sources[key].path!==middle.sources[key].path||policy.sources[key].predecessor_sha256!==middle.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(interfaceSuccessor&&(state.sources[key].path!==policy.sources[key].path||state.sources[key].predecessor_sha256!==policy.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(boundarySuccessor&&(previous.sources[key].path!==publicMapping.sources[key].path||previous.sources[key].predecessor_sha256!==publicMapping.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(calculationSuccessor&&(publicMapping.sources[key].path!==workflow.sources[key].path||publicMapping.sources[key].predecessor_sha256!==workflow.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(publicMappingSuccessor&&(workflow.sources[key].path!==namedInterface.sources[key].path||workflow.sources[key].predecessor_sha256!==namedInterface.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
        if(workflowSuccessor&&(namedInterface.sources[key].path!==state.sources[key].path||namedInterface.sources[key].predecessor_sha256!==state.sources[key].sha256))fail('PCR_CONFIG_SOURCE_PREDECESSOR',key);
      }
      predecessors=previous.sources;
      const supportPaths={mapping_inputs:'impl/cli/src/typed-backend/mapping-inputs.ts',...(policySuccessor?{policy_rules:'impl/cli/src/typed-backend/policy-rules.ts',value_bindings:'impl/cli/src/typed-operation/value-bindings.ts'}:{}),...(stateSuccessor?{state_machine:'impl/cli/src/typed-backend/state-machine.ts'}:{}),...(interfaceSuccessor?{named_interface:'impl/cli/src/typed-backend/interface.ts',interface_version_policy:'impl/cli/src/typed-backend/interface-version-policy.ts',interface_definition:'development/reconciliation-v1/profile-compiler-reconciliation/named-interface-contract.json'}:{}),...(workflowSuccessor?{workflow_occurrences:'impl/cli/src/typed-backend/workflow-occurrences.ts',workflow_definition:'development/reconciliation-v1/profile-compiler-reconciliation/workflow-occurrence-contract.json'}:{}),...(publicMappingSuccessor?{mapping_public:'impl/cli/src/typed-backend/mapping-public.ts',public_mapping_definition:'development/reconciliation-v1/profile-compiler-reconciliation/public-mapping-contract.json'}:{}),...(calculationSuccessor?{calculation_exact:'impl/cli/src/typed-backend/calculation-exact.ts',calculation_definition:'development/reconciliation-v1/profile-compiler-reconciliation/calculation-v2-contract.json'}:{})};
      if(boundarySuccessor)Object.assign(supportPaths,{relationship_identity:'impl/cli/src/input/relationship-identity.ts',project_composition:'impl/cli/src/input/project-composition.ts',finite_projection:'impl/cli/src/formalization/projection.ts',interchange_decoder:'impl/cli/lean/DomainSpecCheckedInterchangeDecoder.lean',input_boundary_definition:'development/reconciliation-v1/profile-compiler-reconciliation/input-boundary-repair-contract.json'});
      keys(sourceSelection.support_sources,Object.keys(supportPaths));
      for(const [key,expectedPath]of Object.entries(supportPaths)){
        if(sourceSelection.support_sources[key].path!==expectedPath)fail('PCR_CONFIG_SOURCE_SELECTION','unexpected support path:'+key);
        readBound(root,sourceSelection.support_sources[key]);
      }
    }
    const selectedSources = structuredClone(config.sources);
    for (const key of ['project_model', 'typed_operations']) {
      const selected = sourceSelection.sources[key], previous = predecessors[key];
      keys(selected, ['path', 'predecessor_sha256', 'sha256']);
      if (selected.path !== previous.path || selected.predecessor_sha256 !== previous.sha256) fail('PCR_CONFIG_SOURCE_PREDECESSOR', key);
      selectedSources[key] = {path: selected.path, sha256: selected.sha256};
    }
    config = {...config, sources: selectedSources};
  }
  strings(config.languages, 'languages');
  if (canonical([...config.languages].sort()) !== canonical([...languages].sort())) fail('PCR_CONFIG_LANGUAGE', 'exactly TypeScript/Python/Rust');
  if (config.open_questions_ref !== 'PLAN.md#9-open-questions-and-proposed-decisions') fail('PCR_CONFIG_QUESTION_OWNER', 'PCR plan');
  const text = Object.fromEntries(sourceKeys.map(k => [k, readBound(root, config.sources[k])]));
  const baseline = JSON.parse(text.baseline), base = JSON.parse(text.base);
  if (baseline.baseline_id !== 'domainspec-meta-types-current-implemented@10') fail('PCR_CONFIG_BASELINE', 'expected @10');
  const rows = baseline.realization_rows;
  if (!Array.isArray(rows) || rows.length !== 39 || new Set(rows.map(r => `${r.meta_type_id}/${r.language}`)).size !== 39) fail('PCR_CONFIG_AXES', '39 distinct baseline cells');
  const kinds = new Map();
  for (const row of rows) {
    if (!languages.includes(row.language)) fail('PCR_CONFIG_LANGUAGE', row.language);
    if (kinds.has(row.meta_type_label) && kinds.get(row.meta_type_label) !== row.meta_type_id) fail('PCR_CONFIG_TYPE_ID', row.meta_type_label);
    kinds.set(row.meta_type_label, row.meta_type_id);
    for (const field of ['source', 'provider', 'binding']) {
      const ref = row[field], prefix = 'projects/domainspec-v2/';
      if (!ref.path.startsWith(prefix)) fail('PCR_CONFIG_REFERENCE_ROOT', ref.path);
      readBound(root, {...ref, path: ref.path.slice(prefix.length)});
    }
  }
  if (kinds.size !== 13 || new Set(kinds.values()).size !== 13 || !Array.isArray(config.types) || config.types.length !== 13) fail('PCR_CONFIG_TYPES', '13 metatypes');
  const seen = new Set();
  for (const t of config.types) {
    keys(t, ['kind', 'role', 'input', 'obligations', 'blocked_by']);
    if (!kinds.has(t.kind) || seen.has(t.kind)) fail('PCR_CONFIG_TYPE', t.kind);
    seen.add(t.kind); safePath(t.role);
    if (!/^(domain|application)\/[a-z]+(?:-[a-z]+)*$/.test(t.role)) fail('PCR_CONFIG_ROLE', t.role);
    keys(t.input, ['body_selector', 'typed_schema', 'decoder_source', 'decoder']);
    const expected = typedInputs[t.kind] ?? [null, 'project_model', 'decodeBody'];
    if (t.input.typed_schema !== (expected[0] ? `domainspec.${expected[0]}/v1` : null) || t.input.decoder_source !== expected[1] || t.input.decoder !== expected[2]) fail('PCR_CONFIG_INPUT_KIND', t.kind);
    if (t.input.body_selector !== `BODY_CONTRACTS.${t.kind}` || !['project_model', 'typed_operations', 'typed_backend'].includes(t.input.decoder_source)) fail('PCR_CONFIG_INPUT', t.kind);
    if (typeof t.input.decoder !== 'string' || !/^[A-Za-z]+$/.test(t.input.decoder) || !text[t.input.decoder_source].includes(`function ${t.input.decoder}(`)) fail('PCR_CONFIG_DECODER', t.kind);
    if (t.input.typed_schema !== null && (typeof t.input.typed_schema !== 'string' || !text[t.input.decoder_source].includes(`"${t.input.typed_schema}"`))) fail('PCR_CONFIG_INPUT_VERSION', t.kind);
    strings(t.obligations, `${t.kind} obligations`); strings(t.blocked_by, `${t.kind} blockers`, false);
  }
  const work = JSON.parse(text.parent_work_items);
  for (const t of config.types) for (const id of t.blocked_by) if (!work.work_items.some(w => w.id === id)) fail('PCR_CONFIG_BLOCKER', id);
  const profiles = {};
  for (const language of languages) {
    const p = JSON.parse(text[language]);
    if (p.language !== language || p.profile_id !== `architecture.${language}-strict`) fail('PCR_CONFIG_PROFILE_LANGUAGE', language);
    if (canonical(p.extends) !== canonical(['./base-domain.profile.json']) || canonical(base.extends) !== '[]') fail('PCR_CONFIG_INHERITANCE_SELECTION', language);
    const merged = mergeProfiles({'./base-domain.profile.json': base, [p.profile_id]: p}, p.profile_id);
    profiles[language] = {profile: p, ...merged};
  }
  const matrix = [];
  for (const kind of [...kinds.keys()].sort()) for (const language of languages) {
    const t = config.types.find(t => t.kind === kind), selected = profiles[language];
    const contractId = `${kind.toLowerCase().replaceAll(' ', '-')}.profile-representation`;
    const overlays = selected.profile.representation_overlays.filter(o => o.contract_id === contractId);
    if (kind !== 'Rule' && (overlays.length !== 1 || overlays[0].candidate_protocols.length !== 1)) fail('PCR_CONFIG_PROTOCOL_SELECTION', `${kind}/${language}`);
    const overlay = overlays[0] ?? null, protocol = overlay?.candidate_protocols[0] ?? null;
    if (kind === 'Rule' && overlays.length) fail('PCR_CONFIG_PROTOCOL_SELECTION', 'Rule uses explicit base constraints, not an invented protocol');
    if (protocol && (overlay.language !== language || !overlay.admitted_forms.includes(protocol.form_id))) fail('PCR_CONFIG_FORM_SELECTION', `${kind}/${language}`);
    const row = rows.find(r => r.meta_type_label === kind && r.language === language);
    if (!row) fail('PCR_CONFIG_AXES', `${kind}/${language}`);
    const constraints = [...selected.constraints.filter(c => applies(c, kind)), ...(overlay?.representation_constraints ?? [])];
    if (new Set(constraints.map(c => c.constraint_id)).size !== constraints.length) fail('PCR_CONFIG_CONSTRAINT_CONFLICT', `${kind}/${language}`);
    const extension = {typescript: 'ts', python: 'py', rust: 'rs'}[language];
    const role = language === 'typescript' ? t.role : t.role.replaceAll('-', '_');
    const example = `src/${role}/example.${extension}`;
    for (const c of constraints.filter(c => c.property_id === 'source.path' && c.operator === 'matches')) if (!new RegExp(c.expected).test(example)) fail('PCR_CONFIG_ROLE_CONFLICT', `${kind}/${language}`);
    matrix.push({meta_type_id: row.meta_type_id, kind, language, source_role: t.role,
      source_template: `src/${role}/{node}.${extension}`,
      filename_case: language === 'typescript' ? 'kebab-case' : 'snake_case',
      symbol_policy: {type: 'PascalCase', callable: language === 'typescript' ? 'camelCase' : 'snake_case', identity: 'qualified-feature-and-node', supporting_exports: 'explicit-only'},
      import_policy: {resolution: 'direct-leaf', graph_edges: 'existing-checked-domain-graph', value_bindings: 'explicit-separate-from-graph-edges', domain_to_application: 'forbidden; target identifiers are data'},
      support_policy: {shared_helpers: 'digest-bound-and-explicit-only', reference_provider: 'proof-reference-not-copyable-template', language_wiring: {typescript: 'relative-leaf-js-specifiers', python: 'explicit-package-init-and-relative-leaves', rust: 'explicit-crate-modules-and-use-leaves'}[language]},
      input: structuredClone(t.input), semantic_obligations: [...t.obligations],
      input_bounds: {body_authority: 'project_model#BODY_CONTRACTS-and-decodeBody',
        type_authority: t.input.typed_schema ? 'typed_operations#TypedType-and-decoder-limits' : 'project_model#FieldSpec-and-kind-specific-decodeBody',
        typed_forms: t.input.typed_schema ? ['scalar', 'named', 'optional', 'list', 'set', 'sum'] : [],
        typed_scalar_names: t.input.typed_schema ? ['String', 'Bool', 'UInt64'] : [],
        interpretation: 'existing-parser-vocabulary; not all forms are legal at every position or supported by the new generator',
        reference_semantics: 'declared-node-selector; not automatically embedding, identity projection or persistence key',
        current_L0_envelope: language === 'typescript' && ['Entity', 'Rule', 'Query'].includes(kind) ? 'CONTRACT.md: required String/Bool, single identity, one feature, declared factory Rule' : null,
        expanded_profile_inputs: 'require selected decoder closure and later native generation evidence'},
      profile_id: selected.profile.profile_id, profile_document_status: selected.profile.status,
      inheritance: selected.order, constraints: structuredClone(constraints),
      base_representation_contract: structuredClone(base.representation_contracts.find(c => c.contract_id === contractId) ?? null),
      overlay_selection_evidence: overlay ? structuredClone({selection_mode: overlay.selection_mode,
        admitted_forms: overlay.admitted_forms, activation_binding: overlay.activation_binding ?? null,
        missing_decision_outcome: overlay.missing_decision_outcome,
        language_mismatch_outcome: overlay.language_mismatch_outcome}) : null,
      representation: protocol ? structuredClone(protocol) : {protocol_id: null, form_id: constraints.find(c => c.property_id === 'callable.form')?.expected, source: 'base Rule constraints plus language callable constraint'},
      baseline_reference: structuredClone(row), reference_admission: 'baseline-admitted-not-generated-conformance',
      blockers: t.blocked_by.map(id => ({id, status: work.work_items.find(w => w.id === id).status})),
      generation_state: 'not-implemented-by-PCR-05', verification_required: ['native-compile', 'native-execution', 'independent-target-observer', 'semantic-negative-controls']});
  }
  const snapshot = immutable({config: structuredClone(config), matrix,
    ...(sourceSelection === null ? {} : {source_selection: structuredClone(sourceSelection), predecessor_configuration_sha256: predecessorConfigurationSha256})});
  loadedSnapshots.add(snapshot);
  return snapshot;
}

export function resolveConfiguration(request, loaded = loadConfiguration()) {
  if (!loadedSnapshots.has(loaded)) fail('PCR_CONFIG_UNCHECKED', 'load a validated configuration snapshot');
  keys(request, ['schema_version', 'language', 'module_root']);
  if (request.schema_version !== 'domainspec.compilation-selection/v1-candidate') fail('PCR_CONFIG_REQUEST_VERSION', request.schema_version);
  if (!languages.includes(request.language)) fail('PCR_CONFIG_LANGUAGE', String(request.language));
  safePath(request.module_root);
  if (!/^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/.test(request.module_root)) fail('PCR_CONFIG_PATH', 'portable module root');
  if (request.module_root.split('/').some(p => reserved.has(p))) fail('PCR_CONFIG_IDENTIFIER', 'reserved module root');
  const result = {schema_version: 'domainspec.resolved-compilation-configuration/v1-candidate', authority_effect: 'none',
    configuration_sha256: sha256(canonical(loaded.config)), selection: structuredClone(request),
    ...(loaded.source_selection ? {source_selection: structuredClone(loaded.source_selection), predecessor_configuration_sha256: loaded.predecessor_configuration_sha256} : {}),
    source_identity: structuredClone(loaded.config.sources),
    cells: structuredClone(loaded.matrix.filter(c => c.language === request.language)),
    feature_root_template: `${request.module_root}/features/{feature-id}`,
    compile_ready: false, claim_ceiling: 'configuration only; no generated-code or graph-validation claim'};
  const plan = immutable({...result, configuration_plan_sha256: sha256(canonical(result))});
  resolvedPlans.add(plan);
  return plan;
}

// Pure naming preview. Does not validate graph semantics, touch disk or grant writes.
export function previewLocations(plan, nodes) {
  if (!resolvedPlans.has(plan)) fail('PCR_CONFIG_UNCHECKED', 'resolve an in-memory configuration plan');
  if (!Array.isArray(nodes)) fail('PCR_CONFIG_NODES', 'array required');
  const seen = new Set();
  return nodes.map(n => {
    keys(n, ['feature_id', 'node_id', 'kind']);
    for (const id of [n.feature_id, n.node_id]) if (typeof id !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id)) fail('PCR_CONFIG_IDENTIFIER', String(id));
    for (const id of [n.feature_id, n.node_id]) if (reserved.has(id)) fail('PCR_CONFIG_IDENTIFIER', `reserved ${id}`);
    const cell = plan.cells.find(c => c.kind === n.kind);
    if (!cell) fail('PCR_CONFIG_TYPE', n.kind);
    const selector = `${n.feature_id}:${n.node_id}`;
    if (seen.has(selector)) fail('PCR_CONFIG_COLLISION', selector);
    seen.add(selector);
    const file = cell.language === 'typescript' ? n.node_id : n.node_id.replaceAll('-', '_');
    const root = plan.feature_root_template.replace('{feature-id}', n.feature_id);
    return {selector, kind: n.kind, module_root: root, source_path: `${root}/${cell.source_template.replace('{node}', file)}`};
  }).sort((a, b) => a.selector < b.selector ? -1 : a.selector > b.selector ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 0 && (args.length !== 2 || args[0] !== '--source-selection')) fail('PCR_CONFIG_ARGUMENT', 'use --source-selection <file> or the closed selection API');
    const sourceSelection = args.length === 0 ? null : JSON.parse(fs.readFileSync(args[1], 'utf8'));
    const loaded = loadConfiguration(undefined, project, sourceSelection);
    console.log(JSON.stringify({schema_version: 'domainspec.compilation-configuration-check/v1-candidate', status: 'pass',
      types: 13, languages: 3, cells: loaded.matrix.length, configuration_sha256: sha256(canonical(loaded.config)),
      ...(loaded.source_selection ? {source_selection: loaded.source_selection, predecessor_configuration_sha256: loaded.predecessor_configuration_sha256} : {}),
      compile_ready: false, authority_effect: 'none', generation_state: 'not-implemented-by-PCR-05'}, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
