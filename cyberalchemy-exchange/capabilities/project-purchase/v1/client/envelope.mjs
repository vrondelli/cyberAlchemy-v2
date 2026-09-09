// Read-only packaging of a tested candidate; never signs or submits transactions.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const cap = new URL('../', import.meta.url);
const repo = new URL('../../../../', cap);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => readFile(new URL(path, cap));
const profileBytes = await read('deployment/public.json');
const profile = JSON.parse(profileBytes);
const reportBytes = await read('evidence/deployment-sbf-test-report.json');
const report = JSON.parse(reportBytes);
const preflightBytes = await read('deployment/preflight.json');
const preflight = JSON.parse(preflightBytes);
const tested = report.configurations?.find(item => item.scope === 'deployment');
if (report.status !== 'passed' || tested?.status !== 'passed' || tested.tests !== 8 ||
    tested.deployment_profile_sha256 !== sha(profileBytes) || preflight.profile_sha256 !== sha(profileBytes))
  throw Error('Missing or mismatched deployment verification');
for (const [path, digest] of Object.entries(tested.source_sha256))
  if (sha(await readFile(new URL(path, repo))) !== digest) throw Error(`Source drift: ${path}`);
if (sha(await read(`evidence/${tested.log}`)) !== tested.log_sha256)
  throw Error('Test log drift');
const operations = [];
for (const [role, file, buffer] of [
  ['kepProgram', 'cyberalchemy_kep_solana_program.so', 'kepBuffer'],
  ['purchaseProgram', 'cyberalchemy_exchange_purchase.so', 'purchaseBuffer'],
]) {
  if (tested.program_ids[role] !== profile.keys[role]) throw Error('Program ID mismatch');
  const path = `program/target/sbf-candidate/deployment/${file}`;
  const bytes = await read(path);
  const artifact = tested.artifacts[file];
  if (sha(bytes) !== artifact.sha256 || bytes.length !== artifact.bytes) throw Error(`Binary drift: ${file}`);
  operations.push({ operation: 'proposed-loader-v3-deployment', program: profile.keys[role],
    buffer: profile.keys[buffer], artifact: { path, ...artifact },
    upgrade_authority: profile.keys.upgradeAuthority, fee_payer: profile.keys.feePayer });
}
const envelope = {
  schema_version: 'exchange-devnet-envelope/v1', status: 'local-tested-candidate',
  network: profile.network, genesis: profile.genesis, rpc: profile.rpc, mint: profile.mint,
  keys: profile.keys, profile_sha256: sha(profileBytes),
  test_report_sha256: sha(reportBytes), preflight_sha256: sha(preflightBytes),
  preflight_checked_at: preflight.checked_at, operations,
  conservative_rent_lamports: preflight.checks.conservative_rent_lamports,
  transaction_fee_ceiling_lamports: null, authorized: false, deployed: false,
  transactions_submitted: 0, blockers: preflight.blockers,
  limitations: ['Local bank tests do not establish target-cluster execution equivalence',
    'Refresh preflight and verify an executor before deployment; transaction fees excluded'],
  open_questions_ref: 'PLAN.md#open-questions',
};
await writeFile(new URL('deployment/envelope.json', cap), JSON.stringify(envelope, null, 2) + '\n');
console.log('Wrote deployment/envelope.json; no transactions submitted');
