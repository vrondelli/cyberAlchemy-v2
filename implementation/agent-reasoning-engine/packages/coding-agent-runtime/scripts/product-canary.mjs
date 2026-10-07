#!/usr/bin/env node
import {createHash} from "node:crypto";
import {chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {runIterativeCodingAgent} from "../iterative-agent.mjs";
import {parsePatchSetCandidate, runTransactionalPatchSet} from "../patch-set-runtime.mjs";
import {createReadOnlyToolRuntime} from "../read-only-tools.mjs";
import {createContainerSandbox} from "../sandbox.mjs";
import {snapshotTree} from "../verifier.mjs";

const DEFAULT_ENGINE = "/usr/bin/docker";
const DEFAULT_IMAGE = `node@sha256:367679cf9792759492a486e4aa4b421764d71a9546a6dae8aab81a99eb797b3e`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function options(argv) {
  const result = {engine: process.env.ARE_PRODUCT_CANARY_ENGINE ?? DEFAULT_ENGINE, image: process.env.ARE_PRODUCT_CANARY_IMAGE ?? DEFAULT_IMAGE, keep: false};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--keep") result.keep = true;
    else if (["--engine", "--image"].includes(argv[index]) && argv[index + 1]) result[argv[index].slice(2)] = argv[++index];
    else throw new TypeError(`Unsupported or incomplete argument: ${argv[index]}`);
  }
  return result;
}

function event(event_id, kind, body) {
  return {schema_version: "are.coding-agent-event/v1", event_id, kind, ...body, authority_effect: "none"};
}

function blocked(error, fixtureRoot = null) {
  return {
    schema_version: "are.coding-agent-product-canary/v1",
    status: "BLOCK",
    reason_codes: [error?.reason_code ?? "product-canary.failed"],
    error: String(error?.message ?? error),
    fixture_root: fixtureRoot,
    fixture_retained: Boolean(fixtureRoot),
    authority_effect: "none",
  };
}

