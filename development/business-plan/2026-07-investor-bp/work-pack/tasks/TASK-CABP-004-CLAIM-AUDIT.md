# TASK-CABP-004: Provisional Claim Audit

## Objective

Create `claim-audit.md` as the cross-artifact gate before any shareable HTML
rewrite.

- Slice: S-004
- Layer: L2
- Wave: W3
- Dependencies: SWU-CABP-005.
- Write scope: `claim-audit.md` only.

## Source Contracts

Approved findings, accepted registry/source trace/financial assumptions/operating
plan, and rewritten `business-plan.md`.

## SWU-CABP-006

- Goal: classify every load-bearing Markdown claim and freeze the HTML claim
  contract.
- Ordered method:
  1. inventory claims by BP section;
  2. classify each as repository-supported, externally documented,
     unwitnessed candidate, proposed protocol, missing evidence, or forbidden;
  3. apply the separate monetary taxonomy;
  4. attach source handles and scope;
  5. record allowed outward wording;
  6. record demotion/repair/next-proof route;
  7. define the exact BP content allowed to appear in HTML;
  8. set provisional verdict `pass-for-html`, `flag`, or `block`.
- Required claim families: company status, buyer/payor, trigger, offer,
  deliverables, work change, money mechanisms, competition, technology,
  scenarios, pricing, team, financing, risks, and next proof.
- Failure modes:
  - detached source list without adjacent mapping;
  - evidence status and monetary status conflated;
  - a disclaimer used to excuse a promoted headline;
  - HTML contract omits a load-bearing BP claim.
- Done criteria: every load-bearing Markdown claim is classified and HTML has a
  bounded content contract.
- Acceptance evidence: complete claim matrix and no unresolved `unknown`
  classification.
- Verification:
  - `git diff --check -- claim-audit.md`
  - review matrix coverage against every H2 in `business-plan.md`.
- Execution owner: `task-session`, local fallback permitted.
- Handoff note: do not edit the BP while auditing. A BP defect reroutes to
  SWU-CABP-005.

## Synchronization

Only `pass-for-html` unlocks SWU-CABP-007.

## Expected Result Shape

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: <native capability>
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: [<path>]
validation: [<check and result>]
blockers: [<blocker or none>]
residue: [<residue or none>]
reroute: <owner or none>
handoff_note: <next coordinator action>
```
