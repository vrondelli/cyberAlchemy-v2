#!/usr/bin/env node
import { randomBytes, createHash } from "node:crypto";
import { once } from "node:events";
import { createServer, request as httpRequest } from "node:http";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  NativeViewerError,
  validateNetworkBoundary,
  validateRequestTarget,
} from "./serve-native-viewer.mjs";
import { treeIdentity } from "./build-thin-prototype.mjs";
import { verifyAdapterReceipt } from "./verify-adapter-receipt.mjs";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const defaultImplementationRoot = resolve(scriptRoot, "..");
const loopback = "127.0.0.1";
const cookieName = "oew_prototype_access";
const tokenPattern = /^[a-f0-9]{64}$/;
const allowedMethods = new Set(["GET", "HEAD"]);
const nativeGraphRoute = "/knowledge-graph.json";
const nativeAuxDocuments = Object.freeze({
  "/meta.json": "{}\n",
  "/config.json": "{}\n",
  "/staleness.json": `${JSON.stringify({
    graphs: {
      knowledge: {
        status: "unknown",
        reason: "graph-commit-unavailable",
      },
    },
  })}\n`,
  "/diff-overlay.json": '{"changedNodeIds":[],"affectedNodeIds":[]}\n',
  "/domain-graph.json": "null\n",
});
const dataRoutes = Object.freeze({
  "/oew-data/presentation-graph.json": "presentation-graph.json",
  "/oew-data/evidence-sidecar.json": "evidence-sidecar.json",
  "/oew-data/adapter-receipt.json": "adapter-receipt.json",
});

export class OewGatewayError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "OewGatewayError";
    this.issue = issue;
  }
}

const sha256 = (content) =>
  createHash("sha256").update(content).digest("hex");

const canonicalJson = (value) => {
  const canonical = (item) => {
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "boolean"
    ) return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (Array.isArray(item)) return item.map(canonical);
    if (!item || typeof item !== "object") {
      throw new OewGatewayError("CANONICAL_VALUE_INVALID");
    }
    return Object.fromEntries(
      Object.keys(item).sort().map((key) => [key, canonical(item[key])]),
    );
  };
  return `${JSON.stringify(canonical(value), null, 2)}\n`;
};

function contained(root, candidate, allowRoot = false) {
  const rel = relative(root, candidate);
  return (
    (allowRoot || rel !== "") &&
    rel !== ".." &&
    !rel.startsWith(`..${sep}`) &&
    !isAbsolute(rel)
  );
}

function normalizedRelative(rawPath) {
  if (
    typeof rawPath !== "string" ||
    !rawPath ||
    isAbsolute(rawPath) ||
    rawPath.includes("\\") ||
    rawPath.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new OewGatewayError("PATH_INVALID", String(rawPath));
  }
  return rawPath;
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function artifact(path, logicalPath) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new OewGatewayError("ARTIFACT_NOT_REGULAR", logicalPath);
  }
  const content = await readFile(path);
  return {
    path: logicalPath,
    sha256: sha256(content),
    size_bytes: info.size,
  };
}

async function readJson(path, issue) {
  try {
    const value = JSON.parse(await readFile(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("object required");
    }
    return value;
  } catch (error) {
    throw new OewGatewayError(issue, error.message);
  }
}

function requireExact(actual, expected, issue) {
  if (actual !== expected) {
    throw new OewGatewayError(issue, `${actual} != ${expected}`);
  }
}

export function parseGatewayArgs(argv) {
  if (argv[0] !== "serve") throw new OewGatewayError("COMMAND_INVALID");
  if (argv.length !== 7) throw new OewGatewayError("ARGUMENT_COUNT_INVALID");
  const allowed = new Set(["--build-handle", "--adapter-run", "--output"]);
  const values = {};
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(flag) || !value) {
      throw new OewGatewayError("ARGUMENT_INVALID", flag ?? "<missing>");
    }
    if (values[flag]) throw new OewGatewayError("ARGUMENT_DUPLICATE", flag);
    values[flag] = value;
  }
  return {
    buildHandle: values["--build-handle"],
    adapterRun: values["--adapter-run"],
    output: values["--output"],
  };
}

