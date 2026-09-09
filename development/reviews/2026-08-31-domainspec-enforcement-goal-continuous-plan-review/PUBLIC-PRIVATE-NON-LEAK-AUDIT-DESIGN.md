# Public/Private Non-Leak Audit

Status: planning candidate  
Work item: `ARC-SWU-05` under `CGC-G20`  
Selected route: `CA2-ROUTE-PLAN`  
Authority effect: none

## Product purpose

CyberAlchemy v2 can use public Arcanum techniques without turning Arcanum into
the owner or accidental publication surface of private Product meaning. The
capability needed here is not “grep four product names.” It is the ability to
prove, for one immutable outward change, which bytes were examined, where they
came from, which disclosure decision applies, which claims have evidence, and
which obligations remain unsupported.

The full auditor and its sensitive fixtures must remain in the private parent.
Putting private marker lists, withheld mechanism strings, copied-private
negative fixtures, or exact private paths into Arcanum would reproduce the
leakage it is supposed to prevent. A future public projection may contain only a
sanitized verdict, policy epoch, candidate digest, counts, and opaque finding
IDs.

## Current boundary evidence

- `cyberAlchemy-v2/authority/boundaries.md` requires a scrub for every public
  derivative, keeps private implementation/validation/telemetry/session/research
  content private, and says generated host packages are projections.
- The Saturn/DomainSpec disclosure decision permits those names and an approved
  explanation only with `intended-not-shipped` and `claim <= proof` framing.
- The engine-moat decision permits properties and supported results but withholds
  the derivation mechanism and Lean internals.
- The current public `docs/system.html` is evidence that Saturn and DomainSpec
  names are not intrinsically violations.
- The existing Inventory installed-consumer test scans eleven module-local
  surfaces with a four-alternative, case-sensitive regex. It is useful local
  evidence, but it does not cover arbitrary Arcanum changes, policy decisions,
  provenance, paraphrased private content, generated mirrors, or claim support.
- Public Arcanum is clean at revision
  `cee157fcb0c7d5a1ad0e6565aa4005660ed9252f`, with 9,577 tracked files:
  1,556 canonical/runtime, 119 docs, 548 generated/local projections, and 7,354
  history/test/evidence files under the current path classifier.

## Policy-epoch gaps

Two contradictions must be owner-resolved rather than encoded as silent
allowlist entries:

1. The active disclosure decision says the internal name `Necronomicon` stays
   private, while current public canonical source contains
   `arcanum/spells/necronomicon/README.md`. No later disclosure decision was
   found in the selected decision set.
2. The active boundary says the Saturn/DomainSpec slice is only a partial
   resolution and broader slices remain open, while current public docs contain
   substantial Craft and CyberAlchemy product prose. No exact Craft/CyberAlchemy
   disclosure decision was found in the selected decision set.

These findings do not retroactively declare the public tree rejected. They make
the policy epoch ambiguous. A new candidate that touches one of those ambiguous
surfaces is `not_evaluable` until the boundary owner supplies a superseding or
clarifying immutable decision. An unrelated candidate may continue if its exact
selected dependencies do not intersect the ambiguity. A full-tree publication
audit cannot pass while either gap remains open.

## Audit boundary

The default unit is one immutable candidate change, never an ambient worktree:

- exact Arcanum base revision and candidate-tree identity;
- sorted changed-path manifest with operation, old/new digest, byte size, media
  type, surface class, and owner;
- normalized textual hunk/block manifest with byte ranges and block digests;
- generated-projection map from every mirror to its canonical public source and
  generator version;
- provenance assertion for every added or modified public text block;
- exact boundary-policy epoch and disclosure-decision bindings;
- evidence references for every outward empirical or shipped-state claim.

Deleted paths remain in the denominator. Binary, unsupported encoding, symlink,
submodule, path escape, unreadable input, missing base, duplicate path, or
candidate-tree mismatch is `BLOCK`, not an exclusion.

## Provenance classes

Every changed text block selects one class:

| Class | Requirement |
|---|---|
| `new-public-original` | Public owner attests the block was authored for the public artifact and names its claim evidence. |
| `public-source-derived` | Exact public source path, selector, digest, and transformation are bound. |
| `private-derived-approved-disclosure` | Exact private source and disclosure decision are bound in the private receipt; public output receives no private bytes or locators. |
| `generated-from-public-canonical` | Canonical public source and deterministic generator/mirror parity are proven. |
| `historical-existing-residue` | The bytes predate the candidate and are reported separately; the class cannot authorize copying or modifying them. |

Missing, conflicting, or unverifiable provenance is `BLOCK`. Private-derived
content without an applicable exact disclosure decision is `BLOCK`. Policy
ambiguity over an otherwise declared sensitive term is `not_evaluable`.

## Deterministic checks

1. **Candidate identity:** base, candidate, diff, path list, and block list
   digests close exactly.
2. **BTE denominator closure:** every changed path and changed block belongs to
   exactly one declared class; no binary, deletion, generated file, or exclusion
   disappears from counts.
3. **Containment:** reject absolute private paths, parent escapes, symlink
   escapes, unowned submodules, and private-root locators after Unicode
   normalization and case folding.
4. **Exact private markers:** reject private repository IDs, HN/session IDs,
   CA2/CAV2 internal identifiers, private telemetry/session locators, and other
   policy-owned markers. Findings contain category and digest, never matched
   secret text.
