// @ts-nocheck
import {describe, expect, it} from "vitest";
import {deriveTrustState} from "./TrustRail.tsx";

describe("deriveTrustState", () => {
  it("requires a complete deterministic read-only receipt", () => {
    const trust = deriveTrustState({
      schema_version: "oew.adapter-receipt.v1",
      result: "pass",
      state: "receipt-complete",
      authority_effect: "none",
      protected_source_check: {read_only: true},
      determinism: {byte_identical: true},
      upstream_contract: {commit: "2cda14e89535049e49120198886bc0b82e9e630f"},
      source_run: {run_id: "SWU-OCGP-008"},
    });
    expect(trust).toMatchObject({verified: true, candidate: true, authority: "none"});
  });
});
