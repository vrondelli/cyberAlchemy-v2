---
artifact_id: UIF-REPAIR-ARCHITECTURE-RESEARCH-v0.1
dispatch_id: 2026-07-11-uif-findings-repair-architecture-research
status: explorer-returns-complete
created: 2026-07-11
authority_boundary: research evidence only; no candidate, validator, DS-D1, or DS-D8 mutation
---

# UIF Findings Repair Architecture Research

The four sections below are the explorers' verbatim compact final returns after
the registered robot-talks round. They preserve each lane's final contribution,
rejected alternatives, and unresolved dissent.

## Agent 1 - Turing, Alan

### Final S1-S7 Contributions

**S1 - Nonempty predicate.** Preserve global `attribute-present`, whose current
contract checks key existence with any value. Add candidate-selected
`attribute-nonempty` for presence-value criteria and a schema-level
`attributes-unique` predicate. The latter rejects duplicate normalized keys
before equality or nonempty evaluation, eliminating order-sensitive conflicts
without changing backend consumers.

**S2 - Mutation ledger.** Persist an immutable criterion-by-mutation ledger.
The unconditional base is 165 cases: 52 deletions, 52 empty values, 52
whitespace-only values, and 9 wrong fixed values. If universal candidate-key
uniqueness is accepted, add valid-then-invalid and invalid-then-valid duplicate
cases for every criterion, producing 269 cases. Stable case IDs use
`<candidate-id>/<criterion>/<mutation-kind>/<variant>`. Each result records
input and fixture digests, expected and observed outcomes, stable violation
codes, validator version, and optional reroute receipt.

**S3 - Reroute receipt.** Keep rerouting separate from node mutation. Each
receipt records source rejection, declared destination, independently executed
destination outcome, relationship-authority digest, and status `local-tested`
or `external-pending`. An external owner handle closes routing responsibility,
not destination acceptance.

**S4 - Separating witness interface.** Mutation results may provide
changed-consequence and typed-negative evidence, including criterion-erasure
outcomes. They do not establish identity. Shared predicates such as
`attributes-unique` cannot count as separating witnesses. Independent
positives, stable contrasts, label erasure, owner firewalls, and collapse/defer
decisions remain formation-review obligations.

**S5 - Corpus receipt interface.** Reference immutable source receipt IDs plus
revision, file, selector, and excerpt hashes. Do not embed reviewer projections
or inferred metadata into generated candidate fixtures. Automation may verify
extraction and hashes; semantic correspondence remains human-reviewed.

**S6 - Relationship-owner packet.** Computational output may carry a finite
owner handle, authority-surface digest, and state `active`, `generated`,
`deferred`, or `unresolved`. It must not resolve externally owned node/relation
questions or mutate DS-D8.

**S7 - Rerun/invalidation envelope.** Preserve prior results. Derive a
generation ID from candidate source, generated schemas, validator contract,
mutation profile, relationship authority, and referenced source receipts.
Store separate immutable `manifest.json`, `results.jsonl`, `reroutes.jsonl`,
and optional mutation fixtures. Changed inputs produce a new generation rather
than overwriting v0.1 evidence.

### Compatibility And Validation Consequences

Both Markdown and generated-instance paths must implement identical new-rule
semantics. Candidate generation, the total rule classifier, and rule-map
projection must change in the same gated rollout. Implement and test rules
before any candidate selects them: unsupported content rules are currently
logged and skipped, which could otherwise create false passes.

Required checks cover legacy blank-acceptance compatibility for
`attribute-present`; ordinary, empty, and whitespace behavior for
`attribute-nonempty`; both duplicate orders for `attributes-unique`; stable
equality behind uniqueness; equivalent Markdown/instance violation codes;
fail-closed candidate preflight for unknown rules; byte-identical repeated
generations; independent destination execution; and absence of identity or
promotion verdicts.

### Retained Dissent And Open Decisions

