# Verification-Derivation Claims Review — Findings

- Dispatch: `2026-07-17-verification-derivation-claims-review`
- Type: `review`
- Target: [pasted-text.txt](/home/vrondelli/.codex/attachments/430923f7-9a22-42d6-bd22-906d2efec01f/pasted-text.txt)
- Evidence boundary: supplied excerpt plus the repository paper, E1 protocol, claim-level research contract, evidence-status matrix, and observability specification cited below
- Attack design: three whole-corpus attackers → one synthesizer ↔ two verifiers → dedicated coverage auditor
- Verifier convergence: round 2, `NO OBJECTION` / `NO OBJECTION`
- Final approval: `ACCEPT` — Loregian, Fosco

## Result

**Verdict: FIX.** Seven **MAJOR** findings survived verification. No finding meets the house definition of CRITICAL: the target is a paper section, and the evidence does not establish system breakage, record corruption, or contradiction of governing law.

The narrow mathematical proposition survives: if each `δᵢ` is already a fixed total deterministic function and obligation equality is defined, the union of its outputs is deterministic. What fails is the excerpt's move from that conditional proposition to an independently reproducible public derivation, exact LLM output, additive set cardinality, exhaustive test/monitor symmetry, uniform observability evaluation, and layer-determined severity.

## Artifact: `pasted-text.txt`

