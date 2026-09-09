# Candidate definitions

These are research definitions, not canonical ARE definitions.

## Append-only Context Stream

An ordered, versioned, hash-linked sequence of immutable events that records
all inputs needed to reconstruct one consumer's context state. Corrections are
new events with explicit predecessor or supersession references.

## Frozen Context Prefix

An exact contiguous event interval whose sequence boundary, head digest,
projection-policy digest, selected-dependency digest, and renderer version are
fixed. It is the local unit of deterministic reuse.

## Context Projection Checkpoint

A non-authoritative cache entry containing the output of folding a Frozen
Context Prefix. It is valid only when all key fields match and is always
reconstructable from canonical events.

## Provider Prefix Cache Evidence

Provider-originated usage data showing that some request tokens were read from
cache for an exact observed request. Byte stability is a precondition or
explanation, not equivalent evidence.

## ARE Request Affinity Header

A complete canonical snapshot of every early request component that can change
prefix equality: provider, model, call configuration, system prompt, ordered
tool schemas, context renderer, and stable context-prefix identity. It is
logged on first use, change, resume, or explicit series change.

## Context Durability Barrier

A fail-closed checkpoint that makes all context events and the request affinity
header durable before a model request or external-effect-capable operation is
allowed to start. It prevents recovery from inventing whether the operation was
dispatched.

## Untrusted Context Import

A bounded immutable snapshot from another context stream whose source identity,
capture cut, and warning are explicit. Its contents cannot contribute authority,
permissions, or admitted observations without separate current-request evidence.
