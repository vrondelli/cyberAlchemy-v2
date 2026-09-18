import {SecretResolutionError} from './secret-provider.mjs';
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const BRIDGE_SCHEMA_VERSION = "secret-management.process-bridge-request/v1";
const DEFAULT_MAX_SECRET_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 5000;
const SHA256 = /^[a-f0-9]{64}$/u;
const defaultProjectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "secret-bridge");

function requiredText(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) throw new TypeError(`${field} is required.`);
  return value;
}

function optionalPath(value, field) {
  if (value === undefined || value === null) return null;
  return requiredText(value, field);
}

function bridgeConsumerId(value) {
  return `co_${createHash("sha256").update(`are.local-sops-consumer/v1\0${value}`).digest("hex").slice(0, 32)}`;
}

function resolutionError(reason) {
  return new SecretResolutionError(reason);
}

function resolveThroughBridge({pythonCommand, projectRoot, request, timeoutMs, maxSecretBytes}) {
  return new Promise((resolveSecret, rejectSecret) => {
    const input = Buffer.from(JSON.stringify(request), "utf8");
    const chunks = [];
    let outputBytes = 0;
    let settled = false;
    let child;

    const clearChunks = () => {
      for (const chunk of chunks) chunk.fill(0);
      chunks.length = 0;
    };
    const fail = (reason) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      input.fill(0);
      clearChunks();
      if (child && !child.killed) child.kill("SIGKILL");
      rejectSecret(resolutionError(reason));
    };

    try {
      child = spawn(pythonCommand, ["-m", "secret_management.bridge"], {
        cwd: projectRoot,
        env: {
          LANG: "C",
          LC_ALL: "C",
          PYTHONDONTWRITEBYTECODE: "1",
          PYTHONPATH: projectRoot
        },
        stdio: ["pipe", "pipe", "ignore"]
      });
    } catch {
      input.fill(0);
      rejectSecret(resolutionError("spawn-failed"));
      return;
    }

    const timer = setTimeout(() => fail("timeout"), timeoutMs);
    child.once("error", () => fail("spawn-failed"));
    child.stdout.on("data", (chunk) => {
      if (settled) {
        chunk.fill(0);
        return;
      }
      outputBytes += chunk.length;
      if (outputBytes > maxSecretBytes) {
        chunk.fill(0);
        fail("output-limit");
        return;
      }
      chunks.push(chunk);
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      clearTimeout(timer);
      input.fill(0);
      if (code !== 0 || signal !== null || outputBytes < 1 || outputBytes > maxSecretBytes) {
        fail(code !== 0 || signal !== null ? "process-failed" : "empty-output");
        return;
      }
      const material = Buffer.concat(chunks, outputBytes);
      clearChunks();
      settled = true;
      resolveSecret(material);
    });
    child.stdin.once("error", () => fail("stdin-failed"));
    child.stdin.end(input, () => input.fill(0));
  });
}

export function createSopsAgeProcessSecretProvider({
  provider_id = "local-sops-age",
  python_command = "/usr/bin/python3.12",
  project_root = defaultProjectRoot,
  key_file,
  vault_file,
  timeout_ms = DEFAULT_TIMEOUT_MS,
  max_secret_bytes = DEFAULT_MAX_SECRET_BYTES
} = {}) {
  const providerId = requiredText(provider_id, "provider_id");
  const pythonCommand = requiredText(python_command, "python_command");
  const projectRoot = requiredText(project_root, "project_root");
  const keyFile = optionalPath(key_file, "key_file");
  const vaultFile = optionalPath(vault_file, "vault_file");
  if (!Number.isSafeInteger(timeout_ms) || timeout_ms < 1) throw new TypeError("timeout_ms must be a positive safe integer.");
  if (!Number.isSafeInteger(max_secret_bytes) || max_secret_bytes < 1 || max_secret_bytes > DEFAULT_MAX_SECRET_BYTES) throw new TypeError("max_secret_bytes is invalid.");
  return Object.freeze({
    provider_id: providerId,
    provider_kind: "local-sops-age-process",
    async resolve({locator, request_digest, consumer_id}) {
      const exactLocator = requiredText(locator, "locator");
      const exactConsumerId = requiredText(consumer_id, "consumer_id");
      if (typeof request_digest !== "string" || !SHA256.test(request_digest)) throw resolutionError();
      try {
        return await resolveThroughBridge({
          pythonCommand,
          projectRoot,
          timeoutMs: timeout_ms,
          maxSecretBytes: max_secret_bytes,
          request: {
            schema_version: BRIDGE_SCHEMA_VERSION,
            locator: exactLocator,
            consumer_id: bridgeConsumerId(exactConsumerId),
            request_digest,
            key_file: keyFile,
            vault_file: vaultFile,
            timeout_seconds: Math.max(1, Math.min(300, Math.ceil(timeout_ms / 1000)))
          }
        });
      } catch (error) {
        throw error instanceof SecretResolutionError ? error : resolutionError();
      }
    }
  });
}
