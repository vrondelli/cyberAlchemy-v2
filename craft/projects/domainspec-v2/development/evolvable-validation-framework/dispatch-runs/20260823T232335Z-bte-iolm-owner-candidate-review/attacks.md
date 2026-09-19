# EVF BTE/IOLM owner-candidate review attacks

These are the two attacker returns preserved verbatim. Their domain-gate status is evidence, not owner authority.

## Attack A1 — BTE formal provenance reconstruction

```json
{
  "task_status": "completed",
  "domain_gate_status": "blocked",
  "lane_id": "bte-owner-candidate-reviewer",
  "source_bindings": {
    "request": {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/refreshes/20260823T124309Z-l3-17-signature-proposal-only/requests/BTE-FREEZE-ADMISSION-CATALOGUE-REQUEST.json",
      "sha256": "51ecbe399d0257b1a46ec52b74375b3ef8172bce212105b98dbe9c93ea63f2d6"
    },
    "terminal_receipt": {
      "sha256": "2d92d46fd4ff21e607480072895976a95c4fcb0f9810d0aacd06b8b1ed7b397a",
      "size_bytes": 5419
    },
    "frozen_creates_oracle": {
      "sha256": "ede9079af3d179a6d6069f07ac27dd39d2fb8626b4a690e53743d291482db1b5",
      "size_bytes": 8332
    },
    "relationship_registry": {
      "sha256": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
      "size_bytes": 26867
    },
    "candidate_profile": {
      "sha256": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85",
      "size_bytes": 3444,
      "status": "candidate",
      "release_admission": "not-granted",
      "kind_count": 13,
      "relationship_count": 17
    },
    "formation_projection": {
      "sha256": "c87233acac710956215f875d88b52855d5df4e62c863194e813069c49d1fdd9d",
      "size_bytes": 8110,
      "status": "candidate",
      "kind_count": 13
    },
    "formation_corpus": {
      "sha256": "a4cb82c5eea47f5cbd7d2d007700e668614636b6054910d7964bfdd9a2584158",
      "size_bytes": 3551,
      "declared_case_count": 26,
      "observed_case_count": 26
    },
    "exact_relationship_membership": [
      "performs",
      "produces",
      "produces-for",
      "creates",
      "triggers-cross",
      "enforces",
      "calculates",
      "transitions",
      "exposes",
      "orchestrates",
      "applies",
      "maps",
      "contains",
      "reads",
      "emits",
      "owns",
      "belongs-to"
    ]
  },
  "candidate_responses": [
    {
      "requested_output_id": "bte-l0b-validation-owner-freeze",
      "owner_identity": "unresolved-independent-owner",
      "owner_role": "independent BTE validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/l0/red-fixture-freeze-receipt.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "terminal_receipt": "2d92d46fd4ff21e607480072895976a95c4fcb0f9810d0aacd06b8b1ed7b397a"
      },
      "validation": "Target absent; no independently authored package-local freeze receipt is available.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "formation-v2-admission",
      "owner_identity": "unresolved-formation-contract-owner",
      "owner_role": "formation-contract owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/admissions/formation-v2-admission.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "formation_projection": "c87233acac710956215f875d88b52855d5df4e62c863194e813069c49d1fdd9d",
        "formation_corpus": "a4cb82c5eea47f5cbd7d2d007700e668614636b6054910d7964bfdd9a2584158"
      },
      "validation": "The candidate projection contains 13 kinds and the corpus contains its declared 26 cases, but the owner admission target is absent.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "candidate-profile-admission-for-bte-core",
      "owner_identity": "unresolved-profile-owner",
      "owner_role": "profile owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/admissions/complete-backend-criteria-v2-admission.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85"
      },
      "validation": "Profile remains candidate with release_admission not-granted; independent admission target is absent.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "node-pattern-admission",
      "owner_identity": "unresolved-node-pattern-owner",
      "owner_role": "node-pattern owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/admissions/node-pattern-admission.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85",
        "formation_projection": "c87233acac710956215f875d88b52855d5df4e62c863194e813069c49d1fdd9d"
      },
      "validation": "No independently authored node-pattern admission exists at the requested locator.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "exact-17-relationship-admission",
      "owner_identity": "unresolved-relationship-and-profile-owners",
      "owner_role": "relationship/profile owners",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/admissions/relationship-profile-17-admission.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "relationship_registry": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85",
        "frozen_creates_oracle": "ede9079af3d179a6d6069f07ac27dd39d2fb8626b4a690e53743d291482db1b5"
      },
      "validation": "The candidate profile contains exactly 17 unique relationship IDs and includes creates, but no joint owner admission exists.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "formation-criterion-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/formation-criterion-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "formation_projection": "c87233acac710956215f875d88b52855d5df4e62c863194e813069c49d1fdd9d"
      },
      "validation": "Requested denominator is 16; no independently frozen catalogue exists.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "formation-structure-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/formation-structure-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "formation_projection": "c87233acac710956215f875d88b52855d5df4e62c863194e813069c49d1fdd9d"
      },
      "validation": "Projection supplies 13 kind entries; no independently frozen 13-entry catalogue exists.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "node-kind-causality-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/node-kind-causality-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85"
      },
      "validation": "Profile supplies 13 kinds; no independent causality freeze exists.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "node-instance-conformance-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/node-instance-conformance-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85"
      },
      "validation": "No independently bound exact-build-node-id set or freeze artifact exists at the requested locator.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "relationship-family-causality-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/relationship-family-causality-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "relationship_registry": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85",
        "frozen_creates_oracle": "ede9079af3d179a6d6069f07ac27dd39d2fb8626b4a690e53743d291482db1b5"
      },
      "validation": "Current profile and proof-engine tests use 17 including creates, but PLAN.md and TASK-BTE-L4-CATALOGUES.md still state 16; no independent 17-entry freeze resolves that lifecycle inconsistency.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    },
    {
      "requested_output_id": "edge-instance-conformance-freeze",
      "owner_identity": "unresolved-independent-validation-owner",
      "owner_role": "independent validation owner",
      "decision": "block",
      "path": "projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/validation-inputs/catalogues/edge-instance-conformance-at-1.freeze.json",
      "sha256": null,
      "size_bytes": null,
      "bound_input_digests": {
        "relationship_registry": "82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1",
        "candidate_profile": "2a339fb1eaf7a9913be42a2c6b07a68c33254cd56c770b0c32b1d189a83cfc85"
      },
      "validation": "No independently bound exact-build-edge-id set or freeze artifact exists at the requested locator.",
      "authority_effect": "none",
      "release_admission": "not-granted"
    }
  ],
  "validation_commands": [
    "sha256sum <request-and-six-bound-input-paths>",
    "wc -c <six-bound-input-paths>",
    "jq '.profiles[] | select(.id == \"complete-backend-criteria\")' projects/domainspec-v2/definitions/minted-project/supported-profiles.yml",
    "jq '.kinds | length' projects/domainspec-v2/definitions/minted-project/formation-projection.v1.json",
    "jq '{declared:.case_count,observed:(.cases|length)}' projects/domainspec-v2/impl/spec/minted-project/formation-golden-corpus.v1.json",
    "test -e <each-of-eleven-requested-output-paths>",
    "rg -n 'relationship-family-causality@1|17/17|creates' projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness projects/domainspec-v2/development/evolvable-validation-framework projects/domainspec-v2/definitions projects/domainspec-v2/impl"
  ],
  "blockers": [
    "All eleven requested canonical output paths are absent.",
    "All eleven available packet files are null-field templates explicitly invalid until independently authored and materialized by their named owners.",
    "The complete-backend-criteria profile remains candidate and explicitly grants no release admission.",
    "The 17-member profile is internally exact and includes creates, but BTE PLAN.md and TASK-BTE-L4-CATALOGUES.md retain a stale 16-member relationship-family denominator.",
    "No exact build-node-ID or build-edge-ID freeze evidence was found at the requested canonical locators.",
    "This reviewer lacks authority to impersonate any requested owner or convert evidence sufficiency into owner acceptance."
  ],
  "residue": [
    "The eleven block responses are complete review candidates, not canonical owner responses.",
    "A named owner may use the verified live digests and exact 17-member list to author fresh response bytes.",
    "Any passing candidate must be independently validated after materialization so its own path, digest, and size are real rather than predicted.",
    "The 16-to-17 BTE catalogue wording mismatch requires explicit reconciliation before relationship-family freeze can pass."
  ],
  "authority_ceiling_check": {
    "status": "pass",
    "actions_taken": [
      "read_declared_inputs",
      "run_read_only_validation",
      "return_candidate_response_content"
    ],
    "actions_not_taken": [
      "repository_write",
      "owner_impersonation",
      "canonical_admission",
      "proposal_acceptance",
      "canonical_apply",
      "readiness",
      "promotion",
      "release",
      "deployment",
      "git_transport"
    ],
    "repository_writes": false,
    "owner_acceptance_claimed": false
  }
}
```

