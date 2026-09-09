import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {applyConfiguredCodingAgentProposal, proposeConfiguredCodingAgent} from "../configured-runner.mjs";
import {snapshotTree} from "../index.mjs";

const runner = fileURLToPath(new URL("../bin/run.mjs", import.meta.url));

test("configured runner binds approval to one immutable proposal digest", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-configured-run-test-"));
  try {
    const files = {
      "package.json": "{\"type\":\"module\"}\n",
      "src/range.mjs": "export function sumInclusive(a,b){let n=0;for(let x=a;x<b;x++)n+=x;return n}\n",
      "test/range.test.mjs": "import test from 'node:test';import assert from 'node:assert/strict';import {sumInclusive} from '../src/range.mjs';test('inclusive',()=>assert.equal(sumInclusive(2,4),9));\n"
    };
    for (const [path, utf8] of Object.entries(files)) {
      const target = resolve(root, path);
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, utf8);
    }
    const before = snapshotTree(root);
    const candidate = {
      schema_version: "are.next-action-candidate/v1",
      operation: "replace-file",
      path: "src/range.mjs",
      expected_base_tree_sha256: before.tree_sha256,
      expected_file_sha256: before.files["src/range.mjs"],
      utf8: "export function sumInclusive(a,b){let n=0;for(let x=a;x<=b;x++)n+=x;return n}\n",
      rationale: "Include both endpoints.",
      authority_effect: "none"
    };
    const config = {
      schema_version: "are.coding-agent-run-config/v1",
      model: {transport: "openai-compatible", base_url: "https://models.invalid/v1", model: "synthetic-model"},
      observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"],
      mutation_allowlist: ["src/range.mjs"],
      verification_command: [process.execPath, "--test"]
    };
    const fetchImpl = async () => ({ok: true, status: 200, async json() { return {choices: [{message: {content: JSON.stringify(candidate)}}]}; }});
    const proposal = await proposeConfiguredCodingAgent({
      config,
      repository_root: root,
      request: "Fix the inclusive range.",
      run_id: "configured-runner-withheld-test",
      fetch_impl: fetchImpl
    });
    assert.equal(proposal.status, "AWAITING_APPROVAL");
    assert.equal(proposal.candidate_sha256, proposal.approval_digest);
    assert.equal(readFileSync(resolve(root, "src/range.mjs"), "utf8"), files["src/range.mjs"]);

    assert.throws(() => applyConfiguredCodingAgentProposal({
      config,
      repository_root: root,
      proposal,
      approval_digest: "0".repeat(64)
    }), /approval does not match/u);
    assert.equal(readFileSync(resolve(root, "src/range.mjs"), "utf8"), files["src/range.mjs"]);

    const receipt = applyConfiguredCodingAgentProposal({config, repository_root: root, proposal, approval_digest: proposal.approval_digest});
    assert.equal(receipt.status, "PATCH_CANDIDATE");
    assert.equal(receipt.verification.status, "PASS_BOUNDED");
    assert.equal(readFileSync(resolve(root, "src/range.mjs"), "utf8"), candidate.utf8);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test("agent CLI loads without model or network access", () => {
  const completed = spawnSync(process.execPath, [runner, "--help"], {encoding: "utf8"});
  assert.equal(completed.status, 0, completed.stderr);
  assert.match(completed.stdout, /--config <file>/u);
  assert.equal(completed.stderr, "");
});

test("configured proposal binds selected capability context and blocks source drift on apply", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "are-configured-capability-test-"));
  try {
    const files = {
      "package.json": "{\"type\":\"module\"}\n",
      "src/value.mjs": "export const value = 1;\n",
      "test/value.test.mjs": "import test from 'node:test';import assert from 'node:assert/strict';import {value} from '../src/value.mjs';test('value',()=>assert.equal(value,2));\n"
    };
    for (const [path, utf8] of Object.entries(files)) {
      const target = resolve(root, path);
      mkdirSync(dirname(target), {recursive: true});
      writeFileSync(target, utf8);
    }
    const capabilityPath = "capabilities/coding.json";
    const capability = {
      schema_version: "cav2-product-capability/v1", capability_id: "CAP-CODING", definition_ref: "CAV2-D67",
      product_ref: "CA2-PRODUCT-CYBERALCHEMY", project_ref: "CA2-PROJECT-AGENT-REASONING-ENGINE", business_ontology_ref: "ONTOLOGY-CODING",
      outcome: "Produce one verified patch candidate.", scope: "One fixture.", exclusions: ["implicit authority"],
      input_contract_refs: ["INPUT"], output_contract_refs: ["OUTPUT"], owner_routes: [{responsibility: "implementation", owner: "runtime owner"}],
      status: "candidate-not-adopted", authority_effect: "none", claim_limit: "No adoption or effect authority."
    };
    const capabilityTarget = resolve(root, capabilityPath);
    mkdirSync(dirname(capabilityTarget), {recursive: true});
    writeFileSync(capabilityTarget, `${JSON.stringify(capability)}\n`);
    const before = snapshotTree(root);
    const candidate = {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "src/value.mjs", expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["src/value.mjs"], utf8: "export const value = 2;\n", rationale: "repair", authority_effect: "none"};
    const config = {
      schema_version: "are.coding-agent-run-config/v1",
      model: {transport: "openai-compatible", base_url: "https://models.invalid/v1", model: "synthetic-model"},
      observation_allowlist: ["package.json", "src/value.mjs", "test/value.test.mjs"], mutation_allowlist: ["src/value.mjs"], verification_command: [process.execPath, "--test"],
      capability_awareness: {catalog_id: "coding", catalog_version: "1", owner_ref: "runtime owner", revision: "r1", capabilities: [{source_path: capabilityPath, route_id: "coding", label: "Coding", mode: "propose", owner_ref: "runtime owner", intent_kind: "coding", request_terms: ["repair"], required_inputs: ["intent-contract"], dominates: [], forbidden_effects: ["implicit-authority"]}]}
    };
    let prompt = "";
    const proposal = await proposeConfiguredCodingAgent({config, repository_root: root, request: "Repair the value.", run_id: "capability-proposal", fetch_impl: async (_url, options) => {
      prompt = JSON.parse(options.body).messages[0].content;
      return {ok: true, status: 200, async json() { return {choices: [{message: {content: JSON.stringify(candidate)}}]}; }};
    }});
    assert.equal(proposal.status, "AWAITING_APPROVAL", JSON.stringify(proposal));
    assert.equal(proposal.capability_context.selection.capability_ref, "CAP-CODING");
    assert.match(prompt, /CAP-CODING/u);
    assert.match(prompt, /candidate-not-adopted/u);
    assert.match(proposal.capability_source_set_digest, /^[a-f0-9]{64}$/u);

    const tampered = structuredClone(proposal);
    tampered.capability_context.selected_capabilities[0].lifecycle_status = "adopted";
    assert.throws(() => applyConfiguredCodingAgentProposal({config, repository_root: root, proposal: tampered, approval_digest: proposal.approval_digest}), /capability context is invalid/u);

    writeFileSync(capabilityTarget, `${JSON.stringify({...capability, outcome: "Changed meaning."})}\n`);
    assert.throws(() => applyConfiguredCodingAgentProposal({config, repository_root: root, proposal, approval_digest: proposal.approval_digest}), /capability sources changed/u);
    assert.equal(readFileSync(resolve(root, "src/value.mjs"), "utf8"), files["src/value.mjs"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
