# Design Distill validation

- Mode: Standard role simulation.
- Verdict: pass, subject to the independent Design extractor/selection scripts.
- Smallest coherent architecture unit: explicit-root structural CLI boundary
  shared by `lint` and `receipt`.

## Role trace

| Role | Claim or objection | Reconciliation |
| --- | --- | --- |
| Proposer | Reuse current development CLI behind a new binary. | Rejected: it exposes fallback/write/internal commands and source-run coupling. |
| Proposer | Create a separate package with curated pure modules and closed adapters. | Accepted as the smallest durable boundary. |
| Balancer — authority | C2 evaluation may make the CLI its own oracle. | Require external expected/executed receipts and independent owner bindings. |
| Balancer — scope | Release operations could dominate the CLI architecture. | Model release artifacts as downstream interfaces; keep product runtime read-only. |
| Balancer — evolution | A plugin framework might ease future profiles. | Deferred: versioned registries/decoders are sufficient for the confirmed evolution pressure. |

## Recomposition proof

Invocation → explicit project source set → owner-bound profile → structural
evaluation → closed result is end-to-end and independently falsifiable. Package,
build, security, resource, compatibility, archive, and pilot layers harden that
same path rather than creating unrelated products. The unit can later join the
July product as one foundation, while excluded runtime/factory/UI work stays separate.

## Premortem

Most likely failure: the new package wraps current mechanisms but accidentally
inherits fallback paths, open decoding, environment leakage, or self-attesting
receipts. Guardrail: new closed interfaces plus killed boundary mutants before
command implementation.

## Frame expiry

Re-run Design if profile topology, supported commands/runtime, writes, data class,
resource envelope, or release channel changes.

