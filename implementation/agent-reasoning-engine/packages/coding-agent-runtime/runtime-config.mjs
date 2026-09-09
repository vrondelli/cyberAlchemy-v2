import {readFileSync} from "node:fs";

import {createOpenAICompatibleModelTransport} from "./openai-compatible-transport.mjs";
import {createEnvironmentSecretProvider, createSecretProviderRegistry, createSecretReference} from "./secret-provider.mjs";
import {createSopsAgeProcessSecretProvider} from "./sops-age-secret-provider.mjs";
import {parseCapabilityAwarenessConfig} from "./capability-awareness.mjs";
import {parseSandboxConfig} from "./sandbox.mjs";

const RUN_SCHEMA_VERSION = "are.coding-agent-run-config/v1";
const TOP_LEVEL_KEYS = new Set(["schema_version", "model", "observation_allowlist", "mutation_allowlist", "verification_command", "max_context_bytes", "capability_awareness", "iterative", "sandbox", "repository_map", "advanced_reasoning", "evolution"]);
const MODEL_KEYS = new Set(["transport", "base_url", "model", "timeout_ms", "credential"]);
const COMMON_CREDENTIAL_KEYS = new Set(["provider_kind", "provider_id", "locator"]);
const LOCAL_CREDENTIAL_KEYS = new Set([...COMMON_CREDENTIAL_KEYS, "python_command", "project_root", "key_file", "vault_file", "timeout_ms"]);
const ITERATIVE_KEYS = new Set(["maximum_steps", "tool_policy", "session_path", "resume"]);
const TOOL_POLICY_KEYS = new Set(["allow", "ask", "deny"]);
const MAP_KEYS = new Set(["maximum_files", "maximum_bytes", "include_extensions"]);
const REASONING_KEYS = new Set(["maximum_event_count"]);
const EVOLUTION_KEYS = new Set(["enabled", "user_selected"]);

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object.`);
  return value;
}

function exactKeys(value, allowed, field) {
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${field} contains an unsupported field.`);
  return value;
}

function text(value, field) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) throw new TypeError(`${field} is required.`);
  return value;
}

