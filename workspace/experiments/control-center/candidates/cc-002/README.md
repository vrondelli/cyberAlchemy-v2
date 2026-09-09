# CC-002: separately identified control-center source candidate

The previous runtime manifest remains untouched. `candidate.json` binds its
lineage, records changed hashes, and identifies current selected source bytes.
It adds 12 explicit layout/build/test inputs to the legacy 40-source binding.

Run from repository root:

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/candidates/cc-002/validate.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/candidates/cc-002/validate.mjs
```

Six tests passed. Validator exit 1 is intentional: selected binding PASS is
independent from nested-runtime FAIL. See `RESULT.json` for captured evidence
and `REVIEW.md` for the source review, uncertainty and construction frontier.
Live reruns can report new drift; historical results do not override current bytes.

Remaining blocker: shared ARE profile has stale route-registry provenance and
no CA2-ROUTE-LOCATE policy. Reconcile that shared runtime dependency in its own
bounded construction slice, test it, then create the next candidate epoch.
Do not mutate CC-002 to inherit earlier evidence.

Budget bytes were not changed; navigation p95 remains 120 ms. Historical budget
equivalence cannot be established from the old hash alone. Full frontend legacy
selection remains unchanged and still targets its historical manifest. No global
test was silenced or relabeled. No native smoke or benchmark campaign was run.

This selected-source inventory is not transitive build closure, a frozen binary,
product approval, conformance, or operational authority. No previous PASS or
approval was inherited. Protocol-drift-tolerant fixture smoke, when eventually
run, will remain distinct from live-engine conformance.
