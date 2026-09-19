# EVF L3 P0 owner-evidence review attacks

Dispatch: `2026-08-23-evf-l3-p0-owner-evidence-review`

The following host-native returns are preserved without semantic alteration. JSON whitespace is normalized. The parent separately verified the live BTE path set, continuation claim, IOLM locator search surface, and dirty-target hashes before synthesizing findings.

## spawn-0001 — BTE prerequisite auditor

```json
{
  "action_id": "spawn-0001",
  "role": "bte-prerequisite-auditor",
  "capability": "review",
  "target": "EVF-L3-P0-BTE-PREREQUISITES-REQUEST-001",
  "mode": "read-only-audit",
  "status": "block",
  "validation": "block",
  "finding": {
    "request_structure": "pass",
    "relationship_ids": 17,
    "requested_outputs": 11,
    "unique_output_ids": 11,
    "unique_output_paths": 11,
    "required_response_fields": 10,
    "prerequisite_admission": "blocked"
  },
  "blockers": [
    "No independently authored responses for the 11 requested BTE outputs are supplied by the in-scope evidence.",
    "The continuation result explicitly records BTE prerequisite responses as missing and exact route authorization as absent.",
    "The request has authority_effect=none, release_admission=not-granted, and no selection effect until every response and independent readiness pass.",
    "Companion P0 evidence remains unresolved: IOLM owner response, five dirty-baseline classifications, exact candidate acceptance, applied-byte inventory, and zero-blocker/zero-flag readiness PASS."
  ],
  "authority_ceiling": "Audit only; no owner decision, admission, selection, execution authorization, or release effect inferred.",
  "artifacts": [],
  "output_ref": {
    "path": "runtime-receipts/bte-prerequisite-audit.json",
    "materialized": false,
    "reason": "Mutation policy is read-only and write_scope is empty."
  },
  "input_bindings": [
    {
      "sha256": "5ac9fa2b1171fd2640f22415ea926f0e1ae05fd2cd1c434074c1e0489f56f99f",
      "size_bytes": 6634
    },
    {
      "sha256": "51ecbe399d0257b1a46ec52b74375b3ef8172bce212105b98dbe9c93ea63f2d6",
      "size_bytes": 5997
    },
    {
      "sha256": "7f081629855d6179076d301850b266972f2e3eecb3485983ac12bfded117d225",
      "size_bytes": 1193
    },
    {
      "sha256": "b058ecf591bdc9ac51db061486ce03b3f0f8ecf20f84002e699592312a139c8c",
      "size_bytes": 3053
    },
    {
      "sha256": "38461ff9157134a35f6417b1fdbc73e7141de816831cb64c91ad072cf48094e6",
      "size_bytes": 1777
    },
    {
      "sha256": "e293d9daa512d30355cb13e3c42b07860827c83af0ec5278422648d6483a57e8",
      "size_bytes": 4999
    }
  ]
}
```

## spawn-0002 — IOLM DSC-A auditor

```json
{
  "schema_version": "host-native-bounded-audit-receipt/v1",
  "action_id": "spawn-0002",
  "role": "iolm-dsc-a-auditor",
  "capability": "review",
  "target": "EVF-L3-P0-IOLM-DSC-A-REQUEST-001",
  "mode": "read-only-audit",
  "status": "completed",
  "target_verdict": "accept",
  "context_verdict": "pass-with-bounded-residue",
  "execution_admission": "blocked",
  "checks": {
    "json_parseability": "pass",
    "request_identity": "pass",
    "private_owner_boundary": "pass",
    "planning_owner_authorship_forbidden": "pass",
    "decision_options_bounded": "pass",
    "unresolved_locator_explicit": "pass",
    "dsc_b_fail_closed": "pass",
    "authority_effect_none": "pass",
    "release_admission_not_granted": "pass",
    "selection_and_task_session_forbidden_before_readiness": "pass"
  },
  "owner_gate": {
    "status": "unresolved-as-designed",
    "missing": "independently authored private IOLM product-owner response",
    "permitted_resolutions": [
      "return-exact-passing-SWU-IOLM-DSC-A-receipt",
      "return-separate-owner-decision-changing-the-predecessor"
    ],
    "claim_ceiling": "The request is structurally acceptable; it does not constitute an owner response, authorization, selection, execution admission, or release admission."
  },
  "findings": [
    {
      "id": "F-001",
      "severity": "bounded-residue",
      "classification": "governance-receipt-consistency",
      "subject": "CONTINUATION-ROUTE-RESULT.json",
      "finding": "The continuation result states that all four request artifacts are hash-bound in that result, but the supplied result exposes only their paths and no per-request sha256/size tuple or explicit aggregate-binding recipe.",
      "effect": "The live request identities recorded by this audit are not reproducible from the continuation result alone.",
      "required_revalidation": "Provide an authoritative digest manifest or regenerate the continuation result as new candidate bytes with explicit request bindings."
    }
  ],
  "scope_limitations": [
    "The referenced private IOLM consumer-contract bytes were not read because cyberAlchemy-v2/ is forbidden scope; its declared sha256 and size were therefore not independently verified."
  ],
  "input_identities": {
    "CONTINUATION-ROUTE-RESULT.json": {
      "sha256": "5ac9fa2b1171fd2640f22415ea926f0e1ae05fd2cd1c434074c1e0489f56f99f",
      "size_bytes": 6634
    },
    "BTE-FREEZE-ADMISSION-CATALOGUE-REQUEST.json": {
      "sha256": "51ecbe399d0257b1a46ec52b74375b3ef8172bce212105b98dbe9c93ea63f2d6",
      "size_bytes": 5997
    },
    "IOLM-DSC-A-PREREQUISITE-REQUEST.json": {
      "sha256": "7f081629855d6179076d301850b266972f2e3eecb3485983ac12bfded117d225",
      "size_bytes": 1193
    },
    "DIRTY-BASELINE-CLASSIFICATION-REQUEST.json": {
      "sha256": "b058ecf591bdc9ac51db061486ce03b3f0f8ecf20f84002e699592312a139c8c",
      "size_bytes": 3053
    },
    "EXECUTION-ENTRY-AND-READINESS-REQUEST.json": {
      "sha256": "38461ff9157134a35f6417b1fdbc73e7141de816831cb64c91ad072cf48094e6",
      "size_bytes": 1777
    },
    "domainspec-v2-evolvable-validation-framework-strategy-result-synthesis.md": {
      "sha256": "e293d9daa512d30355cb13e3c42b07860827c83af0ec5278422648d6483a57e8",
      "size_bytes": 4999
    }
  },
  "mutation": {
    "performed": false,
    "changed_bytes": []
  },
  "output_ref": "runtime-receipts/iolm-dsc-a-audit.json",
  "persistence": "returned-to-parent-for-persistence"
}
```

