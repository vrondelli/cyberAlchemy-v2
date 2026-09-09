import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// The local regression suite needs no Medusa install, Docker, or network.
// The separate oracle command exercises the actual pinned Medusa repository.
test('Medusa quantity-price generated application and exact USD boundary', () => {
  execFileSync(process.execPath, ['--test', fileURLToPath(new URL('../../extensions/medusa-quantity-price-v1/module.test.mjs', import.meta.url))], {encoding:'utf8'});
});
