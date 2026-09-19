# TASK-UIR-RELATIONSHIP-DECISION

## Objective

Persist the four resolved DEC-UIR-010 owner choices in a separate,
digest-bound evidence record while preserving the decision-free transport
packet and unchanged DS-D8 authority.

## Smallest Working Units

### SWU-UIR-014 - Relationship Owner-Decision Generation

**Goal:** produce one immutable owner-decision generation linked to relationship
packet generation 001.

**Dependencies:** SWU-UIR-007 accepted receipt; DEC-UIR-010 resolved 4/4.

**Inputs and outputs:** packet generation/content handles, DS-D8 version/digest,
four selected option records, rationale, evidence obligations, prohibited
inferences, schema/evaluator/builder/tests, and owner-decision generation 001.

**Algorithm:**

1. Verify packet generation 001 and its recorded DS-D8 authority digest.
2. Require exactly one decision for each finite packet question and reject
   unknown/duplicate question or option IDs.
3. Encode Action-source as `route-open` with no admitted signature.
4. Encode Hook-Binding, Guard target set, and Binding endpoint as retained
   current authority outcomes.
5. Require `authority_effect = none` and explicit successor obligations for
   every route-open decision.
6. Reject any changed signature count, invented verb/target, DS-D1 promotion,
   or embedded packet mutation.
7. Build and publish an immutable digest-bound owner-decision generation.

**Edge cases and failure modes:** stale authority digest, missing question,
invalid option, duplicated decision, acknowledgement-only input, route-open
without obligations, and decision payload that claims authority mutation.

**Write scope:**

- `contracts/relationship-owner-decision.schema.yml`
- `evidence/relationship-owner-decision.mjs`
- `evidence/build-relationship-decision-generation.mjs`
- `fixtures/contracts/relationship-owner-decision-*`
- `evidence/results/relationship-decision/generation-001/`
- `tests/relationship-owner-decision.test.mjs`

**Done criteria:** all four choices are represented and traceable; packet
generation 001 and DS-D8 are unchanged; digest drift fails closed; replay is a
no-op.

**Acceptance evidence:** decision generation handles, packet/authority
before-after digests, complete option matrix, replay output, and SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-meta-type-repair/tests/relationship-owner-decision.test.mjs
npm --prefix projects/domainspec-v2/impl run validate:rels
```

**Execution owner:** subagent eligible or local-fallback.

**Context Builder anchors:** this task, relationship packet generation 001,
DEC-UIR-010 decision records, final decision gate, GAP-UIR-007, current
relationship authority selectors, and refresh report section "SWU-UIR-014".

**Expected result:** shared SWU result shape; route to SWU-UIR-015 after 012 and
013 pass.
