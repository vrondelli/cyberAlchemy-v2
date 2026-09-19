# EVF Design-Activation Plan Repair Proposal

## Outcome

The unchanged EVF Design now has a validator-owned `design-validator-pass`, but
the previously reviewed Plan package encoded the earlier fact that no Design
selection existed. That package is preserved as historical evidence and is not
reusable for canonical apply.

This run stages a proposal-only overlay over the frozen 20-target package. The
recomposed package has SHA-256
`b61f99354ed4d06b2ef9769d6d067edff34f68b83b0bf59d2c3c92e1945283d4`:
five repaired postimages and fifteen byte-identical postimages from the base
package.

## Root Cause And Invariant

The original package correctly blocked on missing Design activation when it was
reviewed. Closing that external gate made acceptance-bound status and blocker
wording false in the proposed canonical state. Applying those bytes would have
installed a Plan that still claimed the now-present Design pass was absent.

The affected invariant is:

> Acceptance-bound postimages must describe the actual proposed post-apply
> lifecycle state. Changed postimages require regenerated digests, fresh
> independent review, and new exact-byte owner acceptance.

## Exact Repair

| Canonical target | Repaired postimage SHA-256 | Repair |
| --- | --- | --- |
| `PLAN.md` | `5ce66a73218e957ad15bceaf0b48a862e5563ed6514f9a2fba58e2e88634dbe1` | mark Design activation resolved and renewed review pending |
| `WORK-PACK.md` | `b4ea5e2326cb41e42f63b0d4623faed6f0d80b605a8d85c5a1c1f20caf677765` | bind the Design result and preserve downstream gates |
| `work-pack/target-inventory.l1.json` | `39a34bf0100c4ea9d690c3fd3c4334842e2f909683edc32189366a875442c197` | replace the stale Design role and bind all six durable Design evidence inputs |
| `work-pack/shared/GAPS.md` | `c44ab82588c5513aa5bf3e493fe6599a6ddbd409e97c8c33700fe506c8c48661` | retire the resolved Design blocker and expose renewed review |
| `work-pack/shared/CROSS-TASK-GAPS.md` | `b6b22f839ad8853aaf47113675bb4b3b2368fb3936d7272c1f6787160e9ba32f` | record exact Design closure and the current open gates |

No other postimage changes. Canonical baselines remain unchanged and current.

## Validation

The run-local validator was executed against the live repository:

```text
python3 projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260821T002335Z-design-activation-repair/validation/validate_design_activation_overlay.py --repo-root . --output projects/domainspec-v2/development/evolvable-validation-framework/development/planning-runs/20260821T002335Z-design-activation-repair/validation/VALIDATION-RESULT.json
```

Result: exit `0`, verdict `pass`.

- nine exact source/evidence bindings pass;
- Design verdict, evidence state, fixed point, input/result digests, and replay pass;
- all 20 canonical baselines and frozen base postimages pass;
- the exact five-target override set and recomposed package digest pass;
- all six durable Design evidence inputs are present in the repaired target inventory;
- all 20 resolved postimages pass the stale Design-wording regression and text hygiene;
- the superseding context keeps review, acceptance, apply, readiness, and execution blocked.

The validator SHA-256 is
`a58710519df8b80f25da5c4d1dcce4945205fc13bb347c78089f4aeaf05d9474`.
The validation result SHA-256 is
`0a43d20902a986bef83d1f3fe5178dddf6253d4eaf56bfe338849d18363c0f81`.

## Permanent Regression Fix

`validate_design_activation_overlay.py` resolves the complete 20-target package,
not only the override files. It fails on stale Design-absence status, prose, gap
rows, or the old `authored-design-awaiting-validator-pass-and-selection` role.
It also requires the exact Design evidence set in the repaired immutable-input
inventory. This prevents a locally clean overlay from hiding a stale reused
postimage.

## Required Next Route

1. Fresh independent exact-byte review of this overlay and its recomposed
   package digest.
2. New owner acceptance of the reviewed exact bytes.
3. Separate `invoke:refresh:apply-approved` authorization and canonical apply.
4. Work Pack Readiness and Implementation Readiness against applied bytes.
5. Only then may Task Session select `SWU-GCP-002-P4`.

This proposal supplies no independent review, acceptance, apply, readiness,
implementation, release, deployment, publication, or production claim.