5. **Withheld mechanism:** reject selected engine-mechanism classes and
   unapproved internal names. Sensitive patterns live only in the private
   policy pack.
6. **Disclosure framing:** Saturn/DomainSpec naming requires the exact disclosure
   decision, honest shipped-state posture, and evidence for empirical claims.
7. **Policy ambiguity:** Craft, CyberAlchemy product prose, and Necronomicon
   changes select the open policy gaps until an owner decision closes them.
8. **Provenance:** reject undeclared private derivation and verify exact public
   derivations. Similarity search is diagnostic unless its source corpus and
   threshold are frozen; an owner reviews semantic paraphrase risk.
9. **Generated boundary:** scan canonical public source first, prove generator
   identity and mirror parity, then scan generated output. A filled private
   profile or consuming-repository locator is forbidden.
10. **Claim support:** each outward result, metric, shipped-state, or authority
    claim has an exact public-safe evidence reference and bounded claim kind.
11. **EVF composition:** compose deterministic scan, provenance, policy,
    claim-support, generated-parity, and independent-review evidence without
    strengthening their weakest claim.
12. **Sanitized projection:** prove that the public receipt contains no private
    path, matched bytes, private decision body, private source digest mapping, or
    secret pattern corpus.

## EVF and BTE roles

EVF is the evidence-composition surface. It may establish that an exact-marker
scan passed over declared text bytes, that provenance was resolved, and that an
owner reviewed semantic risk. It must preserve the weakest result: a regex pass
cannot become “no private meaning leaked,” and a human review cannot repair a
missing denominator or stale decision digest. Unsupported obligations remain
visible.

BTE owns breadth. Its account freezes total changed paths, operations, text
blocks, binary/unreadable inputs, generated projections, policy-sensitive
blocks, claim-bearing blocks, provenance classes, scanned bytes, and every
exclusion attempt. Each check reports numerator, denominator, and residue. Zero
silent omissions is a precondition for any aggregate `PASS`.

This audit can later provide one independent EVF consumer vertical, but it does
not close the current EVF/BTE corpus, producer-ID, legacy-resolver,
16-versus-17, eleven-owner-artifact, or independent-consumer gaps in `CGC-G12`
through `CGC-G17`.

## Verdicts

- `PASS`: exact candidate denominator closed; all deterministic checks pass;
  all sensitive terms have current decisions; all claim evidence and required
  independent review are present.
- `BLOCK`: exact leak, path escape, hidden input, undeclared provenance,
  forbidden mechanism, stale digest, incomplete denominator, unsafe generated
  projection, or unsanitized receipt.
- `NOT_EVALUABLE`: the candidate intersects a missing/ambiguous owner policy or
  required semantic review whose decision does not yet exist.

All findings are collect-all. A blocker does not erase dependent checks; they
are emitted as `not_evaluable` with causal blocker IDs.

## Required fixtures

Positive fixtures include a generic public capability change, approved
Saturn/DomainSpec intended-not-shipped explanation, results-only engine claim
with exact evidence, unchanged historical residue, and a deterministic public
canonical-to-mirror generation.

Negative fixtures include a private path, case/Unicode-obfuscated marker,
private paragraph copy, withheld mechanism, internal identifier, filled private
profile in a mirror, symlink escape, binary addition, missing diff path, stale
decision digest, unsupported empirical claim, leaked matched text in the
receipt, and a modified grandfathered line. Policy fixtures require
`NOT_EVALUABLE` for Craft/CyberAlchemy/Necronomicon changes before a resolving
decision.

Private negative fixtures remain private. A public reusable scrub may test only
generic synthetic markers.

## D65 sequence

1. Accept the exact local terms and resolve the two disclosure-policy gaps.
2. Adopt `CA2-CAP-PREVENT-PRIVATE-MEANING-LEAKAGE` through the CyberAlchemy
   Product owner.
3. Admit the capability-local business ontology and relation vocabulary.
4. Author an exact DomainSpec source/profile for candidate, provenance,
   decision, denominator, finding, EVF bundle, and sanitized receipt records.
5. Produce deterministic compiled graph and system ontology.
6. Implement the private audit runtime and synthetic public scrub separately.
7. Bind one immutable implementation and policy epoch in a new
   `ConstructionBinding`.
8. Run negative mutation, semantic owner review, sanitized-output, and
   independent consumer conformance.
9. Only then make the audit a required pre-publication gate through a separate
   owner decision.

Later stages remain `not_evaluable`; neither this design nor the existing
Inventory test is an admitted enforcement gate.

## Required owners

- CyberAlchemy Product and boundary owner: Product fit and disclosure policy.
- Craft Project owner: continuous-Goal integration and consumer suitability.
- Private source owners: derivation and withholding classification.
- Public Arcanum owner: public candidate bytes and generated surfaces.
- DomainSpec owner: source/profile and deterministic projection.
- Auditor implementation owner: private runtime and sanitized projection.
- EVF/BTE owners: evidence composition and exact denominator contract.
- Independent conformance owner: negative mutants and one real consumer run.

## Claim ceiling

This is a source-bound planning design. It does not resolve the Necronomicon or
Craft/CyberAlchemy disclosure gaps, adopt the Product Capability, admit the
ontology or DomainSpec source, implement or run an auditor, prove any current
public artifact safe, close EVF/BTE gaps, create a `ConstructionBinding`, make a
publication gate mandatory, mutate Arcanum or generated mirrors, publish,
release, deploy, or prove the Goal achieved.
