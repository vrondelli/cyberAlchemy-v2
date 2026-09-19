# Strict Task Context — SWU-FCL-001

This context admits one bounded behavior only: create and validate the
logic-neutral `FormalClaimSourcePayload/v2` envelope.

## Fixed semantics

- One immutable FormalClaim version owns one canonical proposition.
- The source binds one BusinessMeaning through one accepted `formalizes` edge.
- The proposition selects exactly one formal-language profile and one exact
  interpretation environment.
- The environment carries the signature, theories, imports, assumptions,
  universe/configuration bindings, and model-profile bindings needed to
  interpret the proposition.
- Cross-language expressions are separate versioned mappings; they are not a
  second canonical proposition in this payload.

## Forbidden source state

The source payload cannot carry proof terms, theorem declarations, proof
results, provider admission, executable profiles, derived decidability,
evidence, obligation discharge, promotion, publication, or release state.

## Execution boundary

Only the three material paths declared by `SWU-FCL-001` may be created. The
Task Session terminal receipt is the sole execution output. The one declared
validator command is acceptance-critical; its first nonzero exit blocks.

## Claim ceiling

Passing this unit establishes only `source-envelope-contract-implemented`. It
does not prove a theorem, establish business truth, discharge an obligation,
admit a provider, promote ontology state, merge, publish, release, or deploy.
