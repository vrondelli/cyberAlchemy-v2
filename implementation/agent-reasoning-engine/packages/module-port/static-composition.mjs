import {canonicalModuleJson, createModulePort, digestModuleValue, verifyModuleManifest} from "./index.mjs";

export const STATIC_MODULE_CONFIGURATION_SCHEMA = "are.static-module-configuration/v1";
const BINDING_KEYS = new Set(["factory_id", "module_id", "version", "manifest_digest"]);
const CONFIGURATION_KEYS = new Set(["schema_version", "configuration_id", "modules", "authority_effect"]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.length > 0;
}

function exactKeys(value, keys) {
  return record(value) && Object.keys(value).every((key) => keys.has(key));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function result({ok, disposition, configurationId = null, reasonCodes = [], residue = [], port = null, inspection = null}) {
  const evidence = deepFreeze({
    schema_version: "are.static-module-composition/v1",
    ok,
    disposition,
    configuration_id: configurationId,
    reason_codes: [...new Set(reasonCodes)].sort(),
    residue,
    module_set_digest: inspection?.module_set_digest ?? null,
    dependency_order: inspection?.dependency_order ?? [],
    modules: inspection?.modules ?? [],
    authority_effect: "none",
  });
  return deepFreeze({...evidence, composition_digest: digestModuleValue(evidence), port});
}

function configurationValid(configuration) {
  return exactKeys(configuration, CONFIGURATION_KEYS)
    && configuration.schema_version === STATIC_MODULE_CONFIGURATION_SCHEMA
    && text(configuration.configuration_id)
    && configuration.authority_effect === "none"
    && Array.isArray(configuration.modules)
    && configuration.modules.every((binding) => exactKeys(binding, BINDING_KEYS)
      && text(binding.factory_id) && text(binding.module_id) && text(binding.version)
      && /^[a-f0-9]{64}$/u.test(binding.manifest_digest));
}

function dependencyReason(error) {
  const message = String(error?.message ?? "");
  if (message.startsWith("Module dependency is missing:")) return "module.dependency-missing";
  if (message.startsWith("Module dependency version mismatches:")) return "module.dependency-version-mismatch";
  if (message === "Module dependency cycle detected.") return "module.dependency-cycle";
  if (message.includes("ambiguous") || message.includes("duplicated")) return "module.configuration-duplicate";
  return "module.configuration-invalid";
}

export function composeStaticModulePort({configuration, adapter_factories = {}, output_validators = {}} = {}) {
  if (!configurationValid(configuration) || !record(adapter_factories) || !record(output_validators)) {
    return result({ok: false, disposition: "unavailable", reasonCodes: ["module.static-configuration-invalid"]});
  }
  const bindings = [...configuration.modules].sort((left, right) => left.module_id.localeCompare(right.module_id));
  if (new Set(bindings.map((binding) => binding.module_id)).size !== bindings.length
    || new Set(bindings.map((binding) => binding.factory_id)).size !== bindings.length) {
    return result({ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
      reasonCodes: ["module.static-binding-duplicate"]});
  }
  const adapters = [];
  for (const binding of bindings) {
    const factory = adapter_factories[binding.factory_id];
    if (typeof factory !== "function") return result({
      ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
      reasonCodes: ["module.reviewed-factory-unavailable"],
      residue: [{kind: "module-binding", module_id: binding.module_id, factory_id: binding.factory_id, disposition: "unavailable"}],
    });
    let adapter;
    try { adapter = factory(); }
    catch { return result({ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
      reasonCodes: ["module.reviewed-factory-failed"], residue: [{kind: "module-binding", module_id: binding.module_id}]}); }
    if (!record(adapter) || !verifyModuleManifest(adapter.manifest) || typeof adapter.invoke !== "function") {
      return result({ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
        reasonCodes: ["module.reviewed-adapter-invalid"], residue: [{kind: "module-binding", module_id: binding.module_id}]});
    }
    const observed = adapter.manifest;
    if (observed.module_id !== binding.module_id || observed.version !== binding.version
      || observed.manifest_digest !== binding.manifest_digest) {
      return result({ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
        reasonCodes: ["module.static-binding-drift"], residue: [{
          kind: "module-binding", module_id: binding.module_id, expected_version: binding.version,
          observed_version: observed.version, expected_manifest_digest: binding.manifest_digest,
          observed_manifest_digest: observed.manifest_digest,
        }]});
    }
    adapters.push(adapter);
  }
  let port;
  try { port = createModulePort({adapters, output_validators}); }
  catch (error) {
    return result({ok: false, disposition: "unavailable", configurationId: configuration.configuration_id,
      reasonCodes: [dependencyReason(error)], residue: [{kind: "module-set", diagnostic_digest: digestModuleValue(String(error?.message ?? ""))}]});
  }
  const inspection = port.inspect();
  return result({ok: true, disposition: "available", configurationId: configuration.configuration_id, port, inspection});
}

export function sealStaticModuleConfiguration({configuration_id, modules = []} = {}) {
  const value = {
    schema_version: STATIC_MODULE_CONFIGURATION_SCHEMA,
    configuration_id,
    modules: [...modules].map((binding) => JSON.parse(canonicalModuleJson(binding)))
      .sort((left, right) => left.module_id.localeCompare(right.module_id)),
    authority_effect: "none",
  };
  if (!configurationValid(value)) throw new TypeError("Static module configuration is invalid.");
  return deepFreeze(value);
}
