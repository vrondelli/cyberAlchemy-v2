#!/usr/bin/env node

import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {applyConfiguredCodingAgentProposal, proposeConfiguredCodingAgent, proposeConfiguredIterativeCodingAgent} from "../configured-runner.mjs";
import {loadCodingAgentRunConfig} from "../runtime-config.mjs";
import {runRecommendOnlyEvolutionCycle} from "../evolution-bridge.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function usage() {
  return [
    "Propose: run.mjs --config <file> --root <repository> --request <text> [--run-id <id>]",
    "Iterate: run.mjs --iterative --config <file> --root <repository> --request <text> --session <jsonl> [--resume] [--max-steps <n>] [--tool-policy <json>] [--context-config <json>] [--cancel-file <path>]",
    "Apply:   run.mjs --config <file> --root <repository> --apply-proposal <file> --approve-digest <sha256>",
    ""
  ].join("\n");
}

function jsonFile(path, label) {
  if (!path) return null;
  try { return JSON.parse(readFileSync(resolve(path), "utf8")); }
  catch { throw new TypeError(`${label} could not be loaded`); }
}

function positiveIntegerArgument(name) {
  const value = argument(name);
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`${name} is invalid`);
  return parsed;
}

async function main() {
  if (process.argv.includes("--help")) {
    process.stdout.write(usage());
    return 0;
  }
  const configPath = argument("--config");
  const repositoryRoot = argument("--root");
  if (!configPath || !repositoryRoot || process.argv.includes("--approve")) throw new TypeError("required argument missing");
  const config = loadCodingAgentRunConfig(resolve(configPath));
  const proposalPath = argument("--apply-proposal");
  let receipt;
  if (proposalPath) {
    const approvalDigest = argument("--approve-digest");
    if (!approvalDigest) throw new TypeError("approval digest missing");
    let proposal;
    try { proposal = JSON.parse(readFileSync(resolve(proposalPath), "utf8")); }
    catch { throw new TypeError("proposal could not be loaded"); }
    receipt = applyConfiguredCodingAgentProposal({config, repository_root: resolve(repositoryRoot), proposal, approval_digest: approvalDigest});
    if (config.evolution.enabled) {
      const evolution = await runRecommendOnlyEvolutionCycle({
        user_selected: config.evolution.user_selected,
        evidence: {
          run_id: receipt.run_id ?? proposal.run_id,
          status: receipt.status,
          result_digest: receipt.result_digest,
          source_tree_digest: receipt.after_tree_sha256 ?? receipt.verification?.after_tree_sha256 ?? receipt.before_tree_sha256 ?? proposal.candidate_sha256,
          changed_paths: receipt.changed_paths ?? receipt.verification?.changed_paths ?? [],
          baseline_ref: receipt.before_tree_sha256 ?? receipt.verification?.before_tree_sha256 ?? "coding-agent:current",
          environment_ref: "coding-agent:configured-cli",
          safety_passed: receipt.status === "PATCH_CANDIDATE",
          determinism_passed: false,
          holdout_passed: false
        }
      });
      receipt = Object.freeze({...receipt, evolution});
    }
  } else {
    const request = argument("--request");
    if (!request) throw new TypeError("request missing");
    const common = {config, run_id: argument("--run-id") ?? `coding-agent-${Date.now()}`, request, repository_root: resolve(repositoryRoot)};
    receipt = process.argv.includes("--iterative")
      ? await proposeConfiguredIterativeCodingAgent({...common, maximum_steps: positiveIntegerArgument("--max-steps"), tool_policy: jsonFile(argument("--tool-policy"), "tool policy"), session_path: argument("--session"), resume: process.argv.includes("--resume"), cancel_file: argument("--cancel-file"), context_config: jsonFile(argument("--context-config"), "context configuration")})
      : await proposeConfiguredCodingAgent(common);
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (receipt.status === "PATCH_CANDIDATE") return 0;
  if (receipt.status === "AWAITING_APPROVAL") return 3;
  return 1;
}

main().then(
  (code) => { process.exitCode = code; },
  () => {
    process.stdout.write(`${JSON.stringify({schema_version: "are.coding-agent-runtime-result/v1", status: "BLOCK", reason_codes: ["runtime.configuration-invalid"], effect_applied: false, authority_effect: "none"}, null, 2)}\n`);
    process.exitCode = 2;
  }
);
