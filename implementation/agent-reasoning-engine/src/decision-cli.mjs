import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {loadVerifiedDecisionProfile, loadVerifiedRepositoryPolicyBundle, routeRequest, evaluateContinuation} from "../packages/request-decision-router/index.mjs";
import {loadRepositoryProfile, loadVerifiedRepositoryRuntimeBundle, evaluateTurnPreflight, evaluateEffectRequest} from "../packages/codex-app-server-wrapper/index.mjs";
import {digestValue} from "../packages/codex-app-server-wrapper/src/canonical.mjs";
import {createNativeSemanticModulePort} from "../packages/module-port/native-semantic-adapter.mjs";

const productRoot = fileURLToPath(new URL("../", import.meta.url));
export const repositoryRoot = resolve(productRoot, "../../..");
export const decisionProfilePath = resolve(productRoot, "packages/request-decision-router/profiles/cyberalchemy-v1.json");
export const policyBundlePath = resolve(productRoot, "packages/request-decision-router/profiles/cyberalchemy-route-pack-v1.json");
const wrapperProfilePath = resolve(productRoot, "packages/codex-app-server-wrapper/profiles/repository-v1.json");
export const runtimeBundlePath = resolve(productRoot, "packages/codex-app-server-wrapper/profiles/repository-runtime-v1.json");
const schemaPath = resolve(productRoot, "schemas/cli-request.schema.json");
export const MAX_INPUT_BYTES = 1024 * 1024;
export const operations = ["route", "context", "effect", "continue"];

