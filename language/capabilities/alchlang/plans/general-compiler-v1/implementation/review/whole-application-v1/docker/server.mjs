import { createServer } from "node:http";
import { GeneratedApplicationRuntime } from "./generated/dist/src/providers/reference/application.js";
import { isValidWebhookSignature } from "./generated/dist/src/providers/reference/inbound-http.js";

const secret = process.env.REVIEW_WEBHOOK_SECRET;
if (!secret || secret.length < 24) throw new Error("REVIEW_WEBHOOK_SECRET must contain at least 24 characters");
const port = Number(process.env.PORT ?? "8080");
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a TCP port");

// Review-only adapter: one seeded order and process-local state. This is not
// the generated PostgreSQL adapter or evidence of durable provider behavior.
const orders = new Map([["7", { id: "7", accepted: true }]]);
const store = {
  async begin() {
    let settled = false;
    return {
      async read({ key }) { const order = orders.get(String(key)); return order ? { ...order } : null; },
      async querySource() { return [...orders.values()].map(order => ({ ...order })); },
      async commit(batch) {
        if (settled) return { status: "indeterminate" };
        if (batch.events.length || batch.writes.some(write => write.target !== "commerce:order" || write.mode !== "replace")) {
          throw new Error("REVIEW_UNSUPPORTED_BATCH");
        }
        for (const write of batch.writes) {
          const value = write.value;
          if (!value || typeof value.accepted !== "boolean" || typeof value.id !== "bigint") {
            throw new Error("REVIEW_INVALID_ORDER_WRITE");
          }
          orders.set(value.id.toString(), { id: value.id.toString(), accepted: value.accepted });
        }
        settled = true;
        return { status: "committed" };
      },
      async rollback() { settled = true; },
    };
  },
};
const application = new GeneratedApplicationRuntime(store);

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(body, (_key, value) => typeof value === "bigint" ? value.toString() : value));
}

async function bodyBytes(request) {
  const parts = [];
  let size = 0;
  for await (const part of request) {
    size += part.length;
    if (size > 65536) throw new Error("REQUEST_TOO_LARGE");
    parts.push(part);
  }
  return Buffer.concat(parts);
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    send(response, 200, { status: "ready", adapter: "in-memory-review" });
    return;
  }
  if (request.method === "GET" && request.url === "/orders/7") {
    send(response, 200, orders.get("7"));
    return;
  }
  if (request.method !== "POST" || request.url !== "/orders") {
    send(response, 404, { code: "NOT_FOUND" });
    return;
  }
  try {
    const bytes = await bodyBytes(request);
    const signature = request.headers["x-domainspec-signature"];
    if (!isValidWebhookSignature(bytes, typeof signature === "string" ? signature : undefined, secret)) {
      send(response, 401, { code: "INVALID_SIGNATURE" });
      return;
    }
    let payload;
    try { payload = JSON.parse(bytes.toString("utf8")); }
    catch { send(response, 400, { code: "INVALID_JSON" }); return; }
    if (!payload || payload.id !== "7" || typeof payload.accepted !== "boolean") {
      send(response, 400, { code: "INVALID_ORDER" });
      return;
    }
    const result = await application.handleWebhook(payload);
    send(response, result.statusCode, result.body);
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_TOO_LARGE") {
      send(response, 413, { code: "REQUEST_TOO_LARGE" });
      return;
    }
    console.error(error);
    send(response, 500, { code: "REVIEW_HOST_ERROR" });
  }
});

server.listen(port, "0.0.0.0", () => console.log(`AlchLang review REST listening on ${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
