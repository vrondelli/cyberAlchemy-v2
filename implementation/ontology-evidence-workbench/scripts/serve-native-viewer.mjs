#!/usr/bin/env node
import { spawn, execFile as execFileCallback } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer, request as httpRequest } from "node:http";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  canonicalBytes,
  canonicalJson,
  sha256Bytes,
} from "../src/canonical-json.mjs";
import { verifyPinnedUpstream } from "./prepare-upstream.mjs";
import { verifyAdapterReceipt } from "./verify-adapter-receipt.mjs";

const execFile = promisify(execFileCallback);
const COMMIT = "2cda14e89535049e49120198886bc0b82e9e630f";
const VIEWER_PREFIX = "understand-anything-viewer/";
const LOOPBACK = "127.0.0.1";
const TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const ALLOWED_METHODS = new Set(["GET", "HEAD"]);
const COOKIE_NAME = "oew_viewer_access";
const implementationRootDefault = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

const DEFAULTS = Object.freeze({
  adapterRun: "generated/runs/SWU-OEW-004",
  lockPath: "upstream/UPSTREAM.lock.json",
  viewerArchive:
    `generated/upstream/${COMMIT}/viewer-dist.tar.gz`,
  receipt:
    "generated/runs/SWU-OEW-006/native-viewer-receipt.json",
});

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function contained(root, candidate, { allowRoot = false } = {}) {
  const path = relative(root, candidate);
  return (allowRoot || path !== "") &&
    path !== ".." &&
    !path.startsWith(`..${sep}`) &&
    !isAbsolute(path);
}

function toPosix(path) {
  return path.split(sep).join("/");
}

function relativeContained(root, candidate) {
  if (!contained(root, candidate)) {
    throw new NativeViewerError("PATH_OUTSIDE_IMPLEMENTATION_ROOT", candidate);
  }
  return toPosix(relative(root, candidate));
}

async function sha256File(path) {
  return sha256Bytes(await readFile(path));
}

export class NativeViewerError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "NativeViewerError";
    this.issue = issue;
  }
}

export function validateNetworkBoundary({
  bindHost = LOOPBACK,
  proxyTargetHost = LOOPBACK,
} = {}) {
  if (bindHost !== LOOPBACK) {
    throw new NativeViewerError("NON_LOOPBACK_BIND_FORBIDDEN", bindHost);
  }
  if (proxyTargetHost !== LOOPBACK) {
    throw new NativeViewerError(
      "OUTBOUND_TARGET_FORBIDDEN",
      proxyTargetHost,
    );
  }
  return {
    bind_host: LOOPBACK,
    proxy_target_host: LOOPBACK,
    outbound_requests: 0,
  };
}

export function validateRequestTarget(rawTarget) {
  if (
    typeof rawTarget !== "string" ||
    rawTarget.length === 0 ||
    rawTarget.length > 8192 ||
    rawTarget.includes("\0") ||
    rawTarget.includes("\\")
  ) {
    throw new NativeViewerError("REQUEST_TARGET_INVALID");
  }

  const rawPath = rawTarget.split("?", 1)[0];
  const lowered = rawPath.toLowerCase();
  if (
    /%(?:00|25|2e|2f|5c)/i.test(lowered) ||
    rawPath.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new NativeViewerError("REQUEST_TRAVERSAL_FORBIDDEN");
  }
  try {
    const decoded = decodeURIComponent(rawPath);
    if (
      decoded.includes("\0") ||
      decoded.includes("\\") ||
      decoded.split("/").some(
        (segment) => segment === "." || segment === "..",
      )
    ) {
      throw new NativeViewerError("REQUEST_TRAVERSAL_FORBIDDEN");
    }
  } catch (error) {
    if (error instanceof NativeViewerError) throw error;
    throw new NativeViewerError("REQUEST_ENCODING_INVALID");
  }
}

function resolveInside(root, value, issue) {
  const candidate = resolve(root, value);
  if (!contained(root, candidate)) throw new NativeViewerError(issue, value);
  return candidate;
}