1. Universal candidate-key uniqueness requires owner acceptance. Without it,
   165 cases remain mandatory but conflict coverage is explicitly incomplete.
2. Durable storage of generated mutation fixtures versus manifests, hashes,
   and results only remains open.
3. Stable violation-code vocabulary remains to be selected.
4. Unknown-rule rejection may be candidate-preflight-only or become a global
   strict-mode correction.
5. Corpus correspondence remains human-reviewed.
6. Missing formation evidence defers unless a separate finite dossier proves
   collapse; mutation coverage supplies no weighted survival score.
7. External destinations remain pending until their declared owner evaluates them.

### Strongest Rejected Alternatives

- Global strengthening of `attribute-present`.
- Nested `all-of` or a new criterion DSL.
- Candidate-only sidecar validation.
- Treating complete mutation, reroute, or corpus evidence as semantic identity.
- Counting `external-pending` as destination acceptance.
- Overwriting historical results or using timestamps as generation identity.
- Counting common structural hygiene predicates as non-collapse witnesses.

### Evidence

- `projects/domainspec-v2/impl/tools/validate-content.ts:119-124`
- `projects/domainspec-v2/impl/tools/validate-content.ts:203-237`
- `projects/domainspec-v2/impl/tools/instances.ts:115-124`
- `projects/domainspec-v2/impl/tools/instances.ts:201-213`
- `projects/domainspec-v2/impl/tools/lib/meta-type-noncollapse.ts:56-64`
- `projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/round-trip-candidates.ts:37-70`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:36-78`
- `projects/domainspec-v2/development/reformulate-batch1/reviews/2026-07-02-r3-edge-law-formalization/findings.md:22-27`

## Agent 2 - Lakatos, Imre

### Position

The repair architecture must preserve four separate evidence planes:
computational validity, empirical observation, semantic identity, and
relationship ownership. A successful result in one plane cannot substitute for
a missing result in another.

The current boundary remains unchanged: all nine candidates are deferred. Form
and Action have the strongest experimental route, but no candidate is
replicated, narrowed, demoted, active, or promotion-ready
(`projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:27-32`).

### Final S1-S7 Contributions

| Solution | Contract contribution |
| --- | --- |
| **S1 nonempty predicate** | Preserve global `attribute-present`. Candidates explicitly select a versioned `attribute-nonempty`. Blank rejection is mechanical shape evidence, never semantic identity evidence. |
| **S2 mutation ledger** | Persist a content-addressed 165-case base generation: 52 deletion, 52 empty, 52 whitespace, and 9 wrong-fixed-value cases. Stable violation codes are the compatibility interface. Conflict, duplicate-key, label-erasure, criterion-erasure, and neighbor-reconstruction tests are typed extensions, not part of the base count. |
| **S3 reroute receipt** | Record source rejection and independently evaluated destination outcome. Local destinations are `accepted` or `rejected`; external destinations remain `destination-pending` until a finite owner handle exists. Destination acceptance supports correction and non-collapse but does not prove source identity. |
| **S4 separating-witness dossier** | Use a finite conjunctive dossier requiring an independent positive, stable contrast, label and criterion erasure survival, changed downstream consequence, closed typed negatives, and an owner firewall. No weighted score. Missing evidence yields `DEFER`; `KILL-DOSSIER` requires a finite zeroing fact. |
| **S5 corpus receipt** | Pin repository revision, path, selector, excerpt hash, observed facts, omitted facts, prohibited inferences, corpus, and implementation style. Immutable source facts and reviewer candidate projections remain separate. `observed-absent` may become a typed negative after a bounded search; `not-observed` means insufficient coverage and forces deferral. |
| **S6 relationship-owner packet** | Name authority state, exact question, affected signatures, required evidence, owner, version, and at least one changed consequence. Relationship consequences may corroborate a node distinction only after an independent DS-D1 formation witness exists. |
| **S7 rerun/invalidation envelope** | Keep separately addressable mutation and corpus generations, joined by a dossier manifest that records prior verdict, invalidation reason, and new evidence verdict. Repaired evidence never overwrites UIF-008 through UIF-010 history. |

Candidate validation currently proves authored shape rather than semantic
identity (`projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:72-78`).
DS-D8 endpoint use supplies graph pressure but cannot establish DS-D1 formation
authority (`projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md:53-60`).

### Verdict Gates

- **EVIDENCE-COMPLETE:** every conjunctive dossier gate passes. This permits
  only a further experimental route.
- **DEFER:** any independent witness, contrast, portability check, destination
  result, or owner decision is missing or disputed.
- **KILL-DOSSIER:** a finite zeroing fact proves the present evidence package
  circular or collapsed.
- **KILL/MERGE-TYPE:** remains a later DS-D1 owner decision; affected
  relationships require a separate DS-D8 migration route.

Saga supplies the governing adversarial precedent: its current dossier has
`W_fact=0` and `W_edge=0`, so the dossier collapses without proving that every
future Saga model is impossible
(`projects/domainspec-v2/development/ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md:35-47`).

### Strongest Rejected Alternatives

- Candidate labels, filenames, framework symbols, or authored criterion names
  as identity evidence.
- Schema success, diagonal matrices, or the 165-case mutation generation as
  semantic replication.
- A weighted score allowing several weak signals to compensate for one missing
  hard gate.
- A single generation hash combining source facts, projections, mutations, and
  human verdicts.
- Treating `destination-pending` as a successful reroute.
- Using DS-D8 endpoint participation as the only separating witness.
- Universal kill or a shared category conclusion across all nine candidates.
- Owner approval curing a definitionally circular dossier.

### Retained Dissent And Open Decisions

1. Duplicate-key policy must be enforced on raw input because structured parsing
   may discard the evidence needed to detect duplicates.
2. Generated-fixture durability remains open.
3. The owner and allowed vocabulary for neutral observations remain undecided.
4. Minimum real-corpus and implementation-style diversity remains undecided.
5. Form and Action retain dissent: Body War provides partial behavioral
   correspondence, but whether that is an independent positive or merely
   warrants another evidence round is unresolved.
6. The threshold between `observed-absent` and `not-observed` needs a finite
   bounded-search rule.
7. Component-as-umbrella, Hook-as-framework-vocabulary, and
   Binding-as-relation retain distinct owner decisions.
8. Action-source, Hook-Binding, Guard-target, and Binding node/relation
   questions remain externally owned.
9. `EVIDENCE-COMPLETE` is preferred over `SURVIVE-DOSSIER` because it avoids
   implying replication, activation, or promotion.

## Agent 3 - Simon, Herbert

### Final S1-S7 Contributions

- **S1 - Nonempty predicate:** Preserve literal source values, including empty
  and whitespace-only values, and link observations to Turing's
  candidate-selected `attribute-nonempty` rule. Corpus receipts do not determine
  validator semantics.
- **S2 - Mutation ledger:** Link mutation generations to immutable empirical
  receipts without merging source facts into candidate metadata. Each generation
  pins candidate criteria, protocol, receipt, and result hashes. The 165 base
  cases are not completeness: applicable conflicts require a separately
  enumerated, content-addressed set.
- **S3 - Reroute receipt:** Distinguish `candidate-validator-rejection`,
  `mutation-rejection`, and `empirical-noncorrespondence`. Record source
  rejection and destination evaluation independently. `destination-pending`
  closes only the handoff record, never the reroute proof.
- **S4 - Separating-witness dossier:** Supply immutable source facts,
  contradictions, and typed missing evidence. Reviewer projections are inputs,
  not independent witnesses by declaration. Missing, ambiguous, or out-of-scope
  evidence DEFERs; only a finite source-backed contradiction may zero a dossier.
- **S5 - Corpus normalization receipt:** Separate immutable source facts from
  reviewer-authored candidate projections. Pin repository-relative path,
  revision, file hash, composite selector, excerpt hash, extractor/version,
  corpus, and implementation style. Every projected criterion must be
  `supported`, `contradicted`, or assigned typed missing evidence. Never infer
  identity from filenames, framework symbols, candidate labels, or normalized
  defaults.
- **S6 - Relationship-owner packet:** Emit `external-owner-required` with a
  finite owner handle, active/generated/deferred authority references, and the
  unresolved changed consequence. The empirical receipt does not resolve
  relationship ownership.
- **S7 - Rerun/invalidation envelope:** Emit append-only, content-addressed
  generations. Source, selector, excerpt, extractor, criterion, schema, or
  protocol drift creates a new generation; prior evidence remains immutable.
  Replay compares normalized semantic fields and all input hashes while
  excluding volatile timestamps.

### Retained Dissent And Open Decisions

Simon retains `deferred` for all nine candidates until nonempty validation,
complete empirical receipts, and stronger candidate-specific replication close.
This remains stricter than Turing and Ashby on Form and Action; the accepted
record preserves that dissent at
`projects/domainspec-v2/development/ui-meta-type-formalization/replication/attacks.md:43-48`.

- Whether two independently authored real corpora in two implementation styles
  permit a bounded portability observation or only a portability probe.
- Whether candidate correspondence and `not-applicable` require one reviewer or
  independent dual review.
- How applicable conflict mutations are finitely enumerated.
- Whether excerpts are stored verbatim or recovered from pinned revisions.
- Whether generated fixtures are durable or regenerable. Preferred boundary:
  manifests and hashes are durable; regeneration is valid only when byte-identical.
- Duplicate normalized keys should be rejected by default; any alternative
  requires explicit deterministic precedence and a recorded violation.
- Extraction may automate literal, AST, or DOM facts, but semantic
  correspondence, ambiguity, applicability, portability, and dossier use remain
  human-reviewed.

Body War and Savvy currently support only bounded corpus observations. Body War
exposes partial Form/Action behavior, while most other candidates have one
Savvy/React specimen; this cannot establish candidate-level portability
(`projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:17-25`).
E0 remains synthetic-only, with zero real/owner specimens
(`projects/domainspec-v2/development/ui-meta-type-formalization/experiments/corpus.yml:7-10`).

### Strongest Rejected Alternatives

- Relabeling E0/W1 adapted fixtures as empirical replication.
- Treating the 165 base mutations as complete while conflicts remain unenumerated.
- Inventing absent candidate attributes through normalization defaults.
- Using filenames, framework vocabulary, or candidate-like symbols as identity evidence.
- Pooling different candidates across Body War and Savvy to satisfy portability.
- Treating reviewer normalization as an independent positive witness.
- Treating `destination-pending` or owner acknowledgement as destination acceptance.
- Using weighted evidence scores or automated semantic identity verdicts.
- Mutating a latest receipt in place instead of preserving generations.

## Agent 4 - Fong, Brendan

### Position

Rerouting is a typed, bidirectional evidence claim: the source candidate must
reject the specimen, and the destination must be independently evaluated. Local
destination acceptance means **destination-shape-accepted**, not semantic
identity. External destinations may complete their receipt only as
`destination-pending`; the underlying repair obligation remains open until the
named owner adjudicates it.

DS-D8 participation cannot establish DS-D1 formation authority. Relationship
packets may describe active, generated, deferred, or proposed signatures, but
they neither mutate relationship authority nor promote UI candidates.

### Final S1-S7 Contributions

| Contract | Contribution |
| --- | --- |
| **S1 - nonempty predicate** | Preserve global `attribute-present`. Select versioned `attribute-nonempty` through a repair manifest rather than candidate-controlled semantics. Blank-value rejection remains a criterion failure and never implies rerouting. |
| **S2 - mutation ledger** | Persist a content-addressed evidence generation containing 165 base cases. Add separately enumerated applicable conflicts and duplicate-key cases. Store stable violation codes and no identity verdict. |
| **S3 - reroute receipt** | Record immutable specimen/hash, source validator and rejection, declared destination handle, independent destination evaluator, and two outcomes: `record_state: complete|invalid` and `destination_state: shape-accepted|rejected|pending-owner|not-testable`. |
| **S4 - separating witness** | Require a finite conjunctive dossier: independent positive, stable contrast, label/criterion erasure, changed consequence, typed negatives, and owner firewall. Missing evidence yields `DEFER` unless a finite zeroing fact proves collapse. No weighted score. |
| **S5 - corpus receipt** | Separate immutable source facts from reviewer candidate projections. Pin revision, file, selector, excerpt hash, omissions, and typed missing-evidence status. Automate extraction and hashing; keep semantic correspondence human-reviewed. Never invent DomainSpec metadata. |
| **S6 - relationship-owner packet** | Name current authority class, endpoint formation status, finite options, positive and negative instances, at least one changed relationship non-collapse consequence, requested owner decision, closure evidence, and prohibited inference. |
| **S7 - rerun envelope** | Create immutable successor generations pinning validator, predicate manifest, corpus receipts, mutation manifest, reroute receipts, dossier version, and predecessor generation. Never overwrite prior UIF evidence. |

### Compatibility And Validation Consequences

- Existing `attribute-present` consumers retain current behavior.
- Repaired runs remain comparable through stable case IDs, violation codes,
  hashes, and predecessor links.
- A local reroute succeeds only when the same normalized specimen rejects under
  the source contract and independently shape-accepts under the destination.
- Wrong verb, reversed direction, wrong source, wrong target, unknown signature,
  generated-only route, deferred route, and deprecated route reject.
- Generated views may support projection evidence but cannot count as authored
  canonical destinations.
- A DS-D8 packet involving formation-deferred UI endpoints must state that
  status and prohibit circular use of the relationship as DS-D1 evidence.
- Binding's edge-shaped neighbor does not prove relation-not-node: active
  `fetches` itself currently requires a Binding source.
- The accepted zero-survivor boundary remains unchanged.

### Strongest Rejected Alternatives

1. Source rejection alone proves successful rerouting.
2. A fixture's destination label proves destination acceptance.
3. The nine-candidate matrix is a closed destination universe.
4. An external owner handle can be reported as accepted before adjudication.
5. The 165 base mutations are complete despite unclassified conflicts.
6. DS-D8 endpoint participation proves DS-D1 identity.
7. Relationship names may use wildcard endpoints or enter owner review without
   a changed non-collapse consequence.
8. Missing dossier evidence receives partial credit through weighted scoring.

### Retained Dissent And Open Decisions

1. Duplicate-key policy.
2. Whether generated fixtures are durable evidence or derived artifacts.
3. Whether framework-vocabulary destinations require a controlled namespace.
4. Whether Guard widens `protects` to Component, uses a distinct relation, or
   remains Page-only.
5. Whether Binding survives as a durable node while edge-only forms reroute, or
   collapses under owner review.
6. Which finite Action-source and Hook-Binding alternatives merit DS-D8 review.
7. Whether human-reviewed correspondence can close destination identity or only
   supply evidence to a later owner gate.

### Evidence

- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:54`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:62`
- `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:72`
- `projects/domainspec-v2/development/ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/findings.md:21`
- `projects/domainspec-v2/development/reformulate-batch1/reviews/2026-07-02-r3-edge-law-formalization/findings.md:24`
- `projects/domainspec-v2/definitions/DEFINITIONS.md:719`
- `projects/domainspec-v2/definitions/relationships/relationships.yml:404`
- `projects/domainspec-v2/definitions/relationships/relationships.yml:500`