| # | File | Evidence | Severity | Proposed fix |
|---|---|---|---|---|
| F1 | `pasted-text.txt` | Lines 5–7 give each `δᵢ` only `G`; lines 20–41 require document rows, bullets, status codes, stories, forms, breakpoints, pages, and components. Lines 10–12 pass bare `E_AB` although cross rules need relationship/type context. The paper says meta-types retain informal semantics and the engine algorithm is withheld ([paper lines 793–795](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/papers/domainspec-paper.md:793), [893–912](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/papers/domainspec-paper.md:893)). Origin: [attacker finals](attacks.md#abramsky-samson--final-position), [definitional verification](attacks.md#gödel-kurt--verifier-round-1). | **MAJOR** | Publish a canonical document→graph encoding or add the document model to the input; define rule predicates, obligation schema/equality, and typed/labeled cross-feature input. |
| F2 | `pasted-text.txt` | Line 8 says this “eliminates the stochastic gap,” but lines 23–24 and 31 allow open-ended minima. The appendix separates a byte-stable backend engine from the LLM path ([paper lines 893–912](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/papers/domainspec-paper.md:893)); E1 remains unrun and requires Jaccard `1.0` ([E1 lines 3–17](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/experiments/E1-derivation-determinism/protocol.md:3), [31–34](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/experiments/E1-derivation-determinism/protocol.md:31)); C2's research contract accepts `>=0.95` and is partially supported ([CLAIMS lines 10–19](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/claims/CLAIMS.md:10), [status line 10](/home/vrondelli/projects/domainspec-core/research/projects/domainspec/results/DOMAINSPEC-EVIDENCE-STATUS.md:10)). Origin: [trace final](attacks.md#van-lamsweerde-axel--final-position), [counterexample verification](attacks.md#popper-karl--verifier-round-1). | **MAJOR** | State separate claims for the abstract calculus, deterministic backend engine, and LLM generator; define obligation equality and reconcile E1's `1.0` criterion with C2's `>=0.95` threshold. |
| F3 | `pasted-text.txt` | Line 6 defines ordinary set union; line 45 replaces its cardinality with a sum; line 11 applies `Σ` and `+` to set-valued results without defining those operators. Minimal overlap: if `δ₉(G)={t}` and `δ₁₄(G)={t}`, union cardinality is 1 while the sum is 2. Origin: [formal final](attacks.md#abramsky-samson--final-position), [counterexample verification](attacks.md#popper-karl--verifier-round-1). | **MAJOR** | Define canonical obligation identity and require provenance-tagged disjoint outputs, or define an explicit multiset/disjoint-union composition algebra. |
| F4 | `pasted-text.txt` | Lines 43–45 advertise a computable 20-rule count, but line 48 is at most a partial floor: it has no explicit `δ₂` population, omits UI dimensions `δ₁₅–δ₂₀`, conflates `δ₉`/`δ₁₄` mappings, and uses undeclared `n_inv`, `n_err`, `n_ec`, and `n_ws`. Line 41 triggers per component but counts per page. Omission alone does not falsify a lower bound; it makes this one incomplete. Origin: [trace final](attacks.md#van-lamsweerde-axel--final-position), [definitional verification](attacks.md#gödel-kurt--verifier-round-1). | **MAJOR** | Label line 48 as a partial backend floor or provide a complete symbol table and formulas for all 20 rules; separate exact tagged counts from coverage minima. |
| F5 | `pasted-text.txt` | Line 75 claims nothing is tested but unmonitored or monitored but untested, yet no `T↔O` relation exists. `δ₁₂` tests query shape/filter/auth while O11 measures duration/result size; an unauthorized response can be fast and correctly sized. `δ₉/δ₁₄` mappings lack direct O-rules; O13 has no explicit test trigger. Existing traceability is a proposed audit, not a proven total property relation ([OBSERVABILITY lines 630–657](/home/vrondelli/projects/domainspec-core/implementation/domainspec/OBSERVABILITY.md:630)). Origin: [systems final](attacks.md#ashby-w-ross--final-position), [both verifier returns](attacks.md#popper-karl--verifier-round-1). | **MAJOR** | Define a property-level relation `ρ ⊆ T × O`, state totality requirements in each intended direction, and emit unmatched-obligation reports; retain only co-origin/traceability symmetry until proven. |
| F6 | `pasted-text.txt` | Lines 52–74 compress substantial existing semantics into a catalog that still does not yield uniform evaluation. O10 has event-type counters but no instance identity, so one lost event plus one duplicate can leave emit=consume ([OBSERVABILITY lines 323–354](/home/vrondelli/projects/domainspec-core/implementation/domainspec/OBSERVABILITY.md:323)). O6 defines reference recalculation but not the percentage denominator ([lines 196–219](/home/vrondelli/projects/domainspec-core/implementation/domainspec/OBSERVABILITY.md:196)). The detailed source also conflicts with its summary on O6/O7 instrument cardinality ([lines 557–576](/home/vrondelli/projects/domainspec-core/implementation/domainspec/OBSERVABILITY.md:557)). Origin: [systems initial/final](attacks.md#ashby-w-ross--initial-position), [both verifier returns](attacks.md#gödel-kurt--verifier-round-1). | **MAJOR** | Preserve existing detailed semantics, normalize instrument/cardinality descriptions, and close remaining event-correlation, percentage-denominator, threshold/window, and missing-telemetry gaps through one evaluation schema. |
| F7 | `pasted-text.txt` | Line 80 says every Domain Fidelity violation is P0 although O7 is P1 at line 62; line 81 says Operational Health violations are P1 although O11 is P3 at line 66. The detailed policy likewise assigns postconditions P1, unusual rule patterns P2, and query/state trends P3 ([OBSERVABILITY lines 661–668](/home/vrondelli/projects/domainspec-core/implementation/domainspec/OBSERVABILITY.md:661)). Line 83's narrower one-way statement about P0 is not itself refuted; the universal layer assignments are. Origin: [formal final](attacks.md#abramsky-samson--final-position), [definitional verification](attacks.md#gödel-kurt--verifier-round-1). | **MAJOR** | Keep layers as classification dimensions, remove universal severity assignments, and make one rule-level decision table authoritative for detection, threshold, impact, and response. |

**Per-artifact verdict: FIX.**

## Verified change requests

1. Split the determinism claim into three explicitly scoped claims: abstract calculus, deterministic backend engine, and LLM generator.
2. Publish the public derivation interface: document→graph encoding or explicit document input, typed rule signatures, canonical obligation schema/equality, and typed cross-feature composition.
3. Replace ordinary-union cardinality assumptions with provenance-tagged disjoint union or a defined multiset/composition algebra.
4. Repair the cardinality section with a complete symbol table and a clear separation between exact counts, complete minima, and partial floors.
5. Downgrade “symmetric verification” to shared-provenance traceability until a property-level `T↔O` coverage relation and unmatched-obligation audit exist.
6. Normalize O-rule instruments and cardinalities, then specify remaining correlation, denominator, threshold/window, and missing-telemetry semantics.
7. Remove layer-wide severity universals and route severity through a single rule-level policy.
8. Reconcile the evidence thresholds: E1 requires exact `1.0` LLM agreement while the C2 research contract currently accepts `>=0.95`.

## KEEP claims

- Fixed total deterministic rules with defined equality yield a deterministic extensional union.
- The undisclosed backend-domain engine is reported byte-stable and non-stochastic; this supports an engine-specific claim only.
- The catalogs enumerate 14 backend rows, 6 UI rows, 3 named cross rules, and 16 O-rules.
- Tests and observability obligations may be described as parallel, concept-traceable derivations from shared source material.
- Inner-loop/outer-loop and Fidelity/Health/Effectiveness remain useful classification scaffolds.
- E1 is a falsifiable LLM-path reproducibility protocol, but it currently supplies no result.
- Line 48 can survive if explicitly labeled and completed as a partial floor.
- The observability package contains meaningful rules, instruments, attributes, formulas, traceability, and some windows/runbooks; the problem is incomplete uniformity, not total absence.

## Refuted or narrowed candidates

- CRITICAL severity was dropped: thesis invalidation alone does not satisfy the house CRITICAL criteria.
- “`δᵢ` is not a function” was narrowed: the notation can stipulate an opaque function; the section fails to define an independently reproducible realization.
- “Omitted terms make the lower bound false” was narrowed: omission weakens a lower bound; overlap threatens additivity.
- Literal duplicate-count gaming was dropped under set semantics; semantically redundant but syntactically distinct obligations remain an adequacy concern inside F2–F4.
- “O-rules have no triggers, counts, attributes, or reference semantics anywhere” was refuted by the detailed observability source and replaced by the precise residual gaps in F6.
- Definition 3 itself received no finding: its local type-safety implication is coherent if its referenced sets and signature function are defined.

## Coverage and zero-findings check

- Every attacker read the complete target under a distinct full-corpus lens.
- Initial and final robot-talks positions are preserved in [attacks.md](attacks.md).
- All five target subsections—5.1 through 5.5—were attacked and synthesized.
- Every candidate was checked by both a definitional verifier and a counterexample verifier.
- Both verifiers returned `NO OBJECTION` after the revised second-round synthesis.
- The all-zero red flag did not fire: seven findings survived.
- Surviving zero-finding areas are explicitly recorded in KEEP claims.

## Closeout

- Exit reason: `resolved`
- Agents spawned: `7` (`explorer: 3`, `writer: 1`, `skeptic: 2`, `auditor: 1`, `helpers: 0`)
- Whole-dispatch loops used: `1`
- Final approver: `Loregian, Fosco`
- Final approval: `ACCEPT`
- Auditor checks: complete 5.1–5.5 and three-lens coverage; cited F1–F7 provenance; resolved verifier objections; accurate dropped/narrowed candidates; no severity inflation; zero-findings rule handled; KEEP/FIX consistency; actionable local evidence paths.
