import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '../../../../../impl/test-derivation-engine/src/grammar/index.js';
import { derive, DEFAULT_RULE_SET } from '../../../../../impl/test-derivation-engine/src/rules/index.js';
import { emitSpec } from '../../../../../impl/test-derivation-engine/src/emit/spec.js';
import { emitTests } from '../../../../../impl/test-derivation-engine/src/emit/tests.js';
import { deriveEnforcesObligations } from '../../../../../impl/test-derivation-engine/src/minted-project/derive.js';

export const implRoot = fileURLToPath(new URL('../../../../../impl/', import.meta.url));
export const aspects = ['states.md', 'operations.md', 'interfaces.md', 'events.md', 'workflows.md', 'queries.md', 'mappings.md', 'domain.md', 'rules.md'] as const;
export type Dialect = 'aspect' | 'normalized-spec' | 'legacy-auto';
const message = (e: unknown) => e instanceof Error ? e.message : String(e);
export function checkedDerive(featureDir: string, dialect: Dialect, tests = false) {
  const sources: {path: string; sha256: string}[] = [];
  let snapshot: string | undefined;
  let selectedDialect: 'aspect' | 'normalized-spec' | undefined;
  let ignoredSources: string[] = [];
  try {
    if (!['aspect', 'normalized-spec', 'legacy-auto'].includes(dialect)) throw Error('unsupported dialect');
    if (!lstatSync(featureDir).isDirectory()) throw Error('feature input must be a directory');
    const names = [...aspects, 'SPEC.md'].filter(name => {
      try { lstatSync(join(featureDir, name)); return true; }
      catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false; throw e; }
    });
    const aspectNames = names.filter(name => name !== 'SPEC.md');
    selectedDialect = dialect === 'legacy-auto' ? (aspectNames.length ? 'aspect' : 'normalized-spec') : dialect;
    const selected = selectedDialect === 'aspect' ? aspectNames : names.filter(n => n === 'SPEC.md');
    ignoredSources = names.filter(n => !selected.includes(n));
    if (!selected.length) throw Error(`missing selected ${selectedDialect} input`);
    snapshot = mkdtempSync(join(tmpdir(), 'dsv2-l02-derive-'));
    for (const name of selected) {
      const path = join(featureDir, name);
      if (!lstatSync(path).isFile()) throw Error(`selected source must be a regular file: ${path}`);
      const bytes = readFileSync(path);
      sources.push({path: resolve(path), sha256: createHash('sha256').update(bytes).digest('hex')});
      writeFileSync(join(snapshot, name), bytes);
    }
    const parsed = parse(snapshot);
    if (parsed.violations.length) return {status: 'reject' as const, selectedDialect, ignoredSources, sources, diagnostics: parsed.violations};
    const obligations = derive(parsed.graph, DEFAULT_RULE_SET);
    return {status: 'pass' as const, selectedDialect, ignoredSources, sources, diagnostics: [],
      output: {obligations, spec: emitSpec(obligations), ...(tests ? {tests: emitTests(obligations)} : {})}};
  } catch (error) {
    return {status: 'reject' as const, selectedDialect, ignoredSources, sources, diagnostics: [message(error)]};
  } finally { if (snapshot) rmSync(snapshot, {recursive: true, force: true}); }
}

export function machineDerive(repoRoot: string, profile: string) {
  if (profile !== 'evf-s1') return {status: 'unsupported' as const, profile, diagnostics: ['No mapped machine profile; no fallback']};
  try { return {status: 'pass' as const, profile, obligations: deriveEnforcesObligations(repoRoot)}; }
  catch (error) { return {status: 'reject' as const, profile, diagnostics: [message(error)]}; }
}

