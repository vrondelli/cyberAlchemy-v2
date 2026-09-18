# Documentation contract

**Lifecycle status:** ACTIVE_LOCAL

**Audience:** Documentation authors, reviewers, generators, and release owners.

**Owner:** ARE documentation owner.

**Last reviewed:** 2026-09-18.

**Applies to:** ARE manual release-readiness documents for Candidate 013 and successors.

**Claim ceiling:** Defines documentation structure and validation only. It grants no product approval, support promise, publication, deployment, SLO, security commitment, compliance conclusion, or external effect.

## Required metadata

Release-readiness guides carry the six visible fields above immediately after
their title. They let a reader distinguish an active local explanation from an
inactive policy, an unsupported procedure, or a generated candidate reference.

Allowed lifecycle values are:

| Status | Meaning |
| --- | --- |
| `ACTIVE_LOCAL` | Current explanatory or development guidance for the private local candidate |
| `CANDIDATE_INTERNAL` | Constructed and validated internally, without a public stability promise |
| `READINESS_ONLY` | Describes known topology and the evidence still required before use as a procedure |
| `DRAFT_INACTIVE` | Policy wording exists but no active external commitment or channel is represented |
| `NOT_APPLICABLE` | The named product boundary, such as an operated service, does not currently exist |
| `NO_SUPPORTED_PATH` | The product has no tested path for the operation described |
| `ACTIVE` | Owner-approved and verified for the exact named distribution or service |
| `RETIRED` | Preserved history that must not be followed for current operation |

Only a separate owner decision with the evidence named by the guide may move a
page to `ACTIVE`.

## Claim classes

- **Source fact:** directly derived from a named current source.
- **Observed evidence:** produced by a named test, drill, measurement, or receipt.
- **Owner decision:** selected by the owner of the exact product or policy boundary.
- **External requirement:** linked to its framework, version, applicability, and
  qualified interpretation.
- **Gap:** missing evidence or decision that limits the page's lifecycle status.

Pages must not turn a source fact into an owner decision, a passing test into a
support commitment, or a framework mapping into compliance.

## Generated documents

A generated page identifies its generator, closed input manifest, input digest,
and generation command. The generated page is a projection. Source modules and
schemas retain contract ownership. Generation fails when the manifest selects a
missing source or an unclassified contract.

## Freshness and review

Every page names a maintainer and a last-reviewed date. A source digest,
supported version, topology, contact, SLI, policy, framework, or owner change
makes the affected page stale immediately. The documentation verifier checks
structure and links. Domain owners still review meaning.

## Writing and vocabulary

The [writing-style policy](WRITING-STYLE.md) applies controlled-English checks
to the manual and product entry documents. The automated check rejects hard
structural and vocabulary findings. It reports passive voice and compound tense
for human review because these forms can preserve necessary meaning.

The check does not include the official ASD-STE100 dictionary. The manual must
not claim official or certified ASD-STE100 compliance.

## Inactive-page rule

Inactive pages may contain current facts, diagnostic commands already supported
elsewhere, missing-evidence lists, and activation criteria. They must not contain
a fake contact, invented numerical target, certification badge, untested
migration command, or instruction that presents an unqualified topology as
deployable.

## Open Questions

- Should the metadata move to parsed front matter after the documentation has a
  renderer that preserves visible lifecycle status?
- Which owner can promote this local contract into a public documentation policy?
