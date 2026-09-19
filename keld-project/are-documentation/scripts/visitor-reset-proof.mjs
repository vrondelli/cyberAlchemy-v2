import {createRequire} from 'node:module';
import {writeFileSync, mkdirSync} from 'node:fs';
if (process.env.ARE_LIVE_CHAT_TEST !== '1') throw new Error('Set ARE_LIVE_CHAT_TEST=1 to authorize this two-turn live reset check.');
const require = createRequire(import.meta.url);
const {chromium} = require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser = await chromium.launch({headless: true, executablePath: '/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const checks = [], responses = [], responseTasks = [];
function check(name, value) {if (!value) throw new Error(name); checks.push(name);}
mkdirSync('evidence', {recursive: true});
try {
  const first = await browser.newContext({viewport: {width: 1366, height: 900}}), second = await browser.newContext({viewport: {width: 331, height: 587}});
  const page = await first.newPage(), visitor = await second.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message)); visitor.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {if (response.url().endsWith('/api/are/chat')) responseTasks.push((async () => {try {responses.push((await response.text()).trim().split('\n').map(line => {const {session_token, ...safe} = JSON.parse(line); return safe;}));} catch {}})());});
  await page.goto('http://127.0.0.1:4193/');
  await page.getByRole('link', {name: 'Try ARE', exact: true}).click();
  check('chat is discoverable from the page navigation', await page.locator('.are-live-chat').isVisible());
  check('no simulated conversation is offered', await page.locator('.agent-simulation').count() === 0 && await page.getByRole('link', {name: /guided simulation/i}).count() === 0);
  check('first visitor begins with empty language state', (await page.locator('.live-state-controls').innerText()).includes('Nothing learned yet'));
  async function send(text) {
    await page.getByRole('textbox', {name: 'Message the agent'}).fill(text);
    await page.getByRole('button', {name: 'Send ↑', exact: true}).click();
    await page.getByRole('button', {name: 'Stop', exact: true}).waitFor({state: 'hidden', timeout: 150000});
    await Promise.all(responseTasks);
    const error = await page.locator('.live-error').allTextContents();
    check('live turn completes' + (error.length ? ': ' + error.join(' ') : ''), error.length === 0);
  }
  await send('Use the word "orbiters" instead of "users" in this conversation. Explain invitation-only signup briefly.');
  await page.getByRole('button', {name: 'Forget language', exact: true}).waitFor();
  check('language preference is visible', await page.getByRole('button', {name: 'Forget language', exact: true}).isEnabled());
  await page.getByText('What this session remembers', {exact: true}).click();
  check('retained quote is inspectable', /orbiters/i.test(await page.locator('.live-state-detail').innerText()));
  await visitor.goto('http://127.0.0.1:4193/#are-walkthrough');
  check('second visitor starts with fresh independent state', (await visitor.locator('.live-state-controls').innerText()).includes('Nothing learned yet') && await visitor.locator('.live-chat-turn').count() === 0);
  await page.getByRole('button', {name: 'Forget language', exact: true}).click();
  await page.getByText('Language preferences forgotten.', {exact: false}).waitFor();
  check('forgotten preference disappears from retained state', !/orbiters/i.test(await page.locator('.live-state-detail').innerText()));
  check('old messages are visibly excluded', await page.locator('.archived-turn').count() === 1);
  check('forgetting keeps routing history', /1 decisions/.test(await page.locator('.live-state-controls').innerText()));
  await send('Which special term did I ask you to use for people joining?');
  check('live reply does not reuse forgotten vocabulary', !/orbiters/i.test(await page.locator('.live-answer').last().innerText()));
  const context = responses.at(-1)?.find(event => event.kind === 'context');
  check('new model context has no forgotten preference or old transcript', context?.preferences.every(quote => !/orbiters/i.test(quote)) && context?.messages_included === 1);
  await page.getByRole('button', {name: 'Reset routing history', exact: true}).click();
  await page.getByText('Routing history and prior intent cleared.', {exact: false}).waitFor();
  check('routing state returns to fresh', /Automatic · fresh/.test(await page.locator('.live-state-controls').innerText()));
  check('reset does not restore the turn allowance', /18 turns left/.test(await page.locator('.live-state-controls').innerText()));
  for (const width of [1366, 331, 240]) {
    await page.setViewportSize({width, height: width === 1366 ? 900 : 587});
    check(`${width}px controls and page fit`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator('.are-live-chat').screenshot({path: `evidence/visitor-reset-${width}.png`});
  }
  await page.getByRole('button', {name: 'Start fresh', exact: true}).click();
  await page.waitForFunction(() => document.querySelectorAll('.live-chat-turn').length === 0);
  check('full reset clears conversation', await page.locator('.live-chat-turn').count() === 0);
  await page.reload();
  check('reload starts a new empty session', (await page.locator('.live-state-controls').innerText()).includes('Nothing learned yet') && await page.locator('.live-chat-turn').count() === 0);
  check('no browser errors', errors.length === 0);
  writeFileSync('evidence/visitor-reset-proof.json', JSON.stringify({checks, responses}, null, 2));
  console.log(JSON.stringify({checks: checks.length, results: checks}));
} finally {writeFileSync('evidence/visitor-reset-attempt.json', JSON.stringify({checks, responses}, null, 2)); await browser.close();}
