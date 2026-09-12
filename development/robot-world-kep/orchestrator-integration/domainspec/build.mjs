import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../../');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const bytes = value => JSON.stringify(value, null, 2) + '\n';
const lock = read(resolve(here, 'compiler-lock.json'));
if (process.versions.node !== lock.node) throw Error('NODE_BINDING');
if (read(resolve(root, 'agent-routing/node_modules/tsx/package.json')).version !== lock.tsx) throw Error('TSX_BINDING');
for (const [path, digest] of Object.entries(lock.files)) {
  if (hash(readFileSync(resolve(root, path))) !== digest) throw Error(`COMPILER_DRIFT:${path}`);
}
const rule = read(resolve(here, 'nodes/dynamics.json')).body;
const definition = readFileSync(resolve(root,rule.definition_binding.path),'utf8');
const start = definition.indexOf(rule.definition_binding.heading);
const end = definition.indexOf('\n## ',start+rule.definition_binding.heading.length);
if (start < 0 || hash(definition.slice(start,end < 0 ? undefined : end+1)) !== rule.definition_binding.sha256) throw Error('DEFINITION_DRIFT');
if (rule.contract_sha256 !== hash(readFileSync(resolve(here, '../CONTRACT.md'))) ||
    rule.mapping_sha256 !== hash(readFileSync(resolve(here, '../MAPPING.md'))) ||
    JSON.stringify(rule.profile) !== JSON.stringify(read(resolve(here, '../PROFILE.json')))) throw Error('CONTRACT_DRIFT');
const {buildMintedProjectViews} = await import(pathToFileURL(resolve(root,
  'implementation/domainspec-v2/impl/tools/minted-project/views.ts')).href);
const opts = {developmentProfileRegistry:{path:resolve(here,'development-profile.json'),handle:'robot-interaction-development-v1'}};
function build() {
  const v = buildMintedProjectViews(here, opts);
  return {
    'graph.json':v.graphBytes, 'source-manifest.json':v.sourceManifestBytes,
    'SPEC.md':v.markdownBytes, 'markdown-view.json':v.markdownViewBytes,
    'build-receipt.json':v.buildReceiptBytes,
    'system-ontology.json':bytes({schema_version:'robot-interaction.system/v1',
      authority_effect:'none', source_graph_sha256:hash(v.graphBytes),
      compiler_lock_sha256:hash(readFileSync(resolve(here,'compiler-lock.json'))),
      nodes:v.graph.nodes,edges:v.graph.edges,open_questions:'../../REPORT.md#open-questions'})};
}
const a=build(), b=build();
if (JSON.stringify(a)!==JSON.stringify(b)) throw Error('NONDETERMINISTIC');
for (const [name, content] of Object.entries(a)) {
  const target=resolve(here,'generated',name);
  if (process.argv.includes('--check')) {
    if (readFileSync(target,'utf8')!==content) throw Error(`PROJECTION_DRIFT:${name}`);
  } else {
    mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,content);
  }
}
console.log(JSON.stringify({status:'PASS',deterministic_builds:2,artifacts:6,graph_sha256:hash(a['graph.json']),authority_effect:'none'}));