// Deliberately only the JSON Schema keywords used by the local closed contract.
function check(value, schema, root, path = "$") {
  if (schema.$ref) return check(value, root.$defs[schema.$ref.split("/").at(-1)], root, path);
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (schema.type && ![schema.type].flat().includes(type)) throw new Error(`cli.input-type:${path}`);
  if (schema.const !== undefined && value !== schema.const) throw new Error(`cli.input-const:${path}`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`cli.input-enum:${path}`);
  if (type === "string" && ((schema.minLength && !value.trim()) || value.length > (schema.maxLength ?? Infinity))) throw new Error(`cli.input-string:${path}`);
  if (type === "array") {
    if (value.length < (schema.minItems ?? 0) || value.length > (schema.maxItems ?? Infinity)) throw new Error(`cli.input-array:${path}`);
    if (schema.items) value.forEach((item, i) => check(item, schema.items, root, `${path}[${i}]`));
  }
  if (type === "object") {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) throw new Error(`cli.input-required:${path}.${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties && Object.hasOwn(schema.properties, key)) check(item, schema.properties[key], root, `${path}.${key}`);
      else if (schema.additionalProperties === false) throw new Error(`cli.input-unknown:${path}.${key}`);
    }
  }
}

export function failure(reason_codes) {
  return {schema_version: "are.cli-result/v1", ok: false, kind: "block", reason_codes, authority_effect: "none"};
}

export function decide(operation, input, paths = {}) {
  try {
    if (!operations.includes(operation)) throw new Error("cli.operation-unsupported");
    if (Buffer.byteLength(JSON.stringify(input)) > MAX_INPUT_BYTES) throw new Error("cli.input-too-large");
    const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
    check(input, schema, schema);
    for (const key of ["effect", "continuation"]) {
      const required = operation === (key === "effect" ? "effect" : "continue");
      if (required !== Object.hasOwn(input, key)) throw new Error(`cli.operation-payload:${key}`);
    }
    if (operation === "route" && input.previous_receipt) throw new Error("cli.route-predecessor-forbidden");
    const root = paths.repositoryRoot ?? repositoryRoot;
    const usePolicyBundle = paths.policyBundlePath !== undefined || (paths.repositoryRoot === undefined && paths.decisionProfilePath === undefined);
    const loaded = usePolicyBundle
      ? loadVerifiedRepositoryPolicyBundle(paths.policyBundlePath ?? policyBundlePath)
      : loadVerifiedDecisionProfile(paths.decisionProfilePath ?? decisionProfilePath, root);
    if (!loaded.ok) return failure(loaded.reason_codes);
    const profile = loaded.value;
    const policySourceMode = usePolicyBundle ? "compiled-bundle" : "development-live";
    const request = {schema_version: "are.request-context/v1", request_id: input.request_id, ...input.request};
    const modulePort = paths.modulePort ?? createNativeSemanticModulePort();
    const route = routeRequest(request, profile, modulePort);
    const binding = {schema_version: "are.cli-route-receipt/v1", session_id: input.session_id, request_id: input.request_id,
      request_digest: digestValue(input.request), decision_profile_digest: profile.profile_digest,
      route_decision_digest: route.decision_digest, authority_effect: "none"};
    const receipt = {...binding, receipt_digest: digestValue(binding)};
    if (operation !== "route" && digestValue(input.previous_receipt ?? null) !== digestValue(receipt)) throw new Error("cli.predecessor-binding-mismatch");
    let result = route;
    let kind = route.kind;
    if (operation !== "route" && route.kind === "direct") {
      if (operation === "context") {
        const useRuntimeBundle = paths.runtimeBundlePath !== undefined || (paths.repositoryRoot === undefined && paths.wrapperProfilePath === undefined);
        const sources = useRuntimeBundle
          ? loadVerifiedRepositoryRuntimeBundle(paths.runtimeBundlePath ?? runtimeBundlePath)
          : loadRepositoryProfile(paths.wrapperProfilePath ?? wrapperProfilePath, root);
        if (!sources.ok) return failure(sources.reason_codes);
        if (sources.decision_profile.profile_digest !== profile.profile_digest) throw new Error("cli.context-profile-mismatch");
        const context = evaluateTurnPreflight({
          message: {id: input.request_id, method: "turn/start", params: {
            threadId: input.session_id,
            input: [{type: "text", text: input.request.raw_request}],
            additionalContext: {"cyberalchemy.request-context": {kind: "application", value: JSON.stringify({
              schema_version: "are.request-context-hint/v1",
              raw_request: input.request.raw_request,
              objective_kind: input.request.objective_kind ?? null,
              field_postures: input.request.field_postures ?? {},
            })}},
          }},
          turn_binding: {...request, lane: "interaction-bound", consumer_ref: `are-cli:${input.session_id}`, purpose: "repository-request",
            source_epoch: digestValue(sources.source_snapshot), turn_id: input.request_id, interaction_id: input.request_id},
          decision_profile: profile, definition_catalog: sources.definition_catalog, ontology_snapshot: sources.ontology_snapshot,
          context: sources.value.context, instructions: sources.instructions, supplemental_context_items: sources.supplemental_context_items,
          current_sources: sources.source_snapshot, projection_policy: sources.value.context_projection,
        }, {module_port: modulePort});
        kind = context.directive?.directive_kind ?? "block";
        if (kind === "direct" && context.directive.selected_route_or_candidates[0] !== route.selected.route_id) throw new Error("cli.context-route-mismatch");
        result = {directive: context.directive ?? context, context_envelope: context.context_envelope ?? null,
          source_snapshot: sources.source_snapshot, source_mode: sources.source_mode ?? "development-live",
          source_epoch_digest: sources.source_epoch_digest ?? digestValue(sources.source_snapshot), caller_field_postures: input.request.field_postures ?? null};
      } else if (operation === "effect") {
        result = evaluateEffectRequest({decision_profile: profile,
          message: {method: input.effect.method, id: input.effect.item_id, params: {threadId: input.session_id, turnId: input.request_id, itemId: input.effect.item_id, proposal: input.effect.proposal}},
          effect_metadata: {...input.effect.metadata, route_id: route.selected.route_id}});
        kind = result.value?.directive_kind ?? "block";
      } else {
        const ids = input.continuation.options.map(option => option.option_id);
        if (new Set(ids).size !== ids.length) throw new Error("cli.continuation-duplicate-option");
        result = evaluateContinuation(input.continuation, profile);
        kind = result.kind;
      }
    }
    let routeContracts = loaded.route_contracts;
    if (!routeContracts) {
      const registrySource = profile.provenance.find(source => source.id === "route-registry");
      const registryBytes = readFileSync(resolve(root, registrySource.path));
      if (createHash("sha256").update(registryBytes).digest("hex") !== registrySource.sha256) throw new Error("cli.registry-changed-during-decision");
      routeContracts = JSON.parse(registryBytes.toString("utf8")).routes;
    }
    const material = {schema_version: "are.cli-result/v1", ok: true, operation, kind,
      session_id: input.session_id, request_id: input.request_id, input_digest: digestValue(input),
      receipt, result, route_contract: routeContracts.find(item => item.route_id === route.selected?.route_id) ?? null,
      policy_bundle_digest: loaded.bundle_digest ?? null,
      policy_source: {mode: policySourceMode, source_epoch_digest: loaded.bundle_digest ?? profile.profile_digest},
      authority_effect: "none"};
    return {...material, result_digest: digestValue(material)};
  } catch (error) {
    return failure([error.message?.startsWith("cli.") ? error.message : `cli.unavailable:${error.code ?? error.name}`]);
  }
}
