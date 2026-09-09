# Decision Gate: SWU-OEWSN-004 Build-Binding Repair

Status: `PASS — option 2 selected`

## Decision question

How should SWU-OEWSN-004 own the new semantic-navigation overlay inputs while
preserving the existing fail-closed L1 build identity?

## Why this blocks execution

The selected unit must change `overlay-manifest.json`, but the mandatory fresh
build requires that file's current digest and size through both
`first-working-version-manifest.json` and `L1-BUILD.lock.json`. Neither binding
target is in the admitted SWU material scope. Bypassing those checks is
inadmissible; changing their ownership or adding a new binding is consequential
and requires an explicit owner decision.

## Options

### 1. `REBIND_EXISTING_L1_INPUTS`

Expand SWU-004 to own both existing binding artifacts and regenerate all three
identities together.

- Benefit: smallest mechanical extension to the current build path.
- Cost/risk: rewrites a historical `first-working-version` handle and the shared
  L1 lock, increasing coupling and the chance of invalidating prior evidence.
- Reversibility: Git-reversible, but authority-sensitive.
- Choose when: the L1 build owner confirms those artifacts are rolling-current
  inputs rather than immutable historical evidence.
- Downstream impact: Invoke refreshes material scope, baselines, lock bindings,
  admission and SWU-004 validation before Task Session resumes.

### 2. `ADD_SEMANTIC_NAV_BUILD_BINDING` — recommended

Introduce a separately owned semantic-navigation build binding consumed after
the retained first-working baseline.

- Benefit: preserves historical L1 identities and gives this package an explicit
  source/patch authority boundary.
- Cost/risk: adds one new binding contract and corresponding builder tests.
- Reversibility: Git-reversible and isolated from prior baseline evidence.
- Choose when: historical reproducibility and clean ownership matter more than
  the smallest immediate diff.
- Downstream impact: Invoke defines the new binding inventory, updates SWU-004
  material/validation scope and admission, then Task Session resumes from 004.

### 3. `DEFER_PACKAGE`

Keep the current zero-product-mutation blocker and stop implementation.

- Benefit: no authority or build changes.
- Cost/risk: none of the seventeen implementation/evidence SWUs proceeds.
- Reversibility: resume later through this same gate.

## Recommendation

Choose option 2. It preserves the meaning of the existing first-working handle
and isolates semantic-navigation evolution behind its own digest-bound contract.

## Decision state

- Selected option: `ADD_SEMANTIC_NAV_BUILD_BINDING`
- Source: `explicit user response: 2`
- Timestamp: `2026-08-02T02:07:57Z`
- Rationale: preserve the historical first-working and L1 identities while
  giving semantic-navigation inputs a separate digest-bound owner contract.
- Remaining decision blockers: `none`
- Invoke Refresh authorization: `apply-approved` for the exact planning and
  dedicated-binding contract inventory derived from this choice.
- Product mutation authorized: `false`; a fresh Task Session material package,
  admission receipt and live validation remain mandatory.

## Evidence

- Task Session receipt:
  `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T014636Z/receipt.json`
- Context preflight:
  `planning/work-pack/session-evidence/SWU-OEWSN-004/20260802T014636Z/preflight.json`
- Admissibility request:
  `planning/decisions/admissibility/SWU-OEWSN-004-build-binding-repair-request.json`
- Admissibility receipt:
  `planning/decisions/admissibility/SWU-OEWSN-004-build-binding-repair-receipt.json`
- Selection receipt:
  `planning/decisions/admissibility/SWU-OEWSN-004-build-binding-repair-selection.json`
