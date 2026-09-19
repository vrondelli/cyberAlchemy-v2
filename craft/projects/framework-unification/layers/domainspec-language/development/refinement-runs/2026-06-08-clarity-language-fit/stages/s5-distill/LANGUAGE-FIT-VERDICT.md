# Decision — Language-Fit Verdict (gate g-language-fit-verdict)

- Decision id: DEC-FIT-01
- Status: **decided (evidence-backed; dialectic-converged)**
- Owner: refine (operator-ratifiable)

## Question
Does the DomainSpec language (DESIGN-PACKAGE) help the categorical verification
pipeline — load-bearing, incidental, or partial?

## Verdict: **PARTIAL-BRIDGE** (route_menu item `partial-bridge`)
The language is **incidental today** and **load-bearing on the P3/P4 build path**.
This is not a hedge — the advocate and skeptic independently converged on the same
boundary (s3 REVIEW).

### Split by validation surface
| Surface | Status today | Language role |
|---|---|---|
| Stage A structural: P1 closure, P2 σ-typing, P5 acyclicity | shipped, σ-only | **incidental** — vocabulary is `domainspec-core` + paper tables, not the language |
| Stage A/B obligation: P3 per-meta obligations | stub | **load-bearing once wired** — needs contract `obligation_id`s |
| Stage B residue governance: P4 + provenance | stub | **load-bearing once wired** — language's iteration/lifecycle records the governed residue |
| Translator T target vocabulary | designed | maps to `Meta`/`EdgeType` (σ), **not** the language's doc kinds |

## The bridge condition (what must hold for load-bearing to be true)
1. **B-1 resolved:** contract obligations authored as addressable, machine-resolvable
   `obligation_id` predicates, indexed per `Meta`/`EdgeType`.
2. **Single source of truth:** the σ/obligation table the validator grades over is
   **derived from** DomainSpec contract/schema/taxonomy artifacts, not maintained
   in parallel by hand. (Otherwise the language stays a parallel doc effort.)
3. **No dialect fork:** OD-3 resolved so the language's schema kind and the
   validator's `Spec` are one dialect, not two.

If (1)–(3) hold, the language becomes the **obligation authority** for ~half the
grading surface (P3/P4). If they do not, the σ-model proceeds alone and the
language remains incidental.

## Why this matters for the prior run's PLAN
The prior PLAN ordered Wave A (provenance + P4) first. DEC-FIT-01 says: **B-1
(`obligation_id`s) is on the critical path for P3** and is a *language* task, not a
validator task. So resolving B-1 in the DESIGN-PACKAGE is a precondition that the
prior PLAN under-weighted — it should be sequenced alongside Wave A, not deferred.

## Honesty note
No present-tense claim that "the language helps the running validator." It does
not, yet. It is *required to* help on the obligation path; the bridge is designed,
not wired.
