<!--
  RUN OUTPUT — faithful re-mint of the resonantos-economy-research domain, leak-stripped.
  Hand-instantiated from templates/authority-model.md by the SWU-3 emit procedure for the
  `research` (resonantos-economy-research) domain. Mint-act output state (criterion §5) =
  the commit including authority/decisions/2026-06-29-mint.md.

  INTEGRITY RULE (load-bearing): the kinds below are the domain's NATURAL kinds — the
  resonantos AS-BUILT set (its own AUTHORITY-MODEL.md kinds). They are NOT chosen to pass
  Obs-A. F3(c) is then applied HONESTLY to each in the flag column. Where the domain's
  natural kind is a re-skin of a cav2 D49 row, it is reported as a re-skin, NOT swapped for
  an invented kind to rescue the domain. The leak strip changes ONLY the resolution-path
  posture (cav2 off any resolution path), NOT the kind set.
-->

# Authority Model

Status: active local authority model
Owner: ResonantOS economy research owner

## Purpose

This model decides what this standalone repository is allowed to claim while it
researches a resilient ResonantOS / ResonantDAO economy.

The model deliberately separates:

- official ResonantDAO source claims (what the governed subject says about itself);
- **repository-local method authority** — owned by *this repo's own* constitution
  (`constitutions/RESEARCH-CREDIBILITY-CONSTITUTION.md`), NOT by any external framework;
- formalization discipline (invariant-writing precedent, kept as supporting source);
- external research evidence (related sources);
- local synthesis;
- policy or implementation authority, which this repo does not own.

