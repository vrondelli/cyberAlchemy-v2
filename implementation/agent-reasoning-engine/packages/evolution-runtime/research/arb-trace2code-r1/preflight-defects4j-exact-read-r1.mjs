#!/usr/bin/env node
// One gold-blind Defects4J source read through the actual ContextBench tool.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRepositoryTools} from '../../../../benchmarks/contextbench-v1/repository-tools.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, message) => { if (!value) throw Error(message); };

async function main() {
  need(process.argv.length === 7, 'args: manifest trace-preflight case-id checkout output');
  const [manifestPath, preflightPath, caseId, checkout, output] = process.argv.slice(2);
  need(!existsSync(output), 'output exists');
  const manifestBytes = readFileSync(manifestPath);
  const preflightBytes = readFileSync(preflightPath);
  const manifest = JSON.parse(manifestBytes), preflight = JSON.parse(preflightBytes);
  need(preflight.manifest_sha256 === sha(manifestBytes), 'manifest drift');
  const selected = manifest.cases.filter(row => row.case_id === caseId);
  const views = preflight.cases.filter(row => row.case_id === caseId);
  need(selected.length === 1 && views.length === 1, 'case identity');
  const revision = selected[0].buggy_revision, view = views[0];
  const root = resolve(checkout);
  need(execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {encoding: 'utf8'}).trim() === revision,
    'buggy revision drift');
  need(execFileSync('git', ['-C', root, 'status', '--porcelain=v1'], {encoding: 'utf8'}).trim() === '',
    'dirty checkout');
  const files = execFileSync('git', ['-C', root, 'ls-files'], {encoding: 'utf8'}).trimEnd().split('\n');
  const matches = files.filter(path => path.endsWith(`/${view.first_nonharness_source_suffix}`));
  need(matches.length === 1, `source suffix match count ${matches.length}`);
  const path = matches[0], startLine = Math.max(1, view.first_nonharness_line - 20);
  const observations = [];
  const execute = createRepositoryTools({root, base_commit: revision,
    record_source: value => observations.push(value)});
  const response = await execute('read_file', {path, start_line: startLine,
    line_count: 50, revision: 'base'});
  need(response.ok, `read_file: ${response.error ?? 'unknown error'}`);
  const value = response.output;
  need(value.path === path && value.base_commit === revision && value.source_revision === 'base',
    'source identity');
  need(value.byte_count === Buffer.byteLength(value.utf8) && observations.length === 1,
    'source byte accounting');
  const receipt = {schema: 'are.defects4j-exact-read-preflight-r1/v1', case_id: caseId,
    posture: 'one-case gold-blind deterministic source read, not a model-driven run or score',
    manifest_sha256: sha(manifestBytes), trace_preflight_sha256: sha(preflightBytes),
    buggy_revision: revision, selected_source_path: path, first_trace_line: view.first_nonharness_line,
    read_start_line: startLine, read_line_count: 50, delivered_bytes: value.byte_count,
    delivered_sha256: sha(value.utf8), observed_source_sha256: observations[0].source_sha256,
    actual_read_file_calls: 1, model_calls: 0, gold_opened: false};
  writeFileSync(output, JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  process.stdout.write(JSON.stringify(receipt) + '\n');
}

await main();
