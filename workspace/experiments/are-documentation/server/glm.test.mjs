import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createModel} from './glm.mjs';

test('broker-side model reads one dedicated file and sends a fixed closed provider body', async () => {
  const root = await mkdtemp(join(tmpdir(), 'are-broker-key-'));
  const credentialPath = join(root, 'model-key');
  await writeFile(credentialPath, 'fixture-key\n', {mode: 0o400}); chmodSync(credentialPath, 0o400);
  let observed;
  try {
    const model = createModel({credentialPath, post: async (body, options) => {
      observed = {body: JSON.parse(body), apiKey: options.apiKey};
      return {status: 200, payload: {choices: [{index: 0, message: {role: 'assistant', content: 'answer'}, finish_reason: 'stop', logprobs: null}], usage: {prompt_tokens: 3, completion_tokens: 1}}, bytes: 1};
    }});
    const result = await model({messages: [{role: 'user', content: 'hello'}], json: false, signal: new AbortController().signal});
    assert.equal(result.text, 'answer'); assert.equal(observed.apiKey, 'fixture-key');
    assert.equal(observed.body.model, 'glm-5.3-flash'); assert.equal(observed.body.tools, undefined);
    assert.deepEqual(Object.keys(observed.body).sort(), ['max_tokens', 'messages', 'model', 'reasoning_effort', 'stream', 'thinking']);
  } finally {await rm(root, {recursive: true});}
});

test('credential path and material fail closed before dispatch', async () => {
  let calls = 0;
  const post = async () => {calls++;};
  const relative = createModel({credentialPath: 'relative-key', post});
  await assert.rejects(relative({messages: [{role: 'user', content: 'hello'}]}), /credential-path-invalid/);
  assert.equal(calls, 0);
});
