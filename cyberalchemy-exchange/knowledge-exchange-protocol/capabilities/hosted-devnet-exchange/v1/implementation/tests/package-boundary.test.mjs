import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const expected=[
 'cli/client.mjs','cli/kep.mjs','cli/provider.mjs','cli/storage.mjs',
 'ui-src/account-client.js','ui-src/console-session.js','ui-src/errors.js','ui-src/file-client.js','ui-src/protocol.js',
 'error-registry/v1.json','CLI-API.md'
];

test('CLI package uses an exact public file allowlist',async()=>{
 const packageJson=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 assert.deepEqual(packageJson.files,expected);assert.equal(packageJson.bin.kep,'cli/kep.mjs');assert.equal(packageJson.exports['./client'],'./cli/client.mjs');
 assert.equal(expected.some(path=>/test|evidence|\.playwright|static\//.test(path)),false);
});
