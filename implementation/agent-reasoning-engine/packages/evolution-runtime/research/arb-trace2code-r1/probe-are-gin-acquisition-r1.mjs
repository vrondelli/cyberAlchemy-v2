#!/usr/bin/env node
// Development-only: run the archived ARE rank_sources code on ARB file snapshots.
// These materialized snapshots are not pinned Git checkouts or full ARE episodes.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, join, resolve, sep} from 'node:path';
import {pathToFileURL} from 'node:url';

const SOURCE_AUDIT_SHA256 = '1e46c4e41b4f8aa31b8a39c401addcb7b3203a3a95da9a43b12d26304065c77f';
const DEV_QUERIES_SHA256 = '19f3aed723705229433bc13423f30ea45c6d84a23d1a481c3924371232e6253a';
const fail = message => { throw Error(message); };
const digest = value => createHash('sha256').update(value).digest('hex');
const shaFile = path => digest(readFileSync(path));
const jsonLines = path => readFileSync(path, 'utf8').trimEnd().split('\n').map(line => JSON.parse(line));

function safeRelative(path) {
  if (typeof path !== 'string' || !path || isAbsolute(path) || path.includes('\\') ||
      path.split('/').some(part => !part || part === '.' || part === '..' || part === '.git')) {
    fail('unsafe snapshot path');
  }
  return path;
}

function boundedUtf8(text, mode) {
  const bytes = Buffer.from(String(text));
  const window = bytes.length <= 1024 ? bytes :
    mode === 'head' ? bytes.subarray(0, 1024) : bytes.subarray(bytes.length - 1024);
  const result = window.toString('utf8').replaceAll('\uFFFD', '').trim();
  if (!result || Buffer.byteLength(result) > 1024) fail('empty or oversized query');
  return result;
}

function materializeSnapshot(source, row, root) {
  const relative = row.chunks_path.replace(/^data\//, '');
  if (relative === row.chunks_path) fail('unexpected corpus path');
  const rows = jsonLines(join(source, relative));
  let files = 0;
  for (const chunk of rows) {
    if (chunk.repo !== row.repo || chunk.base_commit !== row.base_commit) fail('snapshot identity drift');
    if (chunk.kind !== 'file') continue;
    const target = resolve(root, safeRelative(chunk.path));
    if (!target.startsWith(root + sep)) fail('snapshot path escaped root');
    if (existsSync(target)) fail('duplicate file-level snapshot');
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, chunk.text, {flag: 'wx'});
    files++;
  }
  if (files !== row.file_count) fail('snapshot file count drift');
  execFileSync('git', ['init', '-q', root], {timeout: 30000});
  execFileSync('git', ['add', '-f', '-A'], {cwd: root, timeout: 30000});
  const indexed = execFileSync('git', ['ls-files', '-z'], {cwd: root, timeout: 30000}).toString().split('\0').filter(Boolean);
  if (indexed.length !== files) fail('Git index file count drift');
  return files;
}

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const separator = arg.indexOf('=');
  if (separator < 1) fail('arguments must be --key=value');
  return [arg.slice(0, separator), arg.slice(separator + 1)];
}));
if (Object.keys(args).sort().join(',') !== '--acquisition-code,--output,--queries,--source') fail('argument set');
const source = resolve(args['--source']);
const queries = resolve(args['--queries']);
const output = resolve(args['--output']);
const code = resolve(args['--acquisition-code']);
if (existsSync(output) || shaFile(join(source, 'SOURCE-CORPUS-AUDIT.json')) !== SOURCE_AUDIT_SHA256 ||
    shaFile(queries) !== DEV_QUERIES_SHA256) fail('output exists or input pin drift');
const codeSha = shaFile(code);
const {createRankedSourceAcquisition, rankSourcesTool} = await import(pathToFileURL(code));
if (rankSourcesTool?.function?.name !== 'rank_sources' ||
    rankSourcesTool.function.parameters.properties.query.maxLength !== 1024) fail('ARE tool contract drift');
const manifests = new Map(jsonLines(join(source, 'corpus/v2_trace2code/corpus_manifest.jsonl'))
  .map(row => [`${row.repo}@${row.base_commit}`, row]));
const items = jsonLines(queries);
if (items.length !== 56 || new Set(items.map(item => item.id)).size !== 56 ||
    items.some(item => item.repo !== 'gin-gonic/gin')) fail('development population drift');
mkdirSync(output, {recursive: false});
const work = join(output, 'source-snapshots');
mkdirSync(work);
const instances = new Map();
const predictions = [];
for (const item of items) {
  const key = `${item.repo}@${item.base_commit}`;
  const manifest = manifests.get(key);
  if (!manifest) fail('missing source snapshot');
  if (!instances.has(key)) {
    const root = join(work, item.base_commit);
    mkdirSync(root);
    materializeSnapshot(source, manifest, root);
    instances.set(key, {root, ranked: createRankedSourceAcquisition({
      root, base_commit: item.base_commit, problem_statement: item.query.failure_excerpt
    })});
  }
  const {ranked} = instances.get(key);
  const tail = ranked.query(boundedUtf8(item.query.failure_excerpt, 'tail'));
  const primer = ranked.primer;
  if (tail.schema !== 'are.ranked-source-hints/v2' || primer.schema !== tail.schema ||
      tail.base_commit !== item.base_commit || primer.base_commit !== item.base_commit ||
      tail.indexed_files !== manifest.file_count || primer.indexed_files !== manifest.file_count ||
      tail.partial_index || primer.partial_index) fail('ARE acquisition coverage drift');
  for (const result of [primer, tail]) {
    if (result.hints.length > 8 || new Set(result.hints.map(hint => hint.path)).size !== result.hints.length ||
        result.hints.some(hint => hint.start_line < 1 || hint.end_line < hint.start_line)) fail('ARE hint contract drift');
  }
  predictions.push({id: item.id, repo: item.repo, base_commit: item.base_commit,
    indexed_files: tail.indexed_files, indexed_bytes: tail.indexed_bytes,
    primer_hints: primer.hints, tail_hints: tail.hints});
}
const predictionPath = join(output, 'ARE-HINTS.jsonl');
writeFileSync(predictionPath, predictions.map(row => JSON.stringify(row)).join('\n') + '\n', {flag: 'wx'});
const seal = {schema: 'are.arb-trace2code-gin-are-acquisition-r1/v1',
  posture: 'source-only exposed development; ARB file snapshot simulation, not pinned Git or full ARE episode',
  source_audit_sha256: SOURCE_AUDIT_SHA256, dev_queries_sha256: DEV_QUERIES_SHA256,
  acquisition_code_sha256: codeSha, prediction_sha256: shaFile(predictionPath),
  development_cases: predictions.length, snapshots: instances.size,
  primer: 'actual ARE primer on first 1024 bytes of failure excerpt',
  tail: 'actual ARE rank_sources query on last 1024 bytes of failure excerpt',
  gold_opened: false, holdout_queries_opened: false, model_calls: 0};
writeFileSync(join(output, 'SOURCE-SEAL.json'), JSON.stringify(seal, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify(seal));
