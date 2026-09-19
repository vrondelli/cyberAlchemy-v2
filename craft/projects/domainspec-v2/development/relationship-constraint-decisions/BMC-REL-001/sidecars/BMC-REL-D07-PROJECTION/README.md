# BMC-REL-D07 Projection Sidecar

Status: `canonical-vocabulary-and-p02-candidate-projection-applied`

Authority effect: `canonical-domain-vocabulary-only; candidate-packet-projection-only`

Decision effect: `p02-selected-and-applied-candidate-only`

This sidecar carries the separately governed projection work required by the owner's D07 selection,
`BMC-REL-D07-C-ONE-DIRECT-MEMBERSHIP-PER-GOVERNED-KIND`. P01 selected
`BMC-REL-D07-P01-B-GOVERNED-EXTENSIBLE-REGISTRY`: a finite digest-bound registry governance model with
owner-gated add, revise, deprecate, and remove operations. The owner then selected
`BMC-REL-D07-P01-CONTENTS-A-MINIMAL-TWO-KIND`, admitting exactly the candidate meanings for active IDs
`classification` and `home-assignment` as the contents to project. The owner then accepted the exact three-target
package through `BMC-REL-D07-P01-CONTENTS-APPLY-A-APPLY-EXACT-CANONICAL-PACKAGE`; D30, its index row, and the
machine registry were applied byte-identically to the accepted staged postimages. Post-apply validation found two
broken D30 evidence anchors, so the first atomic edge was rolled back exactly. The owner then selected
`BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE` through exact `A` at
`2026-08-23T18:17:44+01:00`. The repaired D30, index, and registry are now canonical at exact hashes
`92f31e0a...`, `d0c8032b...`, and `854ff80f...`; canonical link/content/docs/registry validation passes. The owner
then selected P02 option `BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION` through exact `B` at
`2026-08-23T18:38:33+01:00`. The candidate packet now carries one closed `belongs-to`-only
`membership_topology` object; the schema discriminator and main validator enforce the exact registry-bound policy
while all ordinary `belongs-to` facets remain unresolved.

## Artifact map

