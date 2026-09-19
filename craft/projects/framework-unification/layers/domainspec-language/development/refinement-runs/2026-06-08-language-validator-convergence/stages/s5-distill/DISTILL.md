# Distill — Convergence Seam + Smallest Unit (s5)

Pareto over the dependency map (s4, 22 edges: 2 exist / 11 designed / 9 missing)
+ the dialectic (s3). Decision recorded as DEC-CONV-01 (compiler-pair).

## Smallest coherent convergence unit
The dependency map shows a **first mutual loop closes NOW, without B-1**, using
the real Stage-A checks:

> **SCU:** D1-5 (freeze schema envelope → `Spec`/`unresolvedRefs`) + D1-6 (author
> one `expect:pass` + one `expect:fail` example) → `gradeFor` (P1/P2/P5 exist) →
> D2-5 (report → `validations_run` receipt in the iteration record) → D2-1
> (verdict guards `gated→validated`).

This closes a genuine bidirectional loop on **well-formedness only** — proving
convergence is real before the obligation half exists. The **richer loop** (P3/P4
obligation grading, the load-bearing half) is the **second loop, gated on B-1**.

## Highest-leverage missing edge
**B-1** (`obligation_id`s) unblocks 6 of 9 missing edges (D1-3 anti-collapse,
D1-4 obligationsForMeta→P3, D2-6 provenance, D2-7 P3 residue, D2-8 P4 ambiguity,
D2-9). It is the same edge that flips DEC-FIT-01 from incidental to load-bearing.
One language task; the validator side already waits (P3/P4 stubs).

## Two-loop structure (the distilled shape of convergence)
- **Loop 1 (now):** well-formedness mutual dependency — closable today, proves
  the compiler-pair + acyclicity + bootstrap B0–B3.
- **Loop 2 (after B-1):** obligation/content mutual dependency — the load-bearing
  convergence; bootstrap B4–B5.

## Zig-zag insight
The architect (top-down seam) and mapper (bottom-up edges) met at the same place:
the seam IS the set of edges, and the disjoint-facts rule is exactly what keeps
the 22 edges from forming a cycle. The skeptic's bootstrap order is the temporal
projection of the same acyclic graph.
