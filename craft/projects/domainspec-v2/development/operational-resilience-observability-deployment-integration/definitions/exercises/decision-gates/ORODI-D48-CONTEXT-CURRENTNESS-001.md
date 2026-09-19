# ORODI D48 Context Currentness Gate

Status: PASS — `D48-ACCEPT-HISTORICAL-SNAPSHOT` selected
Decision ID: `ORODI-D48-CONTEXT-CURRENTNESS-001`
Owning gates: CyberAlchemy v2 Define runtime owner and CyberAlchemy v2 definitions-governance owner

## Decision Question

May the exact previously validated Define Session Runtime evidence snapshot be
accepted as the materially distinct semantic exercise input for
`ORODI-D48-DEFINE-SESSION-RUNTIME-001`, while its live source-currentness drift
remains explicit and excluded from all current-runtime claims?

This decision is about the exercise input only. It cannot promote any definition
or satisfy the remaining revisions, positive-evidence exercises, challenge
review, canonical-ID, index, drift, or promotion-decision gates.

## Current Evidence

- The D48 exercise validates with SHA-256
  `daa82c237400b08bbd42a95ba7fd3713f64e7d386ac3de4567ef25fb0cf3ebd3`.
- Its exact historical Define evidence receipt previously passed and is bound by
  SHA-256 `985b4570db52c45fad2b63414072564a9f9fe2d064967529fc98fa136309840d`.
- The live Define system ontology now has material digest
  `5311d3e8543973df62ac5418361658586abbac13a50ec6edc315c9b5db819e03`
  and returns `BLOCK` for DomainSpec source currency and receipt currency.
- The exercise result is four survived challenges, three required revisions,
  and three cases with insufficient positive evidence. Zero terms are promotion
  ready.

## Options

### `D48-ACCEPT-HISTORICAL-SNAPSHOT` — accept for semantic challenge only (recommended)

Bind the exact previously validated snapshot as the second-context semantic
exercise input. Preserve the live drift as residue and forbid any current-
runtime or conformance inference.

- Benefit: retains the completed semantic challenge without forcing unrelated
  Define-system repair into ORODI definition promotion.
- Cost/risk: reviewers must keep historical exercise validity separate from
  current runtime state.
- Downstream impact: permits context-owner review of the 4/3/3 result; it still
  does not make any term promotion-ready.

### `D48-REFRESH-DEFINE-CONTEXT` — require a current evidence package first

Do not accept the exercise yet. Route a separate Define-owner repair to refresh
the evidence package against the current source epoch and current validator
outcome.

- Benefit: the second-context evidence becomes replayable against current
  Define system bytes.
- Cost/risk: couples ORODI progress to unrelated DomainSpec source and receipt-
  currency work; a refresh still will not provide positive telemetry,
  deployment, or rollback evidence.
- Downstream impact: D48 owner review remains blocked until that separate repair
  completes.

### `D48-SELECT-ALTERNATE-CONTEXT` — choose a different context

Reject the Define Session Runtime as the D48 exercise target and select another
independently owned or materially distinct context.

- Benefit: a deployment-bearing context could exercise more of the ten terms
  positively.
- Cost/risk: discards this exercise as promotion evidence and requires a new
  exact exercise from the beginning.
- Downstream impact: all ten candidates return to cross-context-evidence
  pending for the replacement context.

### `D48-DEFER` — keep the decision open

Make no owner decision. The exercise stays validated, non-effectful, and
blocked by currentness.

### `D48-STOP-SHARED-PROMOTION` — stop this shared track

Stop promoting these ten meanings into CAV2 authority while retaining the
immutable ORODI-local candidate meanings and prior evidence.

## Current Result

- Gate result: `PASS`
- Selected option: `D48-ACCEPT-HISTORICAL-SNAPSHOT`
- Decision source: explicit owner selection on `2026-09-01`
- Decision effect: accept only the exact historical snapshot as D48 semantic
  challenge input while preserving its non-current live status
- Immutable decision record:
  `ORODI-D48-CONTEXT-CURRENTNESS-001.decision.json`, SHA-256
  `05a2ba167ada672a34fd620e4a7505edd321536edc85abf8fec9e490bffc2080`
- Remaining blockers: three successor definition revisions; positive evidence
  for three candidates; definitions-governance result review; fresh exact
  promotion decision; canonical IDs, voices, index, and drift review
- Override: none; this authority decision cannot be bypassed generically
- Promotion effect: none

This decision does not make the historical snapshot current and does not accept
any definition for canonical promotion.
