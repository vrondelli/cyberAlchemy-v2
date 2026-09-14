# ARE interaction product: ready for review

The local host candidate joins the existing objective, requirements and learning
runtime behind one usable API and CLI. A user can submit a request, correct a
selected completed response, retain the correction within an explicit scope,
observe its later application, override it for a turn, and disable future reuse.
Objectives, requirements, lesson revisions and controls survive file-ledger restart.

Candidate: `89963afc8855fa652335cbc594e1233a268383b6de387f28ae4bd2a8d33337ff`.
Construction: ARE-INTERACTION-REVIEW-001. Runtime: Node v26.8.1.
Source closure: **1,102 exact files**. Product approval: not granted.

## Review it

From the CyberAlchemy-v2 checkout:

```sh
node implementation/agent-reasoning-engine/bin/are.mjs interaction demo
```

Review the seven requests and two restarts. The demonstration shows the original
failed literal check, an attributed correction, later supported lesson use,
reference-data separation, an interruption and restored requirements, a current
override, and persistent revocation. It labels all fixture responses and its one
fixture interpretation. No external model is invoked.

[README.md](README.md) documents the provider interface, JSON-lines commands,
state inspection and controls. A separate-process test loads a real local provider
module through the public CLI and inspects the saved response after reopening.
Provider output is treated as text; the adapter does not execute tool requests.

## Current product evidence

| Check | Result |
| --- | --- |
| Required intent, wrapper and evolution tests | **300/300 PASS**, zero failures, skips or cancellations |
| Joined review demonstration | **8/8 PASS**, seven fixture response calls, one fixture interpretation, two real file-ledger restarts |
| Exact source identity before/after required tests | **PASS**, 1,102 files |
| New isolated DomainSpec graph/system scaffold | **PASS**, two identical compilations and current-output comparison |
| New live model test | **NOT_RUN**; this epoch uses the injected provider contract and fixture demonstration |
| Serving activation/publication | Not performed |

The required suite includes 15 new host/product tests. It protects source-role
separation, quote/span rejection, exact completed-response attribution, explicit
retention and revisions, current overrides, invalidated sources, objective and
requirement recovery, revocation, concurrent requests, provider deadlines,
late/unknown delivery, corrupted logs, writer/scope conflicts, reference-context
budgeting, CLI reopening and rejection of silently ignored requirement seeds.

Two behavior fixes accompany the adapter: failed/interrupted completion cannot
earn a supported learning outcome from partial output, and the new reference
context is charged to the existing shared projection budget. Original request
text is preserved; selected reference data reaches the optional interpreter with
its role label. The September 5 product explanation now reflects current code.

## Broader baseline residue

The initial focused baseline passed 285/285 tests. During construction, a broader
package/root/real-reasoning run passed 828/832 tests. It exposed:

- Two existing `conversation-runtime/test/routed.test.mjs` failures: route gates
  instead of the expected internal routes/handler behavior.
- One existing `request-decision-router/test/route-availability-alch.test.mjs`
  failure: compiled lowering provenance differs from the frozen receipt.
- One `test/product.test.mjs` file-scan failure while another test removed a
  temporary profile directory under the source root.

A serial counterfactual check loaded git HEAD versions of the four modified
pre-existing runtime modules through a temporary Node loader, without replacing
working files. The same three routing/receipt failures remained; isolated product
tests passed. [BASELINE-RESULT.json](BASELINE-RESULT.json) records the original
module digests, commands' test counts and hashed logs. Those are repository-level
residue, not hidden passes or refreshed historical bindings. The broader run
preceded the final requirement-seed check; the final 300-test receipt binds the
current candidate's declared test contract, not whole-engine conformance.

## Reproduce and verify

```sh
python3 -B development/agent-reasoning-engine/planning/interaction-context/product-review-v1/validate.py
python3 -B development/agent-reasoning-engine/planning/interaction-context/product-review-v1/validate.py --test
```

The first command checks source hashes, current prototype output and saved test
evidence. The second reruns the required tests and public CLI demonstration, then
checks source identities again. `--freeze` is a construction operation for a new
snapshot; do not use it to conceal drift when reviewing this candidate.

Machine evidence: [TEST-RESULT.json](TEST-RESULT.json),
[SOURCE-MANIFEST.json](SOURCE-MANIFEST.json), [DEMO-RESULT.json](DEMO-RESULT.json).
Historical full-loop and live experiment receipts were preserved. Unrelated
in-progress benchmark and repository changes were not reverted or included in
this task's mutation scope.

## Open questions and operational residue

This candidate implements explicit host/user controls, not autonomous preference
extraction or demonstrated model-quality gain. Current literal outcomes do not
prove semantic task success. A production host/provider integration, broader
semantic evaluation, physical erasure and serving activation remain the separate
owners' work in [PLAN.md](PLAN.md#operational-support-and-deferred-residue).

The owner can review this exact tested candidate now. Review does not imply
product approval, admission, publication or activation. Authority effect: none.