export async function resolveVerifiedAdapterRun({
  adapterRun = DEFAULTS.adapterRun,
  implementationRoot = implementationRootDefault,
} = {}) {
  const root = await realpath(resolve(implementationRoot));
  const allowedRuns = resolveInside(
    root,
    "generated/runs",
    "ADAPTER_RUNS_ROOT_INVALID",
  );
  const lexicalRun = resolve(root, adapterRun);
  if (!contained(allowedRuns, lexicalRun)) {
    throw new NativeViewerError("ADAPTER_RUN_PATH_FORBIDDEN", adapterRun);
  }

  let run;
  try {
    run = await realpath(lexicalRun);
  } catch {
    throw new NativeViewerError("ADAPTER_RUN_MISSING", adapterRun);
  }
  if (!contained(allowedRuns, run)) {
    throw new NativeViewerError("ADAPTER_RUN_SYMLINK_ESCAPE", adapterRun);
  }
  const receiptPath = join(run, "adapter-receipt.json");
  const verification = await verifyAdapterReceipt(receiptPath, {
    repositoryRoot: root,
  });
  if (!verification.verified) {
    throw new NativeViewerError(
      "ADAPTER_RUN_UNVERIFIED",
      verification.issues.join(","),
    );
  }

  const graphPath = join(run, "presentation-graph.json");
  const receiptBytes = await readFile(receiptPath);
  const graphBytes = await readFile(graphPath);
  const receipt = JSON.parse(receiptBytes);
  return {
    root,
    run,
    receiptPath,
    receipt,
    receiptSha256: sha256Bytes(receiptBytes),
    graphPath,
    graphBytes,
    graphSha256: sha256Bytes(graphBytes),
    graph: JSON.parse(graphBytes),
  };
}

async function resolveVerifiedViewer({
  implementationRoot,
  lockPath = DEFAULTS.lockPath,
  viewerArchive = DEFAULTS.viewerArchive,
}) {
  const root = await realpath(resolve(implementationRoot));
  const lock = resolveInside(root, lockPath, "UPSTREAM_LOCK_PATH_FORBIDDEN");
  const archive = resolveInside(
    root,
    viewerArchive,
    "VIEWER_ARCHIVE_PATH_FORBIDDEN",
  );
  if (basename(archive) !== "viewer-dist.tar.gz") {
    throw new NativeViewerError("VIEWER_ARCHIVE_NAME_INVALID");
  }
  const outputDirectory = dirname(archive);
  if (basename(outputDirectory) !== COMMIT) {
    throw new NativeViewerError("VIEWER_ARCHIVE_COMMIT_PATH_INVALID");
  }
  const verification = await verifyPinnedUpstream({
    lockPath: lock,
    outputDirectory,
    implementationRoot: root,
  });
  if (!verification.verified) {
    throw new NativeViewerError(
      "UPSTREAM_VIEWER_UNVERIFIED",
      verification.issues.join(","),
    );
  }
  const artifact = verification.artifacts.find(
    ({ path }) => path === "viewer-dist.tar.gz",
  );
  const archiveInfo = await stat(archive);
  const archiveSha256 = await sha256File(archive);
  if (
    !artifact ||
    artifact.sha256 !== archiveSha256 ||
    artifact.size_bytes !== archiveInfo.size
  ) {
    throw new NativeViewerError("VIEWER_ARCHIVE_BINDING_FAILED");
  }
  const buildReceiptPath = join(outputDirectory, "build-receipt.json");
  return {
    root,
    lock,
    archive,
    archiveSha256,
    archiveSize: archiveInfo.size,
    buildReceiptPath,
    buildReceiptSha256: await sha256File(buildReceiptPath),
    verification,
  };
}

