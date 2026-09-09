#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUN_ID = "2026-07-22-intent-schema-02";
const MANIFEST_SHA256 = "d4bf64e93c2c3250deb12fc1a4720ddc98ce4af467cbcc07227c1159d97645dc";
const FIELDS = [
  "source",
  "purpose",
  "scope",
  "constraints",
  "target_pressure",
  "current_output_hypothesis",
  "revision_route"
];
const runDir = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(runDir, "corpus-manifest.json");
const outputPath = resolve(runDir, "records.jsonl");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function unresolved() {
  return { posture: "unresolved", value: null, inference_note: null };
}

function declared(value) {
  return { posture: "declared", value, inference_note: null };
}

function inferred(value, inferenceNote) {
  return { posture: "inferred", value, inference_note: inferenceNote };
}

function missing(fields, note, severity = "flag") {
  return { kind: "missing_semantics", fields, severity, note };
}

function observation(kind, fields, severity, note) {
  return { kind, fields, severity, note };
}

const annotations = {
  "SAMPLE-DISPATCH-01": {
    fields: {
      source: unresolved(),
      purpose: inferred(
        "Enable governed ontology-vault development by transferring context from Invoke to Sigil Development.",
        "This interpretation is false if the phrase names only a command sequence and no development-enabling outcome is intended."
      ),
      scope: declared("The ontology-vault handoff from Invoke to Sigil Development."),
      constraints: declared("Use Invoke for a handoff whose next capability is Sigil Development."),
      target_pressure: unresolved(),
      current_output_hypothesis: declared("A handoff from Invoke to Sigil Development for ontology-vault."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "target_pressure", "revision_route"], "The raw dispatch names capabilities and an artifact but not the expresser, the present failure pressure, or who may revise the projection."),
      observation("field_overlap", ["purpose", "current_output_hypothesis"], "info", "The terse handoff request supports an output directly; its enabling purpose requires interpretation."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "flag", "Treating the handoff itself as the purpose would erase the reason the ontology-vault change should become possible.")
    ]
  },
  "SAMPLE-DISPATCH-02": {
    fields: {
      source: unresolved(),
      purpose: inferred(
        "Make CyberAlchemy and the founder's work intelligible and well-positioned on LinkedIn.",
        "This interpretation is false if 'strongest LinkedIn text' means textual optimization only and no audience understanding outcome is intended."
      ),
      scope: declared("The CyberAlchemy company page and the founder profile entry describing the work and its bases."),
      constraints: declared("Use a confirmed Dispatch Spec and Whisper strategy, identify the founder as Founder AI Governance Architect & Researcher, and preserve category-theory formality."),
      target_pressure: unresolved(),
      current_output_hypothesis: declared("A confirmed Dispatch Spec and Whisper strategy producing LinkedIn text for the company and founder surfaces."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "target_pressure", "revision_route"], "The selected raw intent does not identify the expresser, a present positioning failure, or a projection revision owner."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "flag", "The named strategy and copy can become proxies for audience understanding unless purpose remains separate.")
    ]
  },
  "SAMPLE-DISPATCH-03": {
    fields: {
      source: unresolved(),
      purpose: declared("Support learning about ontology and knowledge graphs for CyberAlchemy Method, Craft, CyberAlchemy v2, and DomainSpec v2."),
      scope: declared("A private application covering CyberAlchemy Method, Craft, CyberAlchemy v2, and DomainSpec v2."),
      constraints: declared("Keep the application private and perform define, design, and plan stages."),
      target_pressure: unresolved(),
      current_output_hypothesis: declared("A defined, designed, and planned private ontology and knowledge-graph learning application."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "target_pressure", "revision_route"], "The raw dispatch supplies a learning outcome and boundary but not attribution, the current learning failure, or revision ownership."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "info", "The application is a revisable means for learning and must not become the learning purpose itself.")
    ]
  },
  "SAMPLE-DISPATCH-04": {
    fields: {
      source: unresolved(),
      purpose: inferred(
        "Make CAV2 artifact-admission validation possible through an implementation-ready plan.",
        "This interpretation is false if the request only asks for a planning artifact and does not intend later validator capability."
      ),
      scope: declared("The CAV2 artifact admission validator."),
      constraints: declared("Use Invoke in plan mode before implementation."),
      target_pressure: unresolved(),
      current_output_hypothesis: declared("An Invoke plan for the CAV2 artifact admission validator."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "target_pressure", "revision_route"], "The sparse request omits attribution, the admission failure that motivates the validator, and who may revise the projection."),
      observation("field_overlap", ["purpose", "current_output_hypothesis"], "flag", "The request states the plan artifact more directly than the capability outcome."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "flag", "A completed plan could be mistaken for the requested validator capability.")
    ]
  },
  "SAMPLE-CRAFT-01": {
    fields: {
      source: unresolved(),
      purpose: declared("Keep stable CyberAlchemy v2 repository work source-ledgered, authority-bounded, and executable from Craft."),
      scope: declared("CyberAlchemy v2 stable repository consolidation, including the root ledger, index, view, README, definition towers, boundary review, and IOLM links."),
      constraints: declared("Remain source-ledgered and authority-bounded; operate at define stage under a flag gate."),
      target_pressure: declared("One hundred forty-nine staged definition candidates still require clustering, deduplication, and localization after D29-D39 promotion."),
      current_output_hypothesis: inferred(
        "A Craft-recorded cluster, deduplication, and localization pass over staged definition candidates.",
        "This interpretation is false if the next move is coordination only and no consolidated candidate organization is expected."
      ),
      revision_route: inferred(
        "Continue through CTX-CAV2-ROOT's Craft next move and its linked definition-tower and boundary-review contexts.",
        "This interpretation is false if the linked contexts are navigation only rather than the route for revising the projection."
      )
    },
    observations: [
      missing(["source"], "The Craft context locks artifact provenance but does not identify the human or authority that expressed the intent."),
      observation("field_ambiguity", ["revision_route", "scope"], "info", "Linked contexts locate related ownership surfaces, but the block does not explicitly say they may revise this intent projection.")
    ]
  },
  "SAMPLE-CRAFT-02": {
    fields: {
      source: unresolved(),
      purpose: declared("Cast the CAV2 authority spine onto a domain, research, or project repository as one Mint casting organ."),
      scope: declared("Mint covers authority-spine casting built from owned scaffold mechanics and precedents; it is one organ of the machine-map foundry, not the whole foundry."),
      constraints: declared("Build from owned scaffold and precedent components, preserve the one-organ scope guardrail, remain at design under a flag gate, and do not treat N=1 as falsification evidence."),
      target_pressure: declared("The first real Mint produced L1-L4 learnings, a lane-versus-spell governance-organ fork remains open, and the N=3 falsification experiment is deferred."),
      current_output_hypothesis: declared("A Mint authority-spine casting capability updated through the L1-L4 learnings and later tested by the deferred N=3 experiment."),
      revision_route: declared("Sigil Development applies the L1-L4 learnings, Decision Gate resolves the lane-versus-spell fork, and the deferred N=3 experiment follows.")
    },
    observations: [
      missing(["source"], "The context records evidence and next owners but not the original human or authority that expressed the Mint intent."),
      observation("field_ambiguity", ["scope", "constraints"], "info", "The statement that Mint is one casting organ both bounds included work and forbids whole-foundry interpretation."),
      observation("source_granularity", ["target_pressure", "revision_route"], "info", "The full context block is reviewable but combines historical evidence, an open fork, and multiple next routes in one selector.")
    ]
  },
  "SAMPLE-CRAFT-03": {
    fields: {
      source: unresolved(),
      purpose: declared("Rework DomainSpec v2 as the typed-intent-to-engine and Lean-kernel pillar in a fresh peer workstream."),
      scope: declared("The DomainSpec v2 pillar, its implementation home, authority spine, imported materials, recursive-governance model, local Craft space, and named engine residues."),
      constraints: declared("Freeze v1, build from owned research and authority, keep the context as an umbrella pointer to the v2-local Craft space, and preserve deferred and residue status."),
      target_pressure: declared("Imported docs and tools still require reformulation, Batch 3 is unexecuted, CI wiring is deferred, and depth-2 leaf inhabitation and trend typing remain residue."),
      current_output_hypothesis: declared("A DomainSpec v2 implementation home plus reformulated imports, design-and-plan Batch 3, and engine-lane resolution of named residues."),
      revision_route: inferred(
        "Continue revisions in the DomainSpec v2 local Craft space, execute the named reformulation route, and send R-leaf and R-trend-type residue to the engine lane.",
        "This interpretation is false if those pointers describe status only and do not authorize revision of the intent projection."
      )
    },
    observations: [
      missing(["source"], "The long-lived Craft context identifies a workstream but not the specific current expresser or authority for its accumulated intent."),
      observation("source_granularity", ["target_pressure", "current_output_hypothesis", "revision_route"], "flag", "One context selector spans several dated states, completed proofs, deferred work, and live residue; review requires disentangling them."),
      observation("field_ambiguity", ["target_pressure", "current_output_hypothesis"], "info", "Unexecuted batches and residue can be read as present failures or as planned output components.")
    ]
  },
  "SAMPLE-CRAFT-04": {
    fields: {
      source: unresolved(),
      purpose: declared("Govern a private, deterministic, source-preserving learning map that renders one shared read model without treating projection or pedagogy as authority."),
      scope: declared("The IOLM graph, hierarchy, and table views; candidate contract, fixture-demo sidecar, blocked cross-feature support, later authoritative rebind, and owned evidence artifacts."),
      constraints: declared("Keep the project private, deterministic, source-preserving, non-authoritative by proximity, and blocked where upstream support or the authoritative graph gate is absent."),
      target_pressure: declared("SWU-IOLM-00C-B lacks a passing upstream support receipt, 00C-C is unselected, and the authoritative graph gate remains open for later rebind."),
      current_output_hypothesis: declared("A shared learning-map read model plus an independent fixture-backed demo, followed later by an owner-generated authoritative rebind."),
      revision_route: declared("Use the accepted projection owner, the DomainSpec v2 source-owner route, the resolved cross-feature decision, and the still-open authoritative graph gate for later changes.")
    },
    observations: [
      missing(["source"], "The context has owner-route links but does not state the original expresser of the intent."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis", "scope"], "flag", "The independent fixture demo must not be treated as evidence for the blocked cross-feature work or authoritative graph.")
    ]
  },
  "SAMPLE-WORKPACK-01": {
    fields: {
      source: unresolved(),
      purpose: declared("Make the ontology-folder recommendation executable without collapsing authority surfaces or losing witness evidence."),
      scope: declared("Ontology meaning, definition meaning, specs, project witness material, domain-local instantiation, and the listed CAV2, DomainSpec v2, projects/ontology, and inventory inputs."),
      constraints: declared("Do not collapse authority surfaces or lose witness evidence; placement and promotion must remain distinguishable."),
      target_pressure: inferred(
        "The current ontology-folder recommendation is not executable enough to prevent future placement and promotion confusion.",
        "This interpretation is false if the recommendation is already executable and the work-pack only documents an existing placement rule."
      ),
      current_output_hypothesis: declared("An executable ontology-folder recommendation that tells future agents where each meaning and witness kind belongs."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "revision_route"], "The objective section does not identify the expresser or who may revise its projection after evidence."),
      observation("field_overlap", ["purpose", "current_output_hypothesis"], "info", "The work-pack names an executable recommendation both as the desired capability and the proposed artifact."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "info", "Producing a recommendation document would not by itself prove future placement decisions remain authority-safe.")
    ]
  },
  "SAMPLE-WORKPACK-02": {
    fields: {
      source: unresolved(),
      purpose: declared("Enable a nontechnical investor to identify the customer, purchase trigger, delivered work, workflow change, possible money mechanism, validation method, and evidence boundary."),
      scope: declared("Every current investor-package artifact and its HTML derivative."),
      constraints: declared("Avoid internal CyberAlchemy vocabulary, preserve artifact parity, make no unsupported claim promotion, and browser-validate the HTML derivative."),
      target_pressure: inferred(
        "The current investor package does not reliably expose the customer, purchase trigger, delivered work, workflow change, money mechanism, validation, and evidence boundary to a nontechnical investor.",
        "This interpretation is false if those elements are already clear and the requested mutation concerns only presentation style."
      ),
      current_output_hypothesis: declared("A parity-preserving investor package and browser-validated HTML derivative using nontechnical language."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "revision_route"], "The objective defines audience and validation but does not state the expresser or revision owner."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "info", "Artifact parity and HTML validation cannot substitute for the investor's actual ability to identify the required business elements.")
    ]
  },
  "SAMPLE-WORKPACK-03": {
    fields: {
      source: unresolved(),
      purpose: declared("Make semantic, epistemic, governance, operational, and pedagogical connections inspectable without collapsing their types or authority."),
      scope: declared("A private IOLM witness, the passed candidate contract, blocked 00C-B, deferred authoritative rebind, independent L0C demo, and planned L0D evidence consumer."),
      constraints: declared("Remain private, deterministic, source-preserving, and non-collapsing; do not let the fixture sidecar weaken or evidence 00C-B; keep the authoritative rebind separately blocked on owner-generated Sg."),
      target_pressure: declared("00C-B is blocked on upstream support, the owner-generated Sg is missing for authoritative rebind, and the L0D consumer remains planned with unselected SWUs."),
      current_output_hypothesis: declared("A source-preserving ontology learning-map witness with an independent fixture-backed workable example and later authoritative rebind."),
      revision_route: inferred(
        "Proceed through the independent L0C demo now, preserve the 00C-B support blocker, and route later authoritative rebind through the owner-generated Sg.",
        "This interpretation is false if the lane-status text describes scheduling only and does not govern revision of the intent projection."
      )
    },
    observations: [
      missing(["source"], "The work-pack objective has lane owners and gates but does not identify the intent's original expresser."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis", "scope"], "flag", "The fixture-backed sidecar must not become evidence for 00C-B or the authoritative rebind.")
    ]
  },
  "SAMPLE-WORKPACK-04": {
    fields: {
      source: unresolved(),
      purpose: declared("Check CAV2-C18 admission records deterministically without claiming adjacent governance authority."),
      scope: declared("A two-phase artifact-admission validator, its named C18 and definition inputs, pass/flag/block/defer fixtures, one live non-mutating witness, and stable CLI receipts."),
      constraints: declared("Do not claim constitution, definition, ontology, or promotion authority; fail closed on malformed policy sources; keep the live witness non-mutating; leave promotion to owning routes."),
      target_pressure: inferred(
        "Artifact-admission checks need deterministic, fail-closed receipts while preserving the separation between validation and promotion authority.",
        "This interpretation is false if a conforming deterministic validator already exists and the objective only republishes its interface."
      ),
      current_output_hypothesis: declared("A deterministic two-phase CLI that emits stable pass, flag, block, and defer receipts and validates one live non-mutating witness."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "revision_route"], "The objective names owning promotion routes but not the expresser or the owner allowed to revise this intent projection."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis", "constraints"], "flag", "Stable CLI receipts could be mistaken for promotion authority unless the output remains subordinate to the stated constraints.")
    ]
  },
  "SAMPLE-HOLDOUT-DISPATCH-01": {
    fields: {
      source: unresolved(),
      purpose: inferred(
        "Synchronize FPR-02B backend test-engine and downstream consumer-proof artifacts with an accepted decision package.",
        "This interpretation is false if 'refresh' means cosmetic regeneration rather than evidence synchronization after the gate."
      ),
      scope: declared("All necessary FPR-02B backend test-engine and downstream consumer-proof artifacts."),
      constraints: declared("Perform the refresh only after the accepted 16-decision gate."),
      target_pressure: inferred(
        "The accepted 16-decision gate has made the existing FPR-02B artifacts require refresh.",
        "This interpretation is false if the accepted decisions do not change or stale any named artifact."
      ),
      current_output_hypothesis: declared("A refreshed set of FPR-02B backend test-engine and downstream consumer-proof artifacts."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "revision_route"], "The held-out raw intent omits attribution and who may revise the projection."),
      observation("field_overlap", ["purpose", "current_output_hypothesis"], "info", "The word 'refresh' names the output directly; synchronization purpose requires bounded interpretation."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis"], "info", "Fresh artifact bytes would not necessarily prove synchronization with the accepted decisions.")
    ]
  },
  "SAMPLE-HOLDOUT-CRAFT-01": {
    fields: {
      source: unresolved(),
      purpose: declared("Coordinate an evidence-informed private definition, design, and plan for a governed agent reasoning engine whose first executable witness is semantic-judgment evaluator@1."),
      scope: declared("The private reasoning-engine authoring context, its dispatch, local Craft surfaces, intent-schema evidence gap, and semantic-witness gap."),
      constraints: declared("Keep the work evidence-informed and private, begin at define under a flag gate, do not promote the candidate intent record or evaluator, and do not treat absent schema evidence or witness as present."),
      target_pressure: declared("Intent-schema evidence and an executable semantic witness are intentionally absent and remain active gaps."),
      current_output_hypothesis: declared("A private definition, design, and plan for the reasoning engine centered on semantic-judgment evaluator@1 as its first executable witness."),
      revision_route: inferred(
        "Use the CTX-ARE-ROOT Craft next move to author the baseline while keeping the two named gaps open for their owning evidence routes.",
        "This interpretation is false if the next move is merely descriptive and does not govern revision of this projection."
      )
    },
    observations: [
      missing(["source"], "The held-out Craft context records the project route but not the human or authority that expressed the intent."),
      observation("field_overlap", ["purpose", "current_output_hypothesis"], "info", "The authoring package appears in both the coordination purpose and the current output guess, while the executable witness remains separate.")
    ]
  },
  "SAMPLE-HOLDOUT-WORKPACK-01": {
    fields: {
      source: unresolved(),
      purpose: declared("Turn the Poker Agent Arena planning packet into one executable MVP path."),
      scope: declared("Local Arena CLI v0 with an end-to-end Kuhn hidden-information fixture; Leduc, Hold'em parity, calibrated leaderboard scoring, and novelty mechanics remain follow-on work."),
      constraints: declared("Use a local CLI with strict protocol, deadlines, deterministic fallback, transcript replay, diagnostics, sample agents, and author-facing first-run proof; do not treat Kuhn as the product."),
      target_pressure: inferred(
        "The planning packet does not yet provide one executable MVP path with first-run proof.",
        "This interpretation is false if Local Arena CLI v0 is already executable and the work-pack only records an existing route."
      ),
      current_output_hypothesis: declared("Local Arena CLI v0 with a Kuhn fixture as the first gate inside a durable local arena surface."),
      revision_route: unresolved()
    },
    observations: [
      missing(["source", "revision_route"], "The held-out objective identifies a staged product route but not the expresser or who may revise the intent projection."),
      observation("replacement_risk", ["purpose", "current_output_hypothesis", "scope"], "flag", "The source explicitly warns that the Kuhn fixture must not replace the durable local arena purpose.")
    ]
  }
};

