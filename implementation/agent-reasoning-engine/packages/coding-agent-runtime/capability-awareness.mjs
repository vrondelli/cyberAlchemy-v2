import {createHash} from "node:crypto";
import {lstatSync, readFileSync, realpathSync} from "node:fs";
import {isAbsolute, resolve, sep} from "node:path";

import {compileRequestIntent} from "../request-intent-runtime/index.mjs";
import {resolveIntentRoute, sealCapabilityCatalog} from "../intent-route-resolver/index.mjs";

export const CAPABILITY_DESCRIPTOR_SCHEMA_VERSION = "are.capability-descriptor/v1";
export const CAPABILITY_CONTEXT_SCHEMA_VERSION = "are.capability-context-envelope/v1";

const CONFIG_KEYS = new Set(["catalog_id", "catalog_version", "owner_ref", "revision", "max_context_bytes", "capabilities"]);
const ENTRY_KEYS = new Set(["source_path", "route_id", "label", "mode", "owner_ref", "intent_kind", "request_terms", "required_inputs", "dominates", "forbidden_effects"]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function object(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${field} must be an object.`);
  return value;
}

function exactKeys(value, allowed, field) {
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${field} contains an unsupported field.`);
  return value;
}

function text(value, field) {
  if (typeof value !== "string" || value.trim().length === 0 || value.includes("\0")) throw new TypeError(`${field} is required.`);
  return value.trim();
}

function strings(value, field, {allowEmpty = false, fallback = undefined} = {}) {
  if (value === undefined && fallback !== undefined) return [...fallback];
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== "string" || item.trim().length === 0 || item.includes("\0"))) {
    throw new TypeError(`${field} must be ${allowEmpty ? "an" : "a non-empty"} array of strings.`);
  }
  return [...new Set(value.map((item) => item.trim()))].sort();
}