## spawn-0003 — dirty-baseline auditor

```json
{
  "schema_version": "arcanum.host-native-action-receipt/v1",
  "action_id": "spawn-0003",
  "role": "dirty-baseline-auditor",
  "capability": "review",
  "target": "EVF-L3-P0-DIRTY-BASELINE-CLASSIFICATION-001",
  "mode": "read-only-audit",
  "status": "completed",
  "observed_at": "2026-08-23T14:36:03Z",
  "repository": {
    "branch": "master",
    "head": "7e77af60ea1fa80fca20d3ebe1df41e2391df149"
  },
  "result": {
    "request_binding": "pass",
    "recorded_dirty_count": 5,
    "observed_dirty_count": 5,
    "recorded_clean_count": 1,
    "observed_clean_count": 1,
    "live_and_head_bindings_match_request": true,
    "staged_changes_within_target_set": 0,
    "diff_check": "pass",
    "owner_disposition": "blocked-no-adoption-inferred"
  },
  "classifications": [
    {
      "path": "projects/domainspec-v2/impl/package.json",
      "unit": "U1",
      "classification": "modified-relative-to-head-unstaged-live-binding-matches-request",
      "live_sha256": "f5d68ea28ab2442307b3a608d184dbd8d877c54436cf5c2b700ad73f2b141692",
      "live_size_bytes": 4283,
      "owner_decision": null
    },
    {
      "path": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.ts",
      "unit": "U2",
      "classification": "modified-relative-to-head-unstaged-live-binding-matches-request",
      "live_sha256": "18b9869d40022e12337fe329efd7bef5ddadab61b08de3c49ff2ef744ea9bf25",
      "live_size_bytes": 25429,
      "owner_decision": null
    },
    {
      "path": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-engine.test.ts",
      "unit": "U2",
      "classification": "modified-relative-to-head-unstaged-live-binding-matches-request",
      "live_sha256": "c4305293e9554af22a6e191a98b6dfc044cbdbe48f0058da97ab1f4c7be992e1",
      "live_size_bytes": 10607,
      "owner_decision": null
    },
    {
      "path": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-fixture.ts",
      "unit": "U2",
      "classification": "modified-relative-to-head-unstaged-live-binding-matches-request",
      "live_sha256": "5a9d2108044174bdc32b9b3de63b7eb6f828702028a0ae96a0bcbe8500fd272e",
      "live_size_bytes": 4063,
      "owner_decision": null
    },
    {
      "path": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-pipeline.test.ts",
      "unit": "U7",
      "classification": "modified-relative-to-head-unstaged-live-binding-matches-request",
      "live_sha256": "df02bcd88e158138b5d78e5eeac2e94cc1d9b2a10a0395b8251b4a1eb43cd180",
      "live_size_bytes": 788,
      "owner_decision": null
    },
    {
      "path": "projects/domainspec-v2/impl/test-derivation-engine/src/bte/development-pipeline.ts",
      "classification": "clean-equals-head-not-an-owner-decision-target",
      "live_sha256": "07001eb4e78039fb6293fb425cd02a232e85a72938c4fd18e50bf2ef0fbf895b",
      "live_size_bytes": 3475
    }
  ],
  "validation": {
    "input_json_parse": "pass",
    "git_status_path_scoped": "pass",
    "live_sha256_and_size_recheck": "pass",
    "head_sha256_and_size_recheck": "pass",
    "git_diff_check": "pass",
    "cached_diff_check": "pass-empty"
  },
  "authority": {
    "finding": "The five factual dirty-baseline classifications remain exact, but adopt-versus-reconcile decisions remain independently owner-supplied.",
    "next_owner": "BTE implementation and aggregate owners",
    "required_next_action": "Return one response-contract-compliant decision for each of the five modified targets.",
    "authority_effect": "none",
    "release_admission": "not-granted"
  },
  "mutation": {
    "changed_paths": [],
    "forbidden_scopes_touched": false
  },
  "output_ref": {
    "path": "runtime-receipts/dirty-baseline-audit.json",
    "materialized": false,
    "reason": "The delegated action had an empty write scope and a read-only mutation policy; this returned receipt is the bounded handoff."
  }
}
```
