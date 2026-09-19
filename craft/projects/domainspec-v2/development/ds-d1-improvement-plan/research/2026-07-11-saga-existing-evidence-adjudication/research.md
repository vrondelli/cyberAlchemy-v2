---
node_type: research
is_session: false
status: candidate
dispatch_id: 2026-07-11-saga-existing-evidence-adjudication
created: 2026-07-11
---

# Research Transcript - Saga Existing-Evidence Adjudication

Verbatim final explorer returns after the declared robot-talks exchange.

## Peirce, Charles Sanders

**Final Verdict: `already-resolved-collapse` evidentially; ratification and migration remain.**

Turing’s mechanics are persuasive, but they support collapse rather than a live evidentiary fork: Saga remains separately modeled because authority has not yet been mutated, while the validator deliberately produces `Saga ~ Workflow` as its sole expected collapse and finds no admissible hardening witness. [validator](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/validate-meta-types-noncollapse.ts:69) [non-collapse logic](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:103)

The historical sequence is:

- July 2 created a genuine harden-or-collapse fork because distinctness was then unresolved. [Saga verdict](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md:122) [fork](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md:129)
- July 7 verified Saga as an over-cut and changed the evidentiary default to merge unless an owner introduces an exclusive structural discriminator. [carving verdict](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-method-carving-soundness-review/findings.md:47) [Saga finding](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-method-carving-soundness-review/findings.md:57) [merge default](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-method-carving-soundness-review/findings.md:81)
- The gate red-team independently called Saga~Workflow the sole collision and intended merge. [verified result](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md:46)
- July 8 exposed resolution-key sensitivity and implementation limits, but supplied no Saga hardening witness. [key sensitivity](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md:92) [remaining verification](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md:156)

No artifact formally says “supersedes,” but explicit supersession language is unnecessary for the chronology to matter: later verified evidence defeats the older harden branch’s present support. A hypothetical future owner-admitted witness is an override condition, not evidence that two branches remain equally live.

**What the peers exposed**

- **Turing** closed the mechanical uncertainty left in my first return: the current resolver projects DS-D8 signatures to edge IDs, the checker intentionally ignores scope attestation, and tests affirm Saga~Workflow as the sole expected collapse.
- **Lawvere** confirmed the authority distinction and directly inspected the work-pack: D6/DS-D1 still requires owner ratification, while the work-pack’s neutral-fork wording has not absorbed the later evidence.
- My initial position was therefore directionally right but should be sharper: the work-pack is not merely “unclosed”; it currently overstates the evidentiary support for hardening.

The remaining owner act is to ratify the merge default and authorize DS-D1 correction plus DS-D8 migration. Absence of that mutation means **the authority state is unchanged**, not that the **evidentiary fork remains live**.

## Turing, Alan

**FINAL verdict: `already-resolved-collapse` evidentially; authority mutation remains owner-unfinalized.**

My initial `still-live-fork` verdict gave too much weight to the continued presence of separate Saga/Workflow schemas and active DS-D8 signatures. Those prove that migration has not happened. They do not make hardening an equally supported branch.

**Mechanical Reconciliation**

The computational evidence supports collapse:

- Saga and Workflow differ only through `attribute-equals(scope=...)` criteria ([saga.schema.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/saga.schema.yml:10), [workflow.schema.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml:10)).
- Attestation values are deliberately excluded from structural witnesses ([meta-type-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:69)).
- Both resolve to identical edge-ID participation: source of `orchestrates`, target of nothing. `wEdge()` compares those edge-ID sets, not complete signature records ([meta-type-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:103)).
- The resulting verdict is therefore `collapse / no witness` ([meta-type-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:109)).
- The CLI expressly requires this outcome: `MUST fire Saga~Workflow`, described as “the one intended merge” ([validate-meta-types-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/validate-meta-types-noncollapse.ts:69)).
- The real-registry test requires Saga~Workflow to be the sole collapse while all acceptance checks pass ([validate-meta-types-noncollapse.test.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/tests/validate-meta-types-noncollapse.test.ts:126)).

The two DS-D8 signatures do differ in scope, obligations, composition, and semantics ([relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:148), [relationships.yml](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:164)). But that establishes endpoint-signature and migration information, not a DS-D1 node-formation witness.

No current participant, compensation, failure/residue, temporal, ownership, or ordering property is both exclusive and validator-admitted. Hardening therefore requires a **future owner-adopted finite discriminator**. It is an override condition, not an evidence-neutral alternative already supported on disk.

**What The Peers Exposed**