export function validateGatewayNetwork({
  bindHost = loopback,
  targetHost = loopback,
} = {}) {
  try {
    return validateNetworkBoundary({
      bindHost,
      proxyTargetHost: targetHost,
    });
  } catch (error) {
    if (error instanceof NativeViewerError) {
      throw new OewGatewayError(error.issue, error.message);
    }
    throw error;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const split = part.indexOf("=");
        return split < 0
          ? [part, ""]
          : [part.slice(0, split), part.slice(split + 1)];
      }),
  );
}

function mime(path) {
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
  }[extname(path).toLowerCase()] ?? "application/octet-stream";
}

function commonHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    "Content-Type": contentType,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function sanitizeBootstrap(body) {
  const sanitized = body
    .toString("utf8")
    .replace(
      /<link\b[^>]*\bhref=["']https?:\/\/[^"']+["'][^>]*>\s*/gi,
      "",
    );
  if (/https?:\/\//i.test(sanitized)) {
    throw new OewGatewayError("EXTERNAL_BOOTSTRAP_REFERENCE");
  }
  return Buffer.from(sanitized);
}

function send(response, status, body, method, headers = {}) {
  response.writeHead(status, {
    ...commonHeaders(headers["Content-Type"]),
    ...headers,
    "Content-Length": body.length,
  });
  response.end(method === "HEAD" ? undefined : body);
}

async function listen(server, port) {
  server.listen(port, loopback);
  await Promise.race([
    once(server, "listening"),
    once(server, "error").then(([error]) => Promise.reject(error)),
  ]);
}

async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolveClose, rejectClose) =>
    server.close((error) => (error ? rejectClose(error) : resolveClose())),
  );
}

async function assertBuildHandle(handlePath, implementationRoot) {
  const handle = await readJson(handlePath, "BUILD_HANDLE_INVALID");
  if (
    handle.schema_version !== "oewtp.thin-prototype-build-handle.v1" ||
    handle.result !== "pass" ||
    handle.swu_id !== "SWU-OEWTP-002" ||
    handle.cleanup?.retained_dist_preserved !== true
  ) {
    throw new OewGatewayError("BUILD_HANDLE_NOT_PASS");
  }
  const distLogical = String(handle.dashboard_dist?.path ?? "").replace(/\/$/, "");
  const distPath = resolve(implementationRoot, normalizedRelative(distLogical));
  if (!contained(implementationRoot, distPath)) {
    throw new OewGatewayError("DIST_PATH_ESCAPE");
  }
  const canonicalDist = await realpath(distPath);
  if (!contained(implementationRoot, canonicalDist)) {
    throw new OewGatewayError("DIST_SYMLINK_ESCAPE");
  }
  const identity = await treeIdentity(canonicalDist);
  requireExact(
    identity.tree_sha256,
    handle.dashboard_dist.tree_sha256,
    "DIST_TREE_DRIFT",
  );
  requireExact(
    identity.file_count,
    handle.dashboard_dist.file_count,
    "DIST_COUNT_DRIFT",
  );
  requireExact(
    identity.byte_size,
    handle.dashboard_dist.byte_size,
    "DIST_SIZE_DRIFT",
  );
  return { handle, distPath: canonicalDist, identity };
}

