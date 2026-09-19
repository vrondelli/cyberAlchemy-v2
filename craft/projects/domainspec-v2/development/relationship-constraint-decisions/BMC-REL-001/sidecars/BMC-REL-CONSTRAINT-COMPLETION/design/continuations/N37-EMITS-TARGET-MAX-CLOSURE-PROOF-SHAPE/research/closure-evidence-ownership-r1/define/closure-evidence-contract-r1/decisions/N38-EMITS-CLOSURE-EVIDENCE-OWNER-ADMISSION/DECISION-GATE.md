# N38 — `emits` closure-evidence owner admission

Status: selected. Selection: `BMC-REL-NONNUMERIC-38-A-ADMIT-SPLIT-CLOSURE-EVIDENCE-OWNERSHIP`.

## Question

Should DomainSpec admit the split owner chain defined here: the relationship/validation contract owns the two record schemas, consumer project owners attest `EmitsIncomingClosureEvidenceEnvelope` instances, and the relationship evaluator owns `EmitsTargetMaxEvaluationReceipt` instances?

This admission changes only proposal-side ownership policy. It does not select storage, serialization, packet mapping, evaluator implementation, minted-profile admission, runtime behavior, promotion, publication, release, deployment, or production state.

## A — Admit the split ownership chain (recommended)

- Benefit: makes N37 evidence producible without collapsing semantic, source, projection, and evaluator responsibilities.
- Cost/risk: creates two governed schema lifecycles and requires later Design, implementation, and separate producer admission.
- Choose when: DomainSpec should own the validation contract while consumer and evaluator instances remain separately authored.
- Downstream: Invoke Design may compare envelope placement/transport; implementation remains unauthorized.

## B — Defer

- Benefit: preserves all current decisions without assigning new authority.
- Cost/risk: N37 remains non-projectable and cannot produce a trusted `pass` receipt.
- Downstream: return to targeted ownership evidence later.

## C — Stop

- Benefit: ends this closure-evidence route with no authority change.
- Cost/risk: `emits.target_max=1` remains selected design policy but cannot become enforceable through this route.
- Downstream: no N38 successor.

Standing choice: Explain / more context. It does not select an option.

Rejected before presentation: combined envelope/verdict authority, compiler-inferred domain completeness, and bundled minted-profile admission.

## Owner disposition

- Selected by: user
- Source: exact `A` response after presentation
- Recorded at: `2026-08-26T00:30:29+01:00` (recording time; response timestamp unavailable)
- Effect: admit the split proposal-side owner chain for downstream Design only
- Non-effect: no representation, packet, implementation, profile admission, promotion, release, or runtime authority