Peirce supplied the missing historical adjudication. The July 2 fork was later narrowed by verified reviews: merge became the evidentiary default, while preservation became conditional on a newly adopted witness ([method review](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-method-carving-soundness-review/findings.md:81), [gate review](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md:46)). July 8 accepted the checker result while preserving resolver-key sensitivity as residue, not affirmative hardening evidence ([open questions](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md:92)).

Lawvere exposed the authority distinction I had compressed: D6/DS-D1 owns node non-collapse, while DS-D8 owns relationship admissibility. Active DS-D8 signatures cannot independently preserve a DS-D1 type boundary ([DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:1123), [D6 review](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/reviews/2026-07-08-d6-node-noncollapse.md:30)).

Thus SWU-DSD1-007 should ratify the evidence-settled merge default or record an explicit owner override backed by a new witness. The unresolved authority act does not reopen the old fork as two equally evidenced choices. No files were modified.

## Lawvere, F. William

**Verdict: `already-resolved-collapse` as the evidentiary default; owner-routed authority mutation and migration remain pending.**

**Reconciliation**

Turing exposes a real limitation: the validator does **not** prove semantic equivalence between Saga and Workflow. Its edge projection reduces DS-D8 signatures to normalized type plus edge ID, ignoring `feature_scope`, multiplicity, obligations, composition text, and other signature fields. Therefore, `Saga ~ Workflow` is conditional on the current verb-ID resolution key. [meta-type-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:103) [validate-meta-types-noncollapse.ts](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/validate-meta-types-noncollapse.ts:105)

Peirce strengthens that qualification historically: the July 8 audit accepted the mechanism while leaving the resolver key itself unverified. Thus the validator cannot be cited as universal proof that no richer, non-circular DS-D8 witness could ever distinguish the pair. [July 8 findings](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md:92) [July 8 residue](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-08-open-questions-noncollapse/findings.md:156)

That limitation does **not**, however, restore an evidence-neutral fork.

1. **No affirmative hardening witness exists.** Saga’s current DS-D1 criterion remains `scope=cross-feature`; Workflow’s is the corresponding intra-feature attestation. Participant, compensation, temporal, failure/residue, and cross-owner distinctions are not finite Saga-only formation laws visible to DS-D1 validation. [DS-D1 findings](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md:121)

2. **The richer DS-D8 signature differences are not automatically independent witnesses.** DS-D8 owns endpoint admissibility, while D6/DS-D1 owns node formation. Using “Saga is a Saga source” or its scope-derived signature to prove Saga is a distinct type risks circularity or laundering the same attestation through relationship authority. [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:220) [DEFINITIONS.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/DEFINITIONS.md:1137)

3. **The checker’s result remains valid within its declared boundary.** It establishes that the current registry contains no admitted structural witness and no verb-level authority-resolved edge witness for Saga versus Workflow. It correctly emits the sole present collapse candidate; it simply cannot establish metaphysical or future non-distinctness. [validator](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/impl/tools/validate-meta-types-noncollapse.ts:78) [node review](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/reviews/2026-07-08-d6-node-noncollapse.md:30)

4. **The evidence chronology has moved beyond the July 2 neutral fork.** The July 7 method review found the carving over-cut and set merge as the default unless an owner adopts a genuine exclusive discriminator. The gate red-team then identified Saga/Workflow as the intended merge. July 8 qualified the mechanism but supplied no hardening witness. [method review](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-method-carving-soundness-review/findings.md:81) [gate red-team](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/meta-type-formalization/research/2026-07-07-node-noncollapse-gate-redteam/findings.md:46)

**Peer Contributions**

- **Peirce** exposed the decisive chronology: the original live fork was followed by verified default-merge evidence, then an accepted but key-sensitive checker audit. There is no formal supersession statement, but there is substantive evidentiary progression.
- **Turing** exposed the implementation boundary: the checker proves collapse only under its current projection and should not be represented as full-signature or semantic proof. Turing also confirmed that none of the proposed hardening distinctions currently reaches the validator as an independent structural witness.

**Final Authority Position**

SWU-DSD1-007 should not ask the owner to choose freely between two equally evidenced outcomes. It should:

- record the established default: `Saga -> Workflow + scope`;
- disclose the verb-ID projection limitation;
- permit an override only if the owner admits a non-circular separating witness and finite Saga-only DS-D1 laws;
- otherwise ratify collapse and route SWU-DSD1-009.

The active DS-D8 signatures make collapse consequential: their deprecation, compatibility handling, validator changes, fixtures, and projections require the relationship-authority owner. They create **migration pressure**, not evidence that Saga already possesses independent DS-D1 type authority. [Saga fork](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md:153) [WORK-PACK.md](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/ds-d1-improvement-plan/WORK-PACK.md:94)

No files were modified.