## Attack A2 — IOLM adversarial consumer-conformance replay

```json
{
  "task_status": "completed",
  "domain_gate_status": "blocked",
  "lane_id": "spawn-0002-iolm-owner-candidate-reviewer",
  "source_bindings": [
    {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/refreshes/20260823T124309Z-l3-17-signature-proposal-only/requests/IOLM-DSC-A-PREREQUISITE-REQUEST.json",
      "sha256": "7f081629855d6179076d301850b266972f2e3eecb3485983ac12bfded117d225",
      "size_bytes": 1193
    },
    {
      "path": "cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml",
      "sha256": "1b1e4ed428c35ee4f85ed2ebc25a24acd3df26b77843a3c0310a0d6be3cd81ca",
      "size_bytes": 3122,
      "binding_status": "matches-current-request"
    },
    {
      "path": "cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/receipt.schema.json",
      "sha256": "2b2154afa8243d29802e9e98cc8ec2c8c6874cc5c9f369b3b3e26dfad7de5367",
      "size_bytes": 9719
    },
    {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/decision-runs/20260823T201735Z-iolm-predecessor/DECISION.json",
      "sha256": "602ccaf5edd7eed899b06d9e2ffae809d6901bbaa0d02effea698818bb314c5c",
      "size_bytes": 1935,
      "effect": "preserves-DSC-A-but-supplies-no-receipt"
    },
    {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/owner-response-packets/20260823T195640Z-runtime-repair-and-p0/iolm-01-private-product-owner.json",
      "sha256": "0dc7675951a58079ab1b041195f48ce1fe446ec8d96d60eb0fef5b968dd603a0",
      "size_bytes": 1639,
      "status": "template-awaiting-independent-owner-authorship"
    },
    {
      "path": "projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/attempt-001/validation-receipt.json",
      "sha256": "0d3e612697e640aa0a286a63e13c3f4226d4d5530ac6cd52a407800278f45bba",
      "status": "pass",
      "claim_ceiling": "candidate-local-SWU-GCP-001-causal-proof-only"
    },
    {
      "path": "cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json",
      "sha256": "49c2e3c76888f85ac9930fcf57ca08030c2d894d1a670999dd4b354299479cbd",
      "result": "block"
    }
  ],
  "candidate_response": {
    "disposition": "defended-block",
    "request_id": "EVF-L3-P0-IOLM-DSC-A-REQUEST-001",
    "owner_response": null,
    "owner_identity": null,
    "decision": null,
    "exact_path": null,
    "sha256": null,
    "size_bytes": null,
    "bound_upstream_handle": null,
    "validation": {
      "contract_binding": "pass",
      "predecessor_selection": "keep-dsc-a-and-produce-passing-receipt",
      "exact_dsc_a_receipt_search": "fail-none-found",
      "declared_run_directory": "absent",
      "candidate_substrate_dependency": "fail-SWU-IOLM-00C-B-blocked",
      "schema_conformance": "not-runnable-no-candidate-receipt",
      "planning_owner_substitution_check": "pass-template-and-decision-rejected-as-receipt"
    },
    "authority_effect": "none",
    "reason": "No exact passing SWU-IOLM-DSC-A receipt exists in the admitted private IOLM corpus. The owner-response packet is explicitly an invalid uncompleted template, the predecessor decision explicitly has receipt_effect none, and the controlling task contract says DSC-A remains blocked and unselected. The declared domainspec-consumer run directory is absent. A valid response therefore cannot supply an exact locator, bound upstream handle, or passing validation without owner impersonation or fabricated execution evidence."
  },
  "validation_commands": [
    "sha256sum cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/consumer-contract.yml cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/receipt.schema.json",
    "sha256sum projects/domainspec-v2/development/evolvable-validation-framework/refreshes/20260823T124309Z-l3-17-signature-proposal-only/requests/IOLM-DSC-A-PREREQUISITE-REQUEST.json projects/domainspec-v2/development/evolvable-validation-framework/owner-response-packets/20260823T195640Z-runtime-repair-and-p0/iolm-01-private-product-owner.json projects/domainspec-v2/development/evolvable-validation-framework/decision-runs/20260823T201735Z-iolm-predecessor/DECISION.json",
    "find cyberAlchemy-v2/development/interactive-ontology-learning-map/prototype/runs/domainspec-consumer -type f -print",
    "find cyberAlchemy-v2/development/interactive-ontology-learning-map cyberAlchemy-v2/development/domainspec-v2/iolm-consumer projects/domainspec-v2/development/evolvable-validation-framework projects/domainspec-v2/impl -type f \\( -iname '*receipt*.json' -o -iname '*receipt*.yml' -o -iname '*receipt*.yaml' \\) -print",
    "jq . cyberAlchemy-v2/development/domainspec-v2/iolm-consumer/receipt.schema.json projects/domainspec-v2/development/evolvable-validation-framework/owner-response-packets/20260823T195640Z-runtime-repair-and-p0/iolm-01-private-product-owner.json projects/domainspec-v2/development/evolvable-validation-framework/evidence/SWU-GCP-001/attempt-001/validation-receipt.json cyberAlchemy-v2/development/interactive-ontology-learning-map/work-pack/session-evidence/SWU-IOLM-00C-B/execution-receipt.json"
  ],
  "blockers": [
    "No fresh schema-valid SWU-IOLM-DSC-A receipt or exact receipt locator exists.",
    "SWU-IOLM-00C-B is blocked; the required passing 00C-B/C candidate-substrate handle is unavailable.",
    "The successful SWU-GCP-001 evidence is only upstream evidence and does not itself provide the nine-handle DSC-A consumer binding or IOLM replay.",
    "No deterministic IOLM rebuild, graph/hierarchy/table/GET parity result, semantic invariance result, or eleven-class negative-suite receipt exists.",
    "Only the private IOLM product owner may author the requested owner response."
  ],
  "residue": [
    "DSC-A remains the selected predecessor.",
    "DSC-B remains blocked until a fresh DSC-A pass exists.",
    "The P0 IOLM prerequisite remains unsatisfied.",
    "An owner-run DSC-A Task Session must first clear candidate-substrate dependencies, consume the exact EVF handle set, run every contract validation, and emit a fresh receipt under prototype/runs/domainspec-consumer/<run-id>/."
  ],
  "authority_ceiling_check": {
    "status": "pass",
    "repository_writes": 0,
    "owner_impersonation": false,
    "predecessor_changed": false,
    "dsc_a_accepted": false,
    "proposal_accepted": false,
    "canonical_apply": false,
    "readiness_or_release_claimed": false,
    "authority_effect": "none"
  }
}
```
