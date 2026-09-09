# ARE advanced reusable reasoning-state vertical

Status: implemented candidate plan
Authority effect: none

## Objective

Complete the remaining DSH-inspired structural mechanisms around the existing
append-only Reasoning State ledger:

```text
verified epoch
  -> branch | replay fixture | reduction | checkpoint policy
  -> reusable counterevidence
  -> portable compatible bundle
  -> exact provenance comparison
```

## Implemented contracts

1. Content-addressed branches append a branch record and seal a successor epoch
   without changing the base.
2. Replay-derived fixtures contain exact verified events and expected replay
   digest, with zero external calls.
3. Reductions append retained/omitted selection evidence and create a successor
   epoch; they never rewrite events or generate summaries.
4. Risk-scaled durability classifies observation, model request, continuation,
   and effect boundaries. Required file durability fails closed when the
   selected sink is process memory.
5. Counterevidence is first-class and reusable only under exact source
   currentness.
6. Portable epoch bundles bind their full event set and exact compatibility
   profile. Import creates a new local provenance event rather than copying or
   impersonating source ledger identities.
7. Provenance comparison reports exact differences across Context Envelope,
   selected dependencies, frontier, event selection, consumer, and request.

## Boundaries

- No model-generated reduction or hidden chain-of-thought is stored.
- No branch, fixture, counterevidence, import, or comparison grants authority.
- No automatic import, compaction, stale-lock repair, production semantic
  policy, distributed replication, acceptance, publication, or deployment is
  introduced.
