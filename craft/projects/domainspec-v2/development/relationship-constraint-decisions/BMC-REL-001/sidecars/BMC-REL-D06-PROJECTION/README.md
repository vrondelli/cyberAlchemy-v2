# BMC-REL-D06 Projection Sidecar

Status: `p01-p02-selected-and-applied-d06-projection-closed`

Authority effect: `canonical-domain-vocabulary-only`

Parent selection: `BMC-REL-D06-C-ONE-OWNER-PER-OWNERSHIP-DIMENSION`

## Objective

Resolve the two independent blockers between the selected D06 policy and a typed, validator-safe packet projection:

1. `BMC-REL-D06-P01-OWNERSHIP-DIMENSION-VOCABULARY` — admit the vocabulary model and its exact definitions contract.
2. `BMC-REL-D06-P02-TYPED-PACKET-REPRESENTATION` — choose a dedicated packet representation bound to the selected P01 vocabulary.

This lane is separate from D07. Completing D07 cannot satisfy either D06 projection blocker.

## P01 owner selection and canonical application

- P01 request raw SHA-256: `7bc14088699ff6a911faded4246b2805ce046292aef092680b1d789a135286fd`.
- P01 request canonical digest: `91f803f7ebec8630fbf2fd39a23d8824cb1929fbbac4b0ef7cec60d1bd771e2e`.
- P01 receipt raw SHA-256: `c7456a88c3c0cb5b4593475283e33cfd2a11d84c1db8472fe298ab7206dc0354`.
- Selected option: `BMC-REL-D06-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`.
- Owner: `user`; exact response `B` at `2026-08-23T15:26:32+01:00` after non-committal examples.
- Candidate SHA-256: `ba150cd06ce95ec374008acf48a353bafb951dad1530fa3ea09d8dd19053cd29`.
- Canonical definition: `domainspec-v2-D29` in `projects/domainspec-v2/definitions/DEFINITIONS.md`, SHA-256 `cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006`.
- Synchronized index SHA-256: `ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744`.
- Registry SHA-256: `91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4`.
- Active IDs: `lifecycle`, `custody`, `write-responsibility`.
- Every future add, revise, deprecate, or remove operation requires a fresh Definitions Governance owner decision.

## Hard dependency

P02 must not be materialized or prefiltered unless P01 has an exact owner-selected action and the P01 decision record binds:

- the selected stable option ID;
- the P01 request digest and receipt path;
- the exact selected definitions-candidate SHA-256;
- a candidate definition package with formal, plain-language, and DomainSpec-context voices.

All predicates are now satisfied by the exact P01 selection receipt and canonical bindings. This permits a fresh
P02 gate to be materialized; it does not select or apply a P02 representation. `owns` remains fully unresolved
in the main packet until a separate P02 owner selection is applied.

## P02 owner selection and candidate-packet application

After P01 closes, a fresh evidence-bound gate may consider:

- `BMC-REL-D06-P02-A-GENERIC-FIRST-CLASS-FACET` — add a generic facet to every row, with `not-applicable` outside `owns`;
- `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION` — add a schema-discriminated `owns`-only object (provisional recommendation);
- `BMC-REL-D06-P02-C-TOP-LEVEL-TYPED-PROJECTION` — add a typed packet-level projection keyed to `owns`;
- explicit defer and stop.

These are fresh candidate alternatives. The P02 request and receipt bind the exact selected P01 evidence and
post-P01 registry digest.

- P02 candidate SHA-256: `33119d1b53b1c7eaf5f2a354bb8daece9c06f689e61a823bb0c31ad7cdc0eb2f`.
- P02 request raw SHA-256: `e1e07f41a52653ca8784807515d1f883c8188b17d791bb04f5f42ac2321fcd3a`.
- P02 request canonical digest: `c4927ba3cdd0d2f0e8ffbce620efb210f6a723d361195fa300d2c5ad42214296`.
- P02 receipt raw SHA-256: `f53baa362ff33a0c3e147627afd6c4d122f170ecf5d318aea6d2f2e7b9b4f8ec`.
- Route outcome: `gate`; all three action alternatives plus defer and stop are structurally admissible.
- Selected option: `BMC-REL-D06-P02-B-OWNS-SCOPED-TYPED-EXTENSION`.
- Owner: `user`; exact response `B` at `2026-08-23T15:44:08+01:00`.
- Applied packet SHA-256: `3d2f7695197b1e8eaa1b2cfd0c2662ad0355888604ee7ad0e6e9dd34ce0107b3`.
- Applied schema SHA-256: `eabaeb7c9f37dc3d016873fa30e2dd86c6e09903f5f7bcbf3b072b2adb8ddbde`.
- Applied validator SHA-256: `03ed61edc240478430a9c5a1eaf2297682beea63d76ac6c44a792172c738def9`.
- The packet remains candidate-only, its row status and ordinary facets remain unresolved, owner disposition is
  pending, and `authority_effect` remains `none`.

## Write and claim boundary

The selected P01 and P02 routes authorize only the new DomainSpec v2 vocabulary and the closed candidate-packet
projection. They do not authorize edits to DS-D8, `relationships.yml`, generated views, implementation, or D07
artifacts.

This sidecar proves the exact P01 and P02 selections, the bounded canonical vocabulary application, and the
closed candidate-packet projection. It does not declare dimension instances or storage, select numeric bounds,
resolve other topology facets, accept the packet as a whole, authorize D07 semantics, implement product behavior,
promote, publish, release, deploy, or prove production use.

## Artifacts

- [Open decisions](./decisions/BMC-REL-D06-PROJECTION-DECISIONS.md)
- [P01 candidate](./candidates/BMC-REL-D06-P01-DEFINITIONS-CANDIDATE.md)
- [P01 request](./decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-REQUEST.json)
- [P01 receipt](./decision-gate/BMC-REL-D06-P01-OPTION-ADMISSIBILITY-RECEIPT.json)
- [P01 selection receipt](./receipts/BMC-REL-D06-P01-SELECTION-RECEIPT.json)
- [P02 candidate](./candidates/BMC-REL-D06-P02-PACKET-REPRESENTATION-CANDIDATE.md)
- [P02 request](./decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-REQUEST.json)
- [P02 receipt](./decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-RECEIPT.json)
- [P02 selection receipt](./receipts/BMC-REL-D06-P02-SELECTION-RECEIPT.json)
- [Scoped validator](./validation/validate-d06-projection-sidecar.mjs)
