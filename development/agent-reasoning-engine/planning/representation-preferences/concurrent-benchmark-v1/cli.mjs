import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildSmokeManifest, createGlmExecutor, verifySourceBindings } from './adapter.mjs';

const [command, ...args] = process.argv.slice(2);
if (command === 'smoke-manifest') {
  const [destination, id = 'glm-concurrency-smoke', count = '4'] = args;
  if (!destination) throw Error('usage: cli.mjs smoke-manifest DESTINATION [ID] [COUNT]');
  const manifest = buildSmokeManifest({ id, count: Number(count), token_budget: Number(count) * 512 });
  writeFileSync(destination, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ manifest: resolve(destination), jobs: manifest.jobs.length, token_budget: manifest.token_budget }));
} else if (command === 'run' || command === 'resume') {
  const [manifestPath, directory, concurrency = '2', credential] = args;
  if (!manifestPath || !directory) throw Error('usage: cli.mjs run|resume MANIFEST DIRECTORY [CONCURRENCY] [CREDENTIAL]');
  const { runScheduler } = await import('../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/scheduler.mjs');
  const { summarizeRun } = await import('../../../../../implementation/agent-reasoning-engine/packages/benchmark-scheduler/report.mjs');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  verifySourceBindings(manifest);
  const execute = createGlmExecutor({ directory: resolve(directory, 'provider'), credential });
  const state = await runScheduler({ directory: resolve(directory), manifest, execute, concurrency: Number(concurrency) });
  const report = summarizeRun({ manifest, state });
  const temporary = resolve(directory, 'report.' + randomUUID() + '.tmp');
  writeFileSync(temporary, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  renameSync(temporary, resolve(directory, 'report.json'));
  console.log(JSON.stringify(report, null, 2));
} else {
  throw Error('commands: smoke-manifest, run, resume');
}
