# Design Decisions, Risks, and Residue

## Decisions

| ID | Decision | Reason | Status |
| --- | --- | --- | --- |
| D01 | Extend the existing `formal-claims-specification` branch; create no new branch. | The selected ontology architecture already owns FormalClaim meaning there. | selected candidate |
| D02 | Use two separately owned contracts in one coherent design unit. | Meaning and capability assessment must connect without collapsing. | selected candidate |
| D03 | Source logic is standard many-sorted FOL with equality and exact assumptions. | Full source expressiveness is useful when its semantic limits are explicit. | selected candidate |
| D04 | Exclude higher-order, temporal, fixed-point, and native transitive-closure semantics. | These are different logics and must not be smuggled through predicate names. | selected candidate |
| D05 | Keep derived decidability and solver evidence out of authored meaning. | Tool capability changes independently from claim meaning. | selected candidate |
| D06 | TDE consumes only an admitted executable projection. | Deterministic derivation cannot inherit full-FOL undecidability. | selected candidate |
| D07 | Preserve `needs_formal` with typed reasons. | Missing statements and out-of-profile formal statements require different repair routes. | selected candidate |
| D08 | EVF owns evidence routing; SMT providers own pinned execution. | Evidence interpretation and process execution have different risk owners. | selected candidate |
| D09 | Unsupported, unknown, timeout, incomplete, stale, or wider-than-source never passes. | Fail-closed evidence preserves claim ceilings and reproducibility. | selected candidate |
| D10 | Candidate id is fresh and not @5. | @4 acceptance is exact-byte and verification-pending. | selected candidate |
| D11 | Make primary assessment total with explicit `unsupported`. | Valid unmatched claims must not be mislabeled as proof-required or indeterminate. | selected candidate |
| D12 | TDE executes its deterministic classification under validation-governance policy. | This preserves TDE's decidability-map ownership while EVF retains solver operation. | selected candidate |

## Risks

| ID | Risk | Guardrail | Owner / next route | Current status |
| --- | --- | --- | --- | --- |
| R01 | “Full FOL” is read as “a solver will decide every claim.” | Put source/execution split and no-termination promise in every contract. | formal-claims plus validation governance owners | design guarded |
| R02 | Assessment silently becomes authored meaning. | Separate schema, owner, version, digest, currentness, and supersession. | successor owner admission | blocked later gate |
| R03 | A bounded or one-direction projection is reported as globally equivalent to full source FOL. | Require exact purpose, preservation kind/direction, domain, assumptions, and either an admitted syntactic construction rule or separately owned certificate receipt; otherwise emit no projection and retain `needs_formal`. | validation governance plus future certificate owner | planned only; no general equivalence checker claimed |
| R04 | `needs_formal` hides distinct causes. | Closed typed reason set and nonempty-reason invariant. | validation governance | designed |
| R05 | SMT `unknown` or timeout is normalized to pass. | Typed provider outcomes and first-nonpass propagation. | EVF and provider owners | planned only |
| R06 | Temporal or closure meanings are encoded as ordinary predicates. | Logic-profile validator rejects unsupported constructors and misleading profile claims. | formal-claims owner | planned only |
| R07 | @4 acceptance is reused for successor bytes. | Fresh candidate id and explicit predecessor-reference-only rule. | primary owner and verifier | blocked later gate |
| R08 | Local Design pass is mistaken for implementation readiness. | Separate `design-validator-pass` from future Plan evidence and domain admission. | parent closeout | guarded |

## Residue

- Exact successor source/assessment schemas do not exist.
- Candidate `assesses` and `projects` relations are not relationship-authority
  admissions.
- No preservation checker, reason classifier, EVF adapter, provider result join,
  or proof-provider integration is implemented.
- Planned witnesses are unimplemented and unexecuted.
- Successor owner and verifier admission is absent.
- Future Plan evidence is absent.
