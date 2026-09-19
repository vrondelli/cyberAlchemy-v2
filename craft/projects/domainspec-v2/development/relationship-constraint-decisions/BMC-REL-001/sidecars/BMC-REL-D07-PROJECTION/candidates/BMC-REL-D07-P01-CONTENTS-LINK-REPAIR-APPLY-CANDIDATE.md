# BMC-REL-D07-P01-CONTENTS link-repair package acceptance candidate

Status: owner gate open; no option selected

Authority effect: none

Decision ID: `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY`

## Consequential question and boundary

Should Definitions Governance accept the fresh exact package that retains the selected D30 semantics and changes
only its two stale local evidence-anchor fragments to their actual canonical targets, or defer or stop?

The prior accepted package was applied exactly, failed acceptance-critical link validation, and was rolled back
exactly. Its acceptance cannot cover these changed bytes. This gate covers only the fresh manifest SHA-256
`c18bda5be46cdd9d2e366c5c12add44619f8f2fe38d93fd76f12040cd7b010dc` and does not itself apply anything.
P02 remains absent and blocked.

## Exact repair

Relative to the prior accepted definitions postimage, the repaired definitions postimage changes exactly:

- `#ds-d8-relationship-catalogue-v09` to `#ds-d8--relationship-signature-authority`;
- `#domainspec-v2-d18-relationship-definition-contract` to
  `#domainspec-v2-d18-relationship-non-collapse-test`.

No other accepted definitions byte changes. The index and registry postimages are byte-identical to their prior
accepted staged copies. The permanent validator parses every local `#...` link in staged D30, derives staged
heading anchors, and rejects any unresolved target before owner presentation.

| Canonical target | Operation | Current preimage SHA-256 | Fresh staged postimage SHA-256 |
| --- | --- | --- | --- |
| `projects/domainspec-v2/definitions/DEFINITIONS.md` | update | `cdbe251015bb6387fe0283b4d058b4fa85b048b253c7e65845e43fd2170b6006` | `92f31e0a888ff0e6bfadd6d0d79dbb7894b88c6ca435672ca57409989dd51bdf` |
| `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` | update | `ad41200bacb825bf11c009bfaef37f350beb3a307a55994ced42e194bc3fa744` | `d0c8032b45fb371d26b8b80eac9f9e576bec10a6ed2a63d275558212bc1a6bfb` |
| `projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json` | create | absent | `854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c` |

<a id="bmc-rel-d07-p01-contents-link-repair-apply-a-apply-exact-repaired-package"></a>
## `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE`

- Option kind: `action`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `authority`
- Owner gate: `definitions-governance:owner-acceptance`
- Evidence: exact rollback receipt, governance-defect receipt, repaired target bytes, fresh manifest, and pre-acceptance anchor validator.
- Rejection reasons: none at structural prefilter.
- Benefit: restores the already selected two-kind D30/index/registry package with evidence links that resolve.
- Risk: any live preimage, postimage, path, or anchor-target drift invalidates the package and requires regeneration plus renewed acceptance.
- Downstream effect: only after a separate exact application and canonical revalidation may P02 be prepared.

<a id="bmc-rel-d07-p01-contents-link-repair-apply-b-defer-repair"></a>
## `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-B-DEFER-REPAIR`

- Option kind: `defer`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: exact pre-attempt canonical state is restored and the repaired package remains sidecar-only.
- Rejection reasons: none at structural prefilter.
- Trade-off: avoids another authority mutation but keeps canonical D30/registry absent and P02 blocked; any source drift requires a new package.

<a id="bmc-rel-d07-p01-contents-link-repair-apply-c-stop-projection"></a>
## `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-C-STOP-PROJECTION`

- Option kind: `stop`
- Structural status: `admissible`
- Reversibility: `reversible`
- Hazard class: `reversible`
- Owner gate: none
- Evidence: Decision Gate preserves an explicit stop route after a failed acceptance edge.
- Rejection reasons: none at structural prefilter.
- Trade-off: terminates D07 projection with canonical definitions restored and no D30 registry or P02.

## Rejected constructions

- Stretching the prior exact acceptance over repaired bytes.
- Applying only definitions, index, or registry; applying against stale preimages; substituting paths or bytes.
- Treating an unresolved local anchor as non-blocking or repairing anchors after owner acceptance.
- Bundling repaired-package application with P02 preparation, selection, or packet mutation.

## Recommendation without selection

Recommend `BMC-REL-D07-P01-CONTENTS-LINK-REPAIR-APPLY-A-APPLY-EXACT-REPAIRED-PACKAGE` because the repair is
exactly bounded to two anchor fragments and the complete staged package now proves every D30 local anchor target
before the gate. This recommendation has `decision_effect: none` and does not select or apply A.

## Explain-path complexity ladder

Shared invariant: only the fresh exact manifest may be accepted; application remains atomic, preimage-bound,
anchor-valid, and separate from P02. All scenarios are hypothetical and have `decision_effect: none`.

### Low — exact restored preimages

The canonical definitions/index equal the restored preimages and the registry is absent. A accepts the fresh
three-target package for a later separate apply; B leaves canonical state unchanged and retains the candidate; C
ends projection. Demonstrates ordinary renewed acceptance; does not apply bytes or select P02.

### Medium — concurrent definitions change

Added complexity: another owner changes canonical definitions after this gate is prepared. A must fail closed on
the preimage mismatch even though both repaired anchors still exist; B leaves the candidate unapplied; C ends the
route. Demonstrates acceptance cannot cross source drift; does not authorize rebasing.

### Complex — heading drift plus partial-write pressure

Added complexity: a canonical heading changes so a repaired anchor would no longer resolve, while an apply edge
could write the index before definitions. A must re-run anchor resolution and atomic prechecks, then remain
unapplied or roll back the whole package on either failure; B preserves restored canonical state; C terminates.
Demonstrates pre-acceptance and pre-apply link/atomic invariants; does not define an application algorithm or P02.

## Claim ceiling

This candidate proves only that one exact repaired package, defer, and stop are structurally presentable and that
stale acceptance, partial/stale/substituted application, unresolved anchors, and bundled P02 are rejected. No
option is selected; canonical pre-attempt state remains restored; no repair apply, P02, packet/schema/main-validator
or relationship change, implementation, publication, release, deployment, or production action is authorized.
