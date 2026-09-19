import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createServer as createHttpServer, request as httpRequest} from 'node:http';
import {createChatServer, parseChatLimit, parseIdleRetentionSeconds} from './chat-server.mjs';

test('production retention accepts positive integer seconds and rejects absent or malformed values', () => {
  assert.equal(parseIdleRetentionSeconds('1'), 1000);
  assert.equal(parseIdleRetentionSeconds('1800'), 1_800_000);
  for (const value of [undefined, '', '0', '-1', '1.5', ' 60', '60 ']) assert.throws(() => parseIdleRetentionSeconds(value), /chat-idle-retention-invalid/);
});

test('production chat limits are explicit bounded integers', () => {
  assert.equal(parseChatLimit('120', 'hourly-turn-limit', 1, 10000), 120);
  assert.equal(parseChatLimit('500000', 'hourly-token-limit', 37000, 10000000), 500000);
  for (const value of [undefined, '', '0', '-1', '1.5', ' 120']) assert.throws(() => parseChatLimit(value, 'hourly-turn-limit', 1, 10000), /chat-hourly-turn-limit-invalid/);
  assert.throws(() => parseChatLimit('36999', 'hourly-token-limit', 37000, 10000000), /chat-hourly-token-limit-invalid/);
});

test('production entry point fails closed when retention is absent', () => {
  const env = {...process.env}; delete env.ARE_CHAT_IDLE_RETENTION_SECONDS;
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./chat-server.mjs', import.meta.url))], {env, encoding: 'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Public chat failed to start/);
});

function raw(port, path, {host = `127.0.0.1:${port}`, method = 'GET'} = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest({host: '127.0.0.1', port, path, method, headers: {host}}, res => {
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()}));
    });
    req.on('error', reject); req.end();
  });
}

test('production server binds static responses to the configured host and browser policy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'are-chat-static-'));
  await writeFile(join(root, 'index.html'), '<!doctype html><title>ARE</title>');
  const portFinder = createHttpServer();
  await new Promise(resolve => portFinder.listen(0, '127.0.0.1', resolve));
  const port = portFinder.address().port;
  await new Promise(resolve => portFinder.close(resolve));
  const reserve = createChatServer({port, publicOrigin: `http://127.0.0.1:${port}`, publicRoot: root, model: async () => {throw new Error('unused');}});
  await new Promise(resolve => reserve.listen(port, '127.0.0.1', resolve));
  try {
    const response = await raw(port, '/');
    assert.equal(response.status, 200); assert.match(response.body, /<title>ARE<\/title>/);
    assert.match(response.headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['x-frame-options'], 'DENY');
    assert.equal(response.headers['referrer-policy'], 'no-referrer');
    const health = await raw(port, '/healthz', {host: 'container-local'});
    assert.equal(health.status, 200); assert.deepEqual(JSON.parse(health.body), {status: 'ready', provider_calls: 0});
    assert.equal((await raw(port, '/', {host: 'attacker.example'})).status, 421);
    assert.equal((await raw(port, '/%2e%2e/%2e%2e/etc/passwd')).status, 404);
    assert.equal((await raw(port, '/', {method: 'POST'})).status, 405);
  } finally {await new Promise(resolve => reserve.close(resolve)); await rm(root, {recursive: true});}
});
