import {execFileSync} from 'node:child_process';
import {readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const STOP = new Set([
  'add', 'and', 'are', 'can', 'close', 'currently', 'documentation', 'fixed',
  'for', 'four', 'from', 'issue', 'spaces', 'the', 'this', 'to', 'with'
]);
const EXPANSIONS = Object.freeze({
  pretty: ['format', 'formatter', 'serialize', 'serialization', 'stringify'],
  print: ['output', 'stream', 'ostream', 'serialize', 'serialization'],
  indentation: ['indent', 'depth', 'level', 'space'],
  indent: ['indentation', 'depth', 'level', 'space'],
  dom: ['element', 'object', 'array']
});

export const rankSourcesTool = Object.freeze({
  type: 'function',
  function: {
    name: 'rank_sources',
    description:
      'Rank likely pinned-base source paths and line ranges for a short query. ' +
      'Results are hints only; use read_file to obtain source evidence.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['query'],
      properties: {query: {type: 'string', minLength: 1, maxLength: 1024}}
    }
  }
});

const tokens = text => {
  const base = String(text).toLowerCase().match(/[a-z_][a-z0-9_]{2,}/g) ?? [];
  const expanded = [];
  for (const token of base) {
    if (!STOP.has(token)) expanded.push(token);
    expanded.push(...(EXPANSIONS[token] ?? []));
  }
  return [...new Set(expanded)].slice(0, 32);
};

const safeText = buffer =>
  !buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);

function scoreLine(path, line, queryTokens) {
  const lowerPath = path.toLowerCase();
  const lowerLine = line.toLowerCase();
  let score = 0;
  const matched = [];
  for (const token of queryTokens) {
    const inPath = lowerPath.includes(token);
    const inLine = lowerLine.includes(token);
    if (inPath || inLine) matched.push(token);
    if (inPath) score += 7;
    if (inLine) score += token.length >= 7 ? 8 : 4;
  }
  if (/\.(h|hpp|c|cc|cpp|md)$/i.test(path)) score += 2;
  if (/^(dependencies|benchmark|third_party)\//.test(path)) score -= 12;
  return {score, matched};
}

export function createRankedSourceAcquisition({
  root,
  base_commit,
  problem_statement,
  maximum_index_bytes = 32 * 1024 * 1024
}) {
  if (typeof root !== 'string' || !/^[a-f0-9]{40}$/.test(base_commit) ||
      typeof problem_statement !== 'string' || !problem_statement.length) {
    throw Error('ranked-source.invalid-input');
  }
  const paths = execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'buffer',
    timeout: 120000,
    maxBuffer: 16 * 1024 * 1024
  }).toString('utf8').split('\0').filter(Boolean).sort();
  const files = [];
  let indexedBytes = 0;
  let omittedFiles = 0;
  for (const path of paths) {
    let size;
    try { size = statSync(join(root, path)).size; } catch { omittedFiles++; continue; }
    if (size > 1024 * 1024 || indexedBytes + size > maximum_index_bytes) {
      omittedFiles++;
      continue;
    }
    const buffer = readFileSync(join(root, path));
    if (!safeText(buffer)) { omittedFiles++; continue; }
    indexedBytes += buffer.length;
    files.push({path, lines: buffer.toString('utf8').split(/\r?\n/)});
  }

  function query(rawQuery) {
    if (typeof rawQuery !== 'string' || rawQuery.length < 1 ||
        Buffer.byteLength(rawQuery) > 1024) {
      throw Error('ranked-source.query');
    }
    const queryTokens = tokens(rawQuery);
    if (!queryTokens.length) {
      return {schema: 'are.ranked-source-hints/v2', base_commit, hints: [],
        query_terms: [], indexed_files: files.length, indexed_bytes: indexedBytes,
        omitted_files: omittedFiles, partial_index: omittedFiles > 0};
    }
    const candidates = [];
    for (const file of files) {
      for (let index = 0; index < file.lines.length; index++) {
        const scored = scoreLine(file.path, file.lines[index], queryTokens);
        if (scored.score <= 0 || !scored.matched.length) continue;
        candidates.push({
          path: file.path,
          start_line: Math.max(1, index + 1 - 8),
          end_line: Math.min(file.lines.length, index + 1 + 8),
          score_units: scored.score,
          matched_terms: [...new Set(scored.matched)].sort()
        });
      }
    }
    candidates.sort((a, b) =>
      b.score_units - a.score_units || a.path.localeCompare(b.path) ||
      a.start_line - b.start_line
    );
    const hints = [];
    for (const candidate of candidates) {
      if (hints.some(hint => hint.path === candidate.path &&
          candidate.start_line <= hint.end_line + 8)) continue;
      hints.push(candidate);
      if (hints.length === 8) break;
    }
    return {
      schema: 'are.ranked-source-hints/v2',
      base_commit,
      query_terms: queryTokens,
      hints,
      indexed_files: files.length,
      indexed_bytes: indexedBytes,
      omitted_files: omittedFiles,
      partial_index: omittedFiles > 0
    };
  }

  const primer = query(problem_statement);
  const summary =
    'Deterministic pinned-base source hints; hints are not evidence. ' +
    'Use read_file before relying on them: ' +
    JSON.stringify(primer.hints.map(({path, start_line, end_line, matched_terms}) =>
      ({path, start_line, end_line, matched_terms})
    ));
  return Object.freeze({query, primer, summary});
}
