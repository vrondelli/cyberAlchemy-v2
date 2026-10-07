import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCurrent as evaluateSelectedRoots } from './auth-v4b-native-trace-successor.mjs';

// Current syntax-wide successor to the historical v1 inventory. This records
// potential entrypoints, not type-resolved call/effect reachability.
const root = resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const implementation = resolve(root, 'auth-foundation/implementation');
const toolchain = resolve(root, 'tools/toolchain/run');
const parserManifest = fileURLToPath(new URL('./v4b-surface-inventory/Cargo.toml', import.meta.url));
const selectedRootManifests = {
  api: 'authorization-api/Cargo.toml',
  tenant: 'tenant-bridge/Cargo.toml',
  prototype: 'authentication-prototype/bridge/Cargo.toml',
  https: 'authentication-https/bridge/Cargo.toml',
};
const generatedPolicySource = 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs';
const compiledOperationGraph = 'standard-conformance/compiled-operation-graph.json';
const generatedPolicyManifest = 'standard-runtime/Cargo.toml';
const generatedPolicyPackage = 'auth-foundation-operation-auth-exact-permission-authorize';
const generatedPolicyFunctions = new Map([
  ['complete_active_roles', 'fn complete_active_roles (context : & EvaluationContext , session : & Session) -> bool'],
  ['exact_active_role_grant', 'fn exact_active_role_grant (context : & EvaluationContext , session : & Session) -> bool'],
  ['session_current', 'fn session_current (context : & EvaluationContext , session : & Session) -> bool'],
  ['trusted_scope', 'fn trusted_scope (context : & EvaluationContext) -> bool'],
  ['unique_resolved_session', 'fn unique_resolved_session (context : & EvaluationContext) -> bool'],
  ['allow_iff', 'fn allow_iff (context : & EvaluationContext) -> bool'],
  ['authorization_admissible', 'fn authorization_admissible (context : & EvaluationContext , session : & Session) -> bool'],
  ['default_deny', 'fn default_deny (context : & EvaluationContext) -> bool'],
  ['authorize', 'fn authorize (context : & EvaluationContext) -> AuthorizationDecision'],
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => { throw new Error(`AUTH_V4B_NATIVE_ENDPOINTS_V2:${code}`); };

const known = [
  ['ready-decision', 'authorization-ready-decision/src/lib.rs', 'free', null, 'authorize'],
  ['generated-policy', 'standard-runtime/src/domainspec/rust/auth-exact-permission/authorize.rs', 'free', null, 'authorize'],
  ['sqlite-service', 'sqlite-provider/src/lib.rs', 'impl', 'SqliteAuthorizationService < C >', 'authorize'],
  ['sqlite-transaction', 'sqlite-provider/src/lib.rs', 'free', null, 'authorize_in_transaction'],
  ['sqlite-snapshot', 'sqlite-provider/src/lib.rs', 'impl', "SqliteAuthorizationStateSnapshot < '_ >", 'authorize'],
  ['runtime-adapter', 'runtime-adapter/src/lib.rs', 'impl', 'AuthorizationAdapter < S , R , E , V , C >', 'authorize'],
  ['runtime-resolved', 'runtime-adapter/src/lib.rs', 'free', null, 'authorize_resolved'],
  ['lower-ready-authority', 'authorization-ready-authority/src/lib.rs', 'free', null, 'with_ready_in_transaction'],
  ['legacy-service-facade', 'authorization-service/src/lib.rs', 'impl', 'SqliteAuthService < C >', 'authorize'],
  ['legacy-boundary-trait', 'trusted-boundary/src/lib.rs', 'trait', 'AuthorizationDecisionService', 'authorize'],
  ['legacy-boundary-wrapper', 'trusted-boundary/src/lib.rs', 'impl', 'TrustedAuthorizationBoundary < A , R , D >', 'authorize'],
  ['v2-boundary-trait', 'trusted-boundary-v2/src/lib.rs', 'trait', 'AuthorizationDecisionService', 'authorize'],
  ['v2-boundary-wrapper', 'trusted-boundary-v2/src/lib.rs', 'impl', 'TrustedAuthorizationBoundary < A , R , D >', 'authorize'],
  ['pre-resolved-borrowed-dispatch', 'trusted-boundary-pre-resolved-v2-candidate/src/lib.rs', 'impl', "BorrowedDecision < '_ , D >", 'authorize'],
  ['pre-resolved-wrapper', 'trusted-boundary-pre-resolved-v2-candidate/src/lib.rs', 'free', null, 'authorize_pre_resolved'],
  ['command-boundary-gate', 'command-boundary-runtime-v2/src/domainspec/rust/auth-command-boundary/admit-authorization-command.rs', 'free', null, 'admit_authorization_command'],
  ['admission-service-with-ready', 'authorization-admission-service/src/lib.rs', 'impl', 'SqliteAdmissionService < C >', 'with_ready'],
  ['api-runtime-authorize', 'authorization-api/src/lib.rs', 'impl', 'AuthorizationRuntime', 'authorize'],
  ['api-http-authorize', 'authorization-api/src/lib.rs', 'free', null, 'authorize'],
  ['tenant-bridge-evaluate', 'tenant-bridge/src/main.rs', 'free', null, 'evaluate'],
  ['prototype-bridge-evaluate', 'authentication-prototype/bridge/src/main.rs', 'free', null, 'evaluate'],
  ['https-bridge-evaluate', 'authentication-https/bridge/src/main.rs', 'free', null, 'evaluate'],
];

export function rustFiles(directory) {
  const files = [], symlinks = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['target', 'node_modules', '.git'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) symlinks.push(path);
    else if (entry.isDirectory()) {
      const nested = rustFiles(path);
      files.push(...nested.files);
      symlinks.push(...nested.symlinks);
    } else if (entry.isFile() && entry.name.endsWith('.rs')) files.push(path);
  }
  return { files: files.sort(), symlinks: symlinks.sort() };
}

function packageName(manifest) {
  let inPackage = false;
  for (const line of readFileSync(manifest, 'utf8').split(/\r?\n/)) {
    const section = line.match(/^\s*\[([^\]]+)\]/);
    if (section) inPackage = section[1] === 'package';
    if (inPackage) {
      const name = line.match(/^\s*name\s*=\s*"([^"]+)"/);
      if (name) return name[1];
    }
  }
  fail(`package-name:${relative(implementation, manifest)}`);
}

