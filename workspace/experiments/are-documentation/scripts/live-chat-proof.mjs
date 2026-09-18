import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.ARE_PLAYWRIGHT_ROOT ?? '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser = await chromium.launch({headless: true, executablePath: process.env.ARE_CHROMIUM ?? '/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const base = process.env.ARE_CANVAS_URL ?? 'http://127.0.0.1:4193';
const live = process.env.ARE_LIVE_CHAT_TEST === '1';
const checks = [], responses = [];
function check(name, value) {if (!value) throw new Error(name); checks.push(name);}
mkdirSync('evidence', {recursive: true});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1000}}), errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({url: request.url(), authorization: Boolean(request.headers().authorization)}));
  if (live) page.on('response', async response => {if (response.url().endsWith('/api/are/chat')) {try {responses.push(await response.text());} catch {}}});
  await page.goto(base + '/#are-walkthrough');
  await page.locator('.are-live-chat').waitFor();
  check('live scope is explicit', (await page.locator('.live-chat-scope').innerText()).includes('not connected'));
  await page.getByRole('button', {name: 'Explain context management in plain language.', exact: true}).click();
  check('suggestions populate an editable draft', (await page.getByRole('textbox', {name: 'Message the agent'}).inputValue()).includes('context management'));
  if (live) {
    for (const [index, prompt] of [
      'For this conversation, call people joining teammates. Explain invitation-only signup in two short sentences.',
      'Explain what happens to people joining when an invitation expires. Use our terminology.',
      'Plan the next checks for this signup flow. Keep it brief.',
    ].entries()) {
      await page.getByRole('textbox', {name: 'Message the agent'}).fill(prompt);
      await page.getByRole('button', {name: 'Send ↑', exact: true}).click();
      await page.getByRole('button', {name: 'Stop', exact: true}).waitFor({state: 'hidden', timeout: 150000});
      check(`live turn ${index + 1} completed without error`, await page.locator('.live-error').count() === 0 && await page.locator('.live-answer').count() === index + 1);
      check(`live turn ${index + 1} contains ARE receipts`, await page.locator('.live-activity').count() === index + 1);
    }
    check('later reply reuses user terminology', /teammates/i.test(await page.locator('.live-answer').nth(1).innerText()));
    await page.locator('.live-activity').last().locator('> summary').click();
    check('plan route is visible', /Route · plan/.test(await page.locator('.live-activity').last().innerText()));
    check('provider accounting is visible', /input \+ \d+ output tokens/.test(await page.locator('.live-activity').last().innerText()));
  }
  for (const [width, height] of [[1440, 1000], [331, 587], [240, 320]]) {
    await page.setViewportSize({width, height});
    check(`${width}px has no page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const composer = page.locator('.live-composer'); await composer.scrollIntoViewIfNeeded();
    const rect = await composer.boundingBox(); check(`${width}px composer fits`, rect.width <= width && rect.x >= 0);
    await page.locator('.are-live-chat').screenshot({path: `evidence/live-chat-${width}.png`});
  }
  // Separate browser lifecycle fixture: no additional paid model request.
  await page.route('**/api/are/chat', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.fulfill({contentType: 'application/x-ndjson', body: JSON.stringify({type: 'message', text: 'LATE FIXTURE REPLY'}) + '\n' + JSON.stringify({type: 'done'}) + '\n'}).catch(() => {});
  });
  await page.getByRole('textbox', {name: 'Message the agent'}).fill('Cancellation fixture');
  await page.getByRole('button', {name: 'Send ↑', exact: true}).click();
  await page.getByRole('button', {name: 'Stop', exact: true}).click();
  await page.waitForTimeout(700);
  check('Stop prevents late browser reply', !(await page.locator('.live-chat-log').innerText()).includes('LATE FIXTURE REPLY'));
  await page.getByRole('button', {name: 'Start fresh', exact: true}).click();
  await page.waitForFunction(() => document.querySelectorAll('.live-chat-turn').length === 0);
  check('new chat clears transcript and draft', await page.locator('.live-chat-turn').count() === 0 && await page.getByRole('textbox', {name: 'Message the agent'}).inputValue() === '');
  check('browser never sends a provider authorization header', requests.every(request => !request.authorization));
  check('browser talks only to local server', requests.every(request => request.url.startsWith(base)));
  check('no browser errors', errors.length === 0);
  writeFileSync('evidence/live-chat-proof.json', JSON.stringify({live, checks, responses: responses.map(text => text.trim().split('\n').map(line => {const {session_token, ...safe} = JSON.parse(line); return safe;}))}, null, 2));
  console.log(JSON.stringify({live, checks: checks.length, results: checks}));
} finally {await browser.close();}
