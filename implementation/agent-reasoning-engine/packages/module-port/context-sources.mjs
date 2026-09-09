import {
  MODULE_INVOCATION_SCHEMA,
  canonicalModuleJson,
  createModulePort,
  sealModuleManifest,
} from "./index.mjs";

export const DEFINITION_CATALOG_CAPABILITY = "context.definition-catalog/v1";
export const ONTOLOGY_SNAPSHOT_CAPABILITY = "context.ontology-snapshot/v1";
export const CONTEXT_SOURCE_INPUT_PROTOCOL = "are.context-source-request/v1";
export const DEFINITION_CATALOG_OUTPUT_PROTOCOL = "are.definition-catalog/v1";
export const ONTOLOGY_SNAPSHOT_OUTPUT_PROTOCOL = "are.ontology-snapshot/v1";

const POSTURES = new Set(["required-for-operation", "optional-enrichment"]);

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" && value.length > 0;
}

export function validDefinitionCatalog(value) {
  return record(value)
    && value.schema_version === DEFINITION_CATALOG_OUTPUT_PROTOCOL
    && text(value.catalog_id)
    && text(value.source_identity)
    && text(value.source_digest)
    && Array.isArray(value.normative_relation_classes)
    && Array.isArray(value.definitions)
    && value.definitions.length > 0;
}

export function validOntologySnapshot(value) {
  return record(value)
    && value.schema_version === ONTOLOGY_SNAPSHOT_OUTPUT_PROTOCOL
    && text(value.ontology_id)
    && text(value.source_identity)
    && text(value.snapshot_digest)
    && Array.isArray(value.nodes)
    && Array.isArray(value.edges);
}

export const contextSourceOutputValidators = Object.freeze({
  [DEFINITION_CATALOG_OUTPUT_PROTOCOL]: validDefinitionCatalog,
  [ONTOLOGY_SNAPSHOT_OUTPUT_PROTOCOL]: validOntologySnapshot,
});

function freezeDeep(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeDeep(child);
  return value;
}

function snapshot(value) {
  return freezeDeep(JSON.parse(canonicalModuleJson(value)));
}

export function createStaticContextSourcesAdapter({definition_catalog, ontology_snapshot} = {}) {
  const catalog = definition_catalog === undefined ? undefined : snapshot(definition_catalog);
  const ontology = ontology_snapshot === undefined ? undefined : snapshot(ontology_snapshot);
  if (catalog !== undefined && !validDefinitionCatalog(catalog)) throw new TypeError("Definition catalog is invalid.");
  if (ontology !== undefined && !validOntologySnapshot(ontology)) throw new TypeError("Ontology snapshot is invalid.");
  const capabilities = [];
  if (catalog !== undefined) capabilities.push({
    capability_id: DEFINITION_CATALOG_CAPABILITY,
    input_protocol: CONTEXT_SOURCE_INPUT_PROTOCOL,
    output_protocol: DEFINITION_CATALOG_OUTPUT_PROTOCOL,
  });
  if (ontology !== undefined) capabilities.push({
    capability_id: ONTOLOGY_SNAPSHOT_CAPABILITY,
    input_protocol: CONTEXT_SOURCE_INPUT_PROTOCOL,
    output_protocol: ONTOLOGY_SNAPSHOT_OUTPUT_PROTOCOL,
  });
  if (capabilities.length === 0) throw new TypeError("At least one context source is required.");
  const manifest = sealModuleManifest({
    schema_version: "are.module-manifest/v1",
    module_id: "static-context-sources",
    version: "1-candidate",
    adapter_protocol: "are.module-adapter/v1",
    capabilities,
    required_permissions: [],
    side_effects: false,
    authority_effect: "none",
  });
  return Object.freeze({
    manifest,
    invoke(invocation) {
      if (invocation.input?.schema_version !== CONTEXT_SOURCE_INPUT_PROTOCOL) throw new TypeError("Context source invocation is invalid.");
      if (invocation.capability_id === DEFINITION_CATALOG_CAPABILITY && catalog !== undefined) return catalog;
      if (invocation.capability_id === ONTOLOGY_SNAPSHOT_CAPABILITY && ontology !== undefined) return ontology;
      throw new TypeError("Context source capability is unavailable.");
    },
  });
}

export function createStaticContextSourcesModulePort(sources) {
  return createModulePort({
    adapters: [createStaticContextSourcesAdapter(sources)],
    output_validators: contextSourceOutputValidators,
  });
}

function invoke(modulePort, consumerId, capabilityId, invocationId, dependencyPosture) {
  if (!POSTURES.has(dependencyPosture)) throw new TypeError("Context dependency posture is invalid.");
  if (!text(invocationId)) throw new TypeError("invocation_id must be a string.");
  return modulePort.invoke({
    schema_version: MODULE_INVOCATION_SCHEMA,
    invocation_id: invocationId,
    consumer_id: consumerId,
    capability_id: capabilityId,
    input: {schema_version: CONTEXT_SOURCE_INPUT_PROTOCOL},
    dependency_posture: dependencyPosture,
    authority_effect: "none",
  });
}

export function createContextSourcesFacade(modulePort, {consumer_id} = {}) {
  if (!modulePort || typeof modulePort.invoke !== "function") throw new TypeError("A Module Port is required.");
  if (!text(consumer_id)) throw new TypeError("consumer_id must be a string.");
  return Object.freeze({
    definitionCatalog({invocation_id, dependency_posture} = {}) {
      return invoke(modulePort, consumer_id, DEFINITION_CATALOG_CAPABILITY, invocation_id, dependency_posture);
    },
    ontologySnapshot({invocation_id, dependency_posture} = {}) {
      return invoke(modulePort, consumer_id, ONTOLOGY_SNAPSHOT_CAPABILITY, invocation_id, dependency_posture);
    },
  });
}
