# N04 Distill Validation

## Intent And Budget

- Mode: `Standard`; no explicit budget override.
- Target: the next smallest coherent consequential owner decision after N03.
- Budget: one proposal track, labelled Proposer/Balancer simulation, two rounds,
  one reconciliation, no additional delegated agent.

## Role Conversation Trace

### Round 1

- Proposer: make packet-wide inverse semantics the next owner decision.
- Balancer (`evidence-ceiling`): canonical DS-D8 authority already fixes inverse
  `none` for thirty signatures and generated `owned-by` for `owns`. Authored inverse
  or bidirectional alternatives contradict current authority rather than form viable
  choices.
- Reconciliation: preserve signature-bound inverse authority as an input; do not
  manufacture an inverse gate or mutate the packet.

### Round 2

- Proposer: decide self-edges and all ownership cycles together.
- Balancer (`independent-owner-boundaries`): D29 explicitly refuses to infer both
  self-edge and cycle policy. Reflexivity is a single-edge predicate; cycles over two
  or more distinct Entities require separate path semantics and evidence.
- Reconciliation: isolate only source Entity equals target Entity for one canonical
  `owns` fact in one admitted dimension.

## Smallest Coherent Unit

`OwnsSelfEdgePolicy`: classify a canonical dimension-bearing `owns` fact as reflexive
when source and target are the same Entity concept, then require one owner choice
between rejecting and allowing that fact.

The unit recomposes into the nonnumeric self-edge topology pass for `owns`. It does
not decide longer cycles, transitivity, existence, dimension vocabulary, per-fact
representation, inverse authorship, other relations, or runtime/numeric policy.

## Technique Trace

- abstraction guard: passed; semantic source/target identity, not storage;
- recomposition proof: passed through D06, D29 and the packet self-relations facet;
- requisite variety: reject, allow, defer and stop cover the bounded space;
- cognitive load: passed; one predicate and two actions;
- boundary object: stable reflexive-edge classification preserves owner authority;
- premortem: likely failure is treating self-edge selection as general cycle policy;
  an explicit hostile witness blocks that;
- frame expiry: reconsider if D06, D29, DS-D8 or the owns packet row changes;
- set tournament: skipped because only two source-compatible actions remain.

## Verdict

- Recursive rounds: `2/2`
- Unit selection: `pass`
- Overall Design: blocked at N04 owner gate
- Decision effect: `none`
- Authority effect: `none`
