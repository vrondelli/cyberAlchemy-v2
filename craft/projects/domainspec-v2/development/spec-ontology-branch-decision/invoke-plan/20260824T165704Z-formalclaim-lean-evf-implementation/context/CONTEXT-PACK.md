# Strict Planning Context — FormalClaim Lean/EVF Implementation

Mode: `standard-strict`
Route: `invoke:plan`
Authority effect: none

## Objective

Turn the accepted `dsv2-formalclaim-multiformalism-lean-extension@3` Design into
one finite execution candidate covering schemas, translation validation,
adversarial fixtures, deterministic Lean identity, a Lean theorem-provider
runtime, an EVF adapter, runtime-conformance binding, candidate migration,
integrated validation, and pre-merge preparation.

Planning may describe future repository-local writes. This run performs none of
those writes and executes no Lean theorem.

## Accepted semantic fixed point

The following meanings are closed and must not be redesigned during Plan or
implementation:

1. `FormalClaimSourcePayload/v2` is logic-neutral and owns exactly one canonical
   proposition for a claim version.
2. FOL remains an admitted profile; Lean/DTT is a native peer profile rather
   than an FOL encoding requirement.
3. A native Lean binding and a translated-to-Lean binding are distinct.
   Translation requires exact mapping, declared loss and preservation,
   independent validation, currentness, and owner acceptance.
4. Category vocabulary requires a local `CategoryModelProfile/v1`; otherwise
   the model is a typed graph or a narrower functional/order model.
5. Lean uses its own manifest, request, receipt, and EVF evidence family. The
   closed Datalog/Alloy `GraphLawProviderReceipt/v1` is not widened.
6. A failed build is `unresolved`, never proposition false. `sorry`, unexpected
   axioms, unsafe declarations, stale bytes, path-only identity, type mismatch,
   or ceiling inflation cannot yield a checked outcome.
7. Theorem evidence is separate from runtime conformance, business
   correspondence, obligation discharge, promotion, publication, release, and
   deployment.
8. The authored ontology direction remains
   `ProofObligation --derived_from--> FormalClaim --formalizes--> BusinessMeaning`.

## Authority and acceptance

- The Design was accepted by Rondelli in
  `owner-admission/RONDELLI-DESIGN-ACCEPTANCE.json` for candidate digest
  `e7e6e24c088824b158df4b8604ea852dc8df0c02f4f21977b34fc1733d0534d0`.
- That response authorizes planning and bounded implementation subject to an
  exact accepted Work Pack and Task Session admission. It cannot accept Plan
  bytes that did not yet exist.
- Rondelli is the Plan acceptance owner and semantic/primary owner.
- Constitution C12 places Victor Boscaro only at the exact frozen pre-merge
  structural-verification edge. Victor is not a Define, Design, Plan, task, or
  semantic acceptance gate.
- The C12 validator validates exact candidate/receipt bindings and requires a
  response-evidence reference and digest; it does not authenticate Victor.
  Immediately before merge, the merge owner must separately confirm that the
  response came directly from Victor.

## Current implementation substrate

- EVF already has typed contracts, Python validators, Datalog provider code,
  SMT receipt validation, and an evidence-handle pattern under
  `projects/domainspec-v2/development/evolvable-validation-framework/`.
- `GraphLawProviderReceipt/v1` remains closed to Datalog and Alloy.
- `domainspec-lean-formalization/lean-engineer/lean-toolchain` pins
  `leanprover/lean4:v4.30.0-rc2`; its `lake-manifest.json` is the dependency
  lock. These are source inputs, not provider admission.
- `domainspec-lean-formalization/lean-formalization/SchemaInstance.lean`
  contains the existing `DomainSpec.SchemaInstance.pullback_comp` theorem,
  suitable as a bounded positive integration fixture. This Plan proves no new
  theorem.
- `domainspec-lean-formalization/lean-engineer/PermGuard.lean` explicitly
  leaves JSON/parser/runtime correspondence outside the Lean theorem boundary.
- `projects/domainspec-v2/ontology/` is a local candidate instantiation with
  `authority_effect: none`; migration there is not canonical promotion.

## Planning boundaries

Allowed future implementation roots are limited to the target inventory in
this Plan. Planning artifacts cannot authorize Git, merge, promotion,
publication, release, deployment, external communication, credential access,
or network access. Research and Inventory results are nonauthority.

## Claim ceiling

This Plan can establish only that exact implementation units are coherent,
traceable, validation-bound, and ready for owner acceptance. Even after all
units pass, the maximum technical claim is: exact source and theorem evidence
contracts were implemented and validated against declared fixtures under
locked local inputs. It is not a new theorem, runtime conformance proof,
business truth, obligation discharge, canonical ontology admission, merge,
release, deployment, or production readiness.
