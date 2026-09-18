import {cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {createHash, randomUUID} from 'node:crypto';
import {dirname, relative, resolve, sep} from 'node:path';

const project = resolve(import.meta.dirname, '..');
const repository = resolve(project, '../../..');
const runtime = resolve(project, '.runtime');
const output = resolve(runtime, 'public-chat-package');
const staging = resolve(runtime, `.public-chat-package-${randomUUID()}`);
const closure = new Set();

const sha256 = value => createHash('sha256').update(value).digest('hex');
function inside(root, path) {return path === root || path.startsWith(root + sep);}
function imports(file) {
  return [...readFileSync(file, 'utf8').matchAll(/(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g)].map(match => match[1]);
}
function visit(input) {
  const file = resolve(input);
  if (closure.has(file)) return;
  if (!inside(repository, file) || !existsSync(file) || !lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) throw new Error(`package-source-invalid:${relative(repository, file)}`);
  closure.add(file);
  for (const specifier of imports(file)) {
    if (specifier.startsWith('node:')) continue;
    if (!specifier.startsWith('.')) throw new Error(`package-external-dependency:${specifier}`);
    let target = resolve(dirname(file), specifier);
    if (!existsSync(target) && existsSync(`${target}.mjs`)) target += '.mjs';
    visit(target);
  }
}
function copy(source, destination) {mkdirSync(dirname(destination), {recursive: true}); cpSync(source, destination);}
function walk(root) {
  return readdirSync(root, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(resolve(root, entry.name)) : [resolve(root, entry.name)]);
}

visit(resolve(project, 'server/chat-server.mjs'));
const profilePath = resolve(repository, 'implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json');
closure.add(profilePath);
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
for (const source of profile.provenance) closure.add(resolve(repository, '..', source.path));
closure.add(resolve(project, 'package.json'));
closure.add(resolve(project, 'package-lock.json'));
for (const file of walk(resolve(project, 'dist'))) closure.add(file);

try {
  mkdirSync(staging, {recursive: true});
  const entries = [];
  for (const source of [...closure].sort()) {
    const sourceRelative = relative(resolve(repository, '..'), source);
    if (sourceRelative.startsWith('..') || sourceRelative === '') throw new Error(`package-source-escape:${source}`);
    const destination = resolve(staging, 'projects', sourceRelative);
    copy(source, destination);
    const bytes = readFileSync(source);
    entries.push({path: relative(staging, destination).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha256(bytes)});
  }
  const material = {schema_version: 'are.public-chat-package-manifest/v1', entrypoint: 'projects/cyberAlchemy-v2/workspace/experiments/are-documentation/server/chat-server.mjs',
    files: entries, forbidden_capabilities: ['child_process', 'coding-agent-runtime', 'secret-provider', 'sandbox', 'verifier', 'agent-runtime', 'commerce', 'orchestrator'], authority_effect: 'none'};
  const manifest = {...material, aggregate_sha256: sha256(JSON.stringify(material))};
  writeFileSync(resolve(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {mode: 0o644});
  if (existsSync(output)) rmSync(output, {recursive: true});
  renameSync(staging, output);
  console.log(JSON.stringify({output, files: entries.length, aggregate_sha256: manifest.aggregate_sha256}));
} catch (error) {
  if (existsSync(staging)) rmSync(staging, {recursive: true});
  throw error;
}
