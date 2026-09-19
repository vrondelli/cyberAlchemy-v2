# DomainSpec v2 contract-completeness audit 002 — proposed sheet

Status: proposal after live implementation stabilization checks; human
confirmation is required before registration.

## Objective

Re-audit the DomainSpec v2 contract-completeness gap set against the new live
freeze at `corpus-freeze.json`. Reassess `GAP-009` and every compiler/adapter
cell affected by the shared criterion kernel and minted-node body adapter. Do
not author the replacement Invoke package until this review is accepted.

The canonical target is `projects/domainspec-v2/`. The CyberAlchemy, IOLM, and
Body War trees are consumer evidence only and cannot supply DomainSpec machine
authority.

## P1 decision

Dispatch is required: the review combines the machine denominator, implementation
diff, executable tests, receipts, and consumer boundaries; it needs independent
isolation and parallel anti-bias attacks; raw returns exceed the parent context.

## Frozen lanes

Global anti-bias: `methodology + attack-vector`.

1. `attackers` — three parallel explorers with robot talks, `anti_bias:
   methodology + attack-vector`, tensioned across:

   - computational causality + counter-example: trace every field to execution
     and receipt;
   - formal ownership + definitional: test machine authority, versioning, and
     provenance;
   - adversarial completeness + vacuity: construct denominator and false-green
     counterexamples.

   Pairwise predicted disagreements on the `methodology + attack-vector` axis:
   computational causality runs the source-to-receipt trace while formal
   ownership runs the machine-authority/provenance audit; formal ownership
   exposes bias in the computational lane when a runtime trace is mistaken for
   semantic authority. Computational causality runs the source-to-receipt trace
   while adversarial completeness runs denominator and false-green
   counterexamples; adversarial completeness exposes computational bias when a
   passing trace omits an obligation or mutation. Formal ownership runs the
   machine-authority/provenance audit while adversarial completeness runs
   denominator and false-green counterexamples; adversarial completeness
   exposes formal-ownership bias when a declared owner has no executable
   witness.
2. `synthesizer` — Bourbaki reconciles the attacker returns into candidate
   `attacks.md`, `findings.md`, and a refreshed matrix without promoting review
   evidence.
3. `verifiers` — two parallel skeptics, `anti_bias: attack-vector`, as a
   specialization of the global theme:

   - Capucci: `scope` attack on authority inflation and denominator promotion;
   - Rittel: `vacuity/counter-example` attack with concrete false-green cases.

   Predicted disagreement: Capucci runs the scope attack and Rittel runs the
   vacuity/counter-example attack on the attack-vector axis; scope bias in
   Capucci would be exposed by Rittel's executable false-green case.
   They converge after independent returns.
4. `coverage_auditor` — Loregian independently checks the complete freeze,
   denominators, affected compiler cells, all matrix metadata, and the mutation
   boundary. Any post-registration target drift is an automatic rejection.

## Required outputs

- exact frozen evidence catalog and post-registration drift check;
- substantive disposition of `GAP-009` and all affected compiler/adapter rows;
- complete surviving/refuted finding set and matrix parity;
- exact verifier and auditor transcripts;
- no implementation, release, or consumer-authority promotion.

## Dependency flow

`attackers --sequential--> synthesizer --zig-zag(2)--> verifiers
--sequential--> coverage_auditor`, with one bounded auditor-to-synthesizer
feedback edge for transcript or factual repair only. The whole dispatch has
`max_loops: 2`.

## Gate state

- implementation checks: `tools:test` 147/147, `engine:test` 107/107,
  `typecheck` pass;
- freeze: created before registration from the current `projects/domainspec-v2`
  source state;
- check-tension: pending independent checker and reviewer;
- human confirmation: required before the dispatch row is appended;
- authority boundary: review output remains non-authority.
