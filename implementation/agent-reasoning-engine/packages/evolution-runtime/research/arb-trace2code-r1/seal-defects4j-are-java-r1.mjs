#!/usr/bin/env node
// Gold-blind candidate: existing ARE rank_sources trace-text implementation.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r1.mjs';

const MANIFEST_SHA = '457ecd8e44ee0dab1773b0e5fbad63d8e371c1f6993dccdd2fb1461814b73e33';
const VIEW_SHA = '5ce31ad82fd8f73b89ed7358cf3f3f26f5a060544b826be8ccf33d3eb9bfec66';
const WORKTREE_SHA = '4b77bf03a0b004831b2416ead495772a08b3cbc3222d84234a1114d03efa45ab';
const HARNESS = ['org.junit.', 'junit.', 'java.', 'javax.', 'sun.', 'jdk.',
  'org.apache.tools.ant.', 'org.gradle.'];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (condition, why) => { if (!condition) throw Error(`defects4j-are.${why}`); };

function traceView(raw) {
  const first = raw.toString('utf8').split('\n--- ', 1)[0];
  need(first.startsWith('--- '), 'missing-failure');
  const prefix = first.split(/\r?\n/).slice(0, 2);
  const frames = first.split(/\r?\n/).filter(line => {
    const match = line.match(/^\s*at\s+([^\s(]+).*?\(([^():]+\.java):(\d+)\)/);
    return match && !HARNESS.some(start => match[1].startsWith(start));
  }).slice(0, 8).map(line => line.trim());
  return prefix.concat(frames).join('\n') + '\n';
}

function main() {
  need(process.argv.length === 7, 'args: manifest views metadata worktrees output');
  const [manifestPath, viewPath, metadataRoot, treeRoot, output] = process.argv.slice(2).map(value => resolve(value));
  need(!existsSync(output), 'output-exists');
  const [manifestBytes, viewBytes, worktreeBytes] = [manifestPath, viewPath,
    join(treeRoot, 'WORKTREE-RECEIPT.json')].map(path => readFileSync(path));
  need(sha(manifestBytes) === MANIFEST_SHA && sha(viewBytes) === VIEW_SHA &&
    sha(worktreeBytes) === WORKTREE_SHA, 'input-drift');
  const manifest = JSON.parse(manifestBytes), views = JSON.parse(viewBytes),
    worktrees = JSON.parse(worktreeBytes);
  const byView = new Map(views.cases.map(row => [row.case_id, row]));
  const byTree = new Map(worktrees.cases.map(row => [row.case_id, row]));
  need(manifest.cases.length === 32 && byView.size === 32 && byTree.size === 32, 'denominator');
  const results = [];
  for (const [index, row] of manifest.cases.entries()) {
    const root = resolve(byTree.get(row.case_id).worktree);
    need(root === join(treeRoot, `${row.case_id}-checkout`), 'root-identity');
    const head = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
    need(head === row.buggy_revision, 'revision-drift');
    need(!execFileSync('git', ['-C', root, 'status', '--porcelain=v1'], {encoding: 'utf8'}).trim(), 'dirty');
    const raw = readFileSync(join(metadataRoot, 'framework', 'projects', row.project,
      'trigger_tests', String(row.bug_id)));
    need(sha(raw) === row.trace_sha256, 'trace-drift');
    const view = traceView(raw);
    need(sha(view) === byView.get(row.case_id).view_sha256, 'view-drift');
    const engine = createRankedSourceAcquisition({root, base_commit: row.buggy_revision,
      problem_statement: view, maximum_index_bytes: 256 * 1024 * 1024,
      allow_projection: false, mode: 'trace-text'});
    const ranking = engine.rankAll(view);
    need(ranking.base_commit === row.buggy_revision && ranking.ranked_files.length === ranking.indexed_files,
      'rank-contract');
    results.push({case_id: row.case_id, buggy_revision: row.buggy_revision,
      trace_view_sha256: sha(view), candidate_count: ranking.indexed_files,
      indexed_bytes: ranking.indexed_bytes, omitted_files: ranking.omitted_files,
      partial_index: ranking.partial_index, ranked_files_top20: ranking.ranked_files.slice(0, 20),
      top_hints: ranking.top});
    process.stdout.write(JSON.stringify({case: index + 1, case_id: row.case_id,
      indexed_files: ranking.indexed_files, omitted_files: ranking.omitted_files}) + '\n');
  }
  const result = {schema: 'are.defects4j-are-java-sealed-r1/v1',
    posture: 'Java-only adapted ARE rank_sources candidate on exact buggy worktrees, same Java candidates and 20000-character text cap as RepoMap; gold-blind and no provider calls',
    manifest_sha256: MANIFEST_SHA, trace_view_preflight_sha256: VIEW_SHA,
    worktree_receipt_sha256: WORKTREE_SHA,
    implementation: 'ranked-source-acquisition-java-r1.mjs',
    maximum_index_bytes: 256 * 1024 * 1024, cases: results};
  const bytes = Buffer.from(JSON.stringify(result, null, 2) + '\n');
  writeFileSync(output, bytes, {flag: 'wx', mode: 0o600});
  process.stdout.write(JSON.stringify({cases: results.length,
    partial_indexes: results.filter(row => row.partial_index).length,
    receipt_sha256: sha(bytes)}) + '\n');
}

main();
