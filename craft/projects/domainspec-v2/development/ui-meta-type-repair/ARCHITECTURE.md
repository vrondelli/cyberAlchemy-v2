---
artifact_id: UIR-ARCH-v0.1
status: approved-planning-baseline
authority: development only
---

# UI Meta-Type Evidence Repair Architecture

## 1. Context View

UIF-010 is the immutable upstream evidence result. This package sits between
that result and any later DS-D1 or DS-D8 owner decision. It may produce
development evidence, but authority owners remain external.

```text
UIF-010 evidence -> repair contracts -> reproducible receipts -> owner routes
                         |                         |
                 validator owner             DS-D1 / DS-D8
```

## 2. High-Level Structure View

```text
contract kernel -> rule adapter
       |              |
       +-> mutation ledger ------+
       +-> reroute receipt -------+
       +-> corpus receipt ---------> formation dossier -> orchestration index
       +-> relationship packet ---+
```

The four producer planes stay separately addressable. The dossier composes
their outcomes conjunctively without taking their ownership.

## 3. Low-Level Component View

| Component | Inputs | Outputs | Failure state |
| --- | --- | --- | --- |
| canonicalizer | typed semantic record | canonical bytes + version | invalid-contract |
| digester | canonical bytes | versioned content digest | invalid-digest |
| lineage allocator | predecessor + inputs | generation identity | lineage-conflict |
| rule adapter | criterion + value | outcome + stable code | unknown-rule |
| mutation generator | frozen manifest | case records | incomplete-base |
| reroute evaluator | specimen + two contracts | two-sided receipt | pending-owner/invalid |
| corpus normalizer | pinned source selector | fact receipt | not-observed/invalid |
| packet builder | authority question + evidence | owner packet | incomplete-packet |
| dossier evaluator | producer handles | DEFER/EVIDENCE-COMPLETE/DOSSIER-ZEROED | disputed |
| index appender | generation + handles | immutable index entry | predecessor-conflict |

## 4. Workflow Process View

1. Freeze contract versions, semantic inputs, and predecessor.
2. Generate producer records independently.
3. Validate record schemas and normalized outcomes/codes.
4. Append records and receipt handles; never update in place.
5. Evaluate every dossier conjunct and preserve typed negatives.
6. Append the dossier and orchestration generation.
7. Route external questions to named owners.
8. Replay frozen mechanical steps and compare semantic results.

## 5. Decision Flow View

```text
record valid? --no--> invalid
     |
    yes
required evidence missing/disputed? --yes--> DEFER
     |
    no
finite dossier zeroed? --yes--> DOSSIER-ZEROED -> DS-D1 owner
     |
    no
external owner pending? --yes--> DEFER + owner packet
     |
    no
EVIDENCE-COMPLETE -> later experimental/owner route only
```

No branch emits `replicated`, `active`, `authoritative`, or `promoted`.

## 6. Dependency Interface View

| Boundary | Contract | Violation response |
| --- | --- | --- |
| Invoke -> Task Session | one selected SWU, declared write scope, receipt | block mutation |
| repair -> validator owner | rule/code proposals and parity evidence | decision gate |
| repair -> corpus owner | pinned facts and bounded review | DEFER |
| repair -> DS-D1 | dossier handles and prohibited inference | owner adjudication only |
| repair -> DS-D8 | exact relationship packet | pending-owner |
| repair -> prior UIF evidence | append-only reference | block overwrite |

## Risks And Controls

- Canonicalization accidentally encodes policy: ratify field semantics first.
- Parsing loses duplicate evidence: gate raw-input policy explicitly.
- Framework labels masquerade as witnesses: require erasure and portability.
- Replay replays human authority: restrict determinism to mechanical stages.
- Dossier becomes a score: hard conjuncts only; no weights.
- Index becomes a second ledger: store handles, not copied authority records.

## Dependency Map

L0 kernel and rule contracts precede all evidence producers. L1 producers may
run independently once their contracts are frozen. L2 dossier waits for all
required producer handles; L2 index waits for a dossier generation. L3 audit
waits for acceptance-critical owner gates but never candidate promotion.
