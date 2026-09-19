# Implementation Layering

## Dependency rule

Dependencies point inward. TDE source intake and neutral derivation cannot import language adapters, provider execution, EVF routing, or lifecycle orchestration.

## Layers

| Layer | Owns | Depends on | Forbidden dependency |
| --- | --- | --- | --- |
| L0 contracts | identities, typed states, schemas, neutral IR, receipts | no runtime | profile admission or tool execution |
| L1 intake/registry | currentness joins, total assessment interpretation, profile resolution | L0 | source meaning authorship |
| L2 derivation | neutral obligations/cases and preserved evaluator seam | L0-L1 | language syntax or theorem execution |
| L3 render/normalize | TypeScript, Python, Rust adapters and receipt normalization | L0-L2 | cross-lane mutation |
| L4 provider/EVF edges | exact runtime calls and Lean theorem handoff | L0-L3 contracts | policy admission or source mutation |
| L5 parity/closeout | all-lane joins, residue, ceilings, lifecycle receipts | explicit lower-layer receipts | hidden defaults or majority vote |

## Component placement

Profile descriptor/registry lives at L0-L1. FormalClaim intake lives at L1. Neutral derivation lives at L2. Each renderer is an independent L3 component. Provider bindings and EVF ports are L4. Parity and Task Session closeout are L5.

## Failure containment

A failure cannot skip a layer. L1 failure prevents derivation. L2 failure prevents rendering. One L3 lane cannot rewrite L2 or another lane. L4 failure stays a typed non-pass. L5 cannot widen any lower-layer ceiling.
