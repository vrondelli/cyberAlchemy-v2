import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, extname} from 'node:path';
import {pathToFileURL} from 'node:url';

const base = import.meta.dirname, root = resolve(base, '../../../../..');
const compilerRoot = resolve(root, 'implementation/domainspec-v2/impl');
const compilerURL = pathToFileURL(`${compilerRoot}/`).href;
// The existing compiler uses extensionless TS imports. Node 26 supplies native
// type stripping; this bounded loader only resolves its relative TS filenames.
registerHooks({resolve(specifier, context, next) {
  if (context.parentURL?.startsWith(compilerURL) && specifier.startsWith('.') && !extname(specifier)) {
    const url = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(url)) return next(url.href, context);
  }
  return next(specifier, context);
}});
const {buildMintedProjectViews} = await import(pathToFileURL(resolve(compilerRoot, 'tools/minted-project/views.ts')).href);
const hash = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const model = JSON.parse(readFileSync(resolve(base, 'MODEL.json'), 'utf8'));
for (const dep of model.selected_ontology_dependencies) {
  const source = JSON.parse(readFileSync(resolve(root, '..', dep.path), 'utf8'));
  const matches = source.nodes.filter(n => n.id === dep.selector);
  if (matches.length !== 1 || hash(JSON.stringify(canonical(matches[0]))) !== dep.sha256) throw Error(`Selected meaning changed: ${dep.selector}`);
}
const projectRoot = resolve(base, 'domainspec');
const options = {developmentProfileRegistry: {path: resolve(projectRoot, 'development-profile.json'), handle: 'agent-reasoning-engine-development-explicit-v0.1'}};
const a = buildMintedProjectViews(projectRoot, options), b = buildMintedProjectViews(projectRoot, options);
const outputs = {'graph.json': a.graphBytes, 'source-manifest.json': a.sourceManifestBytes, 'SPEC.md': a.markdownBytes,
  'markdown-view.json': a.markdownViewBytes, 'build-receipt.json': a.buildReceiptBytes,
  'system-ontology.json': JSON.stringify({schema_version: 'are.interaction-review-system-scaffold/v1', source_graph_digest: hash(a.graphBytes), graph: a.graph, authority_effect: 'none'}, null, 2) + '\n'};
for (const key of ['graphBytes', 'sourceManifestBytes', 'markdownBytes', 'markdownViewBytes', 'buildReceiptBytes']) if (a[key] !== b[key]) throw Error(`Nondeterministic ${key}`);
const generated = resolve(projectRoot, 'generated');
if (!process.argv.includes('--check')) mkdirSync(generated, {recursive: true});
for (const [name, bytes] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) {
    if (readFileSync(resolve(generated, name), 'utf8') !== bytes) throw Error(`Stale ${name}`);
  } else writeFileSync(resolve(generated, name), bytes);
}
console.log('PASS: current local DomainSpec compiler, deterministic review graph and system scaffold; authority_effect=none');
