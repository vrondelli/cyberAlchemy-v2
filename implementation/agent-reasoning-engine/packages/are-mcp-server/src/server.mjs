import {spawn} from "node:child_process";
import {createInterface} from "node:readline";
import {dirname, resolve} from "node:path";
import {existsSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {decide} from "../../../src/decision-cli.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";
import {createDurableEvolutionKernel} from "../../evolution-runtime/index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultRepositoryRoot = resolve(packageRoot, "../../../..");
const coordinateCli = resolve(packageRoot, "../evolution-runtime/bin/coordinate.mjs");
const kernelCli = resolve(packageRoot, "../evolution-runtime/bin/kernel.mjs");
const protocolVersion = "2025-06-18";
const maxMessageBytes = 1024 * 1024;
const maxToolOutputBytes = 4 * 1024 * 1024;
const childTimeoutMs = 110_000;

const tools = Object.freeze([
  {
    name: "are_decide",
    title: "ARE decision",
    description: "Evaluate one route, context, effect, or continuation request through ARE. This returns non-authorizing receipts and never executes an effect.",
    inputSchema: {
      type: "object",
      properties: {
        operation: {type: "string", enum: ["route", "context", "effect", "continue"]},
        request: {type: "object", description: "Exact are.cli-request/v1 document."},
      },
      required: ["operation", "request"],
      additionalProperties: false,
    },
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
  },
  {
    name: "evolution_status",
    title: "ARE evolution status",
    description: "Inspect or diagnose the configured durable evolution runtime without changing cycle state.",
    inputSchema: {
      type: "object",
      properties: {view: {type: "string", enum: ["inspect", "diagnose"], default: "inspect"}},
      additionalProperties: false,
    },
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
  },
  {
    name: "evolution_command",
    title: "ARE evolution command",
    description: "Submit an exact JSON command to the durable evolution kernel or coordinator. Existing schema, revision, admission, idempotency, evidence, and effect-envelope checks remain authoritative.",
    inputSchema: {
      type: "object",
      properties: {
        surface: {type: "string", enum: ["kernel", "coordination"]},
        request: {type: "object"},
      },
      required: ["surface", "request"],
      additionalProperties: false,
    },
    annotations: {readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false},
  },
  {
    name: "evidence_get",
    title: "ARE evidence retrieval",
    description: "Retrieve one content-addressed evolution object using its exact SHA-256 and byte length. Arbitrary paths are not accepted.",
    inputSchema: {
      type: "object",
      properties: {
        sha256: {type: "string", pattern: "^[a-f0-9]{64}$"},
        byte_length: {type: "integer", minimum: 0, maximum: maxToolOutputBytes},
        encoding: {type: "string", enum: ["utf8", "base64"], default: "utf8"},
      },
      required: ["sha256", "byte_length"],
      additionalProperties: false,
    },
    annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false},
  },
]);

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function textResult(value, isError = false) {
  return {content: [{type: "text", text: JSON.stringify(value)}], structuredContent: value, isError};
}

function toolFailure(code, details = {}) {
  return textResult({schema_version: "are.mcp-tool-failure/v1", ok: false, reason_codes: [code], ...details, authority_effect: "none"}, true);
}

export function runCli(script, args, request, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [script, ...args], {stdio: ["pipe", "pipe", "pipe"], windowsHide: true});
    const stdout = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let overflow = false;
    let timedOut = false;
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveRun(value);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, options.timeout_ms ?? childTimeoutMs);
    timer.unref();
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxToolOutputBytes) { overflow = true; child.kill("SIGTERM"); return; }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
    });
    child.once("error", (error) => settle({ok: false, reason: "mcp.child-start-failed", message: error.message}));
    child.once("close", (code) => {
      if (timedOut) return settle({ok: false, reason: "mcp.child-timeout"});
      if (overflow) return settle({ok: false, reason: "mcp.child-output-too-large"});
      const raw = Buffer.concat(stdout).toString("utf8").trim();
      try { settle({ok: true, code, value: JSON.parse(raw)}); }
      catch { settle({ok: false, reason: "mcp.child-invalid-json", code, stderr_bytes: stderrBytes}); }
    });
    child.stdin.end(`${JSON.stringify(request)}\n`);
  });
}

