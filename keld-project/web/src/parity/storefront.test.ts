import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const legacy = readFileSync(new URL('../../../prototype/index.html', import.meta.url), 'utf8');

test('the React storefront keeps the verified HTML experience and secure checkout bridge', () => {
  for (const id of [
    'top',
    'gear',
    'legend',
    'studio',
    'notes',
    'contact',
    'shop',
    'shop-product',
    'shop-alpha-offer',
    'shop-specs',
    'shop-faq',
    'full-legend',
    'legend-cinema',
    'shop-bag-dialog',
    'shop-checkout-dialog',
  ]) assert.match(legacy, new RegExp(`id="${id}"`), `legacy experience is missing #${id}`);

  for (const script of ['shop-config.js', 'shop.js', 'app.js', 'legend.js']) {
    assert.match(app, new RegExp(script.replace('.', '\\.')), `React bridge is missing ${script}`);
  }

  assert.match(app, /prototype\/index\.html\?raw/);
  assert.match(app, /createPortal\(<><Checkout/);
  assert.match(app, /id="react-secure-checkout"/);
  assert.match(app, /secure-checkout-title/);
  assert.match(app, /https:\/\/are\.keld\.studio\//);
  assert.match(app, /href="\/auth\/register"/);
  assert.match(app, /Create account/);
});
