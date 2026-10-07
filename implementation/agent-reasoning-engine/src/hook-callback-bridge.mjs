import {createServer} from "node:http";
import {randomBytes, timingSafeEqual} from "node:crypto";
import {MAX_INPUT_BYTES} from "./decision-cli.mjs";

// One bridge belongs to one gateway client. Its credential is host-private.
export async function startHookCallbackBridge({client} = {}) {
  if (typeof client?.observeHook !== "function") throw new TypeError("callback.client-required");
  const token = randomBytes(32).toString("hex");
  const expected = Buffer.from(`Bearer ${token}`);
  let closed = false;
  const server = createServer(async (request, response) => {
    const reply = (status, result) => {
      response.writeHead(status, {"Content-Type": "application/json", "Cache-Control": "no-store"});
      response.end(JSON.stringify(result));
    };
    const fail = (status, reason) => reply(status, {ok: false, stdout: {}, reason_codes: [reason]});
    const actual = Buffer.from(request.headers.authorization ?? "");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return fail(401, "callback.unauthorized");
    if (request.method !== "POST" || request.url !== "/hook-events") return fail(404, "callback.endpoint-invalid");
    if (request.headers["content-type"] !== "application/json") return fail(415, "callback.content-type-invalid");
    try {
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        if (bytes > MAX_INPUT_BYTES) return fail(413, "callback.input-too-large");
        chunks.push(chunk);
      }
      let event;
      try { event = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { return fail(400, "callback.invalid-json"); }
      if (!event || typeof event !== "object" || Array.isArray(event) || event.method !== undefined || !["UserPromptSubmit", "PreToolUse", "Stop"].includes(event.hook_event_name)) return fail(400, "callback.event-invalid");
      const result = await client.observeHook(event);
      if (typeof result?.ok !== "boolean" || !result.stdout || typeof result.stdout !== "object") return fail(500, "callback.adapter-invalid");
      reply(200, {ok: result.ok, ...(typeof result.kind === "string" ? {kind: result.kind} : {}),
        stdout: result.stdout, reason_codes: result.reason_codes ?? []});
    } catch {
      if (!response.headersSent && !response.destroyed) fail(500, "callback.adapter-failed");
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 5000;
  server.setTimeout(10000, socket => socket.destroy());
  server.maxConnections = 32;
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const connection = Object.freeze({url: `http://127.0.0.1:${server.address().port}/hook-events`, token});
  return Object.freeze({connection,
    close: async () => {
      if (closed) return;
      closed = true;
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    },
  });
}
