// Versioned private benchmark candidate. Not activated in an ARE runner.
import {execFileSync} from 'node:child_process';
import {lstatSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const STOP = new Set([
  'and', 'are', 'build', 'failed', 'file', 'for', 'from', 'gin', 'github',
  'has', 'not', 'package', 'test', 'the', 'type', 'undefined', 'with'
]);
const WORD = /[A-Za-z_][A-Za-z0-9_]*/g;
const FIELD_ERROR = /type\s+([A-Za-z_][A-Za-z0-9_]*)\s+has no field or method\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const UNDEFINED = /undefined:\s*([A-Za-z_][A-Za-z0-9_]*)/g;
const fail = reason => { throw Error(`ranked-source-bm25.${reason}`); };

export const rankSourcesTool = Object.freeze({
  type: 'function',
  function: {
    name: 'rank_sources',
    description: 'Rank likely pinned-base source paths and line ranges for a short query. Results are hints only; use read_file to obtain source evidence.',
    parameters: {
      type: 'object', additionalProperties: false, required: ['query'],
      properties: {query: {type: 'string', minLength: 1, maxLength: 1024}}
    }
  }
});

function terms(value) {
  const result = [];
  for (const match of String(value).matchAll(WORD)) {
    const word = match[0];
    const parts = word.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replaceAll('_', ' ').split(/\s+/);
    for (const part of [word, ...parts]) {
      const term = part.toLowerCase();
      if (term.length >= 3 && !STOP.has(term)) result.push(term);
    }
  }
  return result;
}

function anchors(value) {
  const found = new Set();
  for (const match of String(value).matchAll(FIELD_ERROR)) {
    for (const term of [...terms(match[1]), ...terms(match[2])]) found.add(term);
  }
  for (const match of String(value).matchAll(UNDEFINED)) {
    for (const term of terms(match[1])) found.add(term);
  }
  return found;
}

function git(root, args) {
  return execFileSync('git', args, {cwd: root, timeout: 120000, maxBuffer: 16 * 1024 * 1024});
}

function buildIndex(root, base_commit, maximum_index_bytes, allow_projection) {
  if (!allow_projection) {
    const head = git(root, ['rev-parse', 'HEAD']).toString('utf8').trim();
    if (head !== base_commit) fail('head-drift');
    try {
      git(root, ['diff', '--quiet']);
      git(root, ['diff', '--cached', '--quiet']);
    } catch { fail('tracked-source-dirty'); }
  }
  const paths = git(root, ['ls-files', '-z']).toString('utf8').split('\0').filter(Boolean).sort();
  const documents = [];
  let indexed_bytes = 0;
  let omitted_files = 0;
  for (const path of paths) {
    let stat;
    try { stat = lstatSync(join(root, path)); } catch { omitted_files++; continue; }
    if (!stat.isFile() || stat.size > 1024 * 1024 || indexed_bytes + stat.size > maximum_index_bytes) {
      omitted_files++; continue;
    }
    const bytes = readFileSync(join(root, path));
    if (bytes.subarray(0, Math.min(bytes.length, 8192)).includes(0)) { omitted_files++; continue; }
    indexed_bytes += bytes.length;
    const text = bytes.toString('utf8');
    const freq = new Map();
    for (const term of terms(`${text} ${path}`)) freq.set(term, (freq.get(term) ?? 0) + 1);
    documents.push({path, lines: text.split(/\r?\n/), freq,
      length: Math.max(1, [...freq.values()].reduce((a, b) => a + b, 0)),
      path_terms: new Set(terms(path))});
  }
  const df = new Map();
  for (const document of documents) {
    for (const term of document.freq.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const avg_len = documents.length ? documents.reduce((sum, doc) => sum + doc.length, 0) / documents.length : 1;
  return {documents, df, avg_len, indexed_bytes, omitted_files};
}

function lineHint(document, query_terms, score) {
  let best = 0;
  let bestTerms = [];
  for (let index = 0; index < document.lines.length; index++) {
    const lower = document.lines[index].toLowerCase();
    const matched = query_terms.filter(term => lower.includes(term));
    if (matched.length > bestTerms.length) { best = index; bestTerms = matched; }
  }
  return {path: document.path, start_line: Math.max(1, best + 1 - 8),
    end_line: Math.min(document.lines.length, best + 1 + 8),
    score_units: Math.round(score * 1_000_000),
    matched_terms: [...new Set([...bestTerms, ...query_terms.filter(term => document.path.toLowerCase().includes(term))])].sort()};
}

export function createRankedSourceAcquisition({root, base_commit, problem_statement,
  maximum_index_bytes = 64 * 1024 * 1024, allow_projection = false, mode = 'bm25'}) {
  if (typeof root !== 'string' || !/^[a-f0-9]{40}$/.test(base_commit) ||
      typeof problem_statement !== 'string' || !problem_statement.length ||
      !Number.isSafeInteger(maximum_index_bytes) || maximum_index_bytes < 1 ||
      !['bm25', 'trace-text'].includes(mode) || typeof allow_projection !== 'boolean') {
    fail('invalid-input');
  }
  const index = buildIndex(root, base_commit, maximum_index_bytes, allow_projection);
  function rankAll(rawQuery) {
    if (typeof rawQuery !== 'string' || !rawQuery.trim() || Buffer.byteLength(rawQuery) > 1024) fail('query');
    const query_terms = [...new Set(terms(rawQuery))];
    const trace_anchors = mode === 'trace-text' ? anchors(rawQuery) : new Set();
    const n = index.documents.length;
    const scored = index.documents.map(document => {
      let score = 0;
      for (const term of query_terms) {
        const tf = document.freq.get(term) ?? 0;
        if (tf) {
          const idf = Math.log1p((n - index.df.get(term) + 0.5) / (index.df.get(term) + 0.5));
          score += idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * document.length / index.avg_len));
        }
      }
      if (mode === 'trace-text') {
        for (const term of trace_anchors) {
          if (document.freq.has(term)) score += 1.5;
          if (document.path_terms.has(term)) score += 1.0;
        }
        if (document.path.endsWith('_test.go')) score -= 2.0;
      }
      return {document, score};
    });
    scored.sort((a, b) => b.score - a.score || (a.document.path < b.document.path ? -1 : a.document.path > b.document.path ? 1 : 0));
    return {schema: 'are.ranked-source-files/bm25-r1', base_commit, mode,
      query_terms, ranked_files: scored.map(({document}) => document.path),
      top: scored.slice(0, 8).map(({document, score}) => lineHint(document, query_terms, score)),
      indexed_files: n, indexed_bytes: index.indexed_bytes, omitted_files: index.omitted_files,
      partial_index: index.omitted_files > 0};
  }
  function query(rawQuery) {
    const result = rankAll(rawQuery);
    return {schema: 'are.ranked-source-hints/v2', base_commit,
      query_terms: result.query_terms, hints: result.top,
      indexed_files: result.indexed_files, indexed_bytes: result.indexed_bytes,
      omitted_files: result.omitted_files, partial_index: result.partial_index};
  }
  const primerText = problem_statement.replace(/<!--[\s\S]*?-->/g, ' ').replace(/https?:\/\/\S+/g, ' ');
  const primerQuery = Buffer.from(primerText).subarray(0, 1024).toString('utf8').replace(/\uFFFD$/, '').trim();
  const primer = query(primerQuery);
  const summary = 'Deterministic pinned-base source hints; hints are not evidence. Use read_file before relying on them: ' +
    JSON.stringify(primer.hints.map(({path, start_line, end_line, matched_terms}) =>
      ({path, start_line, end_line, matched_terms})));
  return Object.freeze({query, rankAll, primer, summary});
}
