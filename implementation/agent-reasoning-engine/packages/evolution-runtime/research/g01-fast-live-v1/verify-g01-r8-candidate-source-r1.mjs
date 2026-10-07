// Read-only qualification of the exact WSL-only r8 source candidate.
// No campaign, model, gold, or filesystem write is performed.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root = '/home/vlad_/are-benchmark-archive/g01-r18-r8-source-candidate-r1';
const source = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench';
const pins = new Map([
  [`${source}/ranked_source_hints_r8.py`, 'e934ac458c1566fe0e7483dd9107d2cef5a98aa4df0662b73f6c23fb0afa88d1'],
  [`${source}/ranked_source_worker_r8.py`, 'b06d6a4d2291a96a3d51978058ca6c4b53208c4882780dd7dd629149604dfb6a'],
  [`${source}/ranked_source_supervisor_r8.py`, '1e7a76ad4df6fc865380c3e54ffdb7746afe6a54a73eb839d1cace91c428c41c'],
  [`${source}/ranked-source-index-worker-r8.mjs`, 'f0449dec5658721df56cbb232b55fb276aaa4064fa5d160a59ed2687cbbde5c6'],
  [`${source}/ranked-source-index-service-r8.mjs`, '82353c684fba1a1b4c0818171bacd2479a8ae0615bc90270a5361f2541b4ecc5'],
  [`${source}/discovery-v1/orchestrate-intent-anchor-r3.mjs`, 'ed78c723370a3a8cea56cf8819ef641fd0b75afc9d1fdebc674354549f9af33e'],
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (condition, reason) => {if (!condition) throw Error(`g01-r8-candidate-source.${reason}`);};

async function main() {
  need(process.argv.length === 2 && resolve(root) === root, 'arguments');
  for (const [name, expected] of pins) need(sha(readFileSync(join(root, name))) === expected, `file-drift:${name}`);
  const prepare = join(root, 'implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs');
  const {bindSourceTree} = await import(pathToFileURL(prepare).href);
  const tree = bindSourceTree(root);
  need(tree.file_count === 420 && tree.tree_sha256 === '6e7d9ba3ba09fb97322c203f1547d9636d69c849a87dfcf84d3075aed51d85e1', 'tree-drift');
  const runner = join(root, 'implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/run-pair.mjs');
  const service = join(root, source, 'ranked-source-index-service-r8.mjs');
  const runnerModule = await import(pathToFileURL(runner).href);
  const serviceModule = await import(pathToFileURL(service).href);
  need(typeof runnerModule.runPair === 'function' && typeof serviceModule.createSourceHintService === 'function', 'import-closure');
  console.log(JSON.stringify({schema_version: 'are.g01-r8-candidate-source-check/v1',
    status: 'passed-local-source-only', source_root: root, file_count: tree.file_count,
    source_tree_sha256: tree.tree_sha256, pinned_files: pins.size,
    runner_import_closure: 'passed', service_import_closure: 'passed',
    model_calls: 0, gold_loaded: false, authority_effect: 'none'}));
}

main().catch(error => {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;});
