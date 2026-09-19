# N40 complexity examples

Decision effect: none. All scenarios are hypothetical and preserve one invariant: the evaluator proves only the exact digest-bound snapshot; current-head status is a separate claim.

## Low

One project is built once and immediately evaluated. Under A the receipt says the bound snapshot passes; it does not add “this is still the project head.” Defer leaves the policy unresolved; stop ends the route. Demonstrates the claim boundary, not a currentness vocabulary.

## Medium

A source changes after a passing receipt and a new graph is built. Under A the old receipt remains a valid historical result for the old snapshot, while any claim that it is current needs external evidence; the new snapshot needs a new sidecar and receipt. Defer prevents policy progression; stop ends the route. Adds state change, not TTL or supersession semantics.

## Complex

Two maintained branches each have internally consistent snapshots and passing receipts, while a deployment system chooses one branch as current. Under A both receipts remain valid for their snapshots and only the external owner may identify the deployed/current branch. Defer leaves consumers unable to rely on a standardized claim boundary; stop ends the route. Adds multiple authorities and concurrent snapshots, but does not define branch, deployment, or currentness schemas.

Coverage: 3/3 rungs; A/defer/stop covered evenly; unsupported claims: 0; decision effect: none.
