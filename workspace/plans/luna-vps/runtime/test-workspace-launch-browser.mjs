// Real browser, UI and authenticated bridge. Open questions: WORKSPACE-LAUNCH.md#open-questions
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {startTaskBridge} from './workspace-task-bridge.mjs';
import {compileTask} from './task-contract.mjs';
const [depsArg, kernelArg, screenshotArg, mode = 'fixture'] = process.argv.slice(2);
const deps = resolve(depsArg), kernel = resolve(kernelArg), here = dirname(fileURLToPath(import.meta.url));
const {chromium} = await import(pathToFileURL(resolve(deps, 'node_modules/playwright/index.mjs')));
const {build} = await import(pathToFileURL(resolve(deps, 'node_modules/esbuild/lib/main.js')));
const root = mkdtempSync(resolve(deps, 'browser-launch-'));
const ui = resolve(here, '../../../runtime/src/features/control-center');
for (const name of ['TaskLauncher.tsx', 'workers.ts', 'control-center.css']) cpSync(resolve(ui, name), resolve(root, name));
writeFileSync(resolve(root, 'entry.tsx'), 'import React from "react"; import {createRoot} from "react-dom/client"; import {TaskLauncher} from "./TaskLauncher"; createRoot(document.getElementById("root")!).render(<TaskLauncher/>);');
await build({entryPoints: [resolve(root, 'entry.tsx')], bundle: true, outfile: resolve(root, 'ui.js'), jsx: 'automatic', platform: 'browser'});
const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#141a16;margin:24px;font-family:system-ui"><main id="root" class="luna-workers" style="max-width:620px;margin:auto"></main><script src="/ui.js"></script></body></html>';
const web = createServer((request, response) => {
  const path = request.url === '/ui.js' ? resolve(root, 'ui.js') : request.url === '/style.css' ? resolve(root, 'control-center.css') : null;
  response.setHeader('Content-Type', request.url === '/ui.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html'); response.end(path ? readFileSync(path) : html);
});
await new Promise(ok => web.listen(0, '127.0.0.1', ok));
const token = 'browser-fixture-token-' + createHash('sha256').update(root).digest('hex');
const config = {state: resolve(root, 'state'), kernel, port: 0, max_tasks: 1, ssh_target: 'root@187.77.248.154'};
let calls = 0, finish, browser, bridge;
const errors = [];
try {
  bridge = await startTaskBridge(config, {token, ...(mode === 'live' ? {} : {execute: async task => {
    calls++; await new Promise(ok => {finish = ok;}); const compiled = compileTask(task);
    return {status: 'PASS', offline_replay: true, replay_provider_calls: 0, transient_host_stopped: true, result: {history: {status: 'succeeded', result: {
      request_id: task.task_id, task_digest: compiled.digest, prompt_sha256: createHash('sha256').update(compiled.prompt).digest('hex'), status: 'passed', verified: true,
      model: 'gpt-5.6-luna', provider_calls: 1, max_output_tokens: 512, tools_enabled: false, output: '<script>not executable</script> A verified summary.',
      thread_id: 'browser-thread', turn_id: 'browser-turn', completion_binding_digest: 'a'.repeat(64),
    }}}};
  }})});
  browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? {executablePath: process.env.CHROMIUM_EXECUTABLE} : {})});
  const page = await browser.newPage({viewport: {width: 1000, height: 1000}});
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${web.address().port}`);
  await page.getByLabel('Task bridge address', {exact: true}).fill(`http://127.0.0.1:${bridge.port}`);
  await page.getByLabel('Bridge token', {exact: true}).fill(token);
  await page.getByRole('button', {name: 'Connect task bridge', exact: true}).click();
  await page.getByText('1 launches remaining').waitFor();
  await page.getByLabel('Task title', {exact: true}).fill('Workspace launch acceptance');
  await page.getByLabel('Task instruction', {exact: true}).fill('Summarize the supplied status in one sentence.');
  await page.getByLabel('Supplied text', {exact: true}).fill('RWO records commands before dispatch. ARE verifies native completion. Workspace now has explicit task review and launch controls.');
  await page.getByRole('button', {name: 'Review task', exact: true}).click();
  await page.getByRole('button', {name: 'Launch task · 1 model call', exact: true}).waitFor();
  await page.getByLabel('Task title', {exact: true}).fill('Workspace launch acceptance revised');
  assert.equal(await page.getByRole('button', {name: 'Launch task · 1 model call', exact: true}).count(), 0);
  await page.getByRole('button', {name: 'Review task', exact: true}).click();
  await page.getByRole('button', {name: 'Launch task · 1 model call', exact: true}).click();
  await page.getByRole('status').filter({hasText: 'dispatching'}).waitFor();
  if (mode !== 'live') {assert.equal(calls, 1); finish();}
  await page.getByRole('status').filter({hasText: /succeeded|uncertain/}).waitFor({timeout: 300000});
  assert.equal(await page.getByRole('status').textContent(), 'succeeded', 'Launch did not complete; inspect retained journals before another attempt');
  assert.equal(await page.getByRole('button', {name: 'Review task', exact: true}).isDisabled(), true);
  if (mode !== 'live') await page.getByText('<script>not executable</script> A verified summary.', {exact: true}).waitFor();
  await page.screenshot({path: resolve(screenshotArg), fullPage: true});
  await page.setViewportSize({width: 390, height: 844});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.getByRole('button', {name: 'Disconnect task bridge', exact: true}).click();
  assert.equal(await page.getByLabel('Bridge token', {exact: true}).inputValue(), '');
  assert.deepEqual(errors, []);
  const journal = JSON.parse(readFileSync(resolve(config.state, 'launches.json'))).state;
  assert.equal(journal.tasks.length, 1); assert.equal(journal.tasks[0].status, 'succeeded');
  console.log(JSON.stringify({status: 'PASS', mode, review_invalidated_on_edit: true, explicit_budget_launch: true,
    real_browser_cors_and_auth: true, result_rendered: true, mobile_no_horizontal_overflow: true, token_cleared_on_disconnect: true,
    external_model_calls: mode === 'live' ? journal.tasks[0].result.provider_calls : 0,
    ...(mode === 'live' ? {live_report: journal.tasks[0].report} : {}), open_questions_ref: '../runtime/WORKSPACE-LAUNCH.md#open-questions'}, null, 2));
} finally {
  if (finish) finish(); await browser?.close(); await bridge?.close(); web.closeAllConnections(); await new Promise(ok => web.close(ok));
  // Preserve live receipts/staging for operator inspection; fixtures are disposable.
  if (mode !== 'live') rmSync(root, {recursive: true, force: true});
}
