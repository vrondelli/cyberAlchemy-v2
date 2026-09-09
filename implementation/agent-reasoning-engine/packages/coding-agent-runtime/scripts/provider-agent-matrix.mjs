#!/usr/bin/env node
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {runIterativeCodingAgent} from "../iterative-agent.mjs";
import {createAnthropicNativeModelTransport, createGoogleNativeModelTransport, createOpenAINativeModelTransport} from "../native-provider-transports.mjs";
import {createOpenAICompatibleModelTransport} from "../openai-compatible-transport.mjs";
import {createReadOnlyToolRuntime} from "../read-only-tools.mjs";
import {snapshotTree} from "../verifier.mjs";

function candidate(root) {
  const base = snapshotTree(root);
  return {schema_version: "are.coding-agent-event/v1", event_id: "provider:final", kind: "final-candidate", candidate: {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "a.mjs", expected_base_tree_sha256: base.tree_sha256, expected_file_sha256: base.files["a.mjs"], utf8: "export const value = 2;\n", rationale: "provider matrix fixture", authority_effect: "none"}, authority_effect: "none"};
}

function transports(finalBytes) {
  return [
    createOpenAICompatibleModelTransport({base_url: "http://127.0.0.1:11434/v1", model: "local-fixture", fetch_impl: async () => ({ok: true, status: 200, async json() { return {choices: [{message: {content: finalBytes}}]}; }})}),
    createOpenAINativeModelTransport({model: "openai-fixture", client: {responses: {create: async () => ({id: "openai-fixture", output_text: finalBytes, usage: {input_tokens: 1, output_tokens: 1}})}}}),
    createAnthropicNativeModelTransport({model: "anthropic-fixture", client: {messages: {create: async () => ({id: "anthropic-fixture", content: [{type: "text", text: finalBytes}], usage: {input_tokens: 1, output_tokens: 1}})}}}),
    createGoogleNativeModelTransport({model: "google-fixture", client: {models: {generateContent: async () => ({responseId: "google-fixture", text: finalBytes, usageMetadata: {promptTokenCount: 1, candidatesTokenCount: 1}})}}}),
  ];
}

export async function runProviderAgentMatrix() {
  const checks = [];
  for (const providerIndex of [0, 1, 2, 3]) {
    const root = mkdtempSync(resolve(tmpdir(), "are-provider-agent-matrix-"));
    try {
      writeFileSync(resolve(root, "a.mjs"), "export const value = 1;\n");
      const event = candidate(root);
      const transport = transports(JSON.stringify(event))[providerIndex];
      const result = await runIterativeCodingAgent({run_id: `provider-agent-matrix:${transport.transport_id}`, request: "Change the fixture value", fixture_root: root, model_transport: transport, tool_runtime: createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["a.mjs"]}), tool_policy: {allow: [], ask: [], deny: []}, mutation_allowlist: ["a.mjs"], verification_command: ["node", "--test"], maximum_steps: 1, approve: false});
      const unchanged = readFileSync(resolve(root, "a.mjs"), "utf8") === "export const value = 1;\n";
      const pass = result.status === "AWAITING_APPROVAL" && unchanged && result.candidate_result?.schema_version === "are.patch-set-runtime-result/v1";
      checks.push({transport_id: transport.transport_id, status: pass ? "PASS" : "BLOCK", reason_codes: pass ? [] : ["provider.agent-loop-invalid"], proposal_status: result.status, repository_unchanged: unchanged, authority_effect: "none"});
    } finally { rmSync(root, {recursive: true, force: true}); }
  }
  const status = checks.every((entry) => entry.status === "PASS") ? "PASS_BOUNDED" : "BLOCK";
  return {schema_version: "are.provider-agent-integration-matrix/v1", status, reason_codes: [...new Set(checks.flatMap((entry) => entry.reason_codes))].sort(), checks, live_provider_calls: 0, repository_effects: 0, authority_effect: "none"};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runProviderAgentMatrix();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "PASS_BOUNDED" ? 0 : 1;
}
