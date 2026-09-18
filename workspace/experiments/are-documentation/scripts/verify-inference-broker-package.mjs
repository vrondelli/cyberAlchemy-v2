import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root = resolve(import.meta.dirname, '../.runtime/inference-broker-package');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
for (const entry of manifest.files) {
  const bytes = readFileSync(resolve(root, entry.path));
  if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`broker-package-file-drift:${entry.path}`);
  if (/(?:child_process|sops-age-secret-provider|coding-agent-runtime)/.test(entry.path)) throw new Error(`broker-package-forbidden:${entry.path}`);
}
const material = {...manifest}; delete material.aggregate_sha256;
if (sha256(JSON.stringify(material)) !== manifest.aggregate_sha256) throw new Error('broker-package-manifest-drift');
const moduleUrl = new URL('./projects/cyberAlchemy-v2/workspace/experiments/are-documentation/server/broker-server.mjs', pathToFileURL(root + '/'));
const loaded = await import(moduleUrl.href);
if (typeof loaded.createBrokerHandler !== 'function') throw new Error('broker-package-entrypoint-invalid');
console.log(JSON.stringify({verified: true, files: manifest.files.length, aggregate_sha256: manifest.aggregate_sha256, live_model_invoked: false}));
