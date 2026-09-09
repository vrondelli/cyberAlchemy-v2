import { readFile } from "node:fs/promises";
import {
  sealRecord,
  EVALUATOR_ID,
  SCHEMA_VERSION,
  TEST_ACTION,
  TEST_TARGET,
} from "../index.mjs";

export async function readFixture(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function record(source, runId, recordType, payload) {
  return {
    record_type: recordType,
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    created_at: source.created_at,
    producer: "fixture-builder@1",
    input_digests: [],
    ...payload,
  };
}

export function buildRequest(
  source,
  {
    runId = `run:${source.family_id}`,
    mode = "fresh",
    entryVerdict = "pass",
    effectVerdict = "pass",
    mutateRaw = () => {},
    mutateSealed = () => {},
  } = {},
) {
  const raw = {
    frame: record(source, runId, "ProblemFrame", {
      frame_id: `frame:${source.family_id}`,
      intent_id: `intent:${source.family_id}`,
      conclusion_domain: source.conclusion_domain,
      question: `Is ${source.family_id} recommendable under this snapshot?`,
    }),
    authority_snapshot: record(source, runId, "AuthoritySnapshot", {
      snapshot_id: `authority:${source.family_id}`,
      status: "active",
      owners: [source.author_owner_ref],
      authority_edges: [
        { from: "root-owner@local", to: source.author_owner_ref },
      ],
    }),
    catalog: record(source, runId, "RuleCatalogManifest", {
      catalog_id: `catalog:${source.family_id}`,
      evaluator_id: EVALUATOR_ID,
      issuer_ref: source.author_owner_ref,
      status: "active",
      expires_at: source.expires_at,
      revoked_at: null,
      conclusion_domain: [source.conclusion_domain],
      rules: structuredClone(source.rules),
      precedence_edges: [],
    }),
    observations: Object.entries(source.facts).map(([field, value], index) =>
      record(source, runId, "Observation", {
        observation_id: `${source.family_id}:observation:${String(index + 1).padStart(2, "0")}`,
        field,
        claim_type: "fixture-fact",
        value,
        issuer_ref: source.author_owner_ref,
        source_ref: source.source_ref,
        transform_refs: [],
        validator_ref: "fixture-validator@1",
        temporal_scope: { observed_at: source.as_of },
        posture: "admitted",
        rejection_reason: null,
      }),
    ),
    challenge_closure: record(source, runId, "ChallengeClosure", {
      closure_id: `challenge:${source.family_id}`,
      required_lanes: [
        {
          lane_id: "owner-policy-challenge",
          status: "closed",
          deadline_at: source.expires_at,
          attempt_limit: 1,
          attempt_count: 1,
        },
      ],
      material_disputes: [],
      admitted_defeaters: [],
    }),
    technique_plan: record(source, runId, "TechniquePlan", {
      plan_id: `techniques:${source.family_id}`,
      selected_techniques: ["rule-applicability-check@1"],
    }),
    effort_profile: record(source, runId, "EffortProfile", {
      profile_id: `effort:${source.family_id}`,
      tier: "T0",
      required_roles: [],
      required_techniques: ["rule-applicability-check@1"],
      budgets: { reducer_steps: 100 },
      stop_conditions: ["terminal-outcome"],
      escalation_conditions: ["owner-required"],
      policy_refs: [source.source_ref],
    }),
    entry_gate: record(source, runId, "GateDecision", {
      gate_decision_id: `entry:${source.family_id}`,
      gate_kind: "orchestration-entry",
      verdict: entryVerdict,
      owner_ref: source.author_owner_ref,
      authority_snapshot_digest: "bound-after-seal",
      subject_digest: "bound-after-seal",
      evidence_refs: [source.source_ref],
      residue: entryVerdict === "pass" ? [] : [`entry-${entryVerdict}`],
      effect_of_decision: `entry-${entryVerdict}`,
      decided_at: source.as_of,
    }),
    runtime_journal_cut: record(source, runId, "RuntimeJournalCut", {
      journal_id: `journal:${source.family_id}`,
      state: "observations-frozen",
      events: [],
    }),
    effect_envelope_template: record(
      source,
      runId,
      "FixedEffectEnvelopeTemplate",
      {
        action: TEST_ACTION,
        target: TEST_TARGET,
        scope: source.conclusion_domain,
        authority_basis: source.source_ref,
        risk: "test-only",
        rollback_or_compensation: "delete in-memory test marker",
        idempotency_key: source.idempotency_key,
      },
    ),
    effect_gate_template: record(source, runId, "GateDecisionTemplate", {
      gate_decision_id: `effect:${source.family_id}`,
      gate_kind: "exact-effect",
      verdict: effectVerdict,
      owner_ref: source.author_owner_ref,
      evidence_refs: [source.source_ref],
      residue: effectVerdict === "pass" ? [] : [`effect-${effectVerdict}`],
      effect_of_decision: `effect-${effectVerdict}`,
      decided_at: source.as_of,
    }),
  };

  mutateRaw(raw);

  const sealed = {
    schema_version: SCHEMA_VERSION,
    run_id: runId,
    created_at: source.created_at,
    as_of: source.as_of,
    mode,
    frame: sealRecord(raw.frame),
    authority_snapshot: sealRecord(raw.authority_snapshot),
    catalog: sealRecord(raw.catalog),
    observations: raw.observations.map(sealRecord),
    challenge_closure: sealRecord(raw.challenge_closure),
    technique_plan: sealRecord(raw.technique_plan),
    effort_profile: sealRecord(raw.effort_profile),
    entry_gate: sealRecord(raw.entry_gate),
    runtime_journal_cut: sealRecord(raw.runtime_journal_cut),
    effect: {
      envelope_template: sealRecord(raw.effect_envelope_template),
      gate_template: sealRecord(raw.effect_gate_template),
    },
  };
  mutateSealed(sealed);
  return sealed;
}
