import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeArePublicOrigin} from '../config.ts';

test('ARE public origin defaults to the reviewed production host', () => {
  assert.equal(normalizeArePublicOrigin(undefined), 'https://are.keld.studio/');
  assert.equal(normalizeArePublicOrigin('https://are.example.test'), 'https://are.example.test/');
});

test('ARE public origin rejects paths and ambiguous or unsafe destinations', () => {
  for (const value of [
    'http://are.example.test',
    'https://are.example.test:8443',
    'https://user@are.example.test',
    'https://are.example.test/are/',
    'https://are.example.test/?next=elsewhere',
    '//are.example.test',
    'not a URL',
  ]) assert.throws(() => normalizeArePublicOrigin(value), /absolute HTTPS origin/);
});
