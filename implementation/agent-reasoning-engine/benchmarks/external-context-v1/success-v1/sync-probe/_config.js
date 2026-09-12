import { tick } from 'svelte';
import { test } from '../../test';
export default test({
 mode: ['client', 'hydrate'],
 async test({ assert, target }) {
  await tick();
  await tick();
  assert.htmlEqual(target.innerHTML, '<p>steady</p>');
 }
});
