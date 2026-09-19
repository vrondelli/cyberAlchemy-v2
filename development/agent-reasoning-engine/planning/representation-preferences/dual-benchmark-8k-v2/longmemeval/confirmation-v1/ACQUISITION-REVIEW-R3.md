# Independent acquisition review — R3

**Approved exact-host amendment** for a separately recorded `source-s-v2` attempt, subject to all R2 runtime conditions. The reviewed wrapper SHA is `f7f2b6b410d586a81a7c4b40d27f56a1ad0c902ffe19e7ef54d3b3afc73122cc`.

Removing only the added `us.aws.cdn.hf.co` allowlist entry reconstructs the exact R2 wrapper hash `5fe4a1f11d244044b4799357b03f6b491c7531ec3b43737047278025aa780aee`. No other wrapper code changed. The projector hash remains unchanged. The new regression accepts only the exact HTTPS host and rejects HTTP, a lookalike suffix, credentials and a nonstandard port. All **27 synthetic tests pass under a 64 MiB Python address-space limit**.

The retained `source-s-v1.attempt.json` records failure, zero body bytes returned to the projector, zero provider calls and one attempted chain. It remains failed evidence, not a successful extraction or a marker to overwrite. The coordinator's HEAD-only provenance for the added hostname is documented in [DELIVERY-HOST-AMENDMENT.md](DELIVERY-HOST-AMENDMENT.md); this reviewer performed no network probe, transfer, provider call or real extraction.

HTTPS/TLS checks, exact pinned source endpoint, full size/SHA verification, redirect ceiling, wall deadline, rate/memory/output limits, notice binding and native storage floors remain unchanged. Approval does not authorize lowering a storage floor, broadening to wildcard hosts, skipping integrity verification or retrying inside an existing attempt.

## Exact reviewed hashes

| Artifact | SHA-256 |
| --- | --- |
| acquire_source.py | `f7f2b6b410d586a81a7c4b40d27f56a1ad0c902ffe19e7ef54d3b3afc73122cc` |
| project_stream.py | `c6699be296300998834104880bd434152ec850cf76a318e75a55f7545f69c794` |
| test_delivery_host.py | `4f645b67175e03e25d238ffeff03a534f1d89e9021732962f3da681e44aa082f` |
| DELIVERY-HOST-AMENDMENT.md | `6bce52d9dd1a3031febe21cfebce1b708adae7eb549ad73a497b320487556ead` |
| source-s-v1.attempt.json | `64bb53f61b59934f7e5e364c96fffadfd97e2ff7d1eef1450935094dbaa4c043` |

## Open questions

All [R2 runtime conditions](ACQUISITION-REVIEW-R2.md) continue to apply. Real source schema and EOF verification, target-tokenizer long-history qualification, sealed reference compatibility and eventual model outcomes remain pending. This amendment makes no acquisition-success or benchmark-success claim.
