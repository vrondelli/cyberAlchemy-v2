import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const recovery = 'development/reconciliation-v1/recovery/';
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const git = (...args) => execFileSync('git', ['-C', root, ...args], { maxBuffer: 32 * 1024 * 1024 });
const split0 = buffer => buffer.toString().split('\0').filter(Boolean);
export function safePath(base, relative) {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..') || relative.includes('\\')) throw Error(`Unsafe path: ${relative}`);
  const result = path.resolve(base, relative);
  if (!result.startsWith(base + path.sep)) throw Error(`Outside root: ${relative}`);
  return result;
}
export function readRegular(base, relative) {
  const filename = safePath(base, relative);
  let stat;
  try { stat = fs.lstatSync(filename); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  if (!stat.isFile() || fs.realpathSync(filename) !== filename) throw Error(`Not a direct regular file: ${relative}`);
  const bytes = fs.readFileSync(filename);
  return { bytes, sha256: sha256(bytes), size: bytes.length, mode: stat.mode & 0o777 };
}
export function compare(expected, actual) {
  if (actual === null) return expected === null ? 'matching-absence' : 'missing';
  if (expected === null) return 'appeared';
  return expected === actual ? 'matching' : 'changed';
}
function walk(relative) {
  const location = safePath(root, relative);
  if (!fs.existsSync(location)) return [];
  return fs.readdirSync(location, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const next = relative + '/' + entry.name;
    if (entry.isSymbolicLink()) throw Error(`Symlink in selected tree: ${next}`);
    return entry.isDirectory() ? walk(next) : [next];
  });
}
function mutablePaths() {
  return [...new Set([
    ...split0(git('diff', '--name-only', '-z', 'HEAD', '--', '.')),
    ...split0(git('ls-files', '--others', '--exclude-standard', '-z', '--', '.')),
  ])].map(p => p.startsWith('projects/domainspec-v2/') ? p.slice('projects/domainspec-v2/'.length) : p)
    .filter(p => !p.startsWith(recovery)).sort();
}
function status() { return git('status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.').toString(); }
function emitNew(name, value) {
  fs.writeFileSync(path.join(here, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
export function validateObjects(bundle) {
  if (bundle.schema_version !== 'domainspec.preimage-objects/v1-candidate' || !bundle.objects || !Object.keys(bundle.objects).length) throw Error('Empty or unknown bundle');
  for (const [digest, data] of Object.entries(bundle.objects)) {
    if (!/^[a-f0-9]{64}$/.test(digest) || typeof data !== 'string' || sha256(Buffer.from(data, 'base64')) !== digest) throw Error(`Corrupt object: ${digest}`);
  }
  return Object.keys(bundle.objects).length;
}
function capture() {
  for (const name of ['source-snapshot.json', 'preservation-manifest.json', 'preimages.json.gz']) {
    if (fs.existsSync(path.join(here, name))) throw Error(`Refusing to overwrite ${name}; preserve this epoch.`);
  }
  const started = new Date().toISOString();
  const initialStatus = status();
  const head = git('rev-parse', 'HEAD').toString().trim();
  const umbrella = git('rev-parse', '--show-toplevel').toString().trim();
  const prefix = path.relative(umbrella, root) + '/';
  const local = ref => ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
  const evidence = json(path.join(root, 'development/reconciliation-v1/EVIDENCE.json'));
  const pointerPath = 'definitions/meta-types/current-implementation.json';
  const pointer = json(path.join(root, pointerPath));
  const baselinePath = local(pointer.baseline.manifest);
  const baseline = json(path.join(root, baselinePath));
  const selected = new Map();
  const add = (filename, reason) => {
    filename = local(filename); safePath(root, filename);
    if (filename.startsWith(recovery)) return;
    if (!selected.has(filename)) selected.set(filename, new Set());
    selected.get(filename).add(reason);
  };
  for (const row of evidence.selected_sources) add(row.path, 'planning-selected-source');
  for (const row of baseline.inventory) add(row.path, 'frozen-baseline-member-current-bytes');
  for (const row of evidence.bmc_bound_references) add(row.path, 'BMC-bound-reference');
  const dirty = mutablePaths();
  for (const p of dirty) add(p, 'preexisting-working-tree-change');
  for (const p of walk('impl/cli/src')) add(p, 'CLI-current-source');
  for (const p of walk('impl/cli/dist')) add(p, 'CLI-generated-dist');
  for (const p of ['PLAN.md','WORK-ITEMS.json','VALIDATION.md','DECISIONS.md','EVIDENCE.json','implementation-layering.md']) add('development/reconciliation-v1/' + p, 'planning-preimage');
  add(pointerPath, 'current-baseline-pointer');
  add(baselinePath, 'frozen-baseline-manifest');
  add(local(pointer.baseline.owner_decision), 'frozen-baseline-owner-decision');
  const archives = execFileSync('rg', ['--files','--hidden','--no-ignore','development','-g','*.tgz','-g','!**/node_modules/**','-g','!**/target/**'], {cwd:root}).toString().trim().split('\n').sort();
  for (const p of archives) add(p, 'package-archive');
  const acceptancePath = 'development/cli-successor-candidate/acceptance-v2/decision.json';
  const acceptance = json(path.join(root, acceptancePath));
  const acceptedCandidatePath = local(acceptance.candidate_path);
  const acceptedCandidate = json(path.join(root, acceptedCandidatePath));
  add(acceptedCandidatePath, 'accepted-candidate-manifest');
  for (const p of [acceptance.scope_ref, acceptance.review_ref]) add(p, 'accepted-candidate-bound-evidence');
  for (const dirname of ['development/cli-successor-candidate/v2', 'development/output-layout/release-preparation-v1']) {
    for (const p of walk(dirname).filter(p => /(?:archive-inventory|candidate-source-manifest|input-manifest|source-manifest)\.json$/.test(p))) add(p, 'package-manifest');
  }
  const objects = {};
  const put = bytes => { const digest = sha256(bytes); objects[digest] = bytes.toString('base64'); return digest; };
  const rows = [...selected].sort(([a],[b]) => a.localeCompare(b)).map(([p,reasons]) => {
    const value = readRegular(root, p);
    return {path:p, reasons:[...reasons].sort(), exists:value !== null, sha256:value ? put(value.bytes) : null, bytes:value?.size ?? null, mode:value?.mode ?? null};
  });
  const gitPreimages = [];
  const tracked = new Set(split0(git('ls-files','-z','--','.')));
  for (const p of dirty.filter(p => tracked.has(p) || tracked.has(prefix+p))) {
    for (const revision of ['HEAD', 'INDEX']) {
      const ref = revision === 'HEAD' ? `HEAD:${prefix}${p}` : `:${prefix}${p}`;
      try { const bytes = git('show', ref); gitPreimages.push({path:p, revision, sha256:put(bytes),bytes:bytes.length}); }
      catch { gitPreimages.push({path:p,revision,sha256:null,status:'absent-or-unreadable'}); }
    }
  }
  const byPath = new Map(rows.map(r => [r.path,r]));
  const baselineRows = baseline.inventory.map(r => ({path:local(r.path),expected_sha256:r.sha256,current_sha256:byPath.get(local(r.path)).sha256,status:compare(r.sha256, byPath.get(local(r.path)).sha256)}));
  const counts = values => values.reduce((a,v) => (a[v]=(a[v]??0)+1,a),{});
  const bindings = [
    [baselinePath,pointer.baseline.manifest_sha256], [local(pointer.baseline.owner_decision),pointer.baseline.owner_decision_sha256],
    [acceptedCandidatePath,acceptance.candidate_sha256], [local(acceptance.scope_ref),acceptance.scope_sha256], [local(acceptance.review_ref),acceptance.review_sha256],
  ].map(([p,expected]) => ({path:p,expected_sha256:expected,actual_sha256:byPath.get(p).sha256,status:compare(expected,byPath.get(p).sha256)}));
  const packageRows = archives.map(p => ({path:p,sha256:byPath.get(p).sha256,bytes:byPath.get(p).bytes,
    acceptance:byPath.get(p).sha256 === acceptance.package_archive_sha256 ? 'matches-exact-accepted-successor-archive-digest' : 'not-covered-by-selected-successor-decision',
    comparison: ['impl/cli/package.json','impl/cli/src/cli/main.ts','impl/cli/src/index.ts','impl/cli/src/input/project-model.ts','impl/cli/dist/cli/main.js'].map(current => {
      const member = 'package/' + current.slice('impl/cli/'.length);
      try { const bytes = execFileSync('tar',['-xOf',safePath(root,p),'--',member],{maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']}); return {current_path:current,archive_member:member,archive_member_sha256:sha256(bytes),current_sha256:byPath.get(current)?.sha256??null,status:compare(sha256(bytes),byPath.get(current)?.sha256??null)}; }
      catch { return {current_path:current,archive_member:member,status:'archive-member-unavailable'}; }
    })}));
  const snapshot = {schema_version:'domainspec.source-snapshot/v1-candidate',task_id:'DSR-001',authority_effect:'none',captured_at:started,project_root:root,
    git:{root:umbrella,head,status_porcelain_v1_z_base64:Buffer.from(initialStatus).toString('base64'),preexisting_changed_paths:dirty},
    scope:{rule:'42 planning sources + all baseline members + preexisting Git changes + CLI src/dist + seven discovered package archives + selected package bindings/manifests; not a whole-repository backup',excluded:['dependencies','build caches outside CLI dist','unselected historical files','external session logs'],snapshot_members:rows.length},
    active_writer_boundary:{exclusive_lock:false,claim:'Observed selected bytes only. Recheck immediately before every later dependent mutation; no claim that editors or other processes are stopped.'},
    baseline:{id:baseline.baseline_id,manifest_path:baselinePath,expected_inventory_count:baseline.denominators.frozen_evidence_files,counts:counts(baselineRows.map(r=>r.status)),members:baselineRows},
    package_bindings:bindings,packages:packageRows,source_vs_dist:{claim:'Separately hashed inventories; no rebuild or source-to-dist equivalence claim',source_rows:rows.filter(r=>r.reasons.includes('CLI-current-source')).length,dist_rows:rows.filter(r=>r.reasons.includes('CLI-generated-dist')).length},
    package_identity:{current:json(path.join(root,'impl/cli/package.json')).version,accepted_candidate:acceptedCandidate.candidate_id??acceptedCandidate.id,acceptance_source:acceptancePath,acceptance_inherited_by_working_tree:false},
    selected_files:rows,git_preimages:gitPreimages,open_questions_ref:'../DECISIONS.md'};
  const drift = rows.map(r => ({path:r.path,status:compare(r.sha256,readRegular(root,r.path)?.sha256??null)})).filter(r=>!['matching','matching-absence'].includes(r.status));
  if (git('rev-parse','HEAD').toString().trim() !== head || status() !== initialStatus) drift.push({path:'git-state',status:'changed'});
  if (drift.length) throw Error('Capture changed during read; no snapshot emitted: '+JSON.stringify(drift));
  const bundle = {schema_version:'domainspec.preimage-objects/v1-candidate',objects};
  validateObjects(bundle);
  const compressed = gzipSync(Buffer.from(JSON.stringify(bundle)), {level:9});
  fs.writeFileSync(path.join(here,'preimages.json.gz'), compressed, {flag:'wx',mode:0o600});
  emitNew('source-snapshot.json', snapshot);
  const snapshotDigest = sha256(fs.readFileSync(path.join(here,'source-snapshot.json')));
  const postDrift = rows.filter(r => !['matching','matching-absence'].includes(compare(r.sha256, readRegular(root,r.path)?.sha256??null)));
  emitNew('preservation-manifest.json', {schema_version:'domainspec.preservation-manifest/v1-candidate',task_id:'DSR-001',authority_effect:'none',captured_at:started,completed_at:new Date().toISOString(),status:postDrift.length?'fail':'captured-pending-independent-verification',snapshot:{path:'source-snapshot.json',sha256:snapshotDigest},archive:{path:'preimages.json.gz',sha256:sha256(compressed),bytes:compressed.length,format:'gzip JSON: objects maps SHA-256 to base64 original bytes',objects:Object.keys(objects).length},counts:{selected:rows.length,preserved:rows.filter(r=>r.exists).length,missing:rows.filter(r=>!r.exists).length,git_preimages:gitPreimages.length},mutation_scope:'Only recovery artifacts created; source, baseline, dist, original archives and Git state unchanged.',drift:postDrift,open_questions_ref:'../DECISIONS.md'});
  console.log(JSON.stringify({status:'captured',files:rows.length,missing:rows.filter(r=>!r.exists).length,baseline:snapshot.baseline.counts,packages:packageRows.length,bundle_bytes:compressed.length}));
}
export function verify(allowChanges = []) {
  const manifest = json(path.join(here,'preservation-manifest.json'));
  const snapshotBytes = fs.readFileSync(path.join(here,'source-snapshot.json'));
  if (sha256(snapshotBytes) !== manifest.snapshot.sha256) throw Error('Snapshot digest mismatch');
  const snapshot = JSON.parse(snapshotBytes);
  if (!snapshot.selected_files.length || new Set(snapshot.selected_files.map(r=>r.path)).size !== snapshot.selected_files.length) throw Error('Empty or duplicated selection');
  const compressed = fs.readFileSync(path.join(here,manifest.archive.path));
  if (sha256(compressed) !== manifest.archive.sha256) throw Error('Archive digest mismatch');
  const bundle = JSON.parse(gunzipSync(compressed)); validateObjects(bundle);
  const allowedPaths = ['development/reconciliation-v1/PLAN.md','development/reconciliation-v1/WORK-ITEMS.json'];
  for (const row of allowChanges) if (!allowedPaths.includes(row.path) || snapshot.selected_files.find(r=>r.path===row.path)?.sha256 !== row.before_sha256 || !/^[a-f0-9]{64}$/.test(row.after_sha256)) throw Error('Invalid synchronization exception');
  const changes = new Map(allowChanges.map(r=>[r.path,r]));
  const checks = snapshot.selected_files.map(r => {
    if (r.exists && (!Object.hasOwn(bundle.objects,r.sha256) || Buffer.from(bundle.objects[r.sha256],'base64').length !== r.bytes)) throw Error(`Missing preimage ${r.path}`);
    const expected = changes.get(r.path)?.after_sha256 ?? r.sha256;
    const actual = readRegular(root,r.path)?.sha256??null;
    return {path:r.path,status:compare(expected,actual),authorized_synchronization:changes.has(r.path)};
  });
  const gitDrift = [];
  const prefix = path.relative(snapshot.git.root,root) + '/';
  for (const row of snapshot.git_preimages) {
    if (row.sha256 && (!Object.hasOwn(bundle.objects,row.sha256) || Buffer.from(bundle.objects[row.sha256],'base64').length!==row.bytes)) throw Error(`Missing Git preimage ${row.path}`);
    let actual = null;
    try { actual = sha256(git('show',row.revision === 'HEAD' ? `HEAD:${prefix}${row.path}` : `:${prefix}${row.path}`)); } catch {}
    if (!['matching','matching-absence'].includes(compare(row.sha256,actual))) gitDrift.push({path:row.path,revision:row.revision,status:compare(row.sha256,actual)});
  }
  const drift = checks.filter(c=>!['matching','matching-absence'].includes(c.status));
  const currentDirty = mutablePaths();
  const newDirty = currentDirty.filter(p=>!snapshot.git.preexisting_changed_paths.includes(p));
  const headMatches = git('rev-parse','HEAD').toString().trim() === snapshot.git.head;
  const result = {schema_version:'domainspec.preservation-verification/v1-candidate',task_id:'DSR-001',authority_effect:'none',verified_at:new Date().toISOString(),status:drift.length||gitDrift.length||newDirty.length||!headMatches?'fail':'pass',snapshot_sha256:manifest.snapshot.sha256,archive_sha256:manifest.archive.sha256,checks:checks.length,preserved_files:checks.filter(r=>snapshot.selected_files.find(s=>s.path===r.path).exists).length,expected_missing:checks.filter(r=>r.status==='matching-absence').length,git_preimages:snapshot.git_preimages.length,git_preimage_drift:gitDrift,head_matches:headMatches,new_dirty_outside_recovery:newDirty,drift,authorized_synchronizations:allowChanges,claim_ceiling:'Byte preservation and provenance only; no product tests or acceptance',open_questions_ref:'../DECISIONS.md'};
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'capture') capture();
  else if (process.argv[2] === 'verify') {const r=verify(process.argv[3]?json(process.argv[3]):[]);console.log(JSON.stringify(r,null,2));if(r.status!=='pass')process.exitCode=1;}
  else throw Error('Usage: node snapshot.mjs capture | verify [exact-synchronizations.json]');
}