> **Localization invariant (Obs-B, the precedent's leak — stripped).** Method authority
> (source posture, promotion discipline, non-collapse rules, authority separation) is
> owned **locally** by this repo's constitution + this model. **No external framework
> (including CyberAlchemy v2) is named as the method authority.** CyberAlchemy v2 appears
> ONLY as **harvested precedent (supporting source)** in `source-spine.md` — cited for
> provenance, never on a resolution path. This is the emit-time state; it does not require
> a later owner decision to become true. (This strips the precedent's `2026-06-26`
> mint-act leak, which had named cav2 as the external resolving authority for source-posture
> and promotion — that clause is NOT reproduced here.)

## Core Rule

Research can propose mechanisms, invariants, workflows, and gates. Research cannot promote
them into economy policy, token design, governance weights, payout rules, or implementation
without an external owner decision.

## Authority Kinds

<!--
  These are the resonantos AS-BUILT (natural) kinds. F3(c) applied honestly per row.
  F3(c): a kind is domain-originated iff NEITHER lexically NOR owner-route identical to any
  cav2 D49 row (owner-route identity = same owner route AND governs the same authority
  function). cav2 D49 rows: Definition · Constitution · Discipline · Decision · Spec ·
  Runtime contract · Projection · Evidence · Residue (+ closure catch-all).
-->

| Kind | Counts as | Owner route | Blocked use | F3(c) honest self-read |
| --- | --- | --- | --- | --- |
| Primary source | What ResonantDAO says about itself. | Official-source reading route. | Treating local synthesis as official position. | **CONTESTABLE / ~Evidence** — a specialization of cav2 `Evidence` (source/observability owner). Lexically new but governs the Evidence function. Not a clean domain-originated owner route. |
| Method authority | Research process, source posture, promotion discipline, non-collapse rules. | **Repository-local research-credibility constitution** (`constitution-governance`). | Treating method authority as mechanism validation. | **RE-SKIN (FAILS F3(c))** — owner-route identical to cav2 **Constitution** (route `constitution-governance`, governs source-posture/promotion/non-collapse). The documented precedent re-skin. NOT domain-originated. |
| Formalization discipline | Invariant-writing and proof-honesty posture. | Repository-local formalization precedent (harvested, kept as supporting source); discipline route. | Claiming Lean proof of economics without a Lean artifact. | **RE-SKIN (FAILS F3(c))** — owner-route identical to cav2 **Discipline** (route `discipline-governance`, a recurring practice/posture). NOT domain-originated. |
| Related evidence | DAO, crypto, science-of-science, mechanism-design, behavioral sources. | Relevant subtower / evidence route. | Treating analogy as proof. | **RE-SKIN (FAILS F3(c))** — cav2 **Evidence** (related-source specialization). NOT domain-originated. |
| Local synthesis | A repo-authored reading or hypothesis. | Tower or lane owner review. | Becoming policy by proximity. | **CONTESTABLE / ~Evidence** — a repo-authored reading is `local-inference` Evidence under cav2; same Evidence function. Not a clean new owner route. |
| Candidate invariant | A proposed condition that should remain true. | Closure plan + validation route. | Becoming a rule before witness and gate. | **CONTESTABLE / ~Definition** — cav2 governs `invariant` AS the `Definition` kind (AUTHORITY-MODEL.md note: D16/D29/D38/D49 "govern as the Definition kind"). Owner-route overlaps `definitions-governance`. Not clean-new. |
| Workflow witness | A concrete scenario that can test a candidate mechanism. | Evidence harness / validation route. | Being treated as general proof from one example. | **CONTESTABLE / ~Evidence** — a scenario testing a mechanism is `Evidence` (validation/observability owner). Same function. Not a clean new owner route. |
| External policy authority | Token, governance, bounty, payout, launch, product decision. | ResonantDAO / ResonantOS owner route. | This repo cannot exercise it directly. | **RE-SKIN / out-of-scope** — names an EXTERNAL owner's authority (the policy this repo does NOT own); it is a pointer to a foreign `Decision`/`Spec` owner, not a domain-originated kind this repo authors. NOT domain-originated. |

> **D49 owner-gate (SPEC §Boundaries).** Were any row above genuinely domain-originated, it
> would be **proposed** by the mint and **ratified** by the ResonantOS research owner — this
> repo's OWN domain-local table, NOT a change to cav2's closed D49 enumeration. **HONEST
> RESULT: no row above is both lexically AND owner-route new under F3(c).** Every row is
> either a re-skin of a cav2 D49 kind (Method authority→Constitution; Formalization
> discipline→Discipline; Related evidence→Evidence; External policy authority→foreign
> Decision/Spec) or a contestable specialization of Evidence/Definition (Primary source,
> Local synthesis, Candidate invariant, Workflow witness). The mint emitted the domain's
> NATURAL kinds faithfully; it did NOT invent a kind to rescue Obs-A.

## Source Movement

```text
source evidence
  -> source record
  -> source claim ledger
  -> subtower synthesis
  -> candidate invariant or workflow witness
  -> validation request
  -> external owner decision
```

No arrow is automatic. A candidate can be blocked, demoted, split, or sent back to corpus
work.

## Non-Collapse Rules

1. Contribution credit is not governance authority.
2. Reputation is not proof of truth.
3. Token transferability is not community value.
4. Bounty completion is not long-term contribution by itself.
5. Randomness is not fairness unless the fairness target and audit path are explicit.
6. A mechanism that is incentive-compatible in a model is not socially safe until
   behavioral residue is named.
7. A source from failed DAO history is warning evidence, not destiny.
N. **Harvested external method precedent (incl. CyberAlchemy v2) supports research
   credibility — it is NOT final economy correctness, and it holds NO authority over
   research decisions.** *(Obs-B non-collapse rule — forbids the precedent's leak at the
   rule level; preserved verbatim in shape from the as-built REC non-collapse rule 8.)*

## Gate Vocabulary

- `pass`: evidence, source kind, owner route, and validation surface are adequate for the
  next research move.
- `flag`: work may continue with named risk and follow-up.
- `block`: stop until a source, authority, witness, or boundary gap closes.
- `defer`: not rejected, but the route or timing is not ready.
