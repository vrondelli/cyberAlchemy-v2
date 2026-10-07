import {readFileSync, lstatSync, realpathSync, existsSync, readdirSync, readlinkSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root = '/home/vlad_/projects/cyberAlchemy-v2';
const raw = readFileSync(root + '/output/WSL-CLEANUP-PROPOSAL-2026-10-07.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.getuid() !== 0 || hash(raw) !== '4b434df0f133ea1646e39644309d70bf328fb7bdcda847567acd8858353f9456') throw Error('Root identity or approved manifest mismatch');
const p = JSON.parse(raw);
const prior = JSON.parse(readFileSync(root + '/output/WSL-CLEANUP-RECEIPT-2026-10-07.json'));
const rows = [...p.candidates, ...p.optional_cache_candidates];
if (rows.length !== 123 || new Set(rows.map(r => r.path)).size !== 123 || prior.approval_text !== '“builds and caches') throw Error('Approval scope mismatch');
const mounts = readFileSync('/proc/self/mountinfo', 'utf8').split('\n').map(l => l.split(' ')[4]).filter(Boolean);
const prepared = rows.map(r => {
  if (!r.path.startsWith('/home/vlad_/') && !r.path.startsWith('/var/tmp/alch')) throw Error('Out of approved root scope');
  if (mounts.some(m => m === r.path || m.startsWith(r.path + '/')) || p.retained_packages.some(k => k.path === r.path)) throw Error('Mounted or retained target');
  if (!existsSync(r.path)) return {...r, missing: true};
  const st = lstatSync(r.path);
  if (st.isSymbolicLink() || realpathSync(r.path) !== r.path) throw Error('Replaced or symbolic target');
  return {...r, dev: st.dev, ino: st.ino, directory: st.isDirectory()};
});
for (const pid of readdirSync('/proc').filter(p => /^\d+$/.test(p))) {
  let paths = [];
  try { paths.push(readlinkSync('/proc/' + pid + '/exe'), readlinkSync('/proc/' + pid + '/cwd'));
    paths.push(...readFileSync('/proc/' + pid + '/maps', 'utf8').split('\n').filter(l => l.includes('/')).map(l => l.slice(l.indexOf('/')))); } catch {}
  if (paths.some(path => prepared.some(r => path === r.path || path.startsWith(r.path + '/')))) throw Error('Active process uses a target: ' + pid);
}
const df = () => {
  const line = execFileSync('df', ['-B1', '--output=size,used,avail', '/'], {encoding: 'utf8'}).trim().split('\n').at(-1);
  const [size, used, available] = line.trim().split(/\s+/).map(Number);
  return {size_bytes: size, used_bytes: used, available_bytes: available};
};
const result = {schema_version: 'wsl-cleanup-receipt/v1', approval_text: prior.approval_text,
  proposal_sha256: hash(raw), started_at: prior.started_at, before: prior.before,
  permission_retry_before: df(), first_attempt: {status: prior.status, failed: prior.failed,
    used_bytes_decrease: prior.used_bytes_decrease}, deleted: [], missing: [], failed: [],
  retained_packages: prior.retained_packages, excluded: prior.excluded, open_questions: prior.open_questions};
for (const r of prepared) {
  if (r.missing) { result.missing.push(r.path); continue; }
  try {
    const st = lstatSync(r.path);
    if (st.dev !== r.dev || st.ino !== r.ino || st.isSymbolicLink()) throw Error('Target changed after preflight');
    rmSync(r.path, {recursive: r.directory, force: false, maxRetries: 2, retryDelay: 100});
    if (existsSync(r.path)) throw Error('Target remains');
    result.deleted.push({path: r.path, proposed_allocated_bytes: r.allocated_bytes});
  } catch (e) { result.failed.push({path: r.path, error: e.message}); break; }
}
execFileSync('sync', []);
result.after = df();
result.used_bytes_decrease = result.before.used_bytes - result.after.used_bytes;
result.available_bytes_increase = result.after.available_bytes - result.before.available_bytes;
result.retained_packages_unchanged = prior.retained_packages.every(r => existsSync(r.path) && hash(readFileSync(r.path)) === r.sha256);
result.finished_at = new Date().toISOString();
result.status = !result.failed.length && result.deleted.length + result.missing.length === 123 && result.retained_packages_unchanged ? 'completed-approved-scope' : 'partial';
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'completed-approved-scope') process.exitCode = 1;
