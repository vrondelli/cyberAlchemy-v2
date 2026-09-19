# Outcome Brief

The new addition is defined and designed as a safe connection between expressive
formal claims and narrower executable tools. A formal-claims owner can state
standard many-sorted FOL with equality, while a separate validation-owned
assessment says whether an exact TDE projection, SMT profile, or proof route is
available.

This matters because DomainSpec can preserve the full intended meaning without
pretending every claim is decidable or executable. Unsupported, unknown,
timeout, stale, incomplete, or wider-than-source evidence never passes.

- Objective: improve the existing FormalClaim ontology branch with expressive
  source FOL and explicit downstream capability boundaries.
- Result: Define pass plus local `design-validator-pass` with fixed-point selection.
- Why it matters: source meaning can be richer than current QF_LIA and TDE
  profiles without weakening determinism, owner boundaries, or evidence honesty.

# Boundary and Next Decision

- Changed: private run-local context, Define, Design, selection, Distill, and
  validation evidence for `dsv2-formalclaim-fol-profile-extension@1`.
- Unchanged: frozen @4, Craft, canonical ontology, product, TDE/EVF/SMT runtime,
  owner and verifier admission, migration, execution, proof, discharge,
  promotion, publication, release, deployment, and Git.
- Open questions: whether the exact successor bytes should enter a separately
  governed owner/verifier admission route, and later whether to authorize Plan evidence.
- User decision: none was required to finish this candidate Define and Design.
- Next action: parent review, then exact-byte successor owner/verifier admission
  if the primary owner chooses to advance it.

# Technical Details

## Invoke Result

- Modes: define then design
- Spell: invoke
- Candidate: `dsv2-formalclaim-fol-profile-extension@1`
- Define status: pass for this request's Design authoring only
- Design status: pass
- Design evidence state: `design-validator-pass`
- Domain gate: `blocked-pending-successor-owner-and-verifier-admission-and-future-plan-evidence`
- Six views: context, high-level structure, low-level components, workflow
  process, decision flow, dependency interface
- Denominator signals: 17, with no missing or unbound inputs
- Selected concerns: authority/trust, integration/versioning, validation contracts
- Fixed-point digest: `2a8d8b42d2c1d7298dad5e3437f27dcb3e8b6846732f56ef2de243082f741543`
- Selection result digest: `70990b1b3dc02597c4ca91a213046c24ff6ec1e7d633a9895e6a8fb2be14c8a2`
- Distill: pass; the source contract plus capability assessment is the smallest coherent unit
- Planned witnesses: 11, all unimplemented and unexecuted
- Plan evidence: pending future separate Plan
- Work Pack: n/a
- Authority effect: none

## Plain examples

- `price >= 0`: valid source FOL and a current QF_LIA candidate.
- `forall account exists owner`: valid source FOL, but not the current QF_LIA profile.
- `every request eventually completes`: temporal, so it is not this FOL.
- unbounded graph acyclicity: needs closure/fixed-point semantics or an explicit
  finite bound; a bounded result proves only that bound.

## Main artifacts

- `define/SPEC.md`
- `define/GLOSSARY.md`
- `design/ARCHITECTURE.md`
- `design/SOURCE-CONTRACTS.md`
- `design/DESIGN-SCOPE-MANIFEST.json`
- `design/DESIGN-DENOMINATOR-RECEIPT.json`
- `design/DESIGN-SELECTION-RESULT.json`
- `design/DISTILL-VALIDATION.md`
- `validation/VALIDATION.json`
