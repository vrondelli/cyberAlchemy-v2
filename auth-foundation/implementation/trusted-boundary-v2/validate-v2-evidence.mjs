import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const authRoot = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const repoRoot = realpathSync(join(authRoot, '..'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(`AUTH_CB_V2_EVIDENCE:${message}`); };
const read = path => {
  if (isAbsolute(path) || path.includes('\\') || path.split('/').some(part => !part || part === '.' || part === '..')) fail(`path:${path}`);
  let selected = authRoot;
  for (const part of path.split('/')) {
    selected = join(selected, part);
    if (lstatSync(selected).isSymbolicLink()) fail(`symlink:${path}`);
  }
  if (relative(authRoot, selected).startsWith('..') || realpathSync(selected) !== selected || !lstatSync(selected).isFile()) fail(`scope:${path}`);
  return readFileSync(selected);
};
const evidence = JSON.parse(read('implementation/standard-conformance/command-boundary-v2-candidate-evidence.json'));
if (evidence.schema_version !== 'auth-foundation.command-boundary-v2-candidate-evidence/v1' ||
    evidence.status !== 'tested-local-candidate-not-admitted' || evidence.authority_effect !== 'none' ||
    evidence.neutral_set_eligible !== false || evidence.can_satisfy_f5 !== false) fail('claim-ceiling');
for (const ref of [...evidence.predecessor_preserved, ...evidence.selected_artifacts]) {
  if (!/^[0-9a-f]{64}$/.test(ref.sha256) || digest(read(ref.path)) !== ref.sha256) fail(`stale:${ref.path}`);
}
const sourceRoot = join(authRoot, 'implementation/command-boundary-source-v2');
const walk = (path, prefix = '') => readdirSync(path, { withFileTypes: true }).flatMap(entry => {
  if (entry.isSymbolicLink()) fail(`source-symlink:${prefix}${entry.name}`);
  const name = `${prefix}${entry.name}`;
  const selected = join(path, entry.name);
  if (entry.isDirectory()) return walk(selected, `${name}/`);
  if (!entry.isFile()) fail(`source-kind:${name}`);
  return [`${name}:${digest(readFileSync(selected))}`];
}).sort();
const sourceLines = walk(sourceRoot);
if (sourceLines.length !== evidence.instantiation.source_tree_file_count ||
    digest(`${sourceLines.join('\n')}\n`) !== evidence.instantiation.source_tree_sha256) fail('source-tree-stale');
const cli = (...args) => {
  const result = spawnSync(process.execPath, [
    join(repoRoot, 'craft/projects/domainspec-v2/impl/cli/node_modules/tsx/dist/cli.mjs'),
    join(repoRoot, 'craft/projects/domainspec-v2/impl/cli/src/cli/main.ts'),
    'receipt', ...args,
  ], { cwd: repoRoot, env: { ...process.env, TMPDIR: '/var/tmp' }, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 || result.error) fail(`cli-receipt:${args[0]}:${result.error?.message ?? result.stderr.slice(0, 500)}`);
  try { return JSON.parse(result.stdout); } catch { fail(`cli-json:${args[0]}`); }
};
const sourceManifest = cli(sourceRoot);
if (sourceManifest.schema_version !== 'domainspec.stable-foundation-cli.source-manifest/v1' ||
    sourceManifest.project_id !== 'auth-foundation-command-boundary-v2' ||
    sourceManifest.manifest_sha256 !== evidence.instantiation.source_manifest_sha256) fail('source-manifest-stale');
const receipt = JSON.parse(read('implementation/command-boundary-runtime-v2/.domainspec/instantiations/auth-command-boundary.admit-authorization-command.json'));
if (receipt.schema_version !== 'domainspec.instantiation-receipt/v1' ||
    receipt.input?.project_id !== 'auth-foundation-command-boundary-v2' ||
    receipt.input?.source_manifest_sha256 !== sourceManifest.manifest_sha256 ||
    receipt.receipt_sha256 !== evidence.instantiation.receipt_sha256 ||
    receipt.authority_effect !== 'none') fail('instantiation');
const observed = cli(join(authRoot, 'implementation/command-boundary-runtime-v2'));
if (observed.observation?.result !== 'pass' ||
    observed.receipt?.receipt_sha256 !== receipt.receipt_sha256) fail('receipt-observation');
const generatedRoot = 'implementation/command-boundary-runtime-v2/';
if (receipt.artifacts?.length !== 2 || receipt.artifacts.some(row =>
    !evidence.selected_artifacts.some(ref => ref.path === `${generatedRoot}${row.relative_path}` && ref.sha256 === row.sha256 && read(ref.path).length === row.size_bytes))) fail('generated-artifacts');
const wrapper = read('implementation/trusted-boundary-v2/Cargo.toml').toString('utf8');
if (!wrapper.includes('package = "auth-foundation-command-boundary-v2-auth-command-boundary-admit-authorization-command"') ||
    !wrapper.includes('path = "../command-boundary-runtime-v2"')) fail('wrapper-kernel-selection');
console.log(JSON.stringify({ schema_version: 'auth-foundation.command-boundary-v2-evidence-check/v1', status: 'current-candidate-files-and-receipt', checked_refs: evidence.predecessor_preserved.length + evidence.selected_artifacts.length, source_files: sourceLines.length, test_runs_verified: false, second_generation_verified: false, authority_effect: 'none' }));
