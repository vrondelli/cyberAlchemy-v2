# `emits.target_max` closure evidence contract

Status: proposal-only Define baseline; not admitted, projected, or implemented.

## What this contract owns

This Define package relates two independently governed records: a consumer completeness claim and an evaluator verdict for the selected canonical `emits.target_max=1` predicate. It does not collapse their owners or own canonical relationship meaning, project source truth, generated graph authority, packet representation, or runtime Event behavior.

## Contract map

```text
consumer project sources
  -> EmitsIncomingClosureEvidenceEnvelope (consumer completeness claim + exact snapshot refs)
  -> generated graph/source manifest (non-authoritative projection evidence)
  -> EmitsTargetMaxEvaluationReceipt (evaluator-owned verdict)
  -> later owner-local lifecycle or packet projection decision
```

Each arrow transfers evidence, not authority.

## Records

### `EmitsIncomingClosureEvidenceEnvelope`

A candidate consumer-authored record that binds the exact evidence an evaluator may use. Its minimum conceptual fields are:

| Group | Required information | Responsibility boundary |
| --- | --- | --- |
| identity | envelope identity, contract version/digest | Identifies exact candidate contract bytes; grants no authority. |
| subject | canonical relation reference `emits`, predicate reference `target_max=1`, counting-unit receipt references | Reuses selected owner decisions; does not reinterpret `one_to_many`. |
| boundary | boundary identity and owner-defined boundary-kind reference | D02 requires identity and kind; this Define does not mint a closed kind vocabulary. |
| source population | exact eligible Entity membership set or manifest reference and digest, completeness declaration, and exact placement set/reference and digest | Consumer project owner declares completeness for the evaluated boundary. |
| target population | exact eligible Event membership set or manifest reference and digest, completeness declaration, and exact placement set/reference and digest | Consumer project owner declares completeness for the evaluated boundary. |
| adjacency | exact incoming canonical `emits` fact set or manifest reference and digest for every eligible Event, declared complete; outgoing explicitly open | Implements N37 A without strengthening it to symmetric closure. |
| snapshot | source-set, graph, source-manifest, relationship-registry, and profile references with exact digests | Prevents cross-snapshot evidence mixing. |
| attestation | declaring owner/principal reference, producing tool or author reference, and declaration digest | Names who made and materialized the completeness claim; the compiler does not inherit it. |
| currentness | owner-currentness reference or explicit unknown state | Exact digest equality is the minimum candidate freshness check; it remains owner-unaccepted, and no TTL is invented. Timestamps and file existence alone never establish currentness. |

Every reference must be version- and digest-exact. The representation of those references remains a Design concern.

### `EmitsTargetMaxEvaluationReceipt`

A candidate evaluator-generated record that binds:

| Group | Required information |
| --- | --- |
| identity | receipt identity, evaluator identity/version/digest, receipt schema version/digest |
| inputs | exact envelope digest plus exact graph/source-manifest/registry/profile digests consumed |
| predicate | canonical `emits`, separate numeric-policy authority/receipt, exact N37 receipt, and authored concept-fact counting unit after duplicate rejection |
| result | `pass`, `invalid`, `not-evaluated-incomplete-closure`, or `error` |
| diagnostics | missing proof components, duplicate violations, or Event IDs with more than one distinct incoming Entity |
| claim limit | exact statement that the receipt covers only the bound snapshot and predicate |
| historical status | immutable result plus separate currentness reference; later drift does not rewrite the receipt |

The receipt is evidence owned by its evaluator. It cannot select, accept, or publish packet semantics.

## Evaluation rules

1. Resolve every versioned/digest-exact reference and reject mixed snapshots or stale/missing bindings as `error` or typed input failure.
2. Validate canonical endpoint types and same-feature scope for each observed `emits` fact.
3. Apply the selected duplicate-authorship rule before numeric evaluation; an exact duplicate is independently invalid and never silently coalesced.
4. Group distinct authored canonical `emits` facts by Event concept ID.
5. If any Event has incoming facts from more than one distinct Entity, return `invalid` even when closure proof is incomplete.
6. Otherwise, if boundary identity/kind, complete eligible Entity and Event populations/placement, or complete incoming adjacency is absent, return `not-evaluated-incomplete-closure`.
7. Otherwise return `pass` for the exact bound snapshot.
8. Never require outgoing adjacency closure for this predicate; N37 selected it as explicitly open.

## Responsibility boundaries

| Actor | Owns | Must not claim |
| --- | --- | --- |
| DomainSpec relationship decision owner | predicate and proof semantics | project population completeness or evaluator execution evidence |
| consumer project owner | eligible population, placement, and completeness declarations | generated graph correctness or evaluator verdict |
| projection/compiler owner | graph, source manifest, and build provenance for declared inputs | that declared inputs are the complete domain population |
| relationship evaluator owner | receipt schema, algorithm identity, and immutable evaluation receipt | semantic authority, consumer completeness, packet acceptance, or lifecycle promotion |
| lifecycle/packet owner | later admission or projection decision | rewriting historical evidence or inferring runtime behavior |

## Acceptance scenarios for later Design/Plan

- A complete, internally consistent envelope with no Event having two distinct incoming Entity subjects can yield `pass`.
- A visible two-Entity-to-one-Event violation yields `invalid` even if a population or closure declaration is missing.
- A graph with no visible violation but missing incoming closure yields `not-evaluated-incomplete-closure`.
- A compiler-produced source manifest without a consumer completeness attestation cannot yield `pass`.
- Changing any bound source or contract digest preserves the old receipt as historical and requires a new evaluation.

## Identity denominator

Classification: `not-applicable`. The names in this candidate are working contract keys and glossary terms, not an asserted canonical ID-to-label denominator. Canonical IDs are referenced only through existing exact owner receipts and registries.

## Claim ceiling

This Define artifact specifies a candidate contract only. It does not choose serialization or storage placement, assign canonical authority to the candidate, admit an `emits` profile, change packet fields, implement or execute an evaluator, or authorize promotion, publication, release, deployment, production, or D06 work.
