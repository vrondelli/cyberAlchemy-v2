import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "./core.mjs";
import { MemoryStore } from "./store.mjs";

const MAX_BODY = 65536;

function errorPayload(error) {
  const code = error?.code || "INTERNAL_ERROR";
  const message = error instanceof AppError ? error.message : "internal server error";
  return { error: { code, message } };
}

function statusFor(error) {
  if (error instanceof AppError && Number.isInteger(error.status)) return error.status;
  if (error?.code === "DUPLICATE_LESSON" || error?.code === "REVISION_CONFLICT") return 409;
  if (error?.code === "LESSON_NOT_FOUND" || error?.code === "NOT_FOUND") return 404;
  if (error?.code === "BODY_TOO_LARGE") return 413;
  return 500;
}

function send(response, status, body) {
  const data = JSON.stringify(body);
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(data) });
  response.end(data);
}

function readBody(request) {
  const length = Number(request.headers["content-length"]);
  if (Number.isFinite(length) && length > MAX_BODY) {
    throw new AppError("BODY_TOO_LARGE", "request body exceeds 65536 bytes", 413);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = error => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };
    request.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY) {
        fail(new AppError("BODY_TOO_LARGE", "request body exceeds 65536 bytes", 413));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    request.on("error", fail);
    request.on("aborted", () => fail(new AppError("MALFORMED_JSON", "request body was aborted", 400)));
  });
}

async function jsonBody(request) {
  const raw = await readBody(request);
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError("MALFORMED_JSON", "request body must contain valid JSON", 400);
  }
}

function queryObject(url, fields) {
  const result = {};
  for (const field of fields) result[field] = url.searchParams.get(field);
  return result;
}

function pathLessonId(pathname, suffix) {
  const parts = pathname.split("/");
  if (parts.length !== 4 || parts[1] !== "lessons" || parts[3] !== suffix) return null;
  try {
    return decodeURIComponent(parts[2]);
  } catch {
    throw new AppError("INVALID_INPUT", "lesson_id path is invalid");
  }
}

export function createServer(store) {
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const { method } = request;
      if (method === "GET" && url.pathname === "/health") {
        send(response, 200, { ok: true, schema_version: 1 });
        return;
      }
      if (method === "GET" && url.pathname === "/lessons") {
        send(response, 200, { lessons: store.list(queryObject(url, ["product_id", "participant_id"])) });
        return;
      }
      if (method === "GET" && url.pathname === "/history") {
        send(response, 200, { events: store.history(queryObject(url, ["product_id", "participant_id", "lesson_id"])) });
        return;
      }
      if (method === "GET" && url.pathname === "/export") {
        send(response, 200, store.exportScope(queryObject(url, ["product_id", "participant_id"])));
        return;
      }
      if (method === "POST" && url.pathname === "/lessons") {
        send(response, 201, { lesson: store.create(await jsonBody(request)) });
        return;
      }
      const reviseId = method === "POST" ? pathLessonId(url.pathname, "revise") : null;
      if (reviseId !== null) {
        const body = await jsonBody(request);
        body.lesson_id = reviseId;
        send(response, 200, { lesson: store.revise(body) });
        return;
      }
      const disableId = method === "POST" ? pathLessonId(url.pathname, "disable") : null;
      if (disableId !== null) {
        const body = await jsonBody(request);
        body.lesson_id = disableId;
        send(response, 200, { lesson: store.disable(body) });
        return;
      }
      if (method === "POST" && url.pathname === "/explain") {
        send(response, 200, store.explain(await jsonBody(request)));
        return;
      }
      throw new AppError("NOT_FOUND", "endpoint was not found", 404);
    } catch (error) {
      if (!response.headersSent) send(response, statusFor(error), errorPayload(error));
      else response.destroy();
    }
  });
}

export function parseServerArgs(args) {
  let store;
  let port;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--store") store = args[++index];
    else if (arg === "--port") port = args[++index];
    else throw new AppError("INVALID_INPUT", `unknown argument: ${arg}`);
  }
  if (typeof store !== "string" || store.length === 0) throw new AppError("INVALID_INPUT", "--store FILE is required");
  if (typeof port !== "string" || !/^\d+$/.test(port) || Number(port) > 65535) throw new AppError("INVALID_INPUT", "--port must be an integer from 0 to 65535");
  return { store, port: Number(port) };
}

export async function main(args = process.argv.slice(2)) {
  const options = parseServerArgs(args);
  const store = new MemoryStore(options.store);
  const server = createServer(store);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", resolve);
  });
  const address = server.address();
  process.stdout.write(JSON.stringify({ port: address.port }) + "\n");
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write(JSON.stringify(errorPayload(error)) + "\n");
    process.exitCode = 1;
  });
}
