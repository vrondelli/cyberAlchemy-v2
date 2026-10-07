#!/usr/bin/env node

import {createRequire} from 'node:module';
import {chmodSync, mkdirSync, openSync, closeSync, writeFileSync} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';

if (process.env.KELD_LIVE_BROWSER_TEST !== '1') {
  throw new Error('Set KELD_LIVE_BROWSER_TEST=1 to authorize the bounded live non-payment browser check.');
}

const outputDirectory = process.argv[2];
if (!outputDirectory || !isAbsolute(outputDirectory)) {
  throw new Error('Usage: live_nonpayment_browser_acceptance.mjs /NEW/ABSOLUTE/OUTPUT-DIRECTORY');
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
const browserErrors = [];
const requestFailures = [];
let bodyText = '';

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

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(chromiumExecutable ? {executablePath: chromiumExecutable} : {}),
  });
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('requestfailed', request => requestFailures.push(request.url()));

  let response = await page.goto('https://staging.keld.studio/', {waitUntil: 'networkidle', timeout: 60_000});
  check('storefront returns HTTP 200', response?.status() === 200);
  check('storefront stays canonical', page.url() === 'https://staging.keld.studio/');
  check('storefront title is present', (await page.title()).startsWith('Keld'));
  check('create account is visible', await page.getByRole('link', {name: 'Create account', exact: true}).isVisible());
  check('shop navigation is visible', await page.getByRole('link', {name: 'Shop', exact: true}).first().isVisible());
  bodyText = await page.locator('body').textContent() ?? '';
  check('interim terms are visible', /license terms pending/i.test(bodyText));
  check('stale Apache terms are absent', !bodyText.includes('Apache License 2.0'));
  check('desktop has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path: resolve(outputDirectory, 'storefront-desktop.png'), fullPage: true});

  await page.setViewportSize({width: 320, height: 720});
  check('mobile has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path: resolve(outputDirectory, 'storefront-mobile.png'), fullPage: true});

  response = await page.goto('https://staging.keld.studio/checkout?amount=200', {waitUntil: 'networkidle', timeout: 60_000});
  check('checkout returns HTTP 200', response?.status() === 200);
  check('anonymous checkout stays on checkout', new URL(page.url()).pathname === '/checkout');
  check('anonymous checkout requires sign in', await page.getByRole('link', {name: 'Sign in to continue', exact: true}).isVisible());
  check('anonymous checkout has no payment creation action', await page.getByRole('button', {name: 'Continue to sandbox payment', exact: true}).count() === 0);
  check('checkout has no horizontal overflow at 320px', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({path: resolve(outputDirectory, 'checkout-anonymous-mobile.png'), fullPage: true});

  await page.getByRole('link', {name: 'Sign in to continue', exact: true}).click();
  await page.waitForLoadState('domcontentloaded');
  const identity = new URL(page.url());
  check('login reaches the identity host', identity.hostname === 'auth.staging.keld.studio');
  check('login uses the keld realm', identity.pathname === '/realms/keld/protocol/openid-connect/auth');
  check('login uses PKCE', identity.searchParams.get('code_challenge_method') === 'S256' && Boolean(identity.searchParams.get('code_challenge')));
  check('login targets the keld client', identity.searchParams.get('client_id') === 'keld');
  check('journey has no browser errors', browserErrors.length === 0);
  check('journey has no failed requests', requestFailures.length === 0);

  for (const name of ['storefront-desktop.png', 'storefront-mobile.png', 'checkout-anonymous-mobile.png']) {
    chmodSync(resolve(outputDirectory, name), 0o600);
  }
  privateWrite(resolve(outputDirectory, 'receipt.json'), JSON.stringify({
    schema: 'keld-live-nonpayment-browser-acceptance/v1',
    observedAt: new Date().toISOString(),
    ok: true,
    browser: {name: 'chromium', version: browser.version()},
    checks,
    browserErrors,
    requestFailures,
    claimBoundary: 'Anonymous public browser behavior only. No account, order, payment, provider session, entitlement, model turn, or production authorization was created.',
  }, null, 2) + '\n');
  console.log(JSON.stringify({ok: true, checks: checks.length, outputDirectory}));
} catch (error) {
  privateWrite(resolve(outputDirectory, 'failure.json'), JSON.stringify({
    schema: 'keld-live-nonpayment-browser-acceptance-attempt/v1',
    observedAt: new Date().toISOString(),
    ok: false,
    completedChecks: checks,
    error: error instanceof Error ? error.message : String(error),
    browserErrors,
    requestFailures,
    diagnostics: {bodyTextLength: bodyText.length, bodyTextExcerpt: bodyText.slice(0, 2000)},
  }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
}
