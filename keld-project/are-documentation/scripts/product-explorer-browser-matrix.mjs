import {serveBuild} from './serve-build.mjs';
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.ARE_PLAYWRIGHT_ROOT?.trim();
let playwright;
try {
  playwright = require(playwrightRoot || 'playwright-core');
} catch (error) {
  throw new Error('Playwright is unavailable; set ARE_PLAYWRIGHT_ROOT to a trusted package', {cause: error});
}

const output = resolve(process.env.ARE_EXPLORER_EVIDENCE_DIR?.trim() || 'evidence/product-explorer');
const chromiumPath = process.env.ARE_CHROMIUM?.trim();
const server = await serveBuild(resolve('dist'));
const results = [];
mkdirSync(output, {recursive: true});

try {
  for (const name of ['chromium', 'firefox', 'webkit']) {
    let browser;
    const errors = [];
    try {
      browser = await playwright[name].launch({
        headless: true,
        ...(name === 'chromium' && chromiumPath ? {executablePath: chromiumPath} : {}),
      });
      const page = await browser.newPage({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(server.url + '#view=continuity&tour=request&step=request', {waitUntil: 'networkidle'});
      await page.locator('[data-explanation=request]').waitFor();
      await page.locator('.node-explanation').getByRole('button', {name: 'Next', exact: true}).click();
      await page.locator('[data-explanation=route]').waitFor();
      await page.getByRole('button', {name: 'Read full guide →', exact: true}).click();
      await page.locator('.manual-page').waitFor();
      await page.getByRole('button', {name: 'Return to canvas', exact: true}).first().click();
      await page.locator('[data-explanation=route]').waitFor();
      if (errors.length) throw new Error(errors.join('; '));
      results.push({browser: name, version: browser.version(), status: 'PASS'});
      console.log('PASS ' + name);
    } catch (error) {
      results.push({browser: name, status: browser ? 'FAIL' : 'UNAVAILABLE', error: String(error)});
      if (browser) process.exitCode = 1;
      console.log(name, results.at(-1));
    } finally {
      await browser?.close();
    }
  }
} finally {
  writeFileSync(resolve(output, 'browser-matrix.json'), JSON.stringify(results, null, 2) + '\n');
  await server.close();
}
