#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  evolutionProtocolDigest,
} from "../index.mjs";

const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const root = rootIndex >= 0 ? args[rootIndex + 1] : null;
const constructionOverride = args.includes("--construction-disabled-definitions");

function output(value, status = 0) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
  process.exitCode = status;
}

function invalid(code = "coordination.request-invalid") {
  output({schema_version: "are.evolution-coordination-cli-result/v1", ok: false, reason_codes: [code], authority_effect: "none"}, 2);
}

if (!root || args.some((arg, index) => !["--root", "--construction-disabled-definitions", root].includes(arg) && index !== rootIndex + 1)) {
  invalid();
} else {
  let request;
  try { request = JSON.parse(readFileSync(0, "utf8")); } catch { invalid(); process.exit(2); }
  const operations = new Map([
    ["inspect", []],
    ["admit-phase", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "phase", "plan", "envelope", "prerequisite_receipt_refs"]],
    ["lease-work", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "phase", "task_ref", "rationale", "effect_class", "resource_request", "lease_seconds"]],
    ["settle-work", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "phase", "task_ref", "lease_ref", "fencing_token", "outcome", "evidence", "accounting"]],
    ["recover", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "phase"]],
    ["offer-handoff", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "handoff_ref", "handoff_type", "target_cycle_kind", "artifact_refs", "claim_refs"]],
    ["accept-handoff", ["idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "handoff_ref", "offer_digest", "accepted_artifact_refs", "accepted_claim_refs"]],
  ]);
  if (!request || Object.keys(request).some((key) => !["schema_version", "operation", "input"].includes(key)) || request.schema_version !== "are.evolution-coordination-cli-request/v1" || !operations.has(request.operation) || typeof request.input !== "object" || request.input === null || Array.isArray(request.input) || Object.keys(request.input).some((key) => !operations.get(request.operation).includes(key))) {
    invalid();
  } else {
    const evidenceValidator = ({task, evidence}) => ({ok: task.completion_criteria.length === evidence.length && evidence.every((item) => task.completion_criteria.includes(item.criterion_id) && /^[a-f0-9]{64}$/.test(item.artifact_digest)), reason_codes: ["coordination.completion-evidence-invalid"]});
    const cycleValidator = ({plan, envelope}) => ({ok: plan.tasks.length > 0 && envelope.enabled === true, reason_codes: ["coordination.cycle-validator-rejected"]});
    const kernel = createDurableEvolutionKernel({root: resolve(root), require_enabled: !constructionOverride});
    const coordinator = createEvolutionCoordinator({
      kernel,
      validators: {"are.evolution.evidence-binding/v1": evidenceValidator},
      cycle_validators: Object.fromEntries(["benchmark-research", "research-learning", "engine-improvement", "interaction-learning", "controlled-upgrade"].map((kind) => [kind, cycleValidator])),
      verify_plan(plan) {
        const {plan_digest: planDigest, ...material} = plan ?? {};
        return {ok: /^[a-f0-9]{64}$/.test(planDigest ?? "") && evolutionProtocolDigest(material) === planDigest};
      },
    });
    const methods = {"inspect": "inspect", "admit-phase": "admitPhase", "lease-work": "leaseWork", "settle-work": "settleWork", "recover": "recover", "offer-handoff": "offerHandoff", "accept-handoff": "acceptHandoff"};
    try {
      const result = coordinator[methods[request.operation]](request.input);
      output(result, result.ok === false ? 2 : 0);
    } catch (error) {
      output({schema_version: "are.evolution-coordination-cli-result/v1", ok: false, reason_codes: ["coordination.request-failed"], residue: [{message: error.message}], authority_effect: "none"}, 2);
    }
  }
}
