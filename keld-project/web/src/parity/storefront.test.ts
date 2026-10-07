import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const legacy = readFileSync(new URL('../../../prototype/index.html', import.meta.url), 'utf8');
const template = readFileSync(new URL('../../../prototype/index.template.html', import.meta.url), 'utf8');
const fragment = readFileSync(new URL('../../../prototype/shop.fragment.html', import.meta.url), 'utf8');
const dialogs = readFileSync(new URL('../../../prototype/shop.dialogs.html', import.meta.url), 'utf8');
const shopScript = readFileSync(new URL('../../../prototype/assets/shop.js', import.meta.url), 'utf8');
const shopConfig = readFileSync(new URL('../../../prototype/assets/shop-config.js', import.meta.url), 'utf8');
const checkoutPage = readFileSync(new URL('../checkout/CheckoutPage.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('the React storefront keeps the verified HTML experience and routes into secure checkout', () => {
  for (const id of [
    'top',
    'gear',
    'studio',
    'notes',
    'contact',
    'shop',
    'shop-product',
    'shop-alpha-offer',
    'shop-specs',
    'shop-faq',
    'shop-bag-dialog',
    'shop-checkout-dialog',
  ]) assert.match(legacy, new RegExp(`id="${id}"`), `legacy experience is missing #${id}`);

  for (const script of ['shop-config.js', 'shop.js', 'app.js']) {
    assert.match(app, new RegExp(script.replace('.', '\\.')), `React bridge is missing ${script}`);
  }

  assert.match(app, /prototype\/index\.html\?raw/);
  assert.match(app, /replaceAll\('src="assets\/', 'src="\/assets\/'\)/);
  assert.match(app, /replaceAll\('href="assets\/', 'href="\/assets\/'\)/);
  assert.match(app, /<CheckoutPage\/>/);
  assert.match(app, /window\.location\.assign\(`\/checkout\?amount=/);
  assert.match(app, /id="react-secure-checkout"/);
  assert.match(app, /secure-checkout-title/);
  assert.match(app, /ARE_PUBLIC_ORIGIN/);
  assert.doesNotMatch(app, /https:\/\/are\.keld\.studio\//);
  assert.match(app, /href="\/auth\/register"/);
  assert.match(app, /Create account/);
  assert.match(app, /authState === 'unavailable'/);
  assert.match(app, /Retry account check/);
  assert.match(app, /Sign out was not completed/);
  assert.match(app, /event\.stopImmediatePropagation\(\)/);
  assert.match(legacy, /<title>Synvora — Agent gear\. Even minds need tools\.<\/title>/);
  assert.doesNotMatch(legacy, /id="legend"|href="#legend"|full-legend|legend-cinema|assets\/legend\.(?:css|js)/);
  assert.doesNotMatch(template, /id="legend"|href="#legend"|full-legend|legend-cinema|assets\/legend\.(?:css|js)/);
  assert.match(styles, /\.checkout-page-grid[\s\S]*grid-template-columns/);
  assert.match(styles, /\.checkout-summary-column[\s\S]*position: sticky/);
  assert.match(styles, /@media \(max-width: 900px\)/);
});

test('the sandbox offer has no operative license claim or ARE release delivery promise', () => {
  const interim = 'Sandbox demonstration only. No ARE engine release is delivered. Final license terms are under review.';
  for (const [name, source] of [
    ['legacy storefront', legacy],
    ['storefront template', template],
    ['shop fragment', fragment],
    ['shop dialogs', dialogs],
    ['shop script', shopScript],
    ['shop config', shopConfig],
    ['React storefront', app],
    ['checkout page', checkoutPage],
  ] as const) {
    assert.doesNotMatch(source, /Apache(?: License)?[ -]?2\.0/i, `${name} still advertises Apache rights`);
  }
  assert.match(legacy, new RegExp(interim.replaceAll('.', '\\.')));
  assert.match(checkoutPage, new RegExp(interim.replaceAll('.', '\\.')));
  assert.match(shopConfig, /licenseApprovedForSale: false/);
  assert.match(shopConfig, /licenseId: 'unpublished'/);
});

test('unavailable account copy does not claim an order was saved before creation', () => {
  assert.match(checkoutPage, /Account check could not finish\. No payment action is enabled\. Retry your account check\./);
  assert.match(checkoutPage, /Leaving checkout does not start a payment\. You can return to review your selection\./);
  assert.match(checkoutPage, /Account details are unavailable\. Retry the account check before reviewing an order amount\./);
  assert.doesNotMatch(checkoutPage, /Your order remains saved in this tab and in your authenticated history\./);
});
