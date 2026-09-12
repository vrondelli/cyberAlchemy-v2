import { settled } from 'svelte';
import { test } from '../../test';
export default test({
 mode: ['client', 'hydrate'],
 async test({ assert, target }) {
  await settled();
  assert.htmlEqual(target.innerHTML, '<p>ready</p>');
 }
});
