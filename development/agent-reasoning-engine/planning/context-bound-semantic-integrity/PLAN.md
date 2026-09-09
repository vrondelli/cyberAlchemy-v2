# Context-bound semantic integrity repair

## Objective

Make a production-materialized semantic request retain the exact Context
Envelope reasoning state through evaluation and into its Reasoning Receipt,
without changing historical unbound receipt bytes.

## Failure being repaired

The Context Envelope adapter sealed a bound `ProblemFrame`, entry gate, and
`ContextEnvelopeBinding`, but the reducer verified only each record's local
digest. A separately resealed replacement frame could therefore remain locally
valid while violating the cross-record binding. Receipt assembly also emitted
the legacy unbound shape and omitted the context epoch and envelope identities.

## Runtime contract

1. A request without `context_envelope_binding` retains the historical
   evaluator behavior and exact receipt bytes.
2. A request with `context_envelope_binding` must verify the binding record and
   exact agreement among its frame, entry gate, authority snapshot, Context
   Envelope identity, Context Item digests, freshness, and claim ceiling.
3. Any disagreement returns `InvalidInput` before catalog reduction.
4. A context-bound Reasoning Receipt adds the context epoch, Context Envelope,
   Context Envelope binding, and selected Context Item digests.
5. The added fields remain non-authorizing and deterministic.

## Validation

- historical unbound receipt digest remains byte-identical;
- bound frame and entry-gate substitution fail closed;
- semantic input materialization remains deterministic;
- Codex semantic completion and receipt-constrained continuation pass;
- the full ARE package suite, deterministic ontology replay, and local semantic
  canary pass with no skipped tests.

## Residue

This repair does not adopt a production semantic-domain catalog, enable semantic
evaluation by default, grant effect authority, or close delivery acknowledgement,
cross-process coordination, durable Session, publication, or deployment gaps.
