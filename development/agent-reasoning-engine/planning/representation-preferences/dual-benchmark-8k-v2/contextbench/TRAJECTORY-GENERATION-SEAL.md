# Fixed trajectory result sealing

Candidate offline adapter; no provider dispatch or benchmark score. The prospective runner must assign control and treatment to each frozen task ID before generation. Each slot carries task/arm identity, terminal status, explicit transport settlement, raw receipts, recomputed usage and ordered receipt/reservation consistency and 8K numerical bounds. Failures retain known costs and unknown-request reservations; undispatched slots must explicitly remain empty. Missing slots cannot seal.

The adapter uses the reviewed reference-only helper and requires guarded final persistence. It stores references, not duplicate trajectories. Hydration revalidates fixed identities, original bytes, accounting and summary. A complete generation seal never claims benchmark quality: native scoring remains separate.

## Open questions

The full runner must construct these records from settled transport and actual episode results, supply independently frozen task IDs and source hashes to the scorer, and preserve evidence when a slot cannot validate. Boolean settlement fields are caller evidence, not process supervision. Current construction tests cover mixed failures/unknown costs and stopped slots; complete source preparation and provider/scorer joins still need review before a live run. No failure may be replaced by a zero-cost placeholder.

The validator rejects positive usage marked undispatched, requires each ordered receipt reservation to match its dispatch, and checks known input/output against those reservations. It does not independently reconstruct request digests from prompts. The full runner/scorer must bind original request bytes, transport receipts and recycler dispatch identities before claiming exact live request admission; positional numerical agreement alone is not that proof.
