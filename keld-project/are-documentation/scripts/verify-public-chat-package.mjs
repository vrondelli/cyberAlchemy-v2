import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root = resolve(import.meta.dirname, '../.runtime/public-chat-package');
const manifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
for (const entry of manifest.files) {
  const bytes = readFileSync(resolve(root, entry.path));
  if (bytes.length !== entry.bytes || sha256(bytes) !== entry.sha256) throw new Error(`package-file-drift:${entry.path}`);
}
const material = {...manifest}; delete material.aggregate_sha256;
if (sha256(JSON.stringify(material)) !== manifest.aggregate_sha256) throw new Error('package-manifest-drift');

const chatUrl = new URL('./projects/cyberAlchemy-v2/keld-project/are-documentation/server/chat.mjs', pathToFileURL(root + '/'));
const {createChatSession} = await import(chatUrl.href);
const receipt = {model: 'package-fixture', live_model_invoked: false, input_tokens: 8, output_tokens: 2};
let calls = 0;
const chat = createChatSession({model: async input => {calls++; return {text: input.json
  ? JSON.stringify({objective: 'Explain ARE', kind: 'understand', preference: null}) : 'Packaged response.', receipt};}});
const events = [];
await chat.submit('Explain ARE.', {signal: new AbortController().signal, emit: event => events.push(event)});
chat.close();
if (calls !== 2 || !events.some(event => event.type === 'message' && event.text === 'Packaged response.')) throw new Error('package-runtime-smoke-failed');
console.log(JSON.stringify({verified: true, files: manifest.files.length, aggregate_sha256: manifest.aggregate_sha256, model_calls: calls, live_model_invoked: false}));
