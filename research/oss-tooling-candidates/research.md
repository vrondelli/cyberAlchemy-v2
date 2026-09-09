# OSS Tooling Sweep — Research Evidence Index

**Dispatch:** `2026-07-08-oss-tooling-candidates` (parent: `2026-07-08-oss-tooling-recon`)
**Type:** research · **final_approver:** parent · **exit_reason:** resolved
**anti_bias_global:** external-tool leverage vs incumbent-fit / premature-formalization
skepticism, hardened by inflation-vs-missed-leverage review at each stage.

This file is the evidence trail. The adjudicated deliverable is `findings.md`.

## Graph (11 groups, 3 lanes)

```
[P1/P2/P3 finders: advocate ⊥ skeptic]  → [lane synth]  ⇄(zig-zag,cap2) [lane reviewers: inflation ⊥ gap]
        (source-corpus axis)                                              (attack-vector axis)
                                    ↓ (all three lanes, sequential)
                              [final-synth]  ⇄(zig-zag,cap2)  [final-reviewers: coherence ⊥ claim≤proof]
                                    ↓
                              parent (final_approver) → resolved
```

Anti-bias axes (verified PASS by the check-tension gate before dispatch):
- **finders** = source-corpus (external OSS ecosystem vs internal codebase)
- **lane reviewers** = attack-vector (vacuity vs counter-example)
- **final-reviewers** = attack-vector (scope vs vacuity)

## Raw finder reports (verbatim explorer corpus)

- `research/p1-domainspec-advocate.md` — external OSS for the spec/formal engine
- `research/p1-domainspec-skeptic.md` — internal domainspec-v2 audit
- `research/p2-cyberalchemy-advocate.md` — external OSS for the authority spine
- `research/p2-cyberalchemy-skeptic.md` — internal cyberAlchemy-v2 audit
- `research/p3-orchestration-advocate.md` — external OSS for running/orchestrating agents
- `research/p3-orchestration-skeptic.md` — internal dispatch/telemetry audit

## Synthesis chain (adjudication trail)

- `synthesis/p1-domainspec-synthesis.md` → `…-v2.md` (post-review revision)
- `synthesis/p2-cyberalchemy-synthesis.md` → `…-v2.md`
- `synthesis/p3-orchestration-synthesis.md` → `…-v2.md`
- `findings.md` — final merged portfolio + cross-cutting resolution + try-this-first

## Load-bearing facts verified against source during the run

- **fast-check oracle:** `evalRational` (domainspec-v2 `formal/eval.ts:116-172`) is pure/total
  with commutative add/mul + a sum fold — the metamorphic value-law oracle needs no printer
  (the old parser-round-trip framing had none on disk).
- **lychee / OQ-1:** the STABLE-REPOSITORY constitution's OQ-1 ("start with Markdown link
  checks…") is status OPEN, not ratified → tier is ADOPT-ON-RATIFICATION.
- **D16 regression-lock:** the D29↔D16 relator/field divergence is still live and unreconciled
  in `DEFINITIONS.md`; the sh:in enum does not yet exist (the R1 fix creates it).
- **orchestration:** `loops_used` is uniformly 1 across the dispatch ledger → crash-recovery
  gap never bites today; the read-model's cited payoff metrics are degenerate.

## Both projects had already swept this space

- domainspec-v2: frozen `2026-07-02-formalism-and-primitives/findings.md` — "No DSL, no FOL/SMT/Lean."
- cyberAlchemy-v2: `2026-06-24-ontology-engineering-precedent/findings.md` — "cite the precedent, do not adopt."

The sweep confirms incumbent-fit and adds a small set of boundary-safe seams — see `findings.md`.
