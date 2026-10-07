# C04 completion — multi-file and multi-entry application composition

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

C04 is complete for the declared L2 boundary. One `application-v1`
composition can bind multiple exact source partitions, preserve their explicit
namespaces, validate multiple entry records and compile only the caller-selected
entry. Selection is mandatory and never falls back to array order.

The selected partitions form one source before the shared parser and DomainSpec
lowering path. The emitted entry manifest binds namespaces, declaration
inventories, endpoint/Operation/route identity, runtime identity and exact
source bytes. Existing one-file applications, portable function modules and
`service-v1` remain compatible.

## Done-criterion accounting

| Obligation | Evidence | Result |
| --- | --- | --- |
| Multi-file source | Two exact namespaces join before shared parsing and produce a real application build. | pass |
| Multiple entries | Two closed entry records select the same canonical source set under distinct entry/runtime identities. | pass |
| Explicit selection | API and CLI reject missing/unknown `--entry`; no first-entry fallback exists. | pass |
| Exact namespaces | Entry manifest preserves source and entry namespaces plus per-partition declaration inventories. | pass |
| Exact routes | Declared inbound endpoint resolves to its Operation and method/path; duplicates reject. | pass |
| Import confinement | Exact source references reject escaping paths, symlinks and drift. | pass |
| Identity collision | Duplicate namespaces, entry IDs, runtime IDs and declaration/normalized symbols reject. | pass |
| Current evidence | Build emits and verify regenerates the entry manifest and its digest. | pass |

## Validation

- `npm run typecheck`: pass.
- `application-composition.test.ts`: 2/2 pass, zero skips.
- Composition plus existing application-file/module/service regression: 17/17
  pass, zero skips.
- Full adjacent application suite: 105/105 pass, zero skips.
- `git diff --check`: recorded after final evidence synchronization.

## Claim ceiling

This closes C04 only. It does not establish C05 three-language parity, C06
adversarial/currentness closure, L2X, installed-product qualification, product
approval, publication, release, deployment or production readiness.

Progress is 21 of 37 scoped nodes. C05 is the next product-construction node.
Product-owner validation remains deferred until L4X.

## Open Questions

C05 must prove the 39-cell TypeScript/Python/Rust domain denominator and run the
L1 persistence/messaging/API scenario on all three targets with normalized
semantic outcomes. C06 retains broad Unicode/case collision and fail-before-
publication coverage.
