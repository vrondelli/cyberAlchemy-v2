import {cpSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {createHash, randomUUID} from 'node:crypto';
import {dirname, relative, resolve, sep} from 'node:path';

const project = resolve(import.meta.dirname, '..');
const repository = resolve(project, '../../..');
const runtime = resolve(project, '.runtime');
const output = resolve(runtime, 'inference-broker-package');
const staging = resolve(runtime, `.inference-broker-package-${randomUUID()}`);
const closure = new Set();
const sha256 = value => createHash('sha256').update(value).digest('hex');
const inside = (root, path) => path === root || path.startsWith(root + sep);
const imports = file => [...readFileSync(file, 'utf8').matchAll(/(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g)].map(match => match[1]);

function visit(input) {
  const file = resolve(input);
  if (closure.has(file)) return;
  if (!inside(repository, file) || !existsSync(file) || !lstatSync(file).isFile() || lstatSync(file).isSymbolicLink()) throw new Error(`broker-package-source-invalid:${relative(repository, file)}`);
  closure.add(file);
  for (const specifier of imports(file)) {
    if (specifier.startsWith('node:')) continue;
    if (!specifier.startsWith('.')) throw new Error(`broker-package-external-dependency:${specifier}`);
    let target = resolve(dirname(file), specifier);
    if (!existsSync(target) && existsSync(`${target}.mjs`)) target += '.mjs';
    visit(target);
  }
}
function copy(source, destination) {mkdirSync(dirname(destination), {recursive: true}); cpSync(source, destination);}

visit(resolve(project, 'server/broker-server.mjs'));
closure.add(resolve(project, 'package.json'));
closure.add(resolve(project, 'package-lock.json'));
try {
  mkdirSync(staging, {recursive: true});
  const entries = [];
  for (const source of [...closure].sort()) {
    const sourceRelative = relative(resolve(repository, '..'), source);
    if (sourceRelative.startsWith('..') || sourceRelative === '') throw new Error(`broker-package-source-escape:${source}`);
    const destination = resolve(staging, 'projects', sourceRelative);
    copy(source, destination);
    const bytes = readFileSync(source);
    entries.push({path: relative(staging, destination).replaceAll('\\', '/'), bytes: bytes.length, sha256: sha256(bytes)});
  }
  const material = {schema_version: 'are.inference-broker-package-manifest/v1',
    entrypoint: 'projects/cyberAlchemy-v2/workspace/experiments/are-documentation/server/broker-server.mjs',
    provider_endpoint: 'https://api.z.ai/api/paas/v4/chat/completions', credential_path: '/run/secrets/model_api_key',
    files: entries, excluded_capabilities: ['shell', 'tool-dispatch', 'arbitrary-url', 'commerce', 'orchestrator', 'sops-process-bridge'], authority_effect: 'none'};
  const manifest = {...material, aggregate_sha256: sha256(JSON.stringify(material))};
  writeFileSync(resolve(staging, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', {mode: 0o644});
  if (existsSync(output)) rmSync(output, {recursive: true});
  renameSync(staging, output);
  console.log(JSON.stringify({output, files: entries.length, aggregate_sha256: manifest.aggregate_sha256}));
} catch (error) {
  if (existsSync(staging)) rmSync(staging, {recursive: true});
  throw error;
}
