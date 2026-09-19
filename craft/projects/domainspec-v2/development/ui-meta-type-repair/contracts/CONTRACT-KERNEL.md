# Contract Kernel v1

Status: development contract ratified by DEC-UIR-001. This is evidence
infrastructure, not candidate or definition authority.

## Identity Layers

1. `content_digest` is SHA-256 over `canonical-json-v1` bytes for the
   schema-declared semantic projection.
2. `record_id` is SHA-256 over contract ID, contract version, and content digest.
3. `generation_id` is SHA-256 over record ID, predecessor generation, and sorted
   unique input handles.

Volatile fields such as timestamps and storage paths affect none of the three.
Lineage affects `generation_id` only. A repeated record with the same
predecessor and handles produces the same generation ID and is a no-op.

## Canonical JSON v1

- Objects use recursively sorted keys in JavaScript UTF-16 lexical order.
- Arrays preserve order and must not be sparse.
- Strings are preserved byte-significantly after UTF-8 JSON encoding; no
  Unicode normalization is performed.
- Numbers must be JSON safe integers. Non-finite, fractional, and unsafe values
  fail validation.
- `null` is retained; missing fields are omitted; `undefined` is invalid.
- Only plain JSON objects are accepted.

Changing any rule requires a new canonicalization identifier. Existing digests
remain interpreted under the version recorded in their envelope.

## Files

- `contract-manifest.schema.yml`: semantic/volatile field declaration.
- `record-envelope.schema.yml`: immutable identity and lineage envelope.
- `normalized-result.schema.yml`: normalized outcome and versioned code refs.
- `canonical-json-v1.mjs`: executable development reference.
- `../fixtures/contracts/`: golden and malformed vectors.
