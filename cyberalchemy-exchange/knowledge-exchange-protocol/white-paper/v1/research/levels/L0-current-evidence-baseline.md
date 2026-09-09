# L0 — Current Evidence Baseline

Date checked: 2026-09-03  
Status: candidate evidence inventory  
Authority effect: none

## Purpose

This record distinguishes current source identity from evidence strength. It is
the L0 discrepancy report for the white-paper roadmap; it is not a D65
admission, implementation acceptance, conformance decision, deployment
authorization, or publication decision.

## Selected-source result

- The original fifteen-source paper ledger contained one volatile selected
  receipt: `LOCAL-HOSTED-CONFORMANCE` moved through several historical local
  runs and is now replaced by fresh post-acceptance assessment `adb274dd...`.
- The fresh receipt checks the exact G1.5 decision. Five predecessor stages
  pass, but accepted binding/currentness checks fail because accepted
  `50a0e5ce...`/`e96a517c...` became current
  `41c3bf98...`/`b48ab24d...`. Four implementation-dependent checks are
  explicitly `not_evaluable`; the current replacement binding is only
  internally consistent.
- Five EVF sources and sixteen hosted governance/construction sources were added,
  producing a thirty-six-source local ledger: the hosted definition-acceptance decision,
  hosted capability-adoption decision, hosted ontology candidate and admission
  decision, the DomainSpec source candidate and its exact admission decision,
  the system-ontology candidate, deterministic preacceptance receipt, and exact
  admission decision, the exact selector-level implementation-binding
  candidate, its deterministic preacceptance receipt, exact owner acceptance,
  immutable replacement binding snapshot, replacement candidate, and
  replacement preacceptance receipt, and its post-preacceptance drift receipt, the
  seven-claim source, fifteen-projection formal receipt, local provider
  observations, 204-record relation matrix, and independent review 009.

## EVF baseline

| Surface | Current bounded result | Ceiling |
| --- | --- | --- |
| Formal claim source | 7 claims | Candidate propositions only |
| Lean/TLC/Alloy receipt | 15 projections, two-run deterministic `PASS_BOUNDED` | Bounded formal models only |
| Local providers | 29 Rust, 3 crypto, 1 PostgreSQL, 13 Solana program-test, and 7 formal cases report `PASS_BOUNDED` | Bound local sources and environments only |
| Relation matrix | 204 relations and 204 distinct mapping records | Structural mapping, not independent behavioral proof |
| Independent review 009 | `PASS_BOUNDED`, zero unresolved critical/high, ten carried medium residues | Immutable candidate 011 only; not production or aggregate conformance |

## Dependency-intersection check

The shared worktree contains unrelated active changes and generated build
material. It also contains deletions under protocol runtime paths outside the
candidate-011 selected 26-file binding. The exact non-mutating candidate check
recomputed:

```text
binding material: b617a45bc515cbc435f29f091d26ae07815ab3195bea89667414cc2f3855242b
runtime material: b4b12d7538aafc058da2b8b6943b5d1618f09109cc1e6bb1bfbdc0bf07c6e695
result: PASS
```

Therefore the observed ambient changes do not intersect the selected
candidate-011 dependency set. They are preserved and excluded from this work.
Any later change to one of the 26 selected files invalidates this conclusion
and requires a fresh binding/review decision.

## Deterministic checks

The following non-effectful checks were run against the selected bytes:

```text
candidate-011 binding author --check: PASS
formal conformance-v2 author --check: PASS_BOUNDED
relation-coverage author --check: 204/204 deterministic PASS
```

## Open discrepancies and blockers

1. The white paper previously exposed only the original core-grant Lean claim;
   its claim ledger, evidence matrix, and evidence section now require the EVF
   additions in this L0 change set.
2. No accepted E2 receipt proves complete and exclusive refinement from the
   seven formal claims to exact Rust, Solana, SQL, and browser bytes.
3. No accepted E6 typed adjudication joins semantic authority, formal evidence,
   refinement, implementation observations, environment observations, and
   independent review.
4. Independent review 009 retains ten medium residues.
5. Hosted definitions were accepted by decision
   `CA2-DECISION-KEP-HOSTED-DEFINITION-ACCEPTANCE-001` and Product Capability
   digest `600713ae...` was adopted by decision
   `CA2-DECISION-KEP-HOSTED-DEVNET-PRODUCT-CAPABILITY-ADOPTION-001`. The
   business-system bridge material was admitted by decision
   `CA2-DECISION-KEP-HOSTED-DEVNET-ONTOLOGY-ADMISSION-001`; the exact DomainSpec
   source is admitted by decision
   `CA2-DECISION-KEP-HOSTED-DEVNET-DOMAINSPEC-SOURCE-ADMISSION-001`; the generated
   system ontology candidate is admitted by decision
   `CA2-DECISION-KEP-HOSTED-DEVNET-SYSTEM-ONTOLOGY-ADMISSION-001`, and the exact
   hosted implementation binding is accepted by decision
   `CA2-DECISION-KEP-HOSTED-DEVNET-IMPLEMENTATION-BINDING-ACCEPTANCE-001`,
   while post-acceptance conformance is `BLOCK` and `not_evaluable` on exact
   accepted-target drift. Replacement candidate 002 then passed preacceptance
   but became stale after a second UI drift and is not decision-ready.
6. No fresh hosted third-party Devnet trial joins the current browser, API,
   PostgreSQL, Solana, reconciliation, and recipient-decryption path.

## L0 exit posture

L0 may be described as complete only when the updated white-paper validator
passes with all thirty-six selected local source digests current. That result would
prove source-ledger and document consistency only. L1 remains blocked on the
a stable replacement binding frontier, later D65 owner decisions, and
construction of the E2 refinement evidence.
