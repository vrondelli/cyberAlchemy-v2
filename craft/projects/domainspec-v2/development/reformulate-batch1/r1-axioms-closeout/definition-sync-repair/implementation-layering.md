---
node_type: implementation-layering
is_session: false
status: candidate
created: 2026-07-10
authored_by: invoke (mode: plan)
design: ./DESIGN.md
work_pack: ./WORK-PACK.md
target_artifact: DomainSpec v2 R1 AXIOMS definition-sync repair
---

# Implementation Layering - R1 AXIOMS Definition-Sync Repair

## Layer Model

| Layer | Name | Responsibility | Mutable In Next Task-Session | Boundary |
| --- | --- | --- | --- | --- |
| L0 | CAV2 semantic source | CAV2-D49/D53/D54 definitions and subject tests. | no | Read-only private authority spine. |
| L1 | R1 human authority surface | CAV2 alignment note and row-level classifications in `AXIOMS.md`. | yes | No substantive rewrite of A1/A2/A3 or routed A4/A5/A6. |
| L2 | R1 machine companion | Root alignment metadata and per-entry classifications in `AXIOMS.yml`. | yes | No `authority_kind: axiom` or `authority_kind: invariant`. |
| L3 | Validation receipt | YAML parse, implementation validation, forbidden-kind scan, and diff check. | yes | Receipt only; no parent status claims without passing gates. |
| L4 | Parent closeout sync | Manifest, Craft, and R1 closeout status after the patch. | deferred | Runs after L1-L3 pass. |
| L5 | Upstream/future governance | CAV2-D49 amendments, D53 rewrites, D34 citation repair, Saturn ownership. | no | Decision-gated or external residue. |

## Active Layer Window

The next executable unit should operate in L1-L3 only:

- Patch `projects/domainspec-v2/authority/AXIOMS.md`.
- Patch `projects/domainspec-v2/authority/AXIOMS.yml`.
- Record validation evidence.

L4 parent sync should run only after this repair passes. L5 remains explicitly
out of scope.

## Data Flow

```text
CAV2-D49/D53/D54 + accepted research findings
  -> R1 row classification rules
  -> AXIOMS.md human framing
  -> AXIOMS.yml machine metadata
  -> validation receipt
  -> parent R1 closeout sync
```

## Risk Controls

| Risk | Layer | Control |
| --- | --- | --- |
| Local metadata becomes a shadow authority taxonomy. | L1-L2 | Add guard language that `local_role` and `cav2_shape.primary` are compatibility classifications only. |
| `Definition` rollup is read as converting rows into definitions. | L1-L2 | State it is cataloging only under CAV2-D49. |
| A2 validation bindings become axiom substance. | L2 | Rename `validates` to `downstream_validation` or equivalent. |
| Parent R1 sync closes stale semantics. | L4 | Split SWU-R1A-002 into `002A` repair and `002B` sync. |
| Upstream D34 mismatch is encoded into R1. | L5 | Keep D34 residue noted but unpatched here. |

## Recomposition Proof

The repair recomposes with the original R1 closeout because it does not change
the R1 authority-home decision, retained row set, A2/C6 binding, Saturn routing,
or deletion/de-authorization of `impl/spec/AXIOMS.md`. It only clarifies how the
existing R1 rows map onto the current CAV2 definition system.

After L1-L3 pass, the existing parent closeout sync can proceed with stronger
evidence: R1 is not merely homed under `authority/`; it is also synchronized
with CAV2-D49/D53/D54.