async function extractViewer(archive, temporaryRoot) {
  let listing;
  try {
    const result = await execFile("tar", ["-tzf", archive], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    listing = result.stdout.split("\n").filter(Boolean);
  } catch (error) {
    throw new NativeViewerError(
      "VIEWER_ARCHIVE_LIST_FAILED",
      error.message,
    );
  }
  if (
    listing.length === 0 ||
    listing.some((name) =>
      !name.startsWith(VIEWER_PREFIX) ||
      name.startsWith("/") ||
      name.includes("\0") ||
      name.slice(VIEWER_PREFIX.length).split("/").some(
        (segment) => segment === "..",
      ))
  ) {
    throw new NativeViewerError("VIEWER_ARCHIVE_PATH_INVALID");
  }
  try {
    await execFile("tar", ["-xzf", archive, "-C", temporaryRoot], {
      maxBuffer: 16 * 1024 * 1024,
    });
  } catch (error) {
    throw new NativeViewerError(
      "VIEWER_ARCHIVE_EXTRACT_FAILED",
      error.message,
    );
  }
  const viewerRoot = join(temporaryRoot, VIEWER_PREFIX);
  const entrypoint = join(viewerRoot, "bin/viewer.mjs");
  const entrypointInfo = await lstat(entrypoint);
  if (!entrypointInfo.isFile() || entrypointInfo.isSymbolicLink()) {
    throw new NativeViewerError("VIEWER_ENTRYPOINT_INVALID");
  }
  return { viewerRoot, entrypoint };
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header.split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
      const separator = part.indexOf("=");
      return separator < 0
        ? [part, ""]
        : [part.slice(0, separator), part.slice(separator + 1)];
    }),
  );
}

function authenticatedRequest(url, request, token) {
  const queryToken = url.searchParams.get("token");
  if (queryToken !== null && queryToken !== token) return false;
  const cookieToken = parseCookies(request.headers.cookie)[COOKIE_NAME];
  return queryToken === token || cookieToken === token;
}

function proxyHeaders(headers) {
  const excluded = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "set-cookie",
  ]);
  return Object.fromEntries(
    Object.entries(headers).filter(([key]) => !excluded.has(key.toLowerCase())),
  );
}

async function listen(server, port, host) {
  server.listen(port, host);
  await Promise.race([
    once(server, "listening"),
    once(server, "error").then(([error]) => Promise.reject(error)),
  ]);
}

async function waitForViewer(child, token) {
  let stdout = "";
  let stderr = "";
  const readyPattern =
    /Dashboard URL:\s+http:\/\/127\.0\.0\.1:(\d+)\/\?token=([a-f0-9]+)/;
  return new Promise((resolveReady, rejectReady) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const inspect = () => {
      const match = stdout.match(readyPattern);
      if (!match) return;
      if (match[2] !== token) {
        finish(
          rejectReady,
          new NativeViewerError("VIEWER_TOKEN_BINDING_FAILED"),
        );
        return;
      }
      finish(resolveReady, Number(match[1]));
    };
    child.stdout.on("data", (chunk) => {
      stdout = `${stdout}${chunk}`.slice(-16384);
      inspect();
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-16384);
    });
    child.once("error", (error) => {
      finish(
        rejectReady,
        new NativeViewerError("VIEWER_PROCESS_ERROR", error.message),
      );
    });
    child.once("exit", (code, signal) => {
      finish(
        rejectReady,
        new NativeViewerError(
          "VIEWER_EXITED_BEFORE_READY",
          `code=${code};signal=${signal};stderr=${stderr}`,
        ),
      );
    });
    const timeout = setTimeout(() => {
      finish(
        rejectReady,
        new NativeViewerError(
          "VIEWER_START_TIMEOUT",
          `stdout=${stdout};stderr=${stderr}`,
        ),
      );
    }, 10000);
  });
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolveClose) => server.close(resolveClose));
}

