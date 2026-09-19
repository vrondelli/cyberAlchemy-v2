---
node_type: research
is_session: false
status: candidate
created: 2026-07-02
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-02-metatype-formalism-primitives)
note: Collected returns (verbatim summaries). Full per-agent artifacts are the sibling files. Paths repo-root-relative.
---

# Collected returns — meta-type formalism + primitives

Dispatch `2026-07-02-metatype-formalism-primitives` (ledger: `telemetry/agents/subagents-dispatch.yaml`).
5 agents, 2 tensioned groups, check-tension PASS (first pass). Flow: 3 explorers → parent merge (6-item
proposal set) → 2 skeptics verify → parent froze. Synthesis: [findings.md](./findings.md).

## Group 1 · Tarski (explorer, solver-fit / FOL-SMT-Cedar)
Full: [formalism-solver.md](./formalism-solver.md).
> Solver-decidable is the sweet spot ONLY for the cross-cutting layer; per-concept checks reduce to a
> decidable bounded quantifier over the parsed schema = a table walk (what validate-relationships.ts already
> is). SMT NOT recommended (satisfiability approaches the δ-moat). Datalog/Cedar for cross-edge cycles/
> reachability/cross-rule = the owned FOL/Cedar Row-2 complement. Owned to build from: AgentPermissionKernel
> `applies:Req→Bool` + decidePolicy; Z3-governance decidability argument. No solver wired into impl today.

## Group 1 · Curry (explorer, proof / Lean)
Full: [formalism-lean.md](./formalism-lean.md).
> The load-bearing Lean asset is `Decidable` instances (`deriving DecidableEq`), NOT proof; 4/6 primitives
> decide with zero hand-proof. Dependent types are expressiveness the accept/reject validator doesn't
> consume. Lean-as-proof earns cost only on the P5 boolean-predicate soundness bridge (owned `matchesGlob_iff`
> template, ~1–2 days) + cross-graph obligations. Owned-kernel reuse cited with line numbers (Decision/Effect
> DecidableEq; StructuredArgs; decidePolicy_allow_iff; matchesGlob_iff; governs/acyclicity_not_unary).
> Overkill: P1/P2/P3/P5-per-edge as proofs; a schema validator already decides them.

## Group 1 · Simon (explorer, sufficiency / minimal)
Full: [formalism-minimal.md](./formalism-minimal.md).
> You do NOT need FOL/SMT/Lean for the 3 pre-registered criteria — the bar is accept/reject classification,
> met structurally for 5/6 primitives (evidence: validate-relationships.ts validates the hardest shipped
> check with parse + Set.has(), no logic engine). Breakpoint: P5 (Rule Formal→boolean) needs a ~100-line
> parser + root-tag check (NOT satisfiability); true break at P6 purity (undecidable, syntactic proxy or
> FALSIFIED boundary). Heavy formalism is also the moat risk — a full FOL/SMT encoding starts to resemble
> the δ-derivation.

## Group 2 · Gödel (skeptic, decidability + proportionality)
Full: [verify-decidability.md](./verify-decidability.md).
> Re-verified validate-relationships.ts (holds; deterministic, terminates). KEEP: table-walk (1), bare P5
> parser (2), cross-graph Datalog/Cedar (3 — the ONE solver; `acyclicity_not_unary` proves node-local can't
> decide cross-edge), structural primitives (5), no-DSL (6). DEMOTE: mandatory Lean bridge (overkill),
> semantic purity (undecidable → boundary/4), dependent-typed primitives program, full criterion-DSL.
> **P5 Lean proof NOT PROPORTIONATE** — both decide, proportionality breaks the tie; proof changes zero
> verdicts; DEFER (cash the template only if P5 becomes a published/compositional artifact).

## Group 2 · Quine (skeptic, precedent + moat)
Full: [verify-precedent-moat.md](./verify-precedent-moat.md).
> Every item BUILD-FROM-OWNED, zero kills. Verified Curry's owned-kernel cites (read + grep, sorry=0) and
> Tarski's non-Lean cites. Path correction: the Lean kernel is at `domainspec-core/domainspec-lean-formalization/`
> (repo-root-relative), not a sibling. Moat: item 4 (purity/meaning) is the hard line; P5 leaks iff it drifts
> from return-sort to satisfiability; prefer a declarative `formal_return_type` key over shipping a public
> parser. P5 Lean proof = build-from-owned *head-start* (new proof over a not-yet grammar), a rigor upgrade
> not a gate requirement.

## Parent reconciliation (freeze)
Unanimous per-concept = structural table-walk (owned); P5 = declarative return-type key (moat-safest) + bare
parser, Lean proof deferred; cross-graph = the one Datalog/Cedar solver (owned Row-2); purity/meaning =
boundary. No DSL, no SMT, no per-instance Lean-proof. Primitives-first = yes, as schema predicates. Confirms
the package's `.schema.yml`+md plan; adds `formal_return_type` for P5.
