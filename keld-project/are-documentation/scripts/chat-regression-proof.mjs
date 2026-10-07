import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {serveBuild} from './serve-build.mjs';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(resolve(root, '../video/package.json'));
let playwright;
try {
  playwright = require('playwright-core');
} catch (error) {
  const externalRoot = process.env.ARE_PLAYWRIGHT_ROOT?.trim();
  if (!externalRoot) {
    throw new Error('playwright-core is unavailable; install it or set ARE_PLAYWRIGHT_ROOT to a trusted Playwright package', {cause: error});
  }
  playwright = require(externalRoot);
}
const {chromium} = playwright;
const preview = await serveBuild(resolve(root, 'dist'));
const chromiumExecutable = process.env.ARE_CHROMIUM?.trim();
const browser = await chromium.launch({
  ...(chromiumExecutable ? {executablePath: chromiumExecutable} : {}),
  args: ['--no-sandbox'],
});
const page = await browser.newPage({viewport: {width: 1280, height: 900}});
const errors = [];
const checks = [];
page.on('pageerror', error => errors.push(error.message));
const check = (name, value) => {assert.ok(value, name); checks.push(name);};

let chatRequests = 0;
const state = {preferences: [], routes: [{route_id: 'CA2-ROUTE-UNDERSTAND'}], learned_route_rules: 0, turns_remaining: 19, context_messages: 2};
await page.route('**/are/api/are/**', async route => {
  const request = route.request();
  const path = new URL(request.url()).pathname;
  if (path.endsWith('/status')) return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({configured: true, available: true, availability_reason: null, allowance_resets_at: null, idle_retention_seconds: 1800})});
  if (path.endsWith('/state')) return route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({state})});
  if (path.endsWith('/chat')) {
    chatRequests++;
    if (chatRequests > 1) return route.fulfill({status: 503, contentType: 'application/json', body: JSON.stringify({error: 'provider-unavailable'})});
    const events = [
      {type: 'session', conversation_id: '11111111-1111-4111-8111-111111111111', session_token: 'a'.repeat(64), state: {...state, turns_remaining: 20}},
      {type: 'activity', kind: 'route', decision_kind: 'block', route_id: null, reason_codes: ['selection.no-match'], authority_effect: 'none'},
      {type: 'activity', kind: 'conversation-mode', mode: 'no-route', reason_codes: ['selection.no-match'], authority_effect: 'none', tools_available: 0},
      {type: 'message', text: '## Rendered heading\n\n**Bold answer**\n\n| Check | Result |\n| --- | --- |\n| Markdown | Safe |'},
      {type: 'done'},
      {type: 'state', state},
    ];
    return route.fulfill({status: 200, contentType: 'application/x-ndjson', body: events.map(event => JSON.stringify(event)).join('\n') + '\n'});
  }
  return route.fulfill({status: 200, contentType: 'application/json', body: '{}'});
});

try {
  await page.goto(preview.url + '#view=intro');
  await page.getByRole('link', {name: 'Try ARE', exact: true}).click();
  const composer = page.getByRole('textbox', {name: 'Message the agent'});
  await composer.fill('Show formatted output');
  await page.getByRole('button', {name: 'Send ↑'}).click();
  await page.getByRole('heading', {name: 'Rendered heading'}).waitFor();
  check('assistant Markdown heading renders', await page.locator('.live-answer h2').count() === 1);
  check('assistant Markdown emphasis renders', await page.locator('.live-answer strong', {hasText: 'Bold answer'}).count() === 1);
  check('assistant Markdown table renders', await page.locator('.live-answer table').count() === 1);
  check('raw Markdown markers are not visible', !(await page.locator('.live-answer').innerText()).includes('**'));
  await page.getByText('ARE at work', {exact: false}).click();
  check('router no-match is visible', await page.getByText('Route · no match', {exact: true}).count() === 1);
  check('conversation-only boundary is visible', await page.getByText('Conversation only · no ARE route selected', {exact: true}).count() === 1);

  await page.getByRole('link', {name: 'Documentation', exact: true}).click();
  await page.getByRole('heading', {name: 'What would you like to do?'}).waitFor();
  check('chat is absent from documentation view', await page.locator('#are-walkthrough').count() === 0);
  await page.getByRole('link', {name: 'Introduction', exact: true}).click();
  await page.getByRole('heading', {name: 'Rendered heading'}).waitFor();
  check('conversation survives navigation', await page.getByText('Show formatted output', {exact: true}).count() === 1);
  check('allowance survives navigation', await page.getByText('19 turns left', {exact: true}).count() >= 1);
  check('tab binding survives navigation', await page.evaluate(() => {const stored = JSON.parse(sessionStorage.getItem('are.live-chat/v1') ?? 'null'); return !!stored?.tabId && stored.tabId === history.state?.__areLiveChatTabId;}));
  await page.reload();
  check('tab binding survives reload', await page.evaluate(() => {const stored = JSON.parse(sessionStorage.getItem('are.live-chat/v1') ?? 'null'); return !!stored?.tabId && stored.tabId === history.state?.__areLiveChatTabId;}));
  await page.getByRole('heading', {name: 'Rendered heading'}).waitFor();
  check('conversation survives a same-tab refresh', await page.getByText('Show formatted output', {exact: true}).count() === 1);
  check('server revalidates the refreshed session', await page.getByText('19 turns left', {exact: true}).count() >= 1);

  const opened = page.context().waitForEvent('page');
  await page.evaluate(() => window.open(location.href, '_blank'));
  const child = await opened;
  await child.getByRole('heading', {name: 'What are you working on?'}).waitFor();
  check('opener-created tab starts with a fresh conversation', await child.getByText('Show formatted output', {exact: true}).count() === 0);
  await child.waitForFunction(() => sessionStorage.getItem('are.live-chat/v1') === null);
  check('opener-cloned capability is discarded', await child.evaluate(() => sessionStorage.getItem('are.live-chat/v1') === null));
  await child.close();

  await composer.fill('Retry this request');
  await page.getByRole('button', {name: 'Send ↑'}).click();
  const retry = page.getByRole('button', {name: 'Retry message'});
  await retry.waitFor();
  await retry.click();
  check('failed request can be restored to composer', await composer.inputValue() === 'Retry this request');
  check('browser has no uncaught errors', errors.length === 0);
  console.log(JSON.stringify({status: 'PASS', checks, errors}, null, 2));
} finally {
  await browser.close();
  await preview.close();
}