async function assertAdapterRun(adapterRun, implementationRoot) {
  const logical = normalizedRelative(adapterRun);
  const runsRoot = resolve(implementationRoot, "generated/runs");
  const runPath = resolve(implementationRoot, logical);
  if (!contained(runsRoot, runPath)) {
    throw new OewGatewayError("ADAPTER_RUN_FORBIDDEN");
  }
  const canonicalRun = await realpath(runPath);
  if (!contained(runsRoot, canonicalRun)) {
    throw new OewGatewayError("ADAPTER_RUN_SYMLINK_ESCAPE");
  }
  const receiptPath = join(canonicalRun, "adapter-receipt.json");
  const verification = await verifyAdapterReceipt(receiptPath, {
    repositoryRoot: implementationRoot,
  });
  if (!verification.verified) {
    throw new OewGatewayError(
      "ADAPTER_RUN_UNVERIFIED",
      verification.issues.join(","),
    );
  }
  const artifacts = {};
  const documents = {};
  for (const name of Object.values(dataRoutes)) {
    const path = join(canonicalRun, name);
    artifacts[name] = await artifact(path, `${logical}/${name}`);
    documents[name] = await readFile(path);
  }
  requireExact(
    artifacts["adapter-receipt.json"].sha256,
    verification.receipt_sha256,
    "ADAPTER_RECEIPT_DIGEST_DRIFT",
  );
  const receipt = JSON.parse(documents["adapter-receipt.json"]);
  const graph = JSON.parse(documents["presentation-graph.json"]);
  const sidecar = JSON.parse(documents["evidence-sidecar.json"]);
  if (
    receipt.authority_effect !== "none" ||
    sidecar.authority_effect !== "none" ||
    graph.version !== "1.0.0" ||
    graph.kind !== "knowledge" ||
    Object.keys(sidecar.nodes ?? {}).length !== graph.nodes?.length ||
    Object.keys(sidecar.edges ?? {}).length !== graph.edges?.length
  ) {
    throw new OewGatewayError("BUNDLE_IDENTITY_INVALID");
  }
  return {
    path: canonicalRun,
    logical,
    verification,
    artifacts,
    documents,
  };
}

async function assertLoaderProof(build, implementationRoot) {
  const typedHandlePath = resolve(
    implementationRoot,
    build.handle.predecessor.typed_handle.path.replace(
      /^cyberAlchemy-v2\/implementation\/ontology-evidence-workbench\//,
      "",
    ),
  );
  const typedHandle = await readJson(typedHandlePath, "TYPED_HANDLE_INVALID");
  const proof = typedHandle.validation?.token_handoff;
  if (
    typedHandle.result !== "pass" ||
    proof?.result !== "pass" ||
    proof?.same_origin_absolute_requests !== 3 ||
    proof?.tokenized_requests !== 3 ||
    proof?.credentials_omit_requests !== 3 ||
    proof?.malformed_fetches !== 0 ||
    proof?.cross_origin_fetches !== 0
  ) {
    throw new OewGatewayError("LOADER_PROOF_INVALID");
  }
  const oewAppPath = join(
    implementationRoot,
    "upstream/overlay/packages/dashboard/src/oew/OewApp.tsx",
  );
  const loaderPath = join(
    implementationRoot,
    "upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts",
  );
  const oewApp = await artifact(
    oewAppPath,
    "upstream/overlay/packages/dashboard/src/oew/OewApp.tsx",
  );
  const loader = await artifact(
    loaderPath,
    "upstream/overlay/packages/dashboard/src/oew/loadOewBundle.ts",
  );
  requireExact(oewApp.sha256, typedHandle.validation.oew_app.sha256, "OEW_APP_DRIFT");
  const loaderChange = typedHandle.source_changes.find((item) =>
    item.path.endsWith("/loadOewBundle.ts"),
  );
  requireExact(loader.sha256, loaderChange?.after_sha256, "LOADER_DRIFT");
  return { typedHandlePath, typedHandle, oewApp, loader };
}