function positiveInteger(value, field, fallback) {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${field} must be a positive safe integer.`);
  return value;
}

export function parseCapabilityAwarenessConfig(input) {
  const config = exactKeys(object(input, "capability_awareness"), CONFIG_KEYS, "capability_awareness");
  if (!Array.isArray(config.capabilities) || config.capabilities.length === 0) throw new TypeError("capability_awareness.capabilities must be a non-empty array.");
  const capabilities = config.capabilities.map((raw, index) => {
    const field = `capability_awareness.capabilities[${index}]`;
    const entry = exactKeys(object(raw, field), ENTRY_KEYS, field);
    const intentKind = entry.intent_kind === undefined ? null : text(entry.intent_kind, `${field}.intent_kind`);
    const requestTerms = strings(entry.request_terms, `${field}.request_terms`, {allowEmpty: !intentKind, fallback: []});
    if (intentKind && requestTerms.length === 0) throw new TypeError(`${field}.request_terms is required when intent_kind is set.`);
    if (!intentKind && requestTerms.length > 0) throw new TypeError(`${field}.intent_kind is required when request_terms are set.`);
    return {
      source_path: text(entry.source_path, `${field}.source_path`),
      route_id: text(entry.route_id, `${field}.route_id`),
      label: text(entry.label, `${field}.label`),
      mode: text(entry.mode ?? "propose", `${field}.mode`),
      owner_ref: text(entry.owner_ref, `${field}.owner_ref`),
      intent_kind: intentKind,
      request_terms: requestTerms,
      required_inputs: strings(entry.required_inputs, `${field}.required_inputs`, {allowEmpty: true, fallback: ["intent-contract"]}),
      dominates: strings(entry.dominates, `${field}.dominates`, {allowEmpty: true, fallback: []}),
      forbidden_effects: strings(entry.forbidden_effects, `${field}.forbidden_effects`, {allowEmpty: true, fallback: ["implicit-effect-authority"]})
    };
  });
  for (const [field, values] of [["source_path", capabilities.map((item) => item.source_path)], ["route_id", capabilities.map((item) => item.route_id)]]) {
    if (new Set(values).size !== values.length) throw new TypeError(`capability_awareness contains a duplicate ${field}.`);
  }
  return freeze({
    catalog_id: text(config.catalog_id, "capability_awareness.catalog_id"),
    catalog_version: text(config.catalog_version, "capability_awareness.catalog_version"),
    owner_ref: text(config.owner_ref, "capability_awareness.owner_ref"),
    revision: text(config.revision, "capability_awareness.revision"),
    max_context_bytes: positiveInteger(config.max_context_bytes, "capability_awareness.max_context_bytes", 32 * 1024),
    capabilities
  });
}

function resolveSource(root, relativePath) {
  if (isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes("..")) throw new Error(`capability.source-path-invalid:${relativePath}`);
  const exactRoot = realpathSync(root);
  const absolute = resolve(exactRoot, relativePath);
  if (absolute !== exactRoot && !absolute.startsWith(`${exactRoot}${sep}`)) throw new Error(`capability.source-path-escape:${relativePath}`);
  let current = exactRoot;
  for (const segment of relativePath.split(/[\\/]/u)) {
    current = resolve(current, segment);
    if (lstatSync(current).isSymbolicLink()) throw new Error(`capability.source-symlink-forbidden:${relativePath}`);
  }
  if (!lstatSync(absolute).isFile()) throw new Error(`capability.source-regular-file-required:${relativePath}`);
  return absolute;
}

function descriptor(record, sourcePath, sourceBytes) {
  object(record, `capability source ${sourcePath}`);
  if (record.schema_version !== "cav2-product-capability/v1") throw new Error(`capability.schema-version-invalid:${sourcePath}`);
  if (record.authority_effect !== "none") throw new Error(`capability.authority-effect-invalid:${sourcePath}`);
  const material = {
    schema_version: CAPABILITY_DESCRIPTOR_SCHEMA_VERSION,
    capability_id: text(record.capability_id, "capability.capability_id"),
    definition_ref: text(record.definition_ref, "capability.definition_ref"),
    product_ref: text(record.product_ref, "capability.product_ref"),
    project_ref: text(record.project_ref, "capability.project_ref"),
    business_ontology_ref: text(record.business_ontology_ref, "capability.business_ontology_ref"),
    outcome: text(record.outcome, "capability.outcome"),
    scope: text(record.scope, "capability.scope"),
    exclusions: strings(record.exclusions, "capability.exclusions", {allowEmpty: true}),
    input_contract_refs: strings(record.input_contract_refs, "capability.input_contract_refs", {allowEmpty: true}),
    output_contract_refs: strings(record.output_contract_refs, "capability.output_contract_refs", {allowEmpty: true}),
    owner_routes: Array.isArray(record.owner_routes) ? record.owner_routes.map((route, index) => ({
      responsibility: text(route?.responsibility, `capability.owner_routes[${index}].responsibility`),
      owner: text(route?.owner, `capability.owner_routes[${index}].owner`)
    })).sort((left, right) => stable(left).localeCompare(stable(right))) : (() => { throw new TypeError("capability.owner_routes must be an array."); })(),
    lifecycle_status: text(record.status, "capability.status"),
    source_ref: sourcePath,
    source_sha256: sha256(sourceBytes),
    claim_limit: text(record.claim_limit, "capability.claim_limit"),
    authority_effect: "none"
  };
  return freeze({...material, descriptor_digest: sha256(stable(material))});
}

export function loadCapabilityProjection({repository_root, config}) {
  const parsed = parseCapabilityAwarenessConfig(config);
  const descriptors = [];
  const entries = [];
  for (const entry of parsed.capabilities) {
    const absolute = resolveSource(repository_root, entry.source_path);
    const bytes = readFileSync(absolute);
    let record;
    try { record = JSON.parse(bytes.toString("utf8")); }
    catch { throw new Error(`capability.source-json-invalid:${entry.source_path}`); }
    descriptors.push(descriptor(record, entry.source_path, bytes));
    entries.push(entry);
  }
  descriptors.sort((left, right) => left.capability_id.localeCompare(right.capability_id));
  if (new Set(descriptors.map((item) => item.capability_id)).size !== descriptors.length) throw new Error("capability.duplicate-id");
  const material = {
    schema_version: "are.capability-source-set/v1",
    catalog_id: parsed.catalog_id,
    sources: descriptors.map((item) => ({capability_id: item.capability_id, source_ref: item.source_ref, source_sha256: item.source_sha256, descriptor_digest: item.descriptor_digest})),
    authority_effect: "none"
  };
  return freeze({config: parsed, descriptors, entries, source_set_digest: sha256(stable(material)), authority_effect: "none"});
}

function intentField(request, entries, evidenceRef) {
  const lower = request.toLocaleLowerCase();
  const kinds = [...new Set(entries.filter((entry) => entry.intent_kind && entry.request_terms.some((term) => lower.includes(term.toLocaleLowerCase()))).map((entry) => entry.intent_kind))].sort();
  if (kinds.length !== 1) return {posture: "unresolved", value: null, evidence_refs: [], inference_note: null};
  return {posture: "inferred", value: kinds[0], evidence_refs: [evidenceRef], inference_note: "Deterministic configured request-term match."};
}

function routeFor(entry, capability) {
  return {
    route_id: entry.route_id,
    label: entry.label,
    capability_ref: capability.capability_id,
    mode: entry.mode,
    required: entry.intent_kind ? [{key: "work_kind", operator: "equals", value: entry.intent_kind}] : [],
    exclusions: [],
    required_inputs: entry.required_inputs,
    dominates: entry.dominates,
    owner_ref: entry.owner_ref,
    contract_refs: [...new Set([...capability.input_contract_refs, ...capability.output_contract_refs])].sort(),
    forbidden_effects: [...new Set([...entry.forbidden_effects, ...capability.exclusions])].sort()
  };
}

function blocked(reasonCodes, fields = {}) {
  return freeze({schema_version: CAPABILITY_CONTEXT_SCHEMA_VERSION, status: "BLOCK", reason_codes: [...new Set(reasonCodes)].sort(), ...fields, authority_effect: "none"});
}

export async function prepareCapabilityAwareness({repository_root, request, run_id, config}) {
  let projection;
  try { projection = loadCapabilityProjection({repository_root, config}); }
  catch (error) { return blocked([error.message.startsWith("capability.") ? error.message : `capability.projection-invalid:${error.message}`]); }
  const intentResult = await compileRequestIntent({request, request_ref: `request:${run_id}`, source_refs: projection.descriptors.map((item) => item.source_ref)});
  if (!intentResult.ok) return blocked(intentResult.reason_codes.map((code) => `capability.${code}`), {source_set_digest: projection.source_set_digest});
  const intent = intentResult.value.contract;
  const bySource = new Map(projection.descriptors.map((item) => [item.source_ref, item]));
  const catalog = sealCapabilityCatalog({
    schema_version: "intent-route.catalog@1",
    catalog_id: projection.config.catalog_id,
    catalog_version: projection.config.catalog_version,
    owner_ref: projection.config.owner_ref,
    effective_state: {status: "effective", revision: projection.config.revision},
    clarification_prompts: {work_kind: "Which configured capability kind should handle this request?"},
    routes: projection.entries.map((entry) => routeFor(entry, bySource.get(entry.source_path)))
  });
  const disposition = resolveIntentRoute({
    schema_version: "intent-route.request@1",
    request_id: run_id,
    intent: {
      schema_version: "routable-intent@1",
      source_schema: intent.schema_version,
      source_digest: intent.intent_contract_digest,
      raw_intent: request,
      discriminators: {work_kind: intentField(request, projection.entries, intent.intent_contract_digest)},
      constraints: [...intent.surface_requirements, ...intent.surface_prohibitions]
    },
    catalog_snapshot: catalog
  });
  if (disposition.kind !== "candidate" || disposition.candidates.length !== 1) {
    return blocked([`capability.disposition-${disposition.kind}`], {source_set_digest: projection.source_set_digest, intent_contract_digest: intent.intent_contract_digest, disposition});
  }
  const selected = projection.descriptors.find((item) => item.capability_id === disposition.candidates[0].capability_ref);
  if (!selected) return blocked(["capability.selected-descriptor-missing"], {source_set_digest: projection.source_set_digest, disposition});
  const material = {
    schema_version: CAPABILITY_CONTEXT_SCHEMA_VERSION,
    status: "PASS",
    request_ref: intent.request_ref,
    intent: {objective: intent.objective, target: intent.target, disposition: intent.disposition, intent_contract_digest: intent.intent_contract_digest},
    catalog: {catalog_id: catalog.catalog_id, catalog_digest: catalog.content_digest},
    selection: {route_id: disposition.candidates[0].route_id, capability_ref: selected.capability_id, disposition_digest: disposition.receipt_digest},
    selected_capabilities: [selected],
    source_set_digest: projection.source_set_digest,
    claim_limit: "Capability awareness and eligibility evidence only; no capability adoption, availability, invocation, approval, or effect authority.",
    authority_effect: "none"
  };
  const contextBytes = Buffer.byteLength(stable(material), "utf8");
  if (contextBytes > projection.config.max_context_bytes) return blocked(["capability.context-budget-exceeded"], {source_set_digest: projection.source_set_digest, context_bytes: contextBytes, max_context_bytes: projection.config.max_context_bytes});
  return freeze({...material, context_bytes: contextBytes, context_digest: sha256(stable(material))});
}

export function verifyCapabilityContext(context) {
  if (!context || typeof context !== "object" || Array.isArray(context) || context.schema_version !== CAPABILITY_CONTEXT_SCHEMA_VERSION || context.status !== "PASS") return false;
  if (typeof context.context_digest !== "string" || !/^[a-f0-9]{64}$/u.test(context.context_digest) || !Number.isSafeInteger(context.context_bytes) || context.context_bytes < 1) return false;
  const {context_digest: claimedDigest, context_bytes: claimedBytes, ...material} = context;
  return sha256(stable(material)) === claimedDigest && Buffer.byteLength(stable(material), "utf8") === claimedBytes;
}
