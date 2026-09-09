import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {checkImplementationManifest} from '../../../../runtime/scripts/check-implementation-manifest.mjs';
import {loadVerifiedDecisionProfile} from '../../../../../implementation/agent-reasoning-engine/packages/request-decision-router/src/profile-loader.mjs';

const root = fileURLToPath(new URL('../../../../../../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const readCandidate = () => JSON.parse(readFileSync(new URL('./candidate.json', import.meta.url)));
const extraPaths = [
  "workspace/experiments/control-center/candidates/cc-005/validate.mjs",
  "workspace/experiments/control-center/native-test/campaign/selected.mjs",
  "workspace/experiments/control-center/native-test/campaign/selected.wdio.conf.mjs",
  "workspace/experiments/control-center/native-test/campaign/selected.test.mjs",
  "workspace/experiments/control-center/native-test/measurement-v2/loader.mjs",
  "workspace/experiments/control-center/native-test/measurement-v2/register.mjs",
  "workspace/experiments/control-center/native-test/measurement-v2/loader.test.mjs",
  "workspace/experiments/control-center/native-test/measurement-v2/wdio.conf.mjs",
  "implementation/agent-reasoning-engine/packages/request-decision-router/test/recent.test.mjs",
  "workspace/experiments/control-center/native-test/campaign/analyze.mjs",
  "workspace/experiments/control-center/native-test/campaign/collect.mjs",
  "workspace/experiments/control-center/native-test/campaign/evidence.mjs",
  "workspace/experiments/control-center/native-test/campaign/bundle.mjs",
  "workspace/experiments/control-center/native-test/campaign/probe.mjs",
  "workspace/experiments/control-center/native-test/campaign/protocol.json",
  "workspace/experiments/control-center/native-test/campaign/measurement-loader.mjs",
  "workspace/experiments/control-center/native-test/campaign/measurement-register.mjs",
  "workspace/experiments/control-center/native-test/cc004.vitest.config.mjs",
  "workspace/experiments/control-center/native-test/cc004.wdio.conf.mjs",
  "workspace/experiments/control-center/candidates/cc-004/validate.mjs",
  "workspace/runtime/wdio/specs/unified-workspace.e2e.mjs",
  "workspace/runtime/wdio/wdio.conf.mjs",
  'implementation/agent-reasoning-engine/packages/request-decision-router/test/locate.test.mjs',
  'workspace/runtime/src/features/control-center/layout.ts',
  'workspace/runtime/src/features/control-center/control-center.css',
  'workspace/runtime/src/features/control-center/layout.test.ts',
  'workspace/runtime/src/features/chat/ChatSurface.test.ts',
  'workspace/runtime/src/styles.css', 'workspace/runtime/package.json',
  'workspace/runtime/wdio/vite.config.mjs', 'workspace/runtime/wdio/frontend-bootstrap.ts',
  'workspace/runtime/scripts/check-implementation-manifest.mjs',
  'essays/development/agent-runtime/implementation/desktop/src-tauri/tauri.conf.json',
  'workspace/interaction-definition-pack/DEFINITION-PACK.candidate.json',
  'workspace/experiments/control-center/system.json',
].map(path => 'cyberAlchemy-v2/' + path).sort();

export function validate(candidate = readCandidate()) {
  const errors = [];
  const check = (test, code) => { if (!test) errors.push(code); };
  check(candidate.schema_version === 'cav2-control-center-selected-candidate/v1' && candidate.candidate_id === 'CC-005', 'candidate-identity');
  check(candidate.status === 'candidate' && candidate.authority_effect === 'none' && candidate.approval === 'not-requested' && candidate.inherited_evidence?.length === 0, 'claim-ceiling');
  check(candidate.closure_ceiling === 'selected-source-inventory-not-transitive-build-closure', 'closure-ceiling');
  const readBound = source => {
    try {
      const path = resolve(root, source.path);
      const rel = relative(root, path);
      if (isAbsolute(source.path) || rel.startsWith('..') || isAbsolute(rel)) throw new Error('path-escape');
      const bytes = readFileSync(path);
      check(sha(bytes) === source.sha256, 'source-drift:' + source.path);
      return bytes;
    } catch (error) { errors.push('source-read:' + source?.path + ':' + error.message); return null; }
  };
  check(candidate.previous?.path === 'cyberAlchemy-v2/workspace/experiments/control-center/candidates/cc-004/candidate.json', 'lineage-path');
  const previousBytes = readBound(candidate.previous);
  const previous = previousBytes ? JSON.parse(previousBytes) : null;
  const extras = candidate.additional_sources ?? [];
  check(JSON.stringify(extras.map(s => s.path).sort()) === JSON.stringify(extraPaths), 'additional-source-coverage');
  extras.forEach(readBound);
  const added=extras.filter(s=>!previous?.additional_sources?.some(p=>p.path===s.path));
  check(JSON.stringify(added)===JSON.stringify(candidate.added_sources), 'addition-ledger');
  check((previous?.additional_sources??[]).every(p=>extras.some(s=>s.path===p.path&&s.sha256===p.sha256)), 'preserved-apparatus');
  const closure = candidate.legacy_binding?.bindings?.are_governed_chat?.source_closure ?? [];
  const oldClosure = previous?.legacy_binding?.bindings?.are_governed_chat?.source_closure ?? [];
  check(JSON.stringify(closure.map(s => s.path)) === JSON.stringify(oldClosure.map(s => s.path)), 'legacy-source-coverage');
  const changes = closure.flatMap(s => {
    const old = oldClosure.find(o => o.path === s.path);
    return old && old.sha256 !== s.sha256 ? [{path:s.path,previous_sha256:old.sha256,current_sha256:s.sha256}] : [];
  });
  check(JSON.stringify(changes) === JSON.stringify(candidate.changed_sources), 'change-ledger');
  closure.forEach(readBound);
  let binding = null;
  try { binding = checkImplementationManifest({manifest:candidate.legacy_binding}); }
  catch (error) { errors.push('legacy-binding:' + (error.code ?? error.message)); }
  const profilePath = resolve(root, 'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json');
  const profile = JSON.parse(readFileSync(profilePath));
  const registry = JSON.parse(readFileSync(resolve(root, 'cyberAlchemy-v2/agent-routing/routes.json')));
  const missingPolicies = registry.routes.filter(r => ![registry.entry_route_id, 'CA2-ROUTE-AMBIGUOUS'].includes(r.route_id) && !profile.route_policies.some(p => p.route_id === r.route_id)).map(r => r.route_id);
  const nested = loadVerifiedDecisionProfile(profilePath, root);
  return {
    candidate_id: candidate.candidate_id,
    selected_binding: errors.length ? 'FAIL' : 'PASS',
    errors,
    nested_runtime_profile: nested.ok ? {status:'PASS'} : {status:'FAIL',reason_codes:nested.reason_codes},
    missing_route_policies: missingPolicies,
    selected_runtime_prerequisites_pass: errors.length === 0 && nested.ok && missingPolicies.length === 0,
    legacy_binding_report: binding,
    historical_budget_comparison: candidate.historical_budget_comparison,
    authority_effect:'none', approval:'not-requested',
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = validate();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.selected_runtime_prerequisites_pass ? 0 : 1;
}
