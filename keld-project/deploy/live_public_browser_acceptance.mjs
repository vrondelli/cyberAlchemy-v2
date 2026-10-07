#!/usr/bin/env node

import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {chmodSync, mkdirSync, openSync, closeSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

if (process.env.KELD_LIVE_BROWSER_TEST !== '1') {
  throw new Error('Set KELD_LIVE_BROWSER_TEST=1 to authorize the bounded live public-browser check.');
}

const outputDirectory = process.argv[2];
if (!outputDirectory || !isAbsolute(outputDirectory)) {
  throw new Error('Usage: live_public_browser_acceptance.mjs /NEW/ABSOLUTE/OUTPUT-DIRECTORY');
}

const modulePath = process.env.PLAYWRIGHT_MODULE?.trim();
if (!modulePath || !isAbsolute(modulePath)) {
  throw new Error('PLAYWRIGHT_MODULE must name an absolute trusted Playwright package path.');
}

const chromiumExecutable = process.env.CHROMIUM_EXECUTABLE?.trim();
if (chromiumExecutable && !isAbsolute(chromiumExecutable)) {
  throw new Error('CHROMIUM_EXECUTABLE must be absolute when supplied.');
}

mkdirSync(outputDirectory, {recursive: false, mode: 0o700});
const require = createRequire(import.meta.url);
const {chromium} = require(modulePath);
const checks = [];
const observations = {};
const browserErrors = [];
const sameOriginRequestFailures = [];
const authorizationRequests = [];
const allowedHosts = new Set([
  'are.keld.studio',
  'auth.staging.keld.studio',
  'staging.keld.studio',
]);

function check(name, condition) {
  if (!condition) throw new Error(name);
  checks.push(name);
}

function privateWrite(path, value) {
  const descriptor = openSync(path, 'wx', 0o600);
  try {
    writeFileSync(descriptor, value);
  } finally {
    closeSync(descriptor);
  }
}

function fileEvidence(path) {
  const bytes = readFileSync(path);
  return {
    bytes: statSync(path).size,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

const browser = await chromium.launch({
  headless: true,
  ...(chromiumExecutable ? {executablePath: chromiumExecutable} : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const context = await browser.newContext({
    viewport: {width: 1440, height: 1000},
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('request', request => {
    if (request.headers().authorization) authorizationRequests.push(request.url());
  });
  page.on('requestfailed', request => {
    const host = new URL(request.url()).hostname;
    if (allowedHosts.has(host)) sameOriginRequestFailures.push(request.url());
  });

  const storefront = await page.goto('https://staging.keld.studio/', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  check('storefront returns HTTP 200', storefront?.status() === 200);
  check('storefront stays on the canonical host', page.url() === 'https://staging.keld.studio/');
  check('storefront title is present', (await page.title()).startsWith('Keld'));
  check('storefront account entry is visible', await page.getByRole('link', {name: 'Create account', exact: true}).isVisible());
  check('storefront ARE entry uses the dedicated host', await page.getByRole('link', {name: 'Explore ARE', exact: true}).getAttribute('href') === 'https://are.keld.studio/');
  check('storefront has no desktop overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path: resolve(outputDirectory, 'storefront.png'), fullPage: true});
  chmodSync(resolve(outputDirectory, 'storefront.png'), 0o600);

  const storefrontLegacy = await context.request.get('https://staging.keld.studio/are/', {maxRedirects: 0});
  check('storefront does not serve ARE at the legacy path', storefrontLegacy.status() === 404);
  observations.storefrontLegacyStatus = storefrontLegacy.status();

  await page.getByRole('link', {name: 'Create account', exact: true}).click();
  await page.waitForLoadState('domcontentloaded');
  const registrationUrl = new URL(page.url());
  check('signup enters the staging identity host', registrationUrl.hostname === 'auth.staging.keld.studio');
  check('signup uses the keld realm authorization endpoint', registrationUrl.pathname === '/realms/keld/protocol/openid-connect/auth');
  check('signup explicitly requests account creation', registrationUrl.searchParams.get('prompt') === 'create');
  check('signup uses PKCE', registrationUrl.searchParams.get('code_challenge_method') === 'S256' && Boolean(registrationUrl.searchParams.get('code_challenge')));
  check('signup targets the keld client', registrationUrl.searchParams.get('client_id') === 'keld' && registrationUrl.searchParams.get('response_type') === 'code');
  const registrationAction = new URL(await page.locator('form').getAttribute('action'));
  check('signup posts only to the keld registration action', registrationAction.hostname === 'auth.staging.keld.studio' && registrationAction.pathname === '/realms/keld/login-actions/registration');
  check('signup form requests an email', await page.locator('input[name="email"]').isVisible());
  check('signup form requests a password', await page.locator('input[name="password"]').isVisible());
  check('signup form requests password confirmation', await page.locator('input[name="password-confirm"]').isVisible());
  check('signup form requests first and last names', await page.locator('input[name="firstName"]').isVisible() && await page.locator('input[name="lastName"]').isVisible());
  observations.registrationHost = registrationUrl.hostname;

  const areResponse = await page.goto('https://are.keld.studio/', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  check('ARE root returns HTTP 200', areResponse?.status() === 200);
  check('ARE root stays canonical', page.url() === 'https://are.keld.studio/');
  check('ARE title is present', (await page.title()).includes('Agent Reasoning Engine'));
  const areLegacy = await context.request.get('https://are.keld.studio/are/', {maxRedirects: 0});
  check('ARE legacy path redirects permanently', areLegacy.status() === 308);
  check('ARE legacy redirect targets the root', areLegacy.headers().location === '/');
  observations.areLegacyStatus = areLegacy.status();

  await page.getByRole('link', {name: 'Try ARE', exact: true}).click();
  await page.locator('.are-live-chat').waitFor({state: 'visible'});
  check('public chat is discoverable', await page.locator('.are-live-chat').isVisible());
  await page.locator('.live-session-panel > summary').click();
  check('new visitor begins without learned language', (await page.locator('.live-state-controls').innerText()).includes('Nothing learned yet'));

  const prompt = 'For this conversation, call users testers. In one short sentence, explain why context matters.';
  await page.getByRole('textbox', {name: 'Message the agent'}).fill(prompt);
  await page.getByRole('button', {name: 'Send ↑', exact: true}).click();
  await page.getByRole('button', {name: 'Stop', exact: true}).waitFor({state: 'hidden', timeout: 150_000});
  check('live chat completes without a visible error', await page.locator('.live-error').count() === 0);
  check('live chat renders exactly one answer', await page.locator('.live-answer').count() === 1);
  const chatText = await page.locator('.live-chat-log').innerText();
  check('live chat avoids intent-output-invalid', !/intent-output-invalid/i.test(chatText));
  check('live chat exposes one activity receipt', await page.locator('.live-activity').count() === 1);
  check('learned terminology is inspectable', /testers/i.test(await page.locator('.live-state-detail').innerText()));
  await page.locator('.are-live-chat').screenshot({path: resolve(outputDirectory, 'are-chat.png')});
  chmodSync(resolve(outputDirectory, 'are-chat.png'), 0o600);

  await page.getByRole('button', {name: 'Forget language', exact: true}).click();
  await page.getByText('Language preferences forgotten.', {exact: false}).waitFor();
  check('forget removes learned terminology', !/testers/i.test(await page.locator('.live-state-detail').innerText()));
  await page.getByRole('button', {name: 'Start fresh', exact: true}).click();
  await page.waitForFunction(() => document.querySelectorAll('.live-chat-turn').length === 0);
  check('start fresh clears the transcript', await page.locator('.live-chat-turn').count() === 0);

  await page.setViewportSize({width: 320, height: 640});
  check('ARE has no mobile overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const composer = page.locator('.live-composer');
  await composer.scrollIntoViewIfNeeded();
  const composerBox = await composer.boundingBox();
  check('ARE composer fits the mobile viewport', composerBox !== null && composerBox.x >= 0 && composerBox.width <= 320);

  await page.reload({waitUntil: 'networkidle'});
  await page.locator('.live-session-panel > summary').click();
  check('reload starts an empty visitor session', (await page.locator('.live-state-controls').innerText()).includes('Nothing learned yet') && await page.locator('.live-chat-turn').count() === 0);
  check('browser sends no authorization header', authorizationRequests.length === 0);
  check('KELD origins have no failed browser requests', sameOriginRequestFailures.length === 0);
  check('journey has no browser errors', browserErrors.length === 0);

  const storefrontScreenshot = resolve(outputDirectory, 'storefront.png');
  const chatScreenshot = resolve(outputDirectory, 'are-chat.png');
  const toolPath = fileURLToPath(import.meta.url);
  const receipt = {
    schema: 'keld-live-public-browser-acceptance/v1',
    observedAt: new Date().toISOString(),
    ok: true,
    browser: {name: 'chromium', version: browser.version()},
    tool: {
      path: 'deploy/live_public_browser_acceptance.mjs',
      ...fileEvidence(toolPath),
    },
    screenshots: {
      storefront: fileEvidence(storefrontScreenshot),
      areChat: fileEvidence(chatScreenshot),
    },
    surfaces: {
      storefront: 'https://staging.keld.studio/',
      identity: observations.registrationHost,
      are: 'https://are.keld.studio/',
    },
    observations,
    checks,
    privacy: {
      accountCreated: false,
      checkoutCreated: false,
      paymentProviderInvoked: false,
      responseTextStored: true,
      responseTextStorage: 'Synthetic prompt and answer are visible only in the private mode-0600 ARE screenshot; the JSON receipt omits both.',
      cookiesStored: false,
      credentialsStored: false,
    },
    claimBoundary: 'Public browser behavior only. No account, checkout, payment, entitlement, provider webhook, deployment, or production authorization is claimed.',
  };
  privateWrite(resolve(outputDirectory, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ok: true, checks: checks.length, outputDirectory}));
} catch (error) {
  const failure = {
    schema: 'keld-live-public-browser-acceptance-attempt/v1',
    observedAt: new Date().toISOString(),
    ok: false,
    completedChecks: checks,
    error: error instanceof Error ? error.message : String(error),
    browserErrors,
    sameOriginRequestFailureCount: sameOriginRequestFailures.length,
    authorizationRequestCount: authorizationRequests.length,
  };
  privateWrite(resolve(outputDirectory, 'attempt.json'), JSON.stringify(failure, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