export async function startOewPrototypeGateway({
  buildHandle,
  adapterRun,
  implementationRoot = defaultImplementationRoot,
  bindHost = loopback,
  targetHost = loopback,
  port = 0,
  token = randomBytes(32).toString("hex"),
} = {}) {
  validateGatewayNetwork({ bindHost, targetHost });
  if (!tokenPattern.test(token)) throw new OewGatewayError("TOKEN_INVALID");
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new OewGatewayError("PORT_INVALID");
  }
  const root = await realpath(resolve(implementationRoot));
  const buildLogical = normalizedRelative(buildHandle);
  const buildPath = resolve(root, buildLogical);
  if (!contained(root, buildPath)) throw new OewGatewayError("BUILD_PATH_ESCAPE");
  const build = await assertBuildHandle(buildPath, root);
  const adapter = await assertAdapterRun(adapterRun, root);
  const loaderProof = await assertLoaderProof(build, root);
  const counters = {
    accepted_requests: 0,
    rejected_requests: 0,
    protected_bytes_rejected: 0,
    outbound_requests: 0,
    upgrades_rejected: 0,
  };
  const requestLedger = [];
  let closed = false;
  const server = createServer((request, response) => {
    void (async () => {
      const method = request.method ?? "";
      const rawTarget = request.url ?? "";
      const record = { method, target: rawTarget, status: 500, route: "error" };
      try {
        if (!allowedMethods.has(method)) {
          counters.rejected_requests += 1;
          record.status = 405;
          record.route = "method-reject";
          send(
            response,
            405,
            Buffer.from('{"error":"Method not allowed"}\n'),
            method,
            { Allow: "GET, HEAD" },
          );
          return;
        }
        try {
          validateRequestTarget(rawTarget);
        } catch (error) {
          throw new OewGatewayError(error.issue ?? "REQUEST_TARGET_INVALID");
        }
        const url = new URL(rawTarget, `http://${loopback}`);
        const queryToken = url.searchParams.get("token");
        const cookieToken = parseCookies(request.headers.cookie)[cookieName];
        const isData = url.pathname.startsWith("/oew-data/");
        const isNativeGraph = url.pathname === nativeGraphRoute;
        const isNativeAux = Object.hasOwn(nativeAuxDocuments, url.pathname);
        const isBootstrap = url.pathname === "/" || url.pathname === "/index.html";
        if (isData || isNativeGraph || isNativeAux) {
          if (queryToken !== token) {
            counters.rejected_requests += 1;
            counters.protected_bytes_rejected += 1;
            record.status = queryToken === null ? 401 : 403;
            record.route = "data-auth-reject";
            send(
              response,
              record.status,
              Buffer.from('{"error":"Evidence authentication required"}\n'),
              method,
            );
            return;
          }
          const name =
            isNativeGraph
              ? "presentation-graph.json"
              : isNativeAux
                ? url.pathname.slice(1)
                : dataRoutes[url.pathname];
          const document = isNativeGraph
            ? adapter.documents["presentation-graph.json"]
            : isNativeAux
              ? Buffer.from(nativeAuxDocuments[url.pathname], "utf8")
              : adapter.documents[name];
          if (!name || !document) {
            counters.rejected_requests += 1;
            record.status = 404;
            record.route = "data-route-reject";
            send(response, 404, Buffer.from('{"error":"Not found"}\n'), method);
            return;
          }
          counters.accepted_requests += 1;
          record.status = 200;
          record.route = `data:${name}`;
          send(
            response,
            200,
            document,
            method,
            { "Content-Type": "application/json; charset=utf-8" },
          );
          return;
        }
        if (isBootstrap) {
          if (queryToken === null) {
            counters.rejected_requests += 1;
            counters.protected_bytes_rejected += 1;
            record.status = 401;
            record.route = "bootstrap-missing";
            send(response, 401, Buffer.from('{"error":"Token required"}\n'), method);
            return;
          }
          if (queryToken !== token) {
            counters.rejected_requests += 1;
            counters.protected_bytes_rejected += 1;
            record.status = 403;
            record.route = "bootstrap-invalid";
            send(response, 403, Buffer.from('{"error":"Forbidden"}\n'), method);
            return;
          }
        } else if (cookieToken !== token && queryToken !== token) {
          counters.rejected_requests += 1;
          counters.protected_bytes_rejected += 1;
          record.status = 403;
          record.route = "asset-auth-reject";
          send(response, 403, Buffer.from('{"error":"Forbidden"}\n'), method);
          return;
        }
        const requested = isBootstrap
          ? "index.html"
          : decodeURIComponent(url.pathname).replace(/^\/+/, "");
        const staticPath = resolve(build.distPath, requested);
        if (!contained(build.distPath, staticPath)) {
          throw new OewGatewayError("STATIC_PATH_ESCAPE");
        }
        const info = await lstat(staticPath);
        if (!info.isFile() || info.isSymbolicLink()) {
          throw new OewGatewayError("STATIC_PATH_INVALID");
        }
        const canonical = await realpath(staticPath);
        if (!contained(build.distPath, canonical)) {
          throw new OewGatewayError("STATIC_SYMLINK_ESCAPE");
        }
        const fileBody = await readFile(canonical);
        const body = isBootstrap ? sanitizeBootstrap(fileBody) : fileBody;
        counters.accepted_requests += 1;
        record.status = 200;
        record.route = isBootstrap ? "bootstrap" : "asset";
        const headers = { "Content-Type": mime(canonical) };
        if (isBootstrap) {
          headers["Set-Cookie"] =
            `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/`;
        }
        send(response, 200, body, method, headers);
      } catch (error) {
        counters.rejected_requests += 1;
        record.status =
          error.code === "ENOENT" ? 404 :
          error instanceof OewGatewayError ? 400 : 500;
        record.route =
          error.code === "ENOENT" ? "not-found" : "request-invalid";
        send(
          response,
          record.status,
          Buffer.from(
            `${JSON.stringify({
              error:
                error.code === "ENOENT"
                  ? "Not found"
                  : error.issue ?? "Gateway failure",
            })}\n`,
          ),
          method,
        );
      } finally {
        requestLedger.push(record);
      }
    })();
  });
  server.on("upgrade", (_request, socket) => {
    counters.rejected_requests += 1;
    counters.upgrades_rejected += 1;
    socket.end("HTTP/1.1 405 Method Not Allowed\r\nConnection: close\r\n\r\n");
  });
  try {
    await listen(server, port);
  } catch (error) {
    await closeServer(server);
    throw error;
  }
  const address = server.address();
  if (
    !address ||
    typeof address !== "object" ||
    address.address !== loopback
  ) {
    await closeServer(server);
    throw new OewGatewayError("BINDING_INVALID");
  }
  const stop = async () => {
    if (closed) return;
    await closeServer(server);
    closed = true;
  };
  return {
    baseUrl: `http://${loopback}:${address.port}`,
    port: address.port,
    token,
    tokenDigest: sha256(token),
    cookieName,
    build,
    adapter,
    loaderProof,
    counters,
    requestLedger,
    server,
    stop,
    get closed() {
      return closed;
    },
  };
}

