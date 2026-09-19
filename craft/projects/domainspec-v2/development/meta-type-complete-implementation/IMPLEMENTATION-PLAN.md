# Implementation Plan

## Strategy

Execute one semantic frontier at a time until the observation contract is trusted. Then open Python and Rust in parallel against the frozen contract. Every mutable unit is a Task Session SWU and must close before its successor is eligible.

## Preconditions

- `INSTANCE-INTENT.md` is complete and names an accountable human owner.
- the package Design selection and dispatch validation pass;
- current dirty-worktree overlap is inventoried before each SWU;
- no canonical definitions, public Arcanum, or unrelated implementation-conformance changes are adopted silently.

## Waves and gates

| Wave | Units | Parallel | Entry gate | Exit evidence |
| --- | --- | --- | --- | --- |
| W0 instantiate | MTCI-001 | no | complete instance input | candidate ontology packet |
| W1 authority | MTCI-002, MTCI-003 | no | candidate packet; then owner decision | G1 receipt + canonical validation |
| W2 projection/design | MTCI-004, MTCI-005, MTCI-006 | no | G1 pass | reciprocal projection, G2 receipt, frozen observation schema |
| W3 trust-building | MTCI-007 | no | G2 pass | TypeScript lane + shared-contract trust receipt |
| W4 language expansion | MTCI-008, MTCI-009 | yes | TypeScript trust gate | Python and Rust receipts |
| W5 recomposition | MTCI-010, conditional MTCI-011 | no | all language lanes joined | parity and optional runtime receipt |
| W6 closeout | MTCI-012 | no | all applicable gates pass | read-only closure receipt |

## Validation strategy

Each language lane must bind exact commands only after its toolchain/package home is selected and pinned. Existing TypeScript/DomainSpec commands may be reused after a live preflight. Python and Rust commands do not yet exist and are output obligations of MTCI-005, not assumed facts.

Validation families:

1. candidate and canonical ontology schema/fixture checks;
2. relationship and non-collapse discriminators;
3. ontology projection and invariant-based graph recomposition;
4. observation-schema and evaluator unit tests;
5. native parser/module/type/tool checks per language;
6. positive and exact-cause negative source fixtures;
7. deterministic normalized receipts and raw-evidence reachability;
8. obligation parity and optional runtime behavior;
9. scoped whitespace, link, and repository validation;
10. read-only closeout re-run from declared inputs.

## Stop conditions

Stop immediately for a missing semantic field, absent human owner decision, rejected/non-discriminating formation criterion, ID collision/tombstone ambiguity, public/private boundary crossing, overlapping unowned dirty files, design digest drift, unsupported required observation, missing raw native evidence, lane disagreement, non-deterministic receipt, or failed acceptance-critical command.

## Migration and compatibility

This route is additive for one new type. It must not renumber or reuse stable DS-D1 IDs, reinterpret active relationship signatures, or update hard-coded canvas counts without a recomposed-graph explanation. Existing packs and generated instances must be rerun to detect accidental baseline drift.

## Performance posture

No performance threshold is claimed before tools and corpus size are selected. Every adapter records wall time, file count, cache state, and tool versions so later owners can set evidence-backed budgets.