function positiveInteger(value, field, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${field} must be a positive safe integer.`);
  return value;
}

function textArray(value, field, {allowEmpty = false} = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((entry) => typeof entry !== "string" || entry.length === 0 || entry.includes("\0"))) {
    throw new TypeError(`${field} must be ${allowEmpty ? "an" : "a non-empty"} array of strings.`);
  }
  return Object.freeze([...value]);
}

function credentialConfig(value) {
  if (value === undefined) return null;
  const credential = object(value, "model.credential");
  const kind = text(credential.provider_kind, "model.credential.provider_kind");
  exactKeys(credential, kind === "local-sops-age" ? LOCAL_CREDENTIAL_KEYS : COMMON_CREDENTIAL_KEYS, "model.credential");
  if (!new Set(["environment", "local-sops-age", "injected"]).has(kind)) throw new TypeError("model.credential.provider_kind is unsupported.");
  const result = {
    provider_kind: kind,
    provider_id: text(credential.provider_id, "model.credential.provider_id"),
    locator: text(credential.locator, "model.credential.locator")
  };
  if (kind === "local-sops-age") {
    for (const field of ["python_command", "project_root", "key_file", "vault_file"]) {
      if (credential[field] !== undefined) result[field] = text(credential[field], `model.credential.${field}`);
    }
    if (credential.timeout_ms !== undefined) result.timeout_ms = positiveInteger(credential.timeout_ms, "model.credential.timeout_ms");
  }
  return Object.freeze(result);
}

function iterativeConfig(value) {
  if (value === undefined || value === null) return null;
  const iterative = exactKeys(object(value, "iterative"), ITERATIVE_KEYS, "iterative");
  const toolPolicy = exactKeys(object(iterative.tool_policy ?? {}, "iterative.tool_policy"), TOOL_POLICY_KEYS, "iterative.tool_policy");
  return Object.freeze({
    maximum_steps: positiveInteger(iterative.maximum_steps, "iterative.maximum_steps", 8),
    tool_policy: Object.freeze({allow: textArray(toolPolicy.allow ?? ["list-files", "read-file", "search-text", "repository-map"], "iterative.tool_policy.allow", {allowEmpty: true}), ask: textArray(toolPolicy.ask ?? [], "iterative.tool_policy.ask", {allowEmpty: true}), deny: textArray(toolPolicy.deny ?? [], "iterative.tool_policy.deny", {allowEmpty: true})}),
    session_path: iterative.session_path === undefined ? null : text(iterative.session_path, "iterative.session_path"),
    resume: iterative.resume === true,
  });
}

export function parseIterativeToolPolicy(value) {
  const toolPolicy = exactKeys(object(value, "tool policy"), TOOL_POLICY_KEYS, "tool policy");
  return Object.freeze({allow: textArray(toolPolicy.allow ?? [], "tool policy.allow", {allowEmpty: true}), ask: textArray(toolPolicy.ask ?? [], "tool policy.ask", {allowEmpty: true}), deny: textArray(toolPolicy.deny ?? [], "tool policy.deny", {allowEmpty: true})});
}

function repositoryMapConfig(value) {
  if (value === undefined) return Object.freeze({maximum_files: 256, maximum_bytes: 262_144, include_extensions: null});
  const map = exactKeys(object(value, "repository_map"), MAP_KEYS, "repository_map");
  return Object.freeze({maximum_files: positiveInteger(map.maximum_files, "repository_map.maximum_files", 256), maximum_bytes: positiveInteger(map.maximum_bytes, "repository_map.maximum_bytes", 262_144), include_extensions: map.include_extensions === undefined || map.include_extensions === null ? null : textArray(map.include_extensions, "repository_map.include_extensions", {allowEmpty: true})});
}

export function parseRepositoryMapConfig(value) { return repositoryMapConfig(value); }

function advancedReasoningConfig(value) {
  if (value === undefined) return Object.freeze({maximum_event_count: 32});
  const reasoning = exactKeys(object(value, "advanced_reasoning"), REASONING_KEYS, "advanced_reasoning");
  return Object.freeze({maximum_event_count: positiveInteger(reasoning.maximum_event_count, "advanced_reasoning.maximum_event_count", 32)});
}

function evolutionConfig(value) {
  if (value === undefined) return Object.freeze({enabled: false, user_selected: false});
  const evolution = exactKeys(object(value, "evolution"), EVOLUTION_KEYS, "evolution");
  return Object.freeze({enabled: evolution.enabled === true, user_selected: evolution.user_selected === true});
}

export function parseCodingAgentRunConfig(input) {
  const config = exactKeys(object(input, "config"), TOP_LEVEL_KEYS, "config");
  if (config.schema_version !== RUN_SCHEMA_VERSION) throw new TypeError("config.schema_version is unsupported.");
  const model = exactKeys(object(config.model, "model"), MODEL_KEYS, "model");
  if (model.transport !== "openai-compatible") throw new TypeError("model.transport is unsupported.");
  const credential = credentialConfig(model.credential);
  return Object.freeze({
    schema_version: RUN_SCHEMA_VERSION,
    model: Object.freeze({
      transport: model.transport,
      base_url: text(model.base_url, "model.base_url"),
      model: text(model.model, "model.model"),
      timeout_ms: positiveInteger(model.timeout_ms, "model.timeout_ms", 60_000),
      ...(credential ? {credential} : {})
    }),
    observation_allowlist: textArray(config.observation_allowlist, "observation_allowlist"),
    mutation_allowlist: textArray(config.mutation_allowlist, "mutation_allowlist"),
    verification_command: textArray(config.verification_command, "verification_command"),
    max_context_bytes: positiveInteger(config.max_context_bytes, "max_context_bytes", 256 * 1024),
    capability_awareness: config.capability_awareness === undefined || config.capability_awareness === null ? null : parseCapabilityAwarenessConfig(config.capability_awareness),
    iterative: iterativeConfig(config.iterative),
    sandbox: parseSandboxConfig(config.sandbox),
    repository_map: repositoryMapConfig(config.repository_map),
    advanced_reasoning: advancedReasoningConfig(config.advanced_reasoning),
    evolution: evolutionConfig(config.evolution)
  });
}

export function loadCodingAgentRunConfig(path) {
  const exactPath = text(path, "config path");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(exactPath, "utf8"));
  } catch {
    throw new TypeError("Coding-agent configuration could not be loaded.");
  }
  return parseCodingAgentRunConfig(parsed);
}

function injectedProvider(providerId, providers) {
  const entries = providers instanceof Map ? [...providers.values()] : providers;
  if (!Array.isArray(entries)) throw new TypeError("Injected providers must be an array or Map.");
  const provider = entries.find((candidate) => candidate?.provider_id === providerId);
  if (!provider || typeof provider.resolve !== "function") throw new TypeError("Configured injected provider is unavailable.");
  return provider;
}

export function createConfiguredModelTransport({config, env = process.env, fetch_impl = globalThis.fetch, injected_providers = []}) {
  const parsed = parseCodingAgentRunConfig(config);
  const modelOptions = {
    base_url: parsed.model.base_url,
    model: parsed.model.model,
    timeout_ms: parsed.model.timeout_ms,
    fetch_impl
  };
  const credential = parsed.model.credential;
  if (credential) {
    let provider;
    if (credential.provider_kind === "environment") {
      provider = createEnvironmentSecretProvider({provider_id: credential.provider_id, env});
    } else if (credential.provider_kind === "local-sops-age") {
      provider = createSopsAgeProcessSecretProvider({
        provider_id: credential.provider_id,
        ...(credential.python_command ? {python_command: credential.python_command} : {}),
        ...(credential.project_root ? {project_root: credential.project_root} : {}),
        ...(credential.key_file ? {key_file: credential.key_file} : {}),
        ...(credential.vault_file ? {vault_file: credential.vault_file} : {}),
        ...(credential.timeout_ms ? {timeout_ms: credential.timeout_ms} : {})
      });
    } else {
      provider = injectedProvider(credential.provider_id, injected_providers);
    }
    modelOptions.api_key_ref = createSecretReference({provider_id: credential.provider_id, locator: credential.locator});
    modelOptions.secret_registry = createSecretProviderRegistry({providers: [provider]});
  }
  return Object.freeze({
    config: parsed,
    model_transport: createOpenAICompatibleModelTransport(modelOptions)
  });
}

export {RUN_SCHEMA_VERSION};
