# Define context — closure evidence contract r1

## Goal

Define the smallest proposal-side contract that can carry the N37 proof inputs and return an evaluator-owned result for canonical `Entity --[emits]--> Event` target maximum one.

## Discovery baseline

The validated `closure-evidence-ownership-r1` research package is the discovery artifact. It proves a layered ownership pattern and the absence of an admitted end-to-end producer. No discovery waiver is used.

## Obligations

1. Preserve the N37 minimal incoming-closure selection exactly.
2. Keep the consumer's completeness declaration separate from generated graph provenance and evaluator verdicts.
3. Bind one exact snapshot without treating timestamps or file presence as currentness proof.
4. Return visible maximum violations as invalid even when closure is incomplete.
5. Return absence-based success as `not-evaluated-incomplete-closure` unless every N37 proof component is present.
6. Exclude packet mapping, canonical mutation, implementation, runtime Event behavior, and Event Sourcing.

## Interaction record

The user explicitly said to continue after the bounded ownership research. The research and N37 selection close the core intent; no unanswered interview question blocks Define. Standard Distill budget is assumed: one proposal track, Proposer and Balancer, two rounds, one reconciliation.
