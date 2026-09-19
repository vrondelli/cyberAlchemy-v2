import assert from "node:assert/strict";
import test from "node:test";

import {
  discriminateWorkflowMode,
  sealWorkflowModeDeclaration,
  type WorkflowModeDeclarationBody,
} from "./workflow-mode-discriminator.ts";

const SUBJECT = "Fixture.Workflow";

function body(mode: "synchronous" | "durable" = "synchronous"): WorkflowModeDeclarationBody {
  return {
    schema_version: "ape.workflow-mode-declaration/v1",
    declaration_id: `mode.${mode}/v1`,
    subject_id: SUBJECT,
    mode,
    basis_ref: "owner-decision:workflow-mode",
    owner: "workflow-profile:mode-owner",
    authority_effect: "none",
  };
}

test("accepts only one exact self-digest-bound finite owner declaration", () => {
  for (const mode of ["synchronous", "durable"] as const) {
    const result = discriminateWorkflowMode({
      subject_id: SUBJECT,
      declarations: [sealWorkflowModeDeclaration(body(mode))],
      authority_effect: "none",
    });
    assert.equal(result.result, "pass");
    assert.equal(result.mode, mode);
    assert.equal(result.provider_heuristic_used, false);
    assert.equal(result.authority_effect, "none");
  }
});

test("keeps absent and conflicting declarations owner-blocked", () => {
  assert.equal(
    discriminateWorkflowMode({ subject_id: SUBJECT, declarations: [], authority_effect: "none" }).diagnostic,
    "AOP_WF_MODE_OWNER_BLOCKED",
  );
  assert.equal(
    discriminateWorkflowMode({
      subject_id: SUBJECT,
      declarations: [sealWorkflowModeDeclaration(body("synchronous")), sealWorkflowModeDeclaration(body("durable"))],
      authority_effect: "none",
    }).diagnostic,
    "AOP_WF_MODE_CONFLICT",
  );
});

test("rejects stale declarations and provider/path/runtime heuristics", () => {
  const stale = sealWorkflowModeDeclaration(body());
  stale.mode = "durable";
  assert.equal(
    discriminateWorkflowMode({ subject_id: SUBJECT, declarations: [stale], authority_effect: "none" }).diagnostic,
    "AOP_WF_MODE_STALE_DECLARATION",
  );
  for (const key of ["provider_id", "source_path", "runtime_present"]) {
    const heuristic = { ...sealWorkflowModeDeclaration(body()), [key]: "inferred" };
    assert.equal(
      discriminateWorkflowMode({ subject_id: SUBJECT, declarations: [heuristic], authority_effect: "none" }).diagnostic,
      "AOP_WF_MODE_HEURISTIC_FORBIDDEN",
    );
  }
});
