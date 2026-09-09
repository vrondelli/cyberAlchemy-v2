import {createHash} from 'node:crypto';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildMintedProjectViews} from '../../../../../../projects/domainspec-v2/impl/tools/minted-project/views.ts';

const base = import.meta.dirname;
const repository = resolve(base, '../../../../../..');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const model = JSON.parse(readFileSync(resolve(base, 'MODEL.json'), 'utf8'));
for (const dependency of model.selected_ontology_dependencies) {
  const source = JSON.parse(readFileSync(resolve(repository, dependency.path), 'utf8'));
  const matches = source.nodes.filter((node: any) => node.id === dependency.selector);
  if (matches.length !== 1 || hash(JSON.stringify(canonical(matches[0]))) !== dependency.sha256) throw Error(`Selected ontology dependency changed: ${dependency.selector}`);
}
const scaffold = JSON.parse(readFileSync(resolve(repository, model.prototype_ontology), 'utf8'));
const ids = new Set(scaffold.nodes.map((node: any) => node.id));
if (ids.size !== scaffold.nodes.length || scaffold.relations.some((edge: any) => !ids.has(edge.source) || !ids.has(edge.target))) throw Error('Prototype ontology closure invalid');
if (model.concepts.some((id: string) => !ids.has(id)) || scaffold.authority_effect !== 'none') throw Error('Prototype model binding invalid');
const projectRoot = resolve(base, 'domainspec');
const options = {developmentProfileRegistry: {path: resolve(projectRoot, 'development-profile.json'), handle: 'agent-reasoning-engine-development-explicit-v0.1'}};
const a = buildMintedProjectViews(projectRoot, options), b = buildMintedProjectViews(projectRoot, options);
const outputs = {'graph.json': 'graphBytes', 'source-manifest.json': 'sourceManifestBytes', 'SPEC.md': 'markdownBytes', 'markdown-view.json': 'markdownViewBytes', 'build-receipt.json': 'buildReceiptBytes'} as const;
const generated = resolve(projectRoot, 'generated');
mkdirSync(generated, {recursive: true});
for (const [file, key] of Object.entries(outputs)) {
  if (a[key] !== b[key]) throw Error(`Nondeterministic ${key}`);
  if (process.argv.includes('--check')) {
    if (readFileSync(resolve(generated, file), 'utf8') !== a[key]) throw Error(`Stale ${file}`);
  } else writeFileSync(resolve(generated, file), a[key]);
}
const system = JSON.stringify({schema_version: 'are.interaction-learning-system-scaffold/v1', authority_effect: 'none', source_graph_digest: createHash('sha256').update(a.graphBytes).digest('hex'), graph: a.graph}, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(resolve(generated, 'system-ontology.json'), 'utf8') !== system) throw Error('Stale system scaffold');
} else writeFileSync(resolve(generated, 'system-ontology.json'), system);
console.log('PASS: isolated DomainSpec prototype replay; authority_effect=none');