async function terminateChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const terminated = await Promise.race([
    exited.then(() => true),
    new Promise((resolveTimeout) =>
      setTimeout(() => resolveTimeout(false), 2000)),
  ]);
  if (!terminated && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

export async function startNativeViewer({
  adapterRun = DEFAULTS.adapterRun,
  viewerArchive = DEFAULTS.viewerArchive,
  lockPath = DEFAULTS.lockPath,
  implementationRoot = implementationRootDefault,
  bindHost = LOOPBACK,
  proxyTargetHost = LOOPBACK,
  port = 0,
  token = randomBytes(32).toString("hex"),
} = {}) {
  validateNetworkBoundary({ bindHost, proxyTargetHost });
  if (!TOKEN_PATTERN.test(token)) {
    throw new NativeViewerError("ACCESS_TOKEN_INVALID");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new NativeViewerError("PORT_INVALID");
  }

  const adapter = await resolveVerifiedAdapterRun({
    adapterRun,
    implementationRoot,
  });
  const viewer = await resolveVerifiedViewer({
    implementationRoot: adapter.root,
    lockPath,
    viewerArchive,
  });
  let temporaryRoot;
  let child;
  let proxy;
  const counters = {
    proxied_loopback_requests: 0,
    rejected_requests: 0,
    outbound_requests: 0,
  };
  const lifecycle = {
    proxy_closed: false,
    child_terminated: false,
    temporary_root_removed: false,
  };
  let stopped = false;

  try {
    temporaryRoot = await mkdtemp(join(tmpdir(), "oew-native-viewer-"));
    const { entrypoint } = await extractViewer(viewer.archive, temporaryRoot);
    const projectRoot = join(temporaryRoot, "project");
    const graphDirectory = join(projectRoot, ".ua");
    await mkdir(graphDirectory, { recursive: true });
    const stagedGraphPath = join(graphDirectory, "knowledge-graph.json");
    await copyFile(adapter.graphPath, stagedGraphPath);
    if (await sha256File(stagedGraphPath) !== adapter.graphSha256) {
      throw new NativeViewerError("STAGED_GRAPH_DIGEST_MISMATCH");
    }

    child = spawn(
      process.execPath,
      [entrypoint, projectRoot, "--port", "0", "--no-open"],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          UNDERSTAND_ACCESS_TOKEN: token,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const upstreamPort = await waitForViewer(child, token);

    proxy = createServer((request, response) => {
      void (async () => {
        try {
          if (!ALLOWED_METHODS.has(request.method ?? "")) {
            counters.rejected_requests += 1;
            response.writeHead(405, {
              Allow: "GET, HEAD",
              "Cache-Control": "no-store",
              "Content-Type": "application/json",
            });
            response.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }
          validateRequestTarget(request.url ?? "/");
          const url = new URL(request.url ?? "/", `http://${LOOPBACK}`);
          if (!authenticatedRequest(url, request, token)) {
            counters.rejected_requests += 1;
            response.writeHead(403, {
              "Cache-Control": "no-store",
              "Content-Type": "application/json",
            });
            response.end(JSON.stringify({ error: "Forbidden" }));
            return;
          }

          const queryAuthenticated = url.searchParams.get("token") === token;
          url.searchParams.set("token", token);
          const upstreamRequest = httpRequest(
            {
              host: proxyTargetHost,
              port: upstreamPort,
              method: request.method,
              path: `${url.pathname}${url.search}`,
              headers: {
                Accept: request.headers.accept ?? "*/*",
                "User-Agent": "oew-native-viewer-proxy/1",
              },
            },
            (upstreamResponse) => {
              counters.proxied_loopback_requests += 1;
              const headers = {
                ...proxyHeaders(upstreamResponse.headers),
                "Referrer-Policy": "no-referrer",
                "X-Content-Type-Options": "nosniff",
              };
              if (queryAuthenticated) {
                headers["Set-Cookie"] =
                  `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/`;
              }
              response.writeHead(
                upstreamResponse.statusCode ?? 502,
                headers,
              );
              upstreamResponse.pipe(response);
            },
          );
          upstreamRequest.once("error", () => {
            if (!response.headersSent) {
              response.writeHead(502, {
                "Cache-Control": "no-store",
                "Content-Type": "application/json",
              });
            }
            response.end(JSON.stringify({ error: "Viewer unavailable" }));
          });
          upstreamRequest.end();
        } catch (error) {
          counters.rejected_requests += 1;
          const status = error instanceof NativeViewerError ? 400 : 500;
          response.writeHead(status, {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
          });
          response.end(JSON.stringify({
            error: status === 400 ? error.issue : "Proxy failure",
          }));
        }
      })();
    });
    await listen(proxy, port, bindHost);
    const address = proxy.address();
    if (!isRecord(address) || address.address !== LOOPBACK) {
      throw new NativeViewerError("PROXY_BINDING_INVALID");
    }

    const stop = async () => {
      if (stopped) return;
      stopped = true;
      await closeServer(proxy);
      lifecycle.proxy_closed = true;
      await terminateChild(child);
      lifecycle.child_terminated = true;
      await rm(temporaryRoot, { recursive: true, force: true });
      lifecycle.temporary_root_removed = true;
    };

    return {
      baseUrl: `http://${LOOPBACK}:${address.port}`,
      token,
      adapter,
      viewer,
      counters,
      lifecycle,
      temporaryRoot,
      stagedGraphPath,
      stop,
    };
  } catch (error) {
    await closeServer(proxy);
    await terminateChild(child);
    if (temporaryRoot) {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
    throw error;
  }
}

export async function requestNativeViewer({
  baseUrl,
  path = "/",
  method = "GET",
  token,
  cookie,
} = {}) {
  const target = new URL(baseUrl);
  return new Promise((resolveRequest, rejectRequest) => {
    const request = httpRequest(
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
        response.on("end", () => resolveRequest({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks),
        }));
      },
    );
    request.once("error", rejectRequest);
    request.end();
  });
}

function expectedPoker(graph) {
  const nodeIds = graph.nodes.map(({ id }) => id).sort();
  const edgeTuples = graph.edges.map(
    ({ source, type, target }) => `${source}|${type}|${target}`,
  ).sort();
  return {
    project_name: "Poker Team O13 Evidence",
    node_ids: [
      "presentation:D1",
      "presentation:D2",
      "presentation:F1",
      "presentation:R1",
    ],
    edge_tuples: [
      "presentation:D2|contradicts|presentation:D1",
      "presentation:D2|related|presentation:D1",
      "presentation:F1|builds_on|presentation:R1",
      "presentation:R1|builds_on|presentation:D1",
    ],
    actual_node_ids: nodeIds,
    actual_edge_tuples: edgeTuples,
  };
}

function assertPokerGraph(graph) {
  const poker = expectedPoker(graph);
  if (
    graph.project?.name !== poker.project_name ||
    JSON.stringify(poker.actual_node_ids) !== JSON.stringify(poker.node_ids) ||
    JSON.stringify(poker.actual_edge_tuples) !==
      JSON.stringify(poker.edge_tuples)
  ) {
    throw new NativeViewerError("POKER_GRAPH_MISMATCH");
  }
  return {
    project_name: poker.project_name,
    node_ids: poker.node_ids,
    edge_tuples: poker.edge_tuples,
    node_count: poker.node_ids.length,
    edge_count: poker.edge_tuples.length,
  };
}

export async function probeNativeViewer(options = {}) {
  const service = await startNativeViewer(options);
  const probes = [];
  let graph;
  let assetPath;
  try {
    const root = await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: `/?token=${service.token}`,
    });
    if (root.status !== 200 || !root.body.includes(Buffer.from("<!doctype html"))) {
      throw new NativeViewerError("VIEWER_ROOT_PROBE_FAILED");
    }
    probes.push({ id: "tokenized-get", expected: 200, observed: root.status, result: "pass" });
    const cookie = root.headers["set-cookie"]?.[0]?.split(";", 1)[0];
    if (!cookie?.startsWith(`${COOKIE_NAME}=`)) {
      throw new NativeViewerError("VIEWER_COOKIE_PROBE_FAILED");
    }

    const html = root.body.toString("utf8");
    assetPath = html.match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1];
    if (!assetPath) throw new NativeViewerError("VIEWER_ASSET_PATH_MISSING");
    const asset = await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: assetPath,
      cookie,
    });
    if (asset.status !== 200 || asset.body.length === 0) {
      throw new NativeViewerError("VIEWER_ASSET_PROBE_FAILED");
    }
    probes.push({ id: "cookie-authenticated-asset", expected: 200, observed: asset.status, result: "pass" });

    const head = await requestNativeViewer({
      baseUrl: service.baseUrl,
      method: "HEAD",
      path: `/?token=${service.token}`,
    });
    if (head.status !== 200 || head.body.length !== 0) {
      throw new NativeViewerError("VIEWER_HEAD_PROBE_FAILED");
    }
    probes.push({ id: "tokenized-head", expected: 200, observed: head.status, result: "pass" });

    const graphResponse = await requestNativeViewer({
      baseUrl: service.baseUrl,
      path: `/knowledge-graph.json?token=${service.token}`,
    });
    if (graphResponse.status !== 200) {
      throw new NativeViewerError("VIEWER_GRAPH_PROBE_FAILED");
    }
    graph = JSON.parse(graphResponse.body);
    probes.push({ id: "poker-graph-get", expected: 200, observed: graphResponse.status, result: "pass" });

    for (const negative of [
      { id: "missing-token", path: "/", method: "GET", expected: 403 },
      { id: "wrong-token", path: `/?token=${"0".repeat(64)}`, method: "GET", expected: 403 },
      { id: "post-forbidden", path: `/?token=${service.token}`, method: "POST", expected: 405 },
      { id: "traversal-forbidden", path: `/%2e%2e/secret?token=${service.token}`, method: "GET", expected: 400 },
    ]) {
      const result = await requestNativeViewer({
        baseUrl: service.baseUrl,
        path: negative.path,
        method: negative.method,
      });
      if (result.status !== negative.expected) {
        throw new NativeViewerError(
          "VIEWER_NEGATIVE_PROBE_FAILED",
          `${negative.id}:${result.status}`,
        );
      }
      probes.push({
        id: negative.id,
        expected: negative.expected,
        observed: result.status,
        result: "pass",
      });
    }
  } finally {
    await service.stop();
  }

  const poker = assertPokerGraph(graph);
  const network = validateNetworkBoundary();
  const implementationRoot = service.adapter.root;
  const receipt = {
    schema_version: "oew.native-viewer-receipt.v1",
    state: "receipt-complete",
    result: "pass",
    handle: "oew-native-viewer-poker/v1",
    adapter_run: {
      path: relativeContained(implementationRoot, service.adapter.run),
      adapter_receipt_sha256: service.adapter.receiptSha256,
      presentation_graph_sha256: service.adapter.graphSha256,
      presentation_graph_size_bytes: service.adapter.graphBytes.length,
      independently_verified: true,
    },
    upstream_viewer: {
      repository: "https://github.com/Egonex-AI/Understand-Anything",
      commit: COMMIT,
      build_receipt_path: relativeContained(
        implementationRoot,
        service.viewer.buildReceiptPath,
      ),
      build_receipt_sha256: service.viewer.buildReceiptSha256,
      archive_path: relativeContained(
        implementationRoot,
        service.viewer.archive,
      ),
      archive_sha256: service.viewer.archiveSha256,
      archive_size_bytes: service.viewer.archiveSize,
      entrypoint: `${VIEWER_PREFIX}bin/viewer.mjs`,
      upstream_bytes_modified: false,
    },
    staging: {
      files: [".ua/knowledge-graph.json"],
      graph_copied_exactly: true,
      source_files_staged: 0,
    },
    server_boundary: {
      bind_host: network.bind_host,
      inner_host: network.proxy_target_host,
      methods: ["GET", "HEAD"],
      token_required_all_endpoints: true,
      browser_token_transport: "one-time-query-then-http-only-same-site-cookie",
      traversal_rejected: true,
      symlink_escape_rejected: true,
      unverified_run_rejected: true,
      non_loopback_bind_rejected: true,
      arbitrary_proxy_target_rejected: true,
      outbound_requests: service.counters.outbound_requests,
      proxied_loopback_requests: service.counters.proxied_loopback_requests,
      rejected_requests: service.counters.rejected_requests,
    },
    probes,
    poker,
    lifecycle: service.lifecycle,
    residue: {
      retained: ["native-viewer-receipt.json"],
      temporary_viewer_and_project_removed: true,
      server_processes_retained: 0,
    },
    authority_effect: "none",
  };
  return { receipt, service };
}