export async function runProductCanary({engine = process.env.ARE_PRODUCT_CANARY_ENGINE ?? DEFAULT_ENGINE, image = process.env.ARE_PRODUCT_CANARY_IMAGE ?? DEFAULT_IMAGE, keep = false} = {}) {
  const root = mkdtempSync(resolve(tmpdir(), "are-coding-agent-product-canary-"));
  let retain = keep;
  try {
    chmodSync(root, 0o755);
    mkdirSync(resolve(root, "src"));
    mkdirSync(resolve(root, "test"));
    writeFileSync(resolve(root, "package.json"), `${JSON.stringify({name: "are-product-canary-fixture", private: true, type: "module", scripts: {test: "node --test"}}, null, 2)}\n`);
    writeFileSync(resolve(root, "src/range.mjs"), "export function sum(start, end) {\n  return start + end - 1;\n}\n");
    writeFileSync(resolve(root, "test/range.test.mjs"), "import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport {sum} from '../src/range.mjs';\ntest('sum', () => assert.equal(sum(2, 3), 5));\n");
    const base = snapshotTree(root);
    const original = readFileSync(resolve(root, "src/range.mjs"));
    const fixed = "export function sum(start, end) {\n  return start + end;\n}\n";
    const finalCandidate = {
      schema_version: "are.next-action-candidate/v1",
      operation: "replace-file",
      path: "src/range.mjs",
      expected_base_tree_sha256: base.tree_sha256,
      expected_file_sha256: sha256(original),
      utf8: fixed,
      rationale: "Correct the tested arithmetic defect.",
      authority_effect: "none",
    };
    const responses = [
      event("canary:read", "tool-request", {tool: {name: "read-file", arguments: {path: "src/range.mjs"}}}),
      event("canary:test-before", "tool-request", {tool: {name: "run-command", arguments: {command: ["node", "--test"]}}}),
      event("canary:proposal", "final-candidate", {candidate: finalCandidate}),
    ];
    const prompts = [];
    let responseIndex = 0;
    const model = {async generate({prompt}) {
      prompts.push(prompt);
      const response = responses[responseIndex++];
      if (!response) throw new Error("SCRIPTED_MODEL_EXHAUSTED");
      return {final_bytes: JSON.stringify(response), receipt: {schema_version: "are.model-turn-transport-receipt/v1", transport_kind: "deterministic-product-canary", authority_effect: "none"}};
    }};
    const sandbox = createContainerSandbox({
      repository_root: root,
      config: {type: "container", engine, image, allowed_commands: ["node"], timeout_ms: 30_000, maximum_output_bytes: 131_072, memory: "512m", cpus: "1", pids_limit: 128},
    });
    const tools = createReadOnlyToolRuntime({repository_root: root, observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"], sandbox});
    const proposal = await runIterativeCodingAgent({
      run_id: "product-canary:proposal",
      request: "Repair the failing sum implementation and verify the change.",
      fixture_root: root,
      model_transport: model,
      tool_runtime: tools,
      tool_policy: {allow: ["read-file", "run-command"], ask: [], deny: []},
      mutation_allowlist: ["src/range.mjs"],
      verification_command: ["node", "--test"],
      verification_sandbox: sandbox,
      maximum_steps: 4,
      approve: false,
    });
    if (proposal.status !== "AWAITING_APPROVAL") throw Object.assign(new Error(`Proposal stopped with ${proposal.status}: ${(proposal.reason_codes ?? []).join(",")}`), {reason_code: "product-canary.proposal-failed"});
    if (!prompts[0]?.includes("Exact tool contracts:") || !prompts[0]?.includes('"command":["node","--test"]')) throw Object.assign(new Error("The model prompt did not contain the exact tool and verification contracts."), {reason_code: "product-canary.tool-contract-missing"});
    const diagnostic = proposal.history.find((entry) => entry.event?.event_id === "canary:test-before")?.observation;
    if (diagnostic?.ok !== true || diagnostic.output?.observed_exit !== 1) throw Object.assign(new Error("The expected failing test was not preserved as a model observation."), {reason_code: "product-canary.diagnostic-observation-invalid"});

    const patchSet = {
      schema_version: "are.patch-set-candidate/v1",
      expected_base_tree_sha256: finalCandidate.expected_base_tree_sha256,
      changes: [{operation: finalCandidate.operation, path: finalCandidate.path, expected_file_sha256: finalCandidate.expected_file_sha256, utf8: finalCandidate.utf8}],
      rationale: finalCandidate.rationale,
      authority_effect: "none",
    };
    const parsed = parsePatchSetCandidate(patchSet);
    if (!parsed.ok) throw Object.assign(new Error(parsed.reason_codes.join(",")), {reason_code: "product-canary.candidate-invalid"});
    const applied = runTransactionalPatchSet({
      run_id: "product-canary:apply",
      fixture_root: root,
      raw_candidate: patchSet,
      mutation_allowlist: ["src/range.mjs"],
      verification_command: ["node", "--test"],
      verification_sandbox: sandbox,
      approve: true,
      approval_digest: parsed.candidate_digest,
    });
    if (applied.status !== "PATCH_CANDIDATE" || applied.verification?.observed_exit !== 0 || readFileSync(resolve(root, "src/range.mjs"), "utf8") !== fixed) throw Object.assign(new Error(`Application stopped with ${applied.status}: ${(applied.reason_codes ?? []).join(",")}`), {reason_code: "product-canary.application-failed"});

    return {
      schema_version: "are.coding-agent-product-canary/v1",
      status: "PASS_BOUNDED",
      reason_codes: [],
      checks: {
        exact_tool_contracts_advertised: true,
        failing_test_observed_without_transport_block: true,
        proposal_required_approval: true,
        approval_bound_to_candidate_digest: true,
        transactional_patch_applied: true,
        sandbox_verification_passed: true,
        changed_paths: applied.changed_paths,
      },
      candidate_digest: parsed.candidate_digest,
      before_tree_sha256: applied.before_tree_sha256,
      after_tree_sha256: applied.after_tree_sha256,
      sandbox: {engine, image, config_digest: sandbox.config_digest, network: "none", source_mount: "read-only"},
      fixture_root: keep ? root : null,
      fixture_retained: keep,
      automatic_approval_scope: "newly-created-disposable-fixture-only",
      external_repository_effects: 0,
      claim_limit: "Current product-candidate test evidence only; no product approval, adoption, publication, release, deployment, or external-effect authority.",
      authority_effect: "none",
    };
  } catch (error) {
    retain = true;
    return blocked(error, root);
  } finally {
    if (!retain) rmSync(root, {recursive: true, force: true});
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  try { result = await runProductCanary(options(process.argv.slice(2))); }
  catch (error) { result = blocked(error); }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "PASS_BOUNDED" ? 0 : 1;
}