export async function requestGateway({
  baseUrl,
  path = "/",
  method = "GET",
  cookie,
} = {}) {
  const target = new URL(baseUrl);
  return new Promise((resolveRequest, rejectRequest) => {
    const req = httpRequest(
      {
        host: target.hostname,
        port: Number(target.port),
        method,
        path,
        headers: {
          Accept: "*/*",
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () =>
          resolveRequest({
            status: response.statusCode,
            headers: response.headers,
            body: Buffer.concat(chunks),
          }),
        );
      },
    );
    req.once("error", rejectRequest);
    req.end();
  });
}

async function portReleased(baseUrl) {
  try {
    await requestGateway({ baseUrl, path: "/" });
    return false;
  } catch (error) {
    return ["ECONNREFUSED", "ECONNRESET"].includes(error.code);
  }
}

function outputIdentity(outputPath) {
  const logical = normalizedRelative(outputPath);
  const parts = logical.split("/");
  if (
    parts.length !== 5 ||
    parts[0] !== "generated" ||
    parts[1] !== "runs" ||
    parts[2] !== "SWU-OEWTP-003" ||
    !/^[0-9]{8}T[0-9]{6}Z$/.test(parts[3]) ||
    parts[4] !== "gateway-handle.json"
  ) {
    throw new OewGatewayError("OUTPUT_PATH_INVALID");
  }
  return { logical, attemptId: parts[3] };
}

