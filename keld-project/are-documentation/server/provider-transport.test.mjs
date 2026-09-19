import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveProviderAddresses} from './provider-transport.mjs';

const result = (...answers) => async (host, options) => {
  assert.equal(host, 'api.z.ai');
  assert.deepEqual(options, {all: true, verbatim: true});
  return answers;
};

test('provider DNS admission accepts only validated public addresses', async () => {
  assert.deepEqual(await resolveProviderAddresses(result(
    {address: '8.8.8.8', family: 4},
    {address: '2606:4700:4700::1111', family: 6},
    {address: '8.8.8.8', family: 4},
  )), [
    {address: '8.8.8.8', family: 4},
    {address: '2606:4700:4700::1111', family: 6},
  ]);
});

test('provider DNS admission rejects private, metadata, loopback, mapped and transition addresses', async () => {
  for (const answer of [
    {address: '10.0.0.1', family: 4},
    {address: '127.0.0.1', family: 4},
    {address: '169.254.169.254', family: 4},
    {address: '192.168.1.1', family: 4},
    {address: '::1', family: 6},
    {address: '::ffff:127.0.0.1', family: 6},
    {address: 'fd00:ec2::254', family: 6},
    {address: 'fe80::1', family: 6},
    {address: '2002:7f00:1::', family: 6},
  ]) await assert.rejects(resolveProviderAddresses(result(answer)), /provider-address-forbidden/);
});

test('provider DNS admission fails closed on resolver errors and malformed answers', async () => {
  await assert.rejects(resolveProviderAddresses(async () => { throw new Error('private resolver detail'); }), /provider-dns-invalid/);
  await assert.rejects(resolveProviderAddresses(result()), /provider-dns-invalid/);
  await assert.rejects(resolveProviderAddresses(result({address: 'not-an-ip', family: 4})), /provider-dns-invalid/);
  await assert.rejects(resolveProviderAddresses(result({address: '8.8.8.8', family: 6})), /provider-dns-invalid/);
});
