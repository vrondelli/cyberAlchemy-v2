# Outcome Brief

The requested EVF postimage pass stopped before drafting because the current
36-target plan asks a material package and its generated receipt to include
their own final digest-bound bytes. The existing Candidate A artifacts define
no carrier or inner/outer exception, so authoring now would silently choose a
new package architecture and invalidate the exact-scope model.

- Objective: author 25 planning postimages and assemble future material proof
  without applying canonical targets.
- Result: one exact package-topology blocker and a validated four-option
  Decision Gate; zero postimages or canonical targets changed.
- Why it matters: the package model determines every count, digest, evidence
  path, approval scope, and later independent audit.

# Boundary and Next Decision

- Changed: eight run-local governance files in this refresh directory.
- Unchanged: all staged and canonical postimages, owner-material bytes,
  implementation, Arcanum source, Git state, authority, publication, and
  deployment.
- Open question: preserve 36 targets with two envelopes, or use the standard
  run-local evidence model and revise the canonical denominator to 34.
- User decision: select one option in `EVF-PKG-TOPOLOGY-001`, defer, or stop.
- Next action: after selection, Invoke Refresh can regenerate one coherent
  candidate; fresh exact-byte approval will still be required before any
  passing material receipt or canonical apply.

# Technical Details

## Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: `block`
- Phase status basis: one refresh-authoring blocker; requested artifact is not
  safely authorable until package topology is selected
- Handoff readiness: `blocked`
- Mutation mode: `proposal-only` (explicit)
- Outputs: this report, `refresh-report.json`, patch proposal, Decision Gate
  request/receipt/record
- Proposed changes: topology decision only
- Applied changes: none
- Material package: not produced
- Mutation ready: false
- Next route: `decision-gate`

## Blocking evidence

The Candidate A inventory declares the canonical package and producer receipt
as planning targets 24 and 25. The plan then says one package binds all 25
planning targets plus 11 owner-material targets. The current schema requires
an exact output digest for every change, while the validator hashes the
package and writes that digest into the receipt.

That creates two cycles under the one-package reading:

1. the package output reference needs the final hash of the package containing
   that reference;
2. the package needs the receipt hash while the generated receipt contains the
   package hash.

Independent read-only review found no declared non-recursive topology.

## Admissible options

1. `EVF-PKG-A-TWO-ENVELOPE` — preserve 36 using a 34-output inner package and
   a run-local 36-output outer install envelope.
2. `EVF-PKG-B-EVIDENCE-ONLY` — keep material evidence run-local and revise the
   canonical apply/audit denominators to 34/35. **Recommended.**
3. `EVF-PKG-DEFER` — preserve the current block.
4. `EVF-PKG-STOP` — stop Candidate A postimage authoring.

The public-schema-change option was rejected as outside the request and public
Arcanum owner boundary. `Explain / more context` remains available and does
not select an option.

## Live freeze

- 26/26 planning baselines match the inventory.
- 11/11 owner-material canonical targets remain absent.
- 11/11 owner-material postimages match their declared hashes and sizes.
- The Decision Gate prefilter passed with `routeOutcome=gate`.
- Invoke and Decision Gate observations were recorded at central ledger lines
  656 and 657; their reflection recommendations do not select an option.
- No postimage, package, receipt, or canonical target was authored.

## Claim ceiling

This run proves only the non-recursive packaging blocker and continued live
freeze. It does not prove EVF semantics, execution, audit, admission,
implementation, publication, deployment, or production readiness.