export async function writeNativeViewerReceipt(
  outputPath,
  options = {},
) {
  const output = resolve(options.implementationRoot ?? implementationRootDefault, outputPath);
  const root = await realpath(
    resolve(options.implementationRoot ?? implementationRootDefault),
  );
  const expectedDirectory = resolveInside(
    root,
    "generated/runs/SWU-OEW-006",
    "RECEIPT_DIRECTORY_INVALID",
  );
  if (
    dirname(output) !== expectedDirectory ||
    basename(output) !== "native-viewer-receipt.json"
  ) {
    throw new NativeViewerError("RECEIPT_PATH_INVALID", outputPath);
  }
  try {
    await access(output);
    throw new NativeViewerError("RECEIPT_ALREADY_EXISTS", outputPath);
  } catch (error) {
    if (error instanceof NativeViewerError) throw error;
  }
  await mkdir(expectedDirectory, { recursive: true });
  const { receipt } = await probeNativeViewer({
    ...options,
    implementationRoot: root,
  });
  await writeFile(output, canonicalJson(receipt), { flag: "wx" });
  return { receipt, output };
}

function validateReceiptShape(receipt, issues) {
  if (!isRecord(receipt)) {
    issues.push("RECEIPT_INVALID");
    return;
  }
  if (receipt.schema_version !== "oew.native-viewer-receipt.v1") {
    issues.push("RECEIPT_VERSION_UNSUPPORTED");
  }
  if (receipt.state !== "receipt-complete") issues.push("RECEIPT_STATE_INCOMPLETE");
  if (receipt.result !== "pass") issues.push("RECEIPT_RESULT_NOT_PASS");
  if (receipt.handle !== "oew-native-viewer-poker/v1") issues.push("HANDLE_INVALID");
  if (receipt.authority_effect !== "none") issues.push("AUTHORITY_EFFECT_FORBIDDEN");
  if (
    receipt.adapter_run?.path !== DEFAULTS.adapterRun ||
    receipt.adapter_run?.independently_verified !== true ||
    !DIGEST_PATTERN.test(receipt.adapter_run?.adapter_receipt_sha256 ?? "") ||
    !DIGEST_PATTERN.test(receipt.adapter_run?.presentation_graph_sha256 ?? "")
  ) {
    issues.push("ADAPTER_BINDING_INVALID");
  }
  if (
    receipt.upstream_viewer?.commit !== COMMIT ||
    receipt.upstream_viewer?.archive_path !== DEFAULTS.viewerArchive ||
    receipt.upstream_viewer?.build_receipt_path !==
      `generated/upstream/${COMMIT}/build-receipt.json` ||
    receipt.upstream_viewer?.upstream_bytes_modified !== false ||
    !DIGEST_PATTERN.test(receipt.upstream_viewer?.archive_sha256 ?? "") ||
    !DIGEST_PATTERN.test(receipt.upstream_viewer?.build_receipt_sha256 ?? "")
  ) {
    issues.push("UPSTREAM_BINDING_INVALID");
  }
  const boundary = receipt.server_boundary;
  if (
    boundary?.bind_host !== LOOPBACK ||
    boundary?.inner_host !== LOOPBACK ||
    JSON.stringify(boundary?.methods) !== JSON.stringify(["GET", "HEAD"]) ||
    boundary?.token_required_all_endpoints !== true ||
    boundary?.traversal_rejected !== true ||
    boundary?.symlink_escape_rejected !== true ||
    boundary?.unverified_run_rejected !== true ||
    boundary?.non_loopback_bind_rejected !== true ||
    boundary?.arbitrary_proxy_target_rejected !== true ||
    boundary?.outbound_requests !== 0 ||
    !Number.isInteger(boundary?.proxied_loopback_requests) ||
    boundary.proxied_loopback_requests < 4 ||
    !Number.isInteger(boundary?.rejected_requests) ||
    boundary.rejected_requests < 4
  ) {
    issues.push("SERVER_BOUNDARY_INVALID");
  }
  const expectedProbeIds = [
    "tokenized-get",
    "cookie-authenticated-asset",
    "tokenized-head",
    "poker-graph-get",
    "missing-token",
    "wrong-token",
    "post-forbidden",
    "traversal-forbidden",
  ];
  if (
    JSON.stringify(receipt.probes?.map(({ id }) => id)) !==
      JSON.stringify(expectedProbeIds) ||
    receipt.probes?.some(({ result }) => result !== "pass")
  ) {
    issues.push("PROBES_INVALID");
  }
  const expected = expectedPoker({ nodes: [], edges: [] });
  if (
    receipt.poker?.project_name !== expected.project_name ||
    JSON.stringify(receipt.poker?.node_ids) !== JSON.stringify(expected.node_ids) ||
    JSON.stringify(receipt.poker?.edge_tuples) !==
      JSON.stringify(expected.edge_tuples) ||
    receipt.poker?.node_count !== 4 ||
    receipt.poker?.edge_count !== 4
  ) {
    issues.push("POKER_PROOF_INVALID");
  }
  if (
    receipt.lifecycle?.proxy_closed !== true ||
    receipt.lifecycle?.child_terminated !== true ||
    receipt.lifecycle?.temporary_root_removed !== true ||
    receipt.residue?.temporary_viewer_and_project_removed !== true ||
    receipt.residue?.server_processes_retained !== 0
  ) {
    issues.push("LIFECYCLE_INVALID");
  }
}

