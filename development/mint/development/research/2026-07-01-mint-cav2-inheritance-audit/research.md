---
node_type: research
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: domainspec-subagents-strategy (research dispatch 2026-07-01-mint-cav2-inheritance-audit)
note: Collected returns (verbatim summaries) for the Mint⟵cav2 inheritance audit. Full per-agent artifacts are the sibling files. Paths repo-root-relative from domainspec-core/.
---

# Collected returns — Mint ⟵ cav2 inheritance audit

Dispatch `2026-07-01-mint-cav2-inheritance-audit` (ledger:
`telemetry/agents/subagents-dispatch.yaml`). 4 agents, 2 tensioned groups. Synthesis:
[findings.md](./findings.md).

Flow: Group 1 (explorers) → parent consolidated a 21-candidate list → Group 2 (skeptics) ruled on
the same list → parent synthesized. check-tension gate (Bourbaki + Loregian) PASSED the sheet after
one revision (Group-2 tension was rewritten from coverage to genuine disagreement).

---

## Group 1 · A1 — Alexander, Christopher (explorer, supply-side)

Full artifact: [supply-map.md](./supply-map.md).

> Enumerated every reusable authority+ontology machinery element in cav2 and marked whether Mint
> seeds it. Ground truth: Mint's 6 emit-templates + EMIT-PROCEDURE + L0-contract and the worked
> example (`examples/release-approval/`) — exactly 7 files (AUTHORITY-MODEL, source-spine,
> promotion-policy, constitution, definitions, decisions/mint, crosswalk). Inherits well: the
> Authority-Kinds table FORMAT, gate vocabulary, promotion-ladder format, three-voice definition
> card, constitution header + four inherited meta-rules, the D49 propose→ratify gate. Core finding:
> Mint seeds authority *outputs* but almost none of the candidate-staging / lifecycle / navigation
> machinery a domain needs to author its OWN authority. The entire ontology package is 0% seeded; the
> definitions lifecycle is named but not equipped — and the seeded load-bearing-term rule *requires* a
> drift audit that isn't emitted, so the rule fires into a void (self-inconsistency). ~46 raw
> omissions listed (fully-absent + present-but-partial), two of them disclosed deferrals (L3
> vault-adoption; L2 attestation).

## Group 1 · A2 — Ashby, W. Ross (explorer, demand-side)

Full artifact: [demand-map.md](./demand-map.md).

> Requisite-variety derivation of what a *minted* domain needs to regulate its own authorship,
> grounded in the two products that exist (experiment product; domainspec-v2). Classified 23 surfaces
> into LOAD-BEARING-AT-MINT (kinds-table format, D49 closure rule, D48 ladder, non-collapse structure,
> gate vocab, owner-routing, claim≤proof, build-from-owned, source-posture, decision-as-act,
> constitution meta-rules, owner-ratification), NEEDED-LATER (disciplines, imports, stable-repo/
> extraction, public scrub, attestation), CAV2-INTERNAL-BOOKKEEPING (ontology PACKAGE/NODE/RELATION/
> LIFECYCLE models, empty staging dirs, vault/schema — zero trace in either product). **NEEDED-BUT-
> ABSENT:** G1 ratify-close not in the mint flow; G2 no governance-function→methods prompt; G3 no
> stop/demotion rule. **ABSENT-AND-CORRECTLY-SO:** ontology models, promotion-requests/projections/
> views, LIFECYCLE FSM, vault/schema, disciplines, imports ledger, extraction gate, public scrub,
> crypto attestation. **NET-NEW-NEED:** N1 verifiable attestation; N2 domain-surfaced kinds cav2 lacks.

## Group 2 · B1 — Gödel, Kurt (skeptic, definitional-soundness / circularity)

Full artifact: [circularity-attack.md](./circularity-attack.md).

> Enforced format-vs-fill (two-System-5 boundary): SAFE-TO-INHERIT = empty table + column contract /
> routing-derivation pattern / rule the domain applies to its OWN table / schema shape; CORRECTLY-
> LOCALIZED = cav2's actual populated ROWS (its S5 self-model) → re-fuses the levels. Load-bearing:
> #5 (D49 closure rule on the domain's own table) is SAFE and dissolves the C1 self-contradiction —
> inherit the rule, never cav2's enumeration. Highest-risk cluster: the ontology package (#14/#15/#16)
> — record *shapes* look reusable, but `PACKAGE-MODEL.md:9-11` self-labels as cav2's own candidate
> authority-model package. **DEMOTED to CORRECTLY-LOCALIZED (7):** #3 (posture rows), #4 (non-collapse
> rows), #14 (ontology package = self-model), #15 (structural models), #16 (ARTIFACT-TREE + crosswalks),
> #17 (STABLE-REPO rule instances), #19 (discipline catalog rows). #20 (attestation) is net-new,
> outside the dichotomy.

## Group 2 · B2 — Meadows, Donella H. (skeptic, precedent / already-provided)

Full artifact: [precedent-attack.md](./precedent-attack.md).

> The suspected gap is REAL, not illusory. Mint's emit-logic is fully bounded (EMIT-PROCEDURE +
> EXECUTION-PACK = 6 template instantiations + 1 decision; the minted product confirms 7 files, no
> more). The composed scaffolder `domainspec-new-repo` is orthogonal — its L0-compose-contract states
> "L0 does NOT produce the authority spine." So a surface living only in cav2's authority|ontology|
> disciplines is NOT thereby provided to a minted domain; it needs an emitter, and for most candidates
> none exists. **ALREADY-PROVIDED:** #5 per-row default-deny (templates/authority-model; table-closure
> still absent), #18 knowledge-tree README half (scaffolder); partial: #4 non-collapse structure, #17
> credibility constitution. **GENUINELY-ABSENT:** 1,2,3,4,6,7,8,9,10,11,12,13,14,15,16,17,19,21 (18 of
> 21). #20 attestation genuinely absent today but build-from-owned (`development/attestation-capability/`,
> L2 blocked). No KILL emitted.