if (existsSync(outputPath)) {
  throw new Error(`refusing to overwrite append-only row file: ${outputPath}`);
}

const manifestBytes = readFileSync(manifestPath);
if (sha256(manifestBytes) !== MANIFEST_SHA256) {
  throw new Error(`manifest drift: expected ${MANIFEST_SHA256}, got ${sha256(manifestBytes)}`);
}
const manifest = JSON.parse(manifestBytes.toString("utf8"));
if (manifest.run_id !== RUN_ID || manifest.samples.length !== 15) {
  throw new Error("unexpected manifest identity or cardinality");
}

const seenHoldout = manifest.samples.findIndex((sample) => sample.assignment === "holdout");
if (seenHoldout !== 12 || manifest.samples.slice(0, 12).some((sample) => sample.assignment !== "population")) {
  throw new Error("records must encode all population samples before unchanged-rule holdouts");
}

const rows = manifest.samples.map((sample) => {
  const annotation = annotations[sample.sample_id];
  if (!annotation || FIELDS.some((field) => !annotation.fields[field])) {
    throw new Error(`incomplete annotation for ${sample.sample_id}`);
  }
  const evidenceRef = sample.selector;
  const intent = Object.fromEntries(FIELDS.map((field) => {
    const item = annotation.fields[field];
    return [field, {
      posture: item.posture,
      value: item.value,
      evidence_refs: item.posture === "unresolved" ? [] : [evidenceRef],
      inference_note: item.inference_note
    }];
  }));
  const observations = annotation.observations.map((item) => ({
    ...item,
    evidence_refs: [evidenceRef]
  }));
  const candidateFieldActions = FIELDS.map((field) => ({
    field,
    action: intent[field].posture === "unresolved" ? "unresolved" : "retain",
    rationale: intent[field].posture === "unresolved"
      ? "This sample does not support a safe value; missingness remains evidence and does not decide canonical necessity."
      : `This sample supports the field's distinct question with ${intent[field].posture} evidence; owner selection remains pending.`,
    owner_decision: "pending"
  }));
  return {
    run_id: RUN_ID,
    sample_id: sample.sample_id,
    assignment: sample.assignment,
    stratum: sample.stratum,
    source_lock: {
      source_path: sample.source_path,
      selector: sample.selector,
      source_sha256: sample.source_sha256,
      selected_text_sha256: sample.selected_text_sha256
    },
    intent_record: {
      intent_id: `INTENT-${sample.sample_id.replace(/^SAMPLE-/, "")}`,
      record_schema: "intent-record.candidate@1",
      record_status: "candidate",
      raw_intent: {
        text_or_ref: sample.selected_text,
        source_ref: `${sample.source_path}#${sample.selector}`,
        captured_at: manifest.frozen_at
      },
      intent,
      revision_history: []
    },
    observations,
    candidate_field_actions: candidateFieldActions,
    validator_status: "pending"
  };
});

writeFileSync(outputPath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, { flag: "wx" });
process.stdout.write(`${outputPath}\n${rows.length}\n${sha256(readFileSync(outputPath))}\n`);