export async function probeOewPrototypeGateway({
  buildHandle,
  adapterRun,
  output,
  implementationRoot = defaultImplementationRoot,
} = {}) {
  const root = await realpath(resolve(implementationRoot));
  const outputRef = outputIdentity(output);
  const outputPath = resolve(root, outputRef.logical);
  if (!contained(root, outputPath)) throw new OewGatewayError("OUTPUT_ESCAPE");
  if (await exists(outputPath)) throw new OewGatewayError("OUTPUT_COLLISION");
  const service = await startOewPrototypeGateway({
    buildHandle,
    adapterRun,
    implementationRoot: root,
  });
  const probes = [];
  let cookie;
  let assetPath;
  try {
    const bootstrap = await requestGateway({
      baseUrl: service.baseUrl,
      path: `/?token=${service.token}`,
    });
    if (
      bootstrap.status !== 200 ||
      !bootstrap.body.toString("utf8").includes("<!doctype html")
    ) {
      throw new OewGatewayError("BOOTSTRAP_PROBE_FAILED");
    }
    cookie = bootstrap.headers["set-cookie"]?.[0]?.split(";", 1)[0];
    const fullCookie = bootstrap.headers["set-cookie"]?.[0] ?? "";
    if (
      !cookie?.startsWith(`${cookieName}=`) ||
      !fullCookie.includes("HttpOnly") ||
      !fullCookie.includes("SameSite=Strict") ||
      !fullCookie.includes("Path=/")
    ) {
      throw new OewGatewayError("COOKIE_PROBE_FAILED");
    }
    if (bootstrap.headers["referrer-policy"] !== "no-referrer") {
      throw new OewGatewayError("REFERRER_POLICY_MISSING");
    }
    probes.push({ id: "bootstrap-token", status: 200, result: "pass" });
    assetPath = bootstrap.body
      .toString("utf8")
      .match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1];
    if (!assetPath) throw new OewGatewayError("ASSET_PATH_MISSING");
    const asset = await requestGateway({
      baseUrl: service.baseUrl,
      path: assetPath,
      cookie,
    });
    if (asset.status !== 200 || asset.body.length === 0) {
      throw new OewGatewayError("ASSET_COOKIE_PROBE_FAILED");
    }
    probes.push({ id: "asset-cookie", status: 200, result: "pass" });
    for (const route of Object.keys(dataRoutes)) {
      const data = await requestGateway({
        baseUrl: service.baseUrl,
        path: `${route}?token=${service.token}`,
      });
      const name = dataRoutes[route];
      if (
        data.status !== 200 ||
        sha256(data.body) !== service.adapter.artifacts[name].sha256
      ) {
        throw new OewGatewayError("DATA_PROBE_FAILED", route);
      }
      probes.push({ id: `data:${name}`, status: 200, result: "pass" });
    }
    const nativeGraph = await requestGateway({
      baseUrl: service.baseUrl,
      path: `${nativeGraphRoute}?token=${service.token}`,
    });
    if (
      nativeGraph.status !== 200 ||
      sha256(nativeGraph.body) !==
        service.adapter.artifacts["presentation-graph.json"].sha256
    ) {
      throw new OewGatewayError("NATIVE_GRAPH_PROBE_FAILED");
    }
    probes.push({ id: "native-graph", status: 200, result: "pass" });
    for (const route of Object.keys(nativeAuxDocuments)) {
      const response = await requestGateway({
        baseUrl: service.baseUrl,
        path: `${route}?token=${service.token}`,
      });
      if (response.status !== 200 || response.body.length === 0) {
        throw new OewGatewayError("NATIVE_AUX_PROBE_FAILED", route);
      }
      probes.push({
        id: `native-aux:${route.slice(1)}`,
        status: 200,
        result: "pass",
      });
    }
    const negatives = [
      { id: "bootstrap-missing-token", path: "/", expected: 401 },
      { id: "bootstrap-bad-token", path: "/?token=bad", expected: 403 },
      { id: "asset-missing-cookie", path: assetPath, expected: 403 },
      {
        id: "asset-forged-cookie",
        path: assetPath,
        cookie: `${cookieName}=forged`,
        expected: 403,
      },
      {
        id: "data-cookie-only",
        path: "/oew-data/presentation-graph.json",
        cookie,
        expected: 401,
      },
      {
        id: "data-fourth",
        path: `/oew-data/fourth.json?token=${service.token}`,
        expected: 404,
      },
      {
        id: "native-graph-missing-token",
        path: nativeGraphRoute,
        expected: 401,
      },
      {
        id: "native-graph-bad-token",
        path: `${nativeGraphRoute}?token=bad`,
        expected: 403,
      },
      {
        id: "encoded-dot",
        path: `/%2e%2e/secret?token=${service.token}`,
        expected: 400,
      },
      {
        id: "encoded-slash",
        path: `/%2fsecret?token=${service.token}`,
        expected: 400,
      },
      {
        id: "post",
        path: `/?token=${service.token}`,
        method: "POST",
        expected: 405,
      },
      {
        id: "put",
        path: `/?token=${service.token}`,
        method: "PUT",
        expected: 405,
      },
    ];
    for (const negative of negatives) {
      const observed = await requestGateway({
        baseUrl: service.baseUrl,
        path: negative.path,
        method: negative.method,
        cookie: negative.cookie,
      });
      if (
        observed.status !== negative.expected ||
        observed.body.includes(Buffer.from("<!doctype html"))
      ) {
        throw new OewGatewayError(
          "NEGATIVE_PROBE_FAILED",
          `${negative.id}:${observed.status}`,
        );
      }
      probes.push({
        id: negative.id,
        status: observed.status,
        result: "pass",
      });
    }
  } finally {
    await service.stop();
  }
  const released = await portReleased(service.baseUrl);
  if (!released) throw new OewGatewayError("PORT_NOT_RELEASED");
  const buildArtifact = await artifact(
    resolve(root, normalizedRelative(buildHandle)),
    normalizedRelative(buildHandle),
  );
  const body = {
    schema_version: "oewtp.prototype-gateway-handle.v1",
    handle: `oewtp-prototype-gateway/${outputRef.attemptId}`,
    work_pack_id: "WP-OEWTP-001",
    swu_id: "SWU-OEWTP-003",
    attempt_id: outputRef.attemptId,
    result: "pass",
    process: {
      pid: process.pid,
      ownership: "parent-test-process",
      bind_host: loopback,
      port: service.port,
      url_shape: `http://${loopback}:<ephemeral>/?token=<redacted>`,
      token_sha256: service.tokenDigest,
      token_persisted: false,
    },
    build: {
      handle: buildArtifact,
      dist_path: service.build.handle.dashboard_dist.path.replace(/\/$/, ""),
      tree_sha256: service.build.identity.tree_sha256,
      file_count: service.build.identity.file_count,
      byte_size: service.build.identity.byte_size,
    },
    adapter: {
      run: service.adapter.logical,
      receipt_sha256:
        service.adapter.artifacts["adapter-receipt.json"].sha256,
      graph_sha256:
        service.adapter.artifacts["presentation-graph.json"].sha256,
      sidecar_sha256:
        service.adapter.artifacts["evidence-sidecar.json"].sha256,
      authority_effect: "none",
    },
    loader_contract: {
      oew_app: service.loaderProof.oewApp,
      loader: service.loaderProof.loader,
      same_origin_requests: 3,
      tokenized_requests: 3,
      credentials_omit_requests: 3,
    },
    routes: {
      bootstrap: ["/", "/index.html"],
      static_prefix: "/assets/",
      native_graph: nativeGraphRoute,
      native_aux: Object.keys(nativeAuxDocuments),
      evidence: Object.keys(dataRoutes),
      evidence_requires_explicit_token: true,
      cookie_scope: "static-only",
    },
    request_bank: {
      result: "pass",
      probes,
      passed: probes.length,
      failed: 0,
      protected_bytes_on_reject: 0,
      outbound_requests: service.counters.outbound_requests,
    },
    closure: {
      server_closed: service.closed,
      port_released: released,
      output_written_after_close: true,
    },
    claim_ceiling:
      "Loopback evidence gateway passed; no browser acceptance, deployment, or production readiness.",
    authority_effect: "none",
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, canonicalJson(body), {
    encoding: "utf8",
    flag: "wx",
  });
  return body;
}

async function main() {
  const args = parseGatewayArgs(process.argv.slice(2));
  const result = await probeOewPrototypeGateway(args);
  process.stdout.write(
    `${JSON.stringify({ result: result.result, handle: result.handle })}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error.issue ?? error.name}: ${error.message}\n`);
    process.exitCode = 1;
  });
}
