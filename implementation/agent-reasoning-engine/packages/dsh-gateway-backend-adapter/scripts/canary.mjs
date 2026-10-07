import assert from "node:assert/strict";
import {createServer} from "node:http";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../../codex-app-server-wrapper/index.mjs";

const SERVER = fileURLToPath(new URL("../bin/are-dsh-app-server.mjs", import.meta.url));
const PATCH = fileURLToPath(new URL("../test/canary-provider.patch.yml", import.meta.url));
const EXPECTED = "ARE DSH adapter canary OK";
let requests = 0;

const mock = createServer(async (request, response) => {
  if (request.method !== "POST") { response.writeHead(404).end(); return; }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  requests += 1;
  assert.deepEqual(body.tools ?? [], [], "read-only canary must advertise zero tools");
  const event = {
    id: "are-dsh-canary",
    object: "chat.completion.chunk",
    model: body.model,
    choices: [{index: 0, delta: {role: "assistant", content: EXPECTED}, finish_reason: "stop"}],
    usage: {prompt_tokens: 8, completion_tokens: 6, total_tokens: 14},
  };
  response.writeHead(200, {"content-type": "text/event-stream"});
  response.end(`data: ${JSON.stringify(event)}\n\ndata: [DONE]\n\n`);
});

await new Promise((resolveValue, reject) => {
  mock.once("error", reject);
  mock.listen(0, "127.0.0.1", resolveValue);
});
const address = mock.address();
const home = await mkdtemp(join(tmpdir(), "are-dsh-canary-"));
const transport = spawnAppServerRpcTransport({
  command: process.execPath,
  args: [SERVER],
  env: {
    ...process.env,
    ARE_DSH_PATCH_PATH: PATCH,
    ARE_DSH_MOCK_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
    ARE_DSH_MOCK_API_KEY: "local-canary-no-secret",
    ARE_DSH_PASSTHROUGH_ENV: "ARE_DSH_MOCK_API_KEY,ARE_DSH_MOCK_BASE_URL",
    DSH_HOME: home,
  },
});
const client = createAppServerRpcClient({transport, request_timeout_ms: 30000, completion_timeout_ms: 120000});

try {
  const initialized = await client.initialize({clientInfo: {name: "are-dsh-canary", version: "1"}});
  assert.equal(initialized.capabilities.effects, false);
  await client.notify("initialized", {});
  const thread = await client.startThread({cwd: process.cwd()});
  const result = await client.runTurn({threadId: thread.thread.id, input: [{type: "text", text: "Return the canary phrase exactly."}]});
  assert.equal(result.completed.turn.status, "completed");
  assert.equal(result.text, EXPECTED);
  assert.equal(requests, 1);
  process.stdout.write(`${JSON.stringify({ok: true, dsh_version: "0.1.5-rc.2", response: result.text, provider_requests: requests, tools_advertised: 0, authority_effect: "none"})}\n`);
} finally {
  await client.close();
  await rm(home, {recursive: true, force: true});
  await new Promise((resolveValue) => mock.close(resolveValue));
}
