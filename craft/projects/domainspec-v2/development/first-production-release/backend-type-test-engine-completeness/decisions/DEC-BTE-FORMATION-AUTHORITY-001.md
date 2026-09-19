---
decisionId: DEC-BTE-FORMATION-AUTHORITY-001
status: accepted
createdAt: 2026-07-21
acceptedAt: 2026-07-21T11:49:34-03:00
owner: DomainSpec formation-contract owner
selectedOption: option-2-versioned-yaml-owned-replacement
unblocks: invoke-design
blocks: source-implementation-until-design-and-machine-admission
gap: GAP-029
semanticAuthority: none
decisionAuthority: accepted-design-direction
---

# Decision Gate: Current-v1 Formation Authority

## Decision Needed

Which machine formation contracts must the current-v1 minted compiler enforce
for the four admitted kinds (`Entity`, `Event`, `Operation`, `Rule`)?

This is a blocker because the current profile declares per-kind JSON
`formation_schemas`, while the compiler validates node bodies through YAML
criteria and filters the base node-schema violations under `$.body`. No machine
decision currently authorizes that bypass.

## Concrete Failure

The current compiler can accept this Entity body through the YAML adapter:

```json
{"fields":[{"type":7,"identity":"yes"}]}
```

The profile-declared JSON Entity schema rejects it because `name` is missing,
`type` is not a string, and `identity` is not boolean. A passing compiler result
therefore does not currently prove conformance to all declared current-v1
formation contracts.

## Option 1 — Enforce Both Current Contracts

For current v1, execute the profile-declared JSON formation schema and the
kind's YAML criteria. Reject the node when either contract rejects it.

Consequences:

- preserves every current-v1 declared contract without silent retirement;
- makes the false-green control fail immediately;
- keeps JSON compatibility work narrow and separately versioned from successor
  breadth;
- may temporarily enforce overlapping rules until a later profile explicitly
  retires or replaces one representation;
- requires receipts to identify and digest both contracts and preserve each
  violation source.

## Option 2 — Admit A Versioned YAML-Owned Replacement

Create and owner-admit a new profile/formation contract that explicitly makes
YAML criteria the formation authority and retires each affected JSON body
schema through a compatibility or migration contract.

Consequences:

- creates one long-term formation-rule owner;
- requires a new versioned profile decision, explicit retirement map, migrated
  fixtures, compatibility results, and consumer/replay proof before the old JSON
  route can stop governing current sources;
- cannot be implemented as an in-place change to current v1;
- is broader and riskier than the first compatibility unit because the current
  YAML adapter does not yet enforce literal `required_structure`, closed
  Interface/Mapping domains, or structural Value Object equality.

## Recommendation

Choose **Option 1** for the current-v1 compatibility repair. It is the smallest
reversible step that respects already-declared contracts and prevents further
false greens. Option 2 remains a sensible successor-profile destination after
the exact criterion and migration contracts are designed and proved.

## Accepted Outcome

**Option 2 — Admit a versioned YAML-owned replacement.**

The user selected option `2` on 2026-07-21 after both options and their
trade-offs were presented. The selection overrides the recommendation above.
No additional user rationale was supplied, so none is inferred.

This decision authorizes Design to specify the replacement. It does **not**
make the present YAML adapter the live formation authority, retire any JSON
schema, change current v1 in place, or authorize implementation/admission.

### Current-v1 Compatibility Rule

Until a new machine profile/formation contract is implemented, validated, and
owner-admitted:

1. current v1 remains frozen under its existing profile declarations,
   including its four JSON `formation_schemas`;
2. current compiler passes cannot claim full current-v1 formation conformance
   while those declarations are bypassed;
3. the new YAML-owned path must use a distinct profile/contract version;
4. retirement must map every old JSON constraint to a YAML criterion or
   `required_structure` rule, or record an explicit owner-approved retirement
   with migration impact;
5. existing valid current-v1 fixtures must receive an explicit compatibility
   or migration result rather than being assumed compatible;
6. the JSON-invalid/YAML-valid Entity control must be rejected by the new
   compiler path before old JSON formation contracts can be retired;
7. old and new source/profile digests, violations, receipts, and replay results
   must remain distinguishable.

## Invariants Under Either Option

1. Do not widen or rewrite current v1 in place.
2. Reject the concrete JSON-invalid/YAML-valid Entity control at the compiler
   boundary.
3. Preserve exact contract paths, IDs, versions, digests, and violation origins
   through compiler evidence and replay.
4. Preserve current-v1 four-kind/three-relation/deterministic-view and
   cross-feature-rejection behavior.
5. Do not treat audit 002, this Markdown proposal, or an implementation patch as
   the decision authority. The accepted decision record is the authority.
6. Keep successor exact-13/exact-16 work, relationships, derivation, consumers,
   and release admission outside the first compatibility unit.

## Decision Record

Selection: **Option 2 — versioned YAML-owned replacement**

Accepted by: **user acting as DomainSpec formation-contract owner**

Accepted at: **2026-07-21T11:49:34-03:00**

Source of decision: **direct user response `2`**

Rationale/conditions: **Use one long-term YAML formation-rule owner through a
new versioned machine contract; preserve the compatibility rule above; do not
infer additional rationale or admit the replacement from this Markdown.**

Remaining blockers:

- Design must define the replacement profile, retirement map, compatibility
  and migration evidence, failure precedence, and digest propagation.
- Machine owners must implement, validate, and admit those contracts.
- `GAP-029` stays open for proof even though its human decision is resolved.
- `GAP-030` and all later exact-set, graph, execution, receipt, and consumer
  evidence remain open.

Deferred decisions:

- exact 16-family successor relationship admission remains routed after Design;
- `DEC-GCP-001` remains local to the optional key-and-door Rule semantic
  fixture.

Assumptions recorded: **none**

## Route After Selection

Run Invoke `design`. Design must consume Option 2 and define the versioned
machine replacement, retirement/migration contracts, failure precedence,
identity/digest propagation, and compatibility evidence before Plan can expose
an implementation SWU.