export interface Change {status: string; path: string; previousPath?: string}
function repoPath(path: string) {
  if (!path || isAbsolute(path) || path.includes('\\') || path.split('/').some(p => !p || p === '.' || p === '..')) throw Error(`invalid repository-relative path: ${path}`);
  return path;
}
export function parseChanges(raw: string): Change[] {
  if (!raw) return [];
  if (!raw.endsWith('\0')) throw Error('truncated Git name-status output');
  const fields = raw.slice(0, -1).split('\0');
  const out: Change[] = [];
  while (fields.length) {
    const status = fields.shift()!;
    if (!/^(?:[AMD]|R(?:100|[0-9]{1,2}))$/.test(status)) throw Error(`unsupported Git status: ${status}`);
    const first = repoPath(fields.shift() ?? '');
    if (status.startsWith('R')) out.push({status, previousPath: first, path: repoPath(fields.shift() ?? '')});
    else out.push({status, path: first});
  }
  return out;
}
export function gitChanges(repoRoot: string, range: string): Change[] {
  if (!range || range.startsWith('-') || /[\0\r\n]/.test(range)) throw Error('invalid Git range');
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], {cwd: repoRoot, encoding: 'utf8'});
  if (top.error || top.status !== 0 || realpathSync(top.stdout.trim()) !== realpathSync(repoRoot)) throw Error('repoRoot must be the Git repository root');
  const result = spawnSync('git', ['--no-pager', 'diff', '--no-ext-diff', '--no-textconv', '--name-status', '-z', '--find-renames', range, '--'], {cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  if (result.error || result.status !== 0) throw Error(`Git diff failed: ${result.error?.message ?? result.stderr.trim()}`);
  return parseChanges(result.stdout);
}
function within(root: string, path: string) {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}
export function selectChanges(repoRoot: string, featureRoot: string, changes: readonly Change[]) {
  repoPath(featureRoot);
  const root = resolve(repoRoot, featureRoot);
  if (!within(realpathSync(repoRoot), realpathSync(root))) throw Error('feature root escapes repository');
  const inScope = (p: string) => repoPath(p).startsWith(`${featureRoot}/`) && p.endsWith('.md');
  const files = new Set<string>();
  const dispositions: {change: Change; disposition: string}[] = [];
  for (const change of changes) {
    if (!/^(?:[AMD]|R(?:100|[0-9]{1,2}))$/.test(change.status) || (change.status.startsWith('R') !== !!change.previousPath)) throw Error('invalid change record');
    const current = inScope(change.path);
    const previous = change.previousPath ? inScope(change.previousPath) : false;
    if (!current && !previous) { dispositions.push({change, disposition: 'outside-scope'}); continue; }
    if (change.status === 'D') { dispositions.push({change, disposition: 'deleted; no current file validation'}); continue; }
    if (!current) { dispositions.push({change, disposition: 'renamed-out; no current file validation'}); continue; }
    const absolute = resolve(repoRoot, change.path);
    if (!lstatSync(absolute).isFile() || !within(realpathSync(root), realpathSync(absolute))) throw Error(`selected file missing or escapes feature root: ${change.path}`);
    files.add(change.path);
    dispositions.push({change, disposition: previous ? 'renamed; validate destination' : 'validate current file'});
  }
  return {files: [...files].sort(), dispositions};
}
export interface Diagnostic {file: string; message: string}
export function normalDiagnostics(projectRoot: string): Diagnostic[] {
  if (!existsSync(join(projectRoot, 'spec/features'))) throw Error('features directory not found');
  const result = spawnSync(process.execPath, ['--import', join(implRoot, 'node_modules/tsx/dist/loader.mjs'), join(implRoot, 'tools/validate-doc-links.ts'), '--json'], {cwd: projectRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  if (result.error || ![0, 1].includes(result.status ?? -1)) throw Error(`normal validator failed: ${result.error?.message ?? result.stderr}`);
  let body;
  try { body = JSON.parse(result.stdout); }
  catch { throw Error(`normal validator failed: invalid JSON response; ${result.stderr.trim()}`); }
  if (!Array.isArray(body.errors) || typeof body.checkedFiles !== 'number' || body.ok !== (result.status === 0) || body.ok !== (body.errors.length === 0) || body.errors.some((e: Diagnostic) => typeof e.file !== 'string' || typeof e.message !== 'string')) throw Error('invalid validator response');
  return body.errors;
}
export function validateChanged(repoRoot: string, projectPath: string, changes: readonly Change[]) {
  repoPath(projectPath);
  const selection = selectChanges(repoRoot, `${projectPath}/spec/features`, changes);
  if (!selection.files.length) return {status: selection.dispositions.some(d => d.disposition !== 'outside-scope') ? 'changes-only' : 'no-work', ...selection, errors: [], outsideScopeErrors: []};
  const diagnostics = normalDiagnostics(resolve(repoRoot, projectPath));
  const selected = new Set(selection.files);
  const errors = diagnostics.filter(d => selected.has(`${projectPath}/${d.file}`));
  const outsideScopeErrors = diagnostics.filter(d => !selected.has(`${projectPath}/${d.file}`));
  return {status: errors.length ? 'reject' : 'selected-pass', ...selection, errors, outsideScopeErrors};
}
