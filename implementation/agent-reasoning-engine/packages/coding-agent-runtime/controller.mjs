import {createHash} from "node:crypto";

import {runCodingAgentSlice, snapshotTree} from "./index.mjs";
import {buildCandidatePrompt, captureObservationContext} from "./prompt.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function blocked(runId, reasonCodes, fields = {}) {
  const material = {schema_version: "are.coding-agent-runtime-result/v1", status: "BLOCK", run_id: runId, reason_codes: [...new Set(reasonCodes)].sort(), effect_applied: false, ...fields, authority_effect: "none"};
  return Object.freeze({...material, result_digest: sha256(stable(material))});
}

export async function runModelDrivenCodingTurn(input) {
  const runId = typeof input?.run_id === "string" && input.run_id ? input.run_id : `coding-agent-model-${Date.now()}`;
  if (!input?.model_transport || typeof input.model_transport.generate !== "function") return blocked(runId, ["model.transport-required"]);
  let before;
  let context;
  let prompt;
  try {
    before = snapshotTree(input.fixture_root);
    context = captureObservationContext({
      fixture_root: before.root,
      observation_allowlist: input.observation_allowlist,
      expected_snapshot: before,
      max_context_bytes: input.max_context_bytes
    });
    const observationPaths = new Set(context.observations.map((item) => item.path));
    if ([...new Set(input.mutation_allowlist ?? [])].some((path) => !observationPaths.has(path))) {
      return blocked(runId, ["model.mutation-path-not-observed"], {base_tree_sha256: before.tree_sha256});
    }
    const afterCapture = snapshotTree(before.root);
    if (afterCapture.tree_sha256 !== before.tree_sha256) return blocked(runId, ["model.context-capture-drift"], {base_tree_sha256: before.tree_sha256});
    prompt = buildCandidatePrompt({
      request: input.request,
      base_tree_sha256: before.tree_sha256,
      mutation_allowlist: input.mutation_allowlist,
      observations: context.observations,
      capability_context: input.capability_context ?? null
    });
  } catch (error) {
    return blocked(runId, [`model.context-invalid:${error.message}`]);
  }

  let generated;
  try {
    generated = await input.model_transport.generate(Object.freeze({
      run_id: runId,
      request: input.request,
      prompt,
      prompt_sha256: sha256(prompt),
      base_tree_sha256: before.tree_sha256
    }));
  } catch (error) {
    return blocked(runId, ["model.transport-failed"], {model_error: error.message, prompt_sha256: sha256(prompt), base_tree_sha256: before.tree_sha256});
  }
  if (typeof generated?.final_bytes !== "string" || generated.final_bytes.length === 0) {
    return blocked(runId, ["model.final-bytes-required"], {prompt_sha256: sha256(prompt), base_tree_sha256: before.tree_sha256});
  }
  const modelTurn = Object.freeze({
    schema_version: "are.model-turn-binding/v1",
    transport_kind: input.model_transport.kind ?? "unknown",
    transport_id: input.model_transport.transport_id ?? null,
    prompt_sha256: sha256(prompt),
    final_bytes_sha256: sha256(generated.final_bytes),
    observation_paths: context.observations.map((item) => item.path),
    observation_bytes: context.total_bytes,
    capability_context_digest: input.capability_context?.context_digest ?? null,
    capability_source_set_digest: input.capability_context?.source_set_digest ?? null,
    transport_receipt_sha256: sha256(stable(generated.receipt ?? null)),
    authority_effect: "none"
  });
  return runCodingAgentSlice({...input, run_id: runId, raw_candidate: generated.final_bytes, model_turn: modelTurn});
}
