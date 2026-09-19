# TASK-UIR-VERIFY

## Smallest Working Unit Exemption

This closure-only `VERIFY` task retains one existing SWU. It may run only after
all producer/composition receipts are accepted.

## SWU-UIR-010 - Integrated Audit And Handoff

**Goal:** audit the complete v1 plus successor evidence machinery and emit a
bounded owner-route handoff.

**Dependencies:** accepted receipts for SWU-UIR-001 through 009 and 011 through
015; decision gate pass; unchanged generation-001 and DS-D8 digest evidence.

**Audit order:**

1. Validate schemas, canonical vectors, outcome/code parity, and 165-case base.
2. Validate two-sided reroute and corpus v1/v2 provenance.
3. Validate bounded-search completeness and absence prohibition paths.
4. Validate per-candidate portability counts and independent-positive `missing`.
5. Validate packet/owner-decision separation and no authority effect.
6. Validate dossier/index v1/v2 handles, predecessor chain, and replay.
7. Run prohibited-inference and write-boundary audits.
8. Emit integrated audit manifest/result and Task Session handoff only.

**Edge cases:** stale handles, changed authority digest, partial generations,
unknown versions, false absence, pooled portability, missing-to-fail drift,
packet decision embedding, and attempts to write prior evidence.

**Write scope:** integrated audit manifests/results and the SWU-UIR-010 Task
Session handoff only.

**Done criteria:** all mechanical acceptance criteria have receipts; remaining
empirical/authority gaps are explicit owner routes; no candidate or authority
status changes; package result is bounded to evidence machinery.

**Acceptance evidence:** integrated audit manifest/result, package and aggregate
validation output, immutable-generation digest audit, and SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/*.test.mjs
npm --prefix projects/domainspec-v2/impl run typecheck
npm --prefix projects/domainspec-v2/impl run validate
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** this task, all accepted SWU receipts, final decision
gate, implementation plan/layering, both generation index entries, and all
active gap-ledger selectors.

**Expected result:** shared SWU result shape with `pass`, `flag`, or `block`;
never promotion-ready by approximation.