export function createAreMcpServer({evolutionRoot, repositoryRoot = defaultRepositoryRoot, developmentLive = false} = {}) {
  if (typeof evolutionRoot !== "string" || evolutionRoot.length === 0) throw new TypeError("evolutionRoot is required.");
  const runtimeRoot = resolve(evolutionRoot);
  const repoRoot = resolve(repositoryRoot);
  const decisionRoot = existsSync(resolve(repoRoot, "agent-routing/profile.json")) ? dirname(repoRoot) : repoRoot;

  async function callTool(name, args = {}) {
    if (!object(args)) return toolFailure("mcp.arguments-invalid");
    if (name === "are_decide") {
      if (!object(args.request) || !["route", "context", "effect", "continue"].includes(args.operation)) return toolFailure("mcp.are-decision-request-invalid");
      try {
        const paths = developmentLive ? {repositoryRoot: decisionRoot} : {};
        const value = decide(args.operation, args.request, {...paths, modulePort: createNativeSemanticModulePort()});
        return textResult(value, value?.ok === false || value?.kind === "block");
      } catch (error) { return toolFailure("mcp.are-decision-failed", {message: error.message}); }
    }
    if (name === "evolution_status") {
      const view = args.view ?? "inspect";
      if (!object(args) || Object.keys(args).some((key) => key !== "view") || !["inspect", "diagnose"].includes(view)) return toolFailure("mcp.evolution-status-request-invalid");
      const result = view === "inspect"
        ? await runCli(coordinateCli, ["--root", runtimeRoot], {schema_version: "are.evolution-coordination-cli-request/v1", operation: "inspect", input: {}})
        : await runCli(kernelCli, ["--root", runtimeRoot], {schema_version: "are.evolution-kernel-request/v1", operation: "diagnose"});
      return result.ok ? textResult(result.value, result.value?.ok === false) : toolFailure(result.reason, result);
    }
    if (name === "evolution_command") {
      if (!object(args.request) || !["kernel", "coordination"].includes(args.surface) || Object.keys(args).some((key) => !["surface", "request"].includes(key))) return toolFailure("mcp.evolution-command-request-invalid");
      const script = args.surface === "kernel" ? kernelCli : coordinateCli;
      const result = await runCli(script, ["--root", runtimeRoot], args.request);
      return result.ok ? textResult(result.value, result.value?.ok === false) : toolFailure(result.reason, result);
    }
    if (name === "evidence_get") {
      if (!/^[a-f0-9]{64}$/.test(args.sha256 ?? "") || !Number.isSafeInteger(args.byte_length) || args.byte_length < 0 || args.byte_length > maxToolOutputBytes || ![undefined, "utf8", "base64"].includes(args.encoding) || Object.keys(args).some((key) => !["sha256", "byte_length", "encoding"].includes(key))) return toolFailure("mcp.evidence-request-invalid");
      const kernel = createDurableEvolutionKernel({root: runtimeRoot, require_enabled: true});
      const loaded = kernel.readObject({sha256: args.sha256, byte_length: args.byte_length});
      if (!loaded.ok) return textResult(loaded, true);
      const bytes = Buffer.from(loaded.value.bytes_base64, "base64");
      const content = args.encoding === "base64" ? loaded.value.bytes_base64 : bytes.toString("utf8");
      return textResult({schema_version: "are.mcp-evidence/v1", ok: true, identity: {sha256: args.sha256, byte_length: args.byte_length}, encoding: args.encoding ?? "utf8", content, authority_effect: "none"});
    }
    return toolFailure("mcp.tool-unknown", {tool: name});
  }

  async function handle(message) {
    if (!object(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") return {jsonrpc: "2.0", id: message?.id ?? null, error: {code: -32600, message: "Invalid Request"}};
    if (message.id === undefined) return null;
    if (message.method === "initialize") return {jsonrpc: "2.0", id: message.id, result: {protocolVersion, capabilities: {tools: {listChanged: false}}, serverInfo: {name: "are", version: "0.1.0-candidate"}, instructions: "Use ARE before repository routing and at context, effect, and continuation boundaries. Evolution state changes must go through evolution_command; retrieve evidence only by exact content identity. ARE receipts grant no approval or effect authority."}};
    if (message.method === "ping") return {jsonrpc: "2.0", id: message.id, result: {}};
    if (message.method === "tools/list") return {jsonrpc: "2.0", id: message.id, result: {tools}};
    if (message.method === "tools/call") {
      const name = message.params?.name;
      const args = message.params?.arguments ?? {};
      return {jsonrpc: "2.0", id: message.id, result: await callTool(name, args)};
    }
    return {jsonrpc: "2.0", id: message.id, error: {code: -32601, message: "Method not found"}};
  }

  return Object.freeze({handle, callTool, tools});
}

export async function runAreMcpStdio({evolutionRoot, repositoryRoot, developmentLive = false, input = process.stdin, output = process.stdout} = {}) {
  const server = createAreMcpServer({evolutionRoot, repositoryRoot, developmentLive});
  const lines = createInterface({input, crlfDelay: Infinity});
  for await (const line of lines) {
    if (Buffer.byteLength(line) > maxMessageBytes) {
      output.write(`${JSON.stringify({jsonrpc: "2.0", id: null, error: {code: -32700, message: "Message too large"}})}\n`);
      continue;
    }
    let message;
    try { message = JSON.parse(line); }
    catch {
      output.write(`${JSON.stringify({jsonrpc: "2.0", id: null, error: {code: -32700, message: "Parse error"}})}\n`);
      continue;
    }
    const response = await server.handle(message);
    if (response) output.write(`${JSON.stringify(response)}\n`);
  }
}
