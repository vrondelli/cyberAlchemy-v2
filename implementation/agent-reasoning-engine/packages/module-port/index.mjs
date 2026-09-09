import {createHash} from "node:crypto";

export const MODULE_MANIFEST_SCHEMA = "are.module-manifest/v1";
export const MODULE_ADAPTER_PROTOCOL = "are.module-adapter/v1";
export const MODULE_INVOCATION_SCHEMA = "are.module-invocation/v1";
export const MODULE_RESULT_SCHEMA = "are.module-result/v1";
export const MODULE_RECEIPT_SCHEMA = "are.module-invocation-receipt/v1";

const SHA256 = /^[a-f0-9]{64}$/u;
const ID = /^[a-z0-9](?:[-a-z0-9._/:]{0,126}[a-z0-9])?$/u;
const MANIFEST_KEYS = new Set([
  "schema_version", "module_id", "version", "adapter_protocol", "capabilities",
  "dependencies", "required_permissions", "side_effects", "authority_effect", "manifest_digest",
]);
const CAPABILITY_KEYS = new Set(["capability_id", "input_protocol", "output_protocol"]);
const DEPENDENCY_KEYS = new Set(["module_id", "version"]);
const INVOCATION_KEYS = new Set([
  "schema_version", "invocation_id", "consumer_id", "capability_id", "input",
  "dependency_posture", "authority_effect",
]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exactKeys(value, allowed) {
  return record(value) && Object.keys(value).every((key) => allowed.has(key));
}

function text(value) {
  return typeof value === "string" && value.length > 0;
}

function id(value) {
  return text(value) && ID.test(value);
}

function normalizeJson(value, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite numbers are not canonical JSON.");
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value !== "object" || seen.has(value)) throw new TypeError("Value is not canonical JSON.");
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => normalizeJson(item, seen));
    if (!record(value)) throw new TypeError("Value is not a plain JSON object.");
    return Object.fromEntries(Object.keys(value).sort().map((key) => {
      if (value[key] === undefined) throw new TypeError("Undefined is not canonical JSON.");
      return [key, normalizeJson(value[key], seen)];
    }));
  } finally {
    seen.delete(value);
  }
}

export function canonicalModuleJson(value) {
  return JSON.stringify(normalizeJson(value));
}

