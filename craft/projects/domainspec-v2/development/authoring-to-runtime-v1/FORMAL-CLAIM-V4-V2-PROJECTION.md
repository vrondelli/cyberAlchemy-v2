# Exact FormalClaim v4-to-v2 compatibility projection

Status: E02 candidate implementation. Authority effect: none.

## Boundary

The current TDE intake consumes `FormalClaimSourcePayload/v2`, while AlchLang
emits the definition-bound `FormalClaimSource/v4-candidate`. E02 forms a
deterministic compatibility view for the exact current AlchLang v4 subset. The
v2 artifact is not a second claim, a rewritten meaning, an admission, an
obligation, a provider request or evidence.

Only v4 sources produced by the existing exact FormalClaim lowering path are
accepted. That path already resolves current accepted BusinessMeaning,
acceptance, definition binding, formal-language profile and identity-algorithm
bytes. Stale or missing inputs fail before projection.

## Exact mapping

| v4 source | v2 target | Rule |
| --- | --- | --- |
| Claim id, version, owner, currentness and supersession | `claim` | Copied exactly. `source_digest` binds the complete v4 source bytes. |
| BusinessMeaning and acceptance exact refs | `business_binding` | Paths and SHA-256 digests copied; relation fixed to `formalizes`. |
| Formal-language profile exact ref | `formal_language_profile` | Path and SHA-256 copied. |
| Canonical proposition | `canonical_proposition` | Media type, representation, representation digest, semantic identity and semantic digest copied exactly. |
| Formal signature | `interpretation_environment.signature` | Encoded as deterministic reversible sort/function/predicate/constant declaration strings. |
| Definition binding | `interpretation_environment.imports` | Exact path and digest encoded as one definition-binding import. |
| Interpretation boundary | `interpretation_environment.configuration_bindings` | `interpretation_model_is_part_of_claim=false` and `join_stage=external-evaluation-context` retained literally. |
| Claim identity input digest and source-authority count | `configuration_bindings` | Copied as strings without recomputation or reinterpretation. |
| Claim ceiling | `claim_ceiling` | Copied exactly. |

The generated environment digest covers the complete deterministic environment
encoding. The v2 payload copies the exact selected identity-algorithm digest
and version from the validated v4 source: version `1` for BusinessMeaning/v1,
or version `3` for BusinessMeaning/v2. The predecessor v2 algorithm, which
included acceptance in claim identity, is rejected for current v2 meaning.
For version 3, reissuing the selected acceptance decision or changing the
external interpretation model preserves claim identity but changes exact
source and projection bytes; prior evaluation evidence is not current merely
because the claim identity is unchanged.

## Explicit representation losses

The projection records five target-shape losses. None is treated as semantic
permission to change the claim:

1. v2 has no first-class `definition_binding_ref`; the exact ref remains in the
   environment import and projection record.
2. v2 flattens the structured formal signature into a reversible string set.
3. v2 has no first-class interpretation-boundary block; both values remain in
   configuration bindings and the projection record.
4. v2 leaf references do not carry v4 byte sizes/current flags; the projection
   record retains the exact current source and target refs.
5. v2 omits the v4 `tde_compatibility` wrapper because it is the compatibility
   target itself.

The projection record therefore reports `semantic_loss_count: 0` and
`representation_change_count: 5`. A DomainSpec preservation binding names the
preserved components and the same representation losses. An attached v4 view
sets `v2-projection-attached` and points to the exact current payload without
changing FormalClaim identity.

## Currentness and negative controls

Recomputation binds the original Alch source, all FormalClaim inputs, v4 bytes,
v2 payload, projection record, preservation binding, attached v4 view and
trace. Mutations to the business digest, proposition, signature, definition
import, ceiling, loss count, preservation status or attached reference reject.
Changing proposition or ceiling source text creates a new FormalClaim identity
and new projection bytes; the adapter never repairs the mutation back to the
old meaning.

## Claim ceiling

This is a compatibility-shape construction only. It does not admit the claim
for TDE, derive obligations, execute or admit a provider, establish a theorem
or runtime result, join evidence, approve a product, publish, release, deploy
or grant authority.

## Open Questions

E03 owns provider request/result evidence and typed EVF joins. FormalClaim
admission remains an independent owner decision outside this construction.