- `candidates/BMC-REL-D07-P01-DEFINITIONS-CANDIDATE.md` — P01 vocabulary-model options, recommendation, and Explain-path ladder.
- `decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-REQUEST.json` — caller-supplied structural statuses.
- `decision-gate/BMC-REL-D07-P01-OPTION-ADMISSIBILITY-RECEIPT.json` — canonical Decision Gate prefilter output.
- `receipts/BMC-REL-D07-P01-SELECTION-RECEIPT.json` — exact P01 owner-selection binding.
- `candidates/BMC-REL-D07-P01-CONTENTS-DEFINITIONS-CANDIDATE.md` — exact initial active-ID package options and three-voice candidate meanings.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-REQUEST.json` — initial-contents structural statuses.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-OPTION-ADMISSIBILITY-RECEIPT.json` — initial-contents prefilter output.
- `receipts/BMC-REL-D07-P01-CONTENTS-SELECTION-RECEIPT.json` — exact contents owner-selection binding.
- `staged/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-MANIFEST.json` — exact target/preimage/postimage inventory.
- `staged/targets/projects/domainspec-v2/definitions/DEFINITIONS.md` — complete proposed post-apply definitions bytes with D30.
- `staged/targets/projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` — complete proposed post-apply index bytes.
- `staged/targets/projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json` — proposed two-ID registry bytes.
- `candidates/BMC-REL-D07-P01-CONTENTS-APPLY-CANDIDATE.md` — exact apply/defer/stop owner gate and Explain ladder.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-REQUEST.json` — package structural statuses.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json` — canonical package prefilter output.
- `decisions/BMC-REL-D07-PROJECTION-DECISIONS.md` — durable D07/P01/contents selections and open package gate.
- `validators/validate-bmc-rel-d07-projection.mjs` — exact-binding, boundary, and hard-dependency validator.
- `validators/validate-bmc-rel-d07-p01-contents.mjs` — P01 selection and contents-gate validator.
- `validators/validate-bmc-rel-d07-canonical-package.mjs` — exact staged-package, drift, registry, and hostile-probe validator.
- `receipts/BMC-REL-D07-P01-PREPARATION-RECEIPT.json` — preparation and validation receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-PREPARATION-RECEIPT.json` — contents-gate preparation and validation receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-CANONICAL-PACKAGE-PREPARATION-RECEIPT.json` — exact package owner-gate receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-APPLY-SELECTION-RECEIPT.json` — exact package owner-selection binding.
- `receipts/BMC-REL-D07-P01-CONTENTS-ATOMIC-APPLY-RECEIPT.json` — atomic canonical pre/postimage receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-LINK-FAILURE-ROLLBACK-RECEIPT.json` — exact recoverable rollback receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-POST-APPLY-LINK-DEFECT-RECEIPT.json` — governance-defect diagnosis and repair boundary.
- `staged/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-MANIFEST.json` — fresh repaired three-target manifest.
- `receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-INDEPENDENT-REVIEW-BINDING.json` — deterministic delta and anchor review.
- `candidates/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-CANDIDATE.md` — renewed action/defer/stop gate and Explain ladder.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-REQUEST.json` — repair structural statuses.
- `decision-gate/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-OPTION-ADMISSIBILITY-RECEIPT.json` — repair prefilter receipt.
- `validators/validate-bmc-rel-d07-link-repair-package.mjs` — permanent pre-acceptance staged-anchor validator.
- `receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-PREPARATION-RECEIPT.json` — renewed owner-gate preparation receipt.
- `receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-SELECTION-RECEIPT.json` — exact renewed owner selection.
- `receipts/BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-ATOMIC-APPLY-RECEIPT.json` — repaired canonical apply and validation receipt.
- `candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md` — P02 action/defer/stop options and Explain ladder.
- `decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json` — P02 caller-owned structural statuses.
- `decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json` — canonical P02 prefilter output.
- `validators/validate-bmc-rel-d07-p02.mjs` — exact D30/registry/P02 gate validator.
- `receipts/BMC-REL-D07-P02-PREPARATION-RECEIPT.json` — P02 preparation and owner-gate receipt.
- `receipts/BMC-REL-D07-P02-SELECTION-RECEIPT.json` — exact P02 owner selection and candidate apply binding.

## Hard dependency

The P02 vocabulary dependency is satisfied by the exact repaired canonical package:

1. Definitions Governance accepted the exact package-gate action option;
2. the initial broken-link application was rolled back exactly with no partial state;
3. Definitions Governance separately accepted the fresh two-anchor repair;
4. the repaired D30 card, index, and registry were applied atomically against exact preimages; and
5. semantic voices, registry closure, byte equality, local anchors, docs/content, and scoped format checks pass.

P02 selected policy `one-parent-per-admitted-membership-kind`, exact registry path/digest, `belongs-to`-only scope,
and no existence condition. Decision ID is `BMC-REL-D07-P02-TYPED-PACKET-REPRESENTATION`; selected option is
`BMC-REL-D07-P02-B-BELONGS-TO-SCOPED-TYPED-EXTENSION`. Its application changes only the candidate packet,
packet schema, and main packet validator. It does not create per-fact kind instances or storage, resolve an
ordinary topology facet, require membership, or grant packet-wide acceptance.

Design labels in examples remain non-authoritative. Selection receipt SHA-256 is
`5a680b76fa8eef8fe4676e4deeae67c59e22f2ae0a1d825b92a55262643ff65c`.

## Claim ceiling

This sidecar proves the exact D07, P01 governance-model, minimal two-kind contents, recoverable rollback after the
first two-anchor defect, exact repaired canonical D30/index/registry application, and selected P02 candidate-packet
projection. It does not declare kind instances or storage, require membership, resolve numeric or ordinary
topology facets, change relationship authority, implement enforcement, accept the packet as a whole, decide D08,
or authorize promotion, publication, release, deployment, or production use.
