---
artifact_id: UIF-010-REPLICATION-ATTACKS-v0.2
dispatch_id: 2026-07-11-uif-010-replication-review
status: accepted-review-evidence
writer: Mac Lane, Saunders
revision_loop: 1-of-1
authority_boundary: replication and review evidence only; no DS-D1 or DS-D8 mutation
promotion_eligible: false
---

# UIF-010 Replication Attacks

## Provenance And Gate

- Route: three replication attackers -> writer -> three finding verifiers ->
  coverage auditor/final approver.
- Attacker lenses: empirical corpus, computational replay, and
  authority/operability.
- `robot_talks: true`; initial and final positions are preserved below.
- Human confirmation and registration are complete.
- Three verifier dispositions are incorporated; final auditor verdict is ACCEPT.
- Evidence is bounded to Body War and Savvy repository corpora.

## Simon, Herbert - Empirical Corpus

### Initial Position

Simon normalized direct source/DOM structure without inventing candidate
metadata or inferring route identity from filenames.

| Candidate | Observation | Primary source |
| --- | --- | --- |
| Page | reject | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:417` |
| Layout | reject/partial | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/layout.tsx:58` |
| Component | reject | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-4-inputs.tsx:17` |
| View Model | absent | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-data.ts:197` |
| Hook | reject | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/app/page.tsx:409` |
| Form | accept | `projects/body-war/app/static/index.html:122`; `app.js:309` |
| Action | accept | `projects/body-war/app/static/app.js:309`; `app.js:469` |
| Guard | reject | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/lib/savvy-fsm.ts:126` |
| Binding | reject | `projects/savvy_legal-studio-ai/frontend/savvy-legal-studio/components/screens/screen-login.tsx:40` |

### Final Position

The results are corpus-specific portability observations, not universal kills.
Simon recommends `deferred` for all nine candidates until nonempty criterion
validation and stronger replication exist. Hook may be framework vocabulary.
This is stricter than Turing and Ashby on Form and Action and remains visible.

## Turing, Alan - Computational Replay

### Initial Position

- All nine schemas accept blank values for `attribute-present` keys.
- Stored mutation coverage is 9 of 52 criteria.
- The 9x9 positive-candidate matrix is diagonal.
- All 52 single-field deletions reject.
- Neighbor fixtures reject under all nine labels, but acceptance by the declared
  destination candidate is unverified.
- No candidate-source, schema, or result drift was detected.

The first prompt was blocked by an over-broad safety classifier. The same
registered thread was resumed with a local software-QA-only prompt and completed
without security, network, or external-system work.

### Final Position

Form and Action may be hardened while remaining experimental. The other seven
defer. Required changes are nonempty rules, complete mutation evidence,
bidirectional neighbors, bounded corpus claims, external relationship decisions,
and an explicit statement that W1 does not prove identity or promotion.

## Ashby, W. Ross - Authority And Operability

### Initial Position

- The prior corpus was synthetic/adapted rather than independent product evidence.
- Candidate rules establish authored shape attestations, not type identity.
- Action-source, Hook-Binding, and Guard-target decisions remain externally owned.
- Binding still faces a node-versus-relation decision.
- Entering UIF-011 before review closure would leak promotion.

### Final Position

- Form and Action: narrow/fix while experimental.
- View Model: defer.
- Page and Layout: evidence gap.
- Component and Hook: pressure toward framework vocabulary.
- Guard: defer.
- Binding: pressure toward relation-not-node.
- No candidate may be promoted.

## Reproduced Facts Versus Inference

| Statement | Classification | Boundary |
| --- | --- | --- |
| Frozen candidate/schema hashes match `protocol.yml`. | reproduced | Parent hash freeze. |
| Candidate set has 52 criteria. | reproduced | `candidate-meta-types/ui/candidates.json`. |
| All 52 single-field deletions reject. | attacker-reported execution | Turing local QA; the complete result is not persisted. |
| Stored mutation coverage is 9/52. | reproduced | Persisted round-trip results. |
| Presence-only criteria accept blank values. | attacker reproduced | Turing local QA; validator checks key existence. |
| 9x9 positive matrix is diagonal. | attacker reproduced | Turing local QA. |
| Neighbor fixtures reject under all candidate labels. | attacker reproduced | Turing local QA. |
| Declared destinations accept neighbor specimens. | not established | Outcomes are not consistently persisted and mapped per neighbor; some destinations are external to the nine-label matrix. |
| Body War contains form/action source behavior. | source fact | `projects/body-war/app/static/`. |
| Savvy contains the cited UI counterparts. | source fact | Exact matrix refs. |
| Source counterparts satisfy every normalized attribute. | not established | Complete normalized attestations absent. |
| Form/Action may harden experimentally. | disputed proposal | Turing/Ashby support; Simon defers. |
| Component/Hook are framework vocabulary. | proposed route | Verifier disposition pending. |
| Binding is relation-not-node. | proposed route | Relationship-owner decision pending. |
| Any candidate is promotion-ready. | unsupported | Protocol and authority forbid it. |

## Change-Request Candidates

| CR | Severity | Candidate change |
| --- | --- | --- |
| CR-01 | CRITICAL | Require nonempty values; reject empty and whitespace-only presence cells. Two verifiers support CRITICAL and one records MAJOR because the schemas are experimental. |
| CR-02 | MAJOR | Persist all 52 criterion deletions plus empty, whitespace, wrong fixed-value, and applicable conflict mutations. |
| CR-03 | MAJOR | Persist source rejection, declared reroute, and destination acceptance per testable neighbor; mark external destinations explicitly. |
| CR-04 | MAJOR | Preserve the 9x9 matrix and document intended overlap/collapse. |
| CR-05 | MAJOR | Persist source excerpt, normalization, omitted attributes, outcome, provenance, and style per candidate. |
| CR-06 | MAJOR | Bound review language to Body War and Savvy; do not claim external replication. |
| CR-07 | MINOR | Route Action-source, Hook-Binding, Guard-target, and Binding relation questions externally without treating them as an independent promotion block. |
| CR-08 | MINOR | Keep seven candidates deferred with distinct corpus-bounded follow-up routes. |
| CR-09 | MINOR | Keep Form/Action deferred while preserving the disputed experimental-hardening route. |

## Verifier Reconciliation

| Finding | Vacuity | Definitional collapse | Scope/framework | Reconciled disposition |
| --- | --- | --- | --- | --- |
| UIF-F01 | upheld, CRITICAL | upheld, CRITICAL | upheld, MAJOR | UPHELD, CRITICAL; minority severity retained |
| UIF-F02 | upheld | upheld | upheld | UPHELD, MAJOR |
| UIF-F03 | upheld | upheld | upheld | UPHELD, MAJOR |
| UIF-F04 | upheld | upheld | narrowed | UPHELD, MAJOR, narrowed scope |
| UIF-F05 | upheld | upheld | upheld | UPHELD, MAJOR |
| UIF-F06 | downgraded | downgraded | downgraded | DOWNGRADED, MINOR |
| UIF-F07 | boundary already present | refuted | refuted | REFUTED; dropped |
| UIF-F08 | upheld | downgraded | downgraded | DOWNGRADED, MINOR |
| UIF-F09 | downgraded | downgraded | downgraded | DOWNGRADED, MINOR |

Zero of nine candidates reaches `replicated`, `narrowed`, or `demoted`; all
nine remain `deferred`. This is an evidence disposition, not a universal kill,
and grants no authority, activation, promotion, or canonical mutation.