export async function verifyNativeViewerReceipt(
  receiptPath,
  { implementationRoot = implementationRootDefault } = {},
) {
  const issues = [];
  let root;
  let path;
  let bytes;
  let receipt;
  try {
    root = await realpath(resolve(implementationRoot));
    path = resolve(root, receiptPath);
    if (!contained(root, path)) {
      throw new NativeViewerError("RECEIPT_PATH_INVALID");
    }
    bytes = await readFile(path);
    receipt = JSON.parse(bytes);
  } catch (error) {
    return {
      verified: false,
      issues: [error.issue ?? "RECEIPT_UNREADABLE"],
      authority_effect: "none",
    };
  }
  validateReceiptShape(receipt, issues);
  if (!bytes.equals(canonicalBytes(receipt))) issues.push("RECEIPT_NOT_CANONICAL");

  try {
    const adapter = await resolveVerifiedAdapterRun({
      adapterRun: receipt.adapter_run?.path,
      implementationRoot: root,
    });
    if (
      adapter.receiptSha256 !== receipt.adapter_run?.adapter_receipt_sha256 ||
      adapter.graphSha256 !== receipt.adapter_run?.presentation_graph_sha256 ||
      adapter.graphBytes.length !== receipt.adapter_run?.presentation_graph_size_bytes
    ) {
      issues.push("ADAPTER_DIGEST_BINDING_FAILED");
    }
    assertPokerGraph(adapter.graph);
  } catch (error) {
    issues.push(error.issue ?? "ADAPTER_VERIFICATION_FAILED");
  }

  try {
    const viewer = await resolveVerifiedViewer({
      implementationRoot: root,
      lockPath: DEFAULTS.lockPath,
      viewerArchive: receipt.upstream_viewer?.archive_path,
    });
    if (
      viewer.archiveSha256 !== receipt.upstream_viewer?.archive_sha256 ||
      viewer.archiveSize !== receipt.upstream_viewer?.archive_size_bytes ||
      viewer.buildReceiptSha256 !== receipt.upstream_viewer?.build_receipt_sha256
    ) {
      issues.push("UPSTREAM_DIGEST_BINDING_FAILED");
    }
  } catch (error) {
    issues.push(error.issue ?? "UPSTREAM_VERIFICATION_FAILED");
  }

  const stableIssues = [...new Set(issues)].sort();
  return {
    verified: stableIssues.length === 0,
    issues: stableIssues,
    handle: receipt?.handle ?? null,
    receipt_sha256: bytes ? sha256Bytes(bytes) : null,
    authority_effect: "none",
  };
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;
  const values = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith("--") || value === undefined) {
      throw new NativeViewerError("ARGUMENT_INVALID");
    }
    values[flag.slice(2)] = value;
  }
  if (!["probe", "verify"].includes(mode)) {
    throw new NativeViewerError("USAGE_INVALID");
  }
  if (mode === "verify" && !values.receipt) {
    throw new NativeViewerError("USAGE_INVALID");
  }
  return { mode, values };
}

async function main() {
  const { mode, values } = parseArguments(process.argv.slice(2));
  if (mode === "probe") {
    const output = values.output ?? DEFAULTS.receipt;
    const result = await writeNativeViewerReceipt(output, {
      adapterRun: values["adapter-run"] ?? DEFAULTS.adapterRun,
      viewerArchive: values["viewer-archive"] ?? DEFAULTS.viewerArchive,
      lockPath: values.lock ?? DEFAULTS.lockPath,
    });
    process.stdout.write(`${JSON.stringify({
      result: "pass",
      handle: result.receipt.handle,
      output,
      authority_effect: "none",
    })}\n`);
    return;
  }
  const result = await verifyNativeViewerReceipt(values.receipt);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (!result.verified) process.exitCode = 1;
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    process.stderr.write(
      `${error.issue ?? "NATIVE_VIEWER_COMMAND_FAILED"}: ${error.message}\n`,
    );
    process.exitCode = 1;
  });
}