export function digestModuleValue(value) {
  return createHash("sha256").update(canonicalModuleJson(value)).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function normalizedManifestMaterial(input) {
  if (!exactKeys(input, MANIFEST_KEYS)) throw new TypeError("Module manifest fields are invalid.");
  if (input.schema_version !== MODULE_MANIFEST_SCHEMA || !id(input.module_id) || !text(input.version)
    || input.adapter_protocol !== MODULE_ADAPTER_PROTOCOL || input.authority_effect !== "none"
    || input.side_effects !== false || !Array.isArray(input.capabilities) || input.capabilities.length === 0
    || !Array.isArray(input.required_permissions) || input.required_permissions.some((item) => !id(item))) {
    throw new TypeError("Module manifest is invalid.");
  }
  const capabilities = input.capabilities.map((capability) => {
    if (!exactKeys(capability, CAPABILITY_KEYS) || !id(capability.capability_id)
      || !id(capability.input_protocol) || !id(capability.output_protocol)) {
      throw new TypeError("Module capability is invalid.");
    }
    return normalizeJson(capability);
  }).sort((left, right) => left.capability_id.localeCompare(right.capability_id));
  if (new Set(capabilities.map((item) => item.capability_id)).size !== capabilities.length) {
    throw new TypeError("Module capability is duplicated.");
  }
  const dependencies = input.dependencies === undefined ? null : input.dependencies.map((dependency) => {
    if (!exactKeys(dependency, DEPENDENCY_KEYS) || !id(dependency.module_id) || !text(dependency.version)) {
      throw new TypeError("Module dependency is invalid.");
    }
    return normalizeJson(dependency);
  }).sort((left, right) => left.module_id.localeCompare(right.module_id));
  if (dependencies !== null && new Set(dependencies.map((item) => item.module_id)).size !== dependencies.length) {
    throw new TypeError("Module dependency is duplicated.");
  }
  return normalizeJson({
    schema_version: MODULE_MANIFEST_SCHEMA,
    module_id: input.module_id,
    version: input.version,
    adapter_protocol: MODULE_ADAPTER_PROTOCOL,
    capabilities,
    ...(dependencies === null ? {} : {dependencies}),
    required_permissions: [...new Set(input.required_permissions)].sort(),
    side_effects: false,
    authority_effect: "none",
  });
}

export function sealModuleManifest(input) {
  const material = normalizedManifestMaterial({...input, manifest_digest: input.manifest_digest ?? ""});
  return deepFreeze({...material, manifest_digest: digestModuleValue(material)});
}

export function verifyModuleManifest(input) {
  try {
    if (!SHA256.test(input?.manifest_digest ?? "")) return false;
    const material = normalizedManifestMaterial(input);
    return digestModuleValue(material) === input.manifest_digest;
  } catch {
    return false;
  }
}

function blockedInvocation(invocation, moduleSetDigest, reasonCodes, module = null) {
  const inputDigest = (() => {
    try { return digestModuleValue(invocation?.input ?? null); } catch { return null; }
  })();
  return sealResult({
    ok: false,
    disposition: "blocked",
    invocation_id: text(invocation?.invocation_id) ? invocation.invocation_id : null,
    consumer_id: text(invocation?.consumer_id) ? invocation.consumer_id : null,
    capability_id: text(invocation?.capability_id) ? invocation.capability_id : null,
    module_id: module?.manifest.module_id ?? null,
    module_version: module?.manifest.version ?? null,
    value: null,
    reason_codes: [...new Set(reasonCodes)].sort(),
    receipt: receipt({invocation, moduleSetDigest, module, inputDigest, outputDigest: null, disposition: "blocked"}),
  });
}

function receipt({invocation, moduleSetDigest, module, inputDigest, outputDigest, disposition}) {
  const material = normalizeJson({
    schema_version: MODULE_RECEIPT_SCHEMA,
    invocation_id: text(invocation?.invocation_id) ? invocation.invocation_id : null,
    consumer_id: text(invocation?.consumer_id) ? invocation.consumer_id : null,
    capability_id: text(invocation?.capability_id) ? invocation.capability_id : null,
    disposition,
    module_id: module?.manifest.module_id ?? null,
    module_version: module?.manifest.version ?? null,
    manifest_digest: module?.manifest.manifest_digest ?? null,
    module_set_digest: moduleSetDigest,
    input_digest: inputDigest,
    output_digest: outputDigest,
    authority_effect: "none",
  });
  return deepFreeze({...material, receipt_digest: digestModuleValue(material)});
}

function sealResult(fields) {
  const material = normalizeJson({schema_version: MODULE_RESULT_SCHEMA, ...fields, authority_effect: "none"});
  return deepFreeze({...material, result_digest: digestModuleValue(material)});
}

function invocationValid(input) {
  if (!exactKeys(input, INVOCATION_KEYS) || input.schema_version !== MODULE_INVOCATION_SCHEMA
    || !id(input.invocation_id) || !id(input.consumer_id) || !id(input.capability_id)
    || !["required-for-judgment", "required-for-operation", "optional-enrichment"].includes(input.dependency_posture)
    || input.authority_effect !== "none") return false;
  try { canonicalModuleJson(input.input); return true; } catch { return false; }
}

export function createModulePort({adapters = [], output_validators = {}} = {}) {
  if (!Array.isArray(adapters) || !record(output_validators)) throw new TypeError("Module port configuration is invalid.");
  const capabilityMap = new Map();
  const moduleIds = new Set();
  const validators = Object.freeze({...output_validators});
  const modules = [];
  const modulesById = new Map();
  for (const adapter of adapters) {
    if (!record(adapter) || !verifyModuleManifest(adapter.manifest) || typeof adapter.invoke !== "function") {
      throw new TypeError("Module adapter is invalid.");
    }
    if (moduleIds.has(adapter.manifest.module_id)) throw new TypeError("Module identity is duplicated.");
    moduleIds.add(adapter.manifest.module_id);
    const frozenAdapter = {manifest: adapter.manifest, invoke: adapter.invoke};
    modules.push(frozenAdapter);
    modulesById.set(adapter.manifest.module_id, frozenAdapter);
    for (const capability of adapter.manifest.capabilities) {
      if (capabilityMap.has(capability.capability_id)) throw new TypeError("Module capability provider is ambiguous.");
      capabilityMap.set(capability.capability_id, {adapter: frozenAdapter, capability});
    }
  }
  for (const module of modules) {
    for (const dependency of module.manifest.dependencies ?? []) {
      const target = modulesById.get(dependency.module_id);
      if (!target) throw new TypeError(`Module dependency is missing: ${module.manifest.module_id} -> ${dependency.module_id}`);
      if (target.manifest.version !== dependency.version) {
        throw new TypeError(`Module dependency version mismatches: ${module.manifest.module_id} -> ${dependency.module_id}@${dependency.version}`);
      }
    }
  }
  const pending = new Map(modules.map((module) => [module.manifest.module_id,
    new Set((module.manifest.dependencies ?? []).map((dependency) => dependency.module_id))]));
  const orderedModules = [];
  while (pending.size > 0) {
    const ready = [...pending.entries()].filter(([, dependencies]) => dependencies.size === 0)
      .map(([moduleId]) => moduleId).sort();
    if (ready.length === 0) throw new TypeError("Module dependency cycle detected.");
    for (const moduleId of ready) {
      orderedModules.push(modulesById.get(moduleId));
      pending.delete(moduleId);
      for (const dependencies of pending.values()) dependencies.delete(moduleId);
    }
  }
  const moduleSetMaterial = modules.map(({manifest}) => ({
    module_id: manifest.module_id,
    version: manifest.version,
    manifest_digest: manifest.manifest_digest,
    ...(manifest.dependencies === undefined ? {} : {dependencies: manifest.dependencies}),
  })).sort((left, right) => (
    orderedModules.findIndex((module) => module.manifest.module_id === left.module_id)
      - orderedModules.findIndex((module) => module.manifest.module_id === right.module_id)
  ));
  const moduleSetDigest = digestModuleValue({schema_version: "are.module-set/v1", modules: moduleSetMaterial, authority_effect: "none"});
  const capabilityIds = [...capabilityMap.keys()].sort();

  return deepFreeze({
    schema_version: "are.module-port/v1",
    module_set_digest: moduleSetDigest,
    capability_ids: capabilityIds,
    authority_effect: "none",
    inspect() {
      return deepFreeze({
        schema_version: "are.module-set-inspection/v1",
        module_set_digest: moduleSetDigest,
        modules: moduleSetMaterial,
        dependency_order: orderedModules.map((module) => module.manifest.module_id),
        capability_ids: capabilityIds,
        discovery: "disabled",
        fallback: "forbidden",
        hot_reload: "disabled",
        authority_effect: "none",
      });
    },
    invoke(invocation) {
      if (!invocationValid(invocation)) return blockedInvocation(invocation, moduleSetDigest, ["module.invocation-invalid"]);
      const binding = capabilityMap.get(invocation.capability_id);
      const inputDigest = digestModuleValue(invocation.input);
      if (!binding) {
        return sealResult({
          ok: false,
          disposition: "unavailable",
          invocation_id: invocation.invocation_id,
          consumer_id: invocation.consumer_id,
          capability_id: invocation.capability_id,
          module_id: null,
          module_version: null,
          value: null,
          reason_codes: ["module.capability-unavailable"],
          receipt: receipt({invocation, moduleSetDigest, module: null, inputDigest, outputDigest: null, disposition: "unavailable"}),
        });
      }
      const validator = validators[binding.capability.output_protocol];
      if (typeof validator !== "function") return blockedInvocation(invocation, moduleSetDigest, ["module.output-validator-unavailable"], binding.adapter);
      let value;
      try {
        value = binding.adapter.invoke(deepFreeze(normalizeJson({
          schema_version: MODULE_INVOCATION_SCHEMA,
          invocation_id: invocation.invocation_id,
          consumer_id: invocation.consumer_id,
          capability_id: invocation.capability_id,
          input: invocation.input,
          input_digest: inputDigest,
          module_set_digest: moduleSetDigest,
          authority_effect: "none",
        })));
      } catch {
        return blockedInvocation(invocation, moduleSetDigest, ["module.invoke-failed"], binding.adapter);
      }
      if (value && typeof value.then === "function") {
        if (typeof value.catch === "function") value.catch(() => {});
        return blockedInvocation(invocation, moduleSetDigest, ["module.invoke-must-be-synchronous"], binding.adapter);
      }
      let normalizedValue;
      try { normalizedValue = normalizeJson(value); }
      catch { return blockedInvocation(invocation, moduleSetDigest, ["module.output-invalid"], binding.adapter); }
      let valid = false;
      try { valid = validator(normalizedValue) === true; } catch { valid = false; }
      if (!valid) return blockedInvocation(invocation, moduleSetDigest, ["module.output-invalid"], binding.adapter);
      const outputDigest = digestModuleValue(normalizedValue);
      return sealResult({
        ok: true,
        disposition: "available",
        invocation_id: invocation.invocation_id,
        consumer_id: invocation.consumer_id,
        capability_id: invocation.capability_id,
        module_id: binding.adapter.manifest.module_id,
        module_version: binding.adapter.manifest.version,
        value: normalizedValue,
        reason_codes: [],
        receipt: receipt({invocation, moduleSetDigest, module: binding.adapter, inputDigest, outputDigest, disposition: "available"}),
      });
    },
  });
}
