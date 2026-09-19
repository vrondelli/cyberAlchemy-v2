# Define Context

## Context Pack Summary

- Task: `BMC-REL-001-INVOKE-DEFINE`
- Mode: `standard`
- Files selected: `10` repository sources plus the persisted runtime handoff and DomainSpec Define templates
- Obligation coverage: `100%`
- Handoff pack: `runtime`
- Strict coverage: `pass`
- Blockers in source retrieval: `0`
- Fallback exploration: `named-gaps-only`; no fallback source was needed

## Selected Evidence Denominator

| Source | SHA-256 | Obligation fit |
| --- | --- | --- |
| `decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md` | `914d227e68c4969cbf52e4fcbb4751f9ccf2b8d4e6c472b29246f96dd39d3643` | fixed D01-D08 and exact remaining blockers |
| `candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json` | `a9f659fc847f7cbfe87d7f68d02f0f996dcae9daa196275042a4e1b7ec9e62c0` | current packet state |
| `schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json` | `d68616768f5018b1023481a6cb507f8fd1b4eb0df656b518bc101cd1315508e7` | closed decision surface |
| `validators/validate-bmc-rel-001-decision-packet.mjs` | `69681598b58529d64037335e6f47935cce769c79a95fc7140daa9f77dd74b975` | live and hostile packet checks |
| `definitions/relationships/relationships.yml` | `82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1` | canonical relationship signatures |
| `definitions/DEFINITIONS.md` | `92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf` | DS-D8, D27, D29, D30 |
| `definitions/DEFINITIONS-INDEX.md` | `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb` | synchronized term index |
| `ownership-dimensions/ownership-dimensions.json` | `91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4` | exact D29 active IDs |
| `membership-kinds/membership-kinds.json` | `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c` | exact D30 active IDs |
| `.arcanum/handoff-notices/notices/HN-E1384364D9F4.json` | `5c50e7649678d5f6ef64085464402aca5a4098dff4e5d7eae192474dd2510d0a` | historical handoff and non-authority boundary |

Paths above are shortened only for readability; `evidence/RUNTIME-HANDOFF.json` owns their exact repository-relative paths.

## Inventory Selection

- Mode: `lookup`
- Lookup readiness: `pass`
- Projection conformance: `pass-with-warnings`
- Uncontrolled historical tag warnings: `153`
- Authority effect: `none`
- Selection result: no adjacent Inventory result was admitted into the evidence denominator because the exact, current BMC decision corpus and its bound canonical sources are more direct and more recent for this compilation.

The warnings are Inventory metadata residue, not a source-integrity failure and not authority for this candidate.

## Included Template Context

The DomainSpec spec baseline and its Define-stage aspect templates were selected because this target is a capability-driven DomainSpec authoring contract with typed concepts, constraints, evidence links, and a downstream Design boundary.

## Excluded Context

- Adjacent Inventory matches: excluded as less direct than the exact BMC corpus.
- Design and execution templates: excluded because this run stops at Define approval.
- Implementation sources: excluded because product implementation is forbidden and unnecessary for the Define obligations.
- One analogous local Define package: not read; repository convention was fully determined by the selected templates and mode contract.

## Context Builder Verdict

Every authoring, validation, authority, and approval obligation is covered. No unresolved retrieval question remains, and no broad exploration is permitted.
