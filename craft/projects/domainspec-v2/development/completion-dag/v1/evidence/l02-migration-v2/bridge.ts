import { readFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { buildMintedProjectViews } from '../../../../../impl/tools/minted-project/views.js';
import { deriveEnforcesObligations, loadEvfS1Bundle } from '../../../../../impl/test-derivation-engine/src/minted-project/derive.js';
import type { KeyDoorBindingContract } from '../../../../../impl/test-derivation-engine/src/minted-project/types.js';
import { machineDerive as legacyMachineDerive } from '../l02-migration-v1/bridge.js';
export { checkedDerive, gitChanges, validateChanged } from '../l02-migration-v1/bridge.js';

const packagePath = 'projects/domainspec-v2/development/completion-dag/v1/evidence/l02-migration-v2';
const fixturePath = 'projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door';
const sha = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
interface Ref {path: string; sha256: string}
interface Profile {candidate_id: string; profile_id: string; source_manifest_sha256: string; binding_sha256: string}
// This package-local profile is part of the candidate code/output-manifest boundary.
const profile: Profile = JSON.parse(readFileSync(new URL('./profile.json', import.meta.url), 'utf8'));

function sourceFile(root: string, path: string) {
  if (isAbsolute(path) || path.includes('\\') || path.split('/').some(p => !p || p === '.' || p === '..')) throw Error(`invalid source path: ${path}`);
  const absolute = resolve(root, path);
  const rel = relative(realpathSync(root), realpathSync(absolute));
  if (isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) throw Error(`source escapes repository: ${path}`);
  return absolute;
}
function pinnedBytes(root: string, path: string, digest: string) {
  const bytes = readFileSync(sourceFile(root, path));
  if (sha(bytes) !== digest) throw Error(`source drift: ${path}`);
  return bytes;
}
export function verifySources(root: string) {
  const manifest = JSON.parse(pinnedBytes(root, `${packagePath}/source-manifest.json`, profile.source_manifest_sha256).toString()) as {files: Ref[]};
  if (!Array.isArray(manifest.files) || !manifest.files.length) throw Error('empty source manifest');
  for (const ref of manifest.files) pinnedBytes(root, ref.path, ref.sha256);
  return manifest.files.length;
}
export function selectedBundle(root: string) {
  verifySources(root);
  const previous = loadEvfS1Bundle(root);
  const binding: KeyDoorBindingContract = JSON.parse(pinnedBytes(root, `${packagePath}/key-door-binding.json`, profile.binding_sha256).toString());
  const retained = {...binding, lineage_refs: {...binding.lineage_refs,
    generated_graph: previous.binding.lineage_refs.generated_graph,
    generated_source_manifest: previous.binding.lineage_refs.generated_source_manifest}};
  if (!isDeepStrictEqual(retained, previous.binding)) throw Error('successor exceeds the two generated-reference delta');
  const built = buildMintedProjectViews(resolve(root, fixturePath));
  for (const [bytes, ref] of [[built.graphBytes, binding.lineage_refs.generated_graph], [built.sourceManifestBytes, binding.lineage_refs.generated_source_manifest]] as const) {
    if (bytes !== pinnedBytes(root, ref.path, ref.sha256).toString() || Buffer.byteLength(bytes) !== ref.size_bytes) throw Error(`compiler reproduction mismatch: ${ref.path}`);
  }
  if (built.buildReceiptBytes !== readFileSync(sourceFile(root, `${fixturePath}/expected/build-receipt.json`), 'utf8')) throw Error('compiler build receipt mismatch');
  return {...previous, binding};
}
export function machineDerive(root: string, requestedProfile: string) {
  if (requestedProfile === 'evf-s1') return legacyMachineDerive(root, requestedProfile);
  if (requestedProfile !== 'evf-s1-migration-002') return {status: 'unsupported' as const, profile: requestedProfile, diagnostics: ['No mapped machine profile; no fallback']};
  try {
    if (profile.profile_id !== requestedProfile || profile.candidate_id !== 'DSV2-L02-MIGRATION-PROTOTYPE-002') throw Error('invalid migration profile identity');
    const bundle = selectedBundle(root);
    const obligations = deriveEnforcesObligations(root, bundle);
    verifySources(root);
    return {status: 'pass' as const, profile: requestedProfile, candidate_id: profile.candidate_id, obligations};
  } catch (error) {
    return {status: 'reject' as const, profile: requestedProfile, diagnostics: [error instanceof Error ? error.message : String(error)]};
  }
}