function ownerPackage(path) {
  let directory = dirname(path);
  while (directory.startsWith(implementation) && directory !== implementation) {
    const manifest = join(directory, 'Cargo.toml');
    try {
      if (statSync(manifest).isFile()) return { name: packageName(manifest), manifest };
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    directory = dirname(directory);
  }
  return null;
}

function normalCargoPackages(manifest) {
  const output = execFileSync(toolchain, [
    'cargo', 'metadata', '--locked', '--offline', '--format-version', '1',
    '--manifest-path', manifest,
  ], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const metadata = JSON.parse(output);
  const packages = new Map(metadata.packages.map(item => [item.id, item]));
  const nodes = new Map(metadata.resolve.nodes.map(item => [item.id, item]));
  const pending = [metadata.resolve.root], seen = new Set();
  while (pending.length) {
    const id = pending.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const dependency of nodes.get(id)?.deps ?? []) {
      if (dependency.dep_kinds.some(kind => kind.kind === null || kind.kind === 'normal')) {
        pending.push(dependency.pkg);
      }
    }
  }
  return [...seen].map(id => packages.get(id)).filter(item => item?.manifest_path.startsWith(implementation));
}

export function parseSurface(source) {
  const output = execFileSync(toolchain, [
    'cargo', 'run', '--quiet', '--locked', '--offline', '--manifest-path',
    parserManifest,
  ], { cwd: root, input: source, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const parsed = JSON.parse(output);
  if (parsed.schema_version !== 'auth-foundation.v4b-rust-surface/v1-candidate' ||
      parsed.cfg_expanded !== false || parsed.types_resolved !== false ||
      parsed.transitive_effect_closure !== false || !Array.isArray(parsed.functions) ||
      !Array.isArray(parsed.opaque)) fail('parser-posture');
  return parsed;
}

const suspect = row => /^(?:authorize(?:_|$)|with_ready|admit_|evaluate$|decide$)/.test(row.name) ||
  /AuthorizationDecision|BinaryAuthorizationDecision|AuthorizationOutcome|AdmissionOutcome/.test(row.return_type);
const effectHook = row => /^(?:decision_time|resolve_|current_authorization_revision)/.test(row.name);
export const sourceRole = (source, row, owner) => {
  if (source.startsWith('.')) return 'hidden-source-candidate';
  if (owner === null) return 'unbound-source-candidate';
  if (source.startsWith('current-runtime-successor-v1/')) return 'historical-mirror';
  if (source.includes('/tests/') || /\/src\/(?:[\w-]*tests?|test_[\w-]*)\.rs$/.test(source)) {
    return 'test-only-or-cfg-test';
  }
  const cfg = row.cfg.map(condition => condition.replace(/\s+/g, ''));
  if (cfg.includes('#[cfg(test)]')) return 'test-only-or-cfg-test';
  if (cfg.some(condition => condition !== '#[cfg(not(test))]')) return 'cfg-conditional-candidate';
  return 'production-source-candidate';
};

export function matchKnown(functions) {
  return known.map(([id, source, kind, owner, name]) => {
    const matches = functions.filter(row => row.source === source && row.kind === kind &&
      row.owner === owner && row.name === name);
    if (matches.length !== 1) fail(`known-entrypoint:${id}:${matches.length}`);
    return { id, ...matches[0] };
  });
}

export function assertSelectedProductionClassified(rows) {
  const unexpected = rows.filter(row => row.source_role === 'production-source-candidate' &&
    row.selected_root_cargo_membership.length > 0);
  if (unexpected.length) fail(`unclassified-selected-production:${unexpected.map(row =>
    `${row.source}:${row.kind}:${row.owner ?? ''}:${row.name}`).join(',')}`);
}

export function assertScannedCargoTargets(packages, scanned, id) {
  for (const item of packages) {
    for (const target of item.targets) {
      if (!scanned.has(resolve(target.src_path))) {
        fail(`selected-target-unscanned:${id}:${relative(implementation, target.src_path)}`);
      }
    }
  }
}

export function assertGeneratedPolicyCargoTarget(packagesByRoot) {
  const manifest = resolve(implementation, generatedPolicyManifest);
  const source = resolve(implementation, generatedPolicySource);
  if (JSON.stringify(Object.keys(packagesByRoot).sort()) !==
      JSON.stringify(Object.keys(selectedRootManifests).sort())) fail('generated-policy-root-set');
  for (const [rootId, packages] of Object.entries(packagesByRoot)) {
    const matched = packages.filter(item => resolve(item.manifest_path) === manifest);
    if (matched.length !== 1 || matched[0].name !== generatedPolicyPackage ||
        matched[0].targets.length !== 1 ||
        resolve(matched[0].targets[0].src_path) !== source ||
        JSON.stringify(matched[0].targets[0].kind) !== JSON.stringify(['lib'])) {
      fail(`generated-policy-cargo-target:${rootId}`);
    }
  }
}

// Bind the conservative protection set to DomainSpec's typed Rule closure,
// not to Rust names that merely look like authorization functions.
export function policyBindingContract(source, graph) {
  const closure = graph?.typed_closure;
  const operation = closure?.operation;
  if (graph?.root_selector !== 'auth-exact-permission:authorize' ||
      closure?.root_selector !== graph.root_selector ||
      operation?.schema_version !== 'domainspec.typed-operation/v1' ||
      operation.ontology_operation !== 'AUTH-OP-AUTHORIZE' ||
      !Array.isArray(closure.rules) || !Array.isArray(closure.nodes)) {
    fail('policy-binding-typed-closure');
  }
  const digest = source.match(/pub const DOMAINSPEC_TYPED_CLOSURE_SHA256: &str =\s*"([a-f0-9]{64})";/);
  if (!digest || digest[1] !== closure.closure_sha256) fail('policy-binding-closure-digest');
  const block = source.match(/pub const DOMAINSPEC_RULE_IMPLEMENTATION_BINDINGS: &\[\(&str, &str, &str\)\] = &\[([\s\S]*?)\];/);
  if (!block) fail('policy-binding-generated-table');
  const lines = block[1].split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const bindings = lines.map(line => {
    const match = line.match(/^\("([A-Z0-9-]+)", "([a-z0-9:-]+)", "([a-z][a-z0-9_]*)"\),$/);
    if (!match) fail('policy-binding-generated-row');
    return { ontology_rule: match[1], domainspec_selector: match[2], name: match[3] };
  });
  const expected = closure.rules.map(rule => ({ ontology_rule: rule.ontology_rule,
    domainspec_selector: rule.domainspec_selector,
    name: rule.domainspec_selector?.split(':').at(-1).replaceAll('-', '_') }));
  const sort = rows => rows.map(row => JSON.stringify(row)).sort();
  if (new Set(bindings.map(row => row.name)).size !== bindings.length ||
      JSON.stringify(sort(bindings)) !== JSON.stringify(sort(expected)) ||
      JSON.stringify(sort(closure.nodes.filter(node => node.kind === 'Rule').map(node => ({
        ontology_rule: node.typed_contract?.ontology_rule,
        domainspec_selector: node.selector,
        name: node.selector?.split(':').at(-1).replaceAll('-', '_'),
      })))) !== JSON.stringify(sort(expected)) ||
      bindings.length !== generatedPolicyFunctions.size - 1) {
    fail('policy-binding-rule-join');
  }
  return new Map(bindings.map(row => [row.name, row]));
}

// This is a syntax discovery gate, not a decision about which Boolean
// predicates independently count as downstream authorization entrypoints.
export function generatedPolicySurface(functions, opaque, roots, ruleBindings) {
  const rows = functions.filter(row => row.source === generatedPolicySource);
  const opaqueRows = opaque.filter(row => row.source === generatedPolicySource);
  if (JSON.stringify(Object.keys(roots).sort()) !==
      JSON.stringify(Object.keys(selectedRootManifests).sort())) fail('generated-policy-root-set');
  if (opaqueRows.length !== 0) fail(`generated-policy-opaque:${opaqueRows.map(row => row.kind).join(',')}`);
  if (rows.length !== generatedPolicyFunctions.size) fail(`generated-policy-count:${rows.length}`);
  if (!(ruleBindings instanceof Map) || ruleBindings.size !== rows.length - 1 ||
      ruleBindings.has('authorize')) fail('generated-policy-rule-bindings');
  const seen = new Set();
  for (const row of rows) {
    const expectedSignature = generatedPolicyFunctions.get(row.name);
    if (seen.has(row.name) || expectedSignature === undefined || row.kind !== 'free' ||
        row.owner !== null || row.module.length !== 0 || row.visibility !== 'pub' ||
        row.signature !== expectedSignature || row.cfg.length !== 0 ||
        row.crate !== generatedPolicyPackage || row.package_manifest !== generatedPolicyManifest ||
        row.source_role !== 'production-source-candidate') {
      fail(`generated-policy-function:${row.name}`);
    }
    seen.add(row.name);
    if (row.name !== 'authorize' && !ruleBindings.has(row.name)) {
      fail(`generated-policy-rule-binding:${row.name}`);
    }
  }
  if (seen.size !== generatedPolicyFunctions.size) fail('generated-policy-missing');
  if (Object.values(roots).some(root => !root.manifests.includes(generatedPolicyManifest))) {
    fail('generated-policy-selected-membership');
  }
  return rows.map(row => ({ source: row.source, crate: row.crate,
    package_manifest: row.package_manifest, name: row.name, kind: row.kind,
    visibility: row.visibility, signature: row.signature, return_type: row.return_type,
    role: row.name === 'authorize' ? 'known-full-decision-entrypoint' :
      'policy-callable-role-unresolved',
    protection_role: row.name === 'authorize' ? 'authorization-decision' :
      'authorization-policy-predicate',
    conservative_downstream_risk: true,
    domainspec_binding: ruleBindings.get(row.name) ?? {
      ontology_operation: 'AUTH-OP-AUTHORIZE',
      domainspec_selector: 'auth-exact-permission:authorize',
    },
    selected_root_cargo_membership: Object.keys(roots).sort(),
  })).sort((left, right) => left.name.localeCompare(right.name));
}

export function evaluateCurrent() {
  const selected = evaluateSelectedRoots();
  if (selected.status !== 'indeterminate' || selected.endpoint_set_closed !== false ||
      selected.runtime_guarantees_observed !== false) fail('selected-posture');
  const { files, symlinks } = rustFiles(implementation);
  if (files.length === 0) fail('no-rust-sources');
  const functions = [], opaque = [], sourceHashes = {};
  for (const path of symlinks) opaque.push({ source: relative(implementation, path),
    kind: 'unresolved-symlink-source', cfg: [] });
  for (const path of files) {
    const source = relative(implementation, path);
    const bytes = readFileSync(path);
    sourceHashes[source] = sha(bytes);
    const parsed = parseSurface(bytes.toString('utf8'));
    const owner = ownerPackage(path);
    for (const row of parsed.functions) functions.push({ source, crate: owner?.name ?? null,
      package_manifest: owner ? relative(implementation, owner.manifest) : null,
      source_role: sourceRole(source, row, owner), ...row });
    for (const row of parsed.opaque) opaque.push({ source, crate: owner?.name ?? null,
      package_manifest: owner ? relative(implementation, owner.manifest) : null, ...row });
  }
  const scanned = new Set(files);
  const packagesByRoot = Object.fromEntries(Object.entries(selectedRootManifests).map(
    ([id, path]) => [id, normalCargoPackages(resolve(implementation, path))]));
  assertGeneratedPolicyCargoTarget(packagesByRoot);
  const roots = Object.fromEntries(Object.entries(packagesByRoot).map(([id, packages]) => {
    assertScannedCargoTargets(packages, scanned, id);
    const names = packages.map(item => item.name).filter(name => name.startsWith('auth-')).sort();
    if (JSON.stringify(names) !== JSON.stringify(selected.roots[id]?.local_crates)) {
      fail(`cargo-identity-drift:${id}`);
    }
    return [id, { names, manifests: packages.map(item =>
      relative(implementation, item.manifest_path)).sort() }];
  }));
  const withReachability = row => ({ ...row,
    selected_root_cargo_membership: Object.keys(roots).filter(id =>
      row.package_manifest !== null && roots[id].manifests.includes(row.package_manifest)),
  });
  const suspects = functions.filter(suspect).map(withReachability);
  const ruleBindings = policyBindingContract(
    readFileSync(resolve(implementation, generatedPolicySource), 'utf8'),
    JSON.parse(readFileSync(resolve(implementation, compiledOperationGraph), 'utf8')));
  const generatedPolicyCallables = generatedPolicySurface(functions, opaque, roots, ruleBindings);
  const effectHooks = functions.filter(effectHook).map(withReachability);
  const knownRows = matchKnown(functions).map(withReachability);
  const lowerAuthority = knownRows.find(row => row.id === 'lower-ready-authority');
  const knownKeys = new Set(knownRows.map(row => `${row.source}|${row.kind}|${row.owner}|${row.name}`));
  const unclassified = suspects.filter(row => !knownKeys.has(
    `${row.source}|${row.kind}|${row.owner}|${row.name}`));
  assertSelectedProductionClassified(unclassified);
  const sourceSetSha = sha(Buffer.from(Object.entries(sourceHashes)
    .map(([path, digest]) => `${path}\0${digest}\n`).join('')));
  return {
    schema_version: 'auth-v4b-native-endpoint-inventory/v2-candidate',
    status: 'indeterminate',
    source_set_sha256: sourceSetSha,
    rust_source_count: files.length,
    parsed_function_count: functions.length,
    decision_shaped_suspect_count: suspects.length,
    effect_hook_suspect_count: effectHooks.length,
    production_source_suspect_count: suspects.filter(row =>
      row.source_role === 'production-source-candidate').length,
    known_entrypoint_count: knownRows.length,
    generated_policy_callable_count: generatedPolicyCallables.length,
    generated_policy_callables: generatedPolicyCallables,
    protected_generated_policy_surface_complete: true,
    generated_policy_endpoint_roles_closed: false,
    unclassified_suspect_count: unclassified.length,
    unclassified_selected_production_suspect_count: 0,
    opaque_edge_count: opaque.length,
    public_capturing_lower_authority: lowerAuthority.visibility === 'pub' &&
      lowerAuthority.signature.includes('impl FnOnce'),
    known_entrypoints: knownRows,
    unclassified_suspects: unclassified,
    effect_hook_suspects: effectHooks,
    opaque_edges: opaque,
    selected_root_cargo_closures: Object.fromEntries(Object.entries(roots).map(([id, value]) =>
      [id, value.names])),
    selected_root_package_manifests: Object.fromEntries(Object.entries(roots).map(([id, value]) =>
      [id, value.manifests])),
    source_sha256: sourceHashes,
    open_effects: [
      'generated-policy Rule helpers protected as downstream predicates; exact business endpoint roles unresolved',
      'public raw-command SQLite/runtime entrypoints outside selected roots',
      ...(lowerAuthority.visibility === 'pub' && lowerAuthority.signature.includes('impl FnOnce')
        ? ['public lower READY authority accepts captured FnOnce; DENY drop effects unclosed'] : []),
      'cfg and macro expansion; dynamic/trait/function-pointer targets',
      'callbacks, Drop, SQL, FFI, panic/unwind, and root-set completeness',
    ],
    cfg_expanded: false,
    types_resolved: false,
    transitive_effect_closure: false,
    endpoint_set_closed: false,
    all_path_ready_dominance: false,
    runtime_guarantees_observed: false,
    claim_limit: 'Current Rust syntax surface joined to four selected normal Cargo closures and the compiled DomainSpec Rule/Operation closure. All nine generated policy callables are in the protected downstream set, but exact helper business endpoint roles, complete roots, cfg/macro expansion, dynamic targets, effects, all-path READY dominance, and runtime observation remain open.',
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = evaluateCurrent();
    if (process.argv.includes('--summary')) {
      const { source_sha256, opaque_edges, unclassified_suspects, effect_hook_suspects,
        selected_root_cargo_closures,
        ...summary } = result;
      console.log(JSON.stringify({ ...summary,
        unclassified_suspects: unclassified_suspects.map(row => ({
          source: row.source, crate: row.crate, kind: row.kind, owner: row.owner,
          name: row.name, selected_root_cargo_membership: row.selected_root_cargo_membership,
        })),
        opaque_edge_count: opaque_edges.length,
        selected_root_cargo_closures,
      }, null, 2));
    } else console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
