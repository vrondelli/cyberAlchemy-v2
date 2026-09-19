# Reference-based final generation record

Candidate helper: `referenced-generation-seal.mjs`. It addresses the earlier final-write failure, where persisted slot results were duplicated into a combined record larger than the 8 MiB final reserve. Frozen run files and the reviewed lossless recovery remain unchanged.

`createReferencedSeal` receives the exact planned slot IDs, relative persisted-result paths and expected SHA-256 hashes, plus caller-supplied result validation and summary functions. It validates every source, computes the summary, checks lossless JSON serialization and checks final serialized size before returning a compact record. The record contains references, byte counts and summary rather than result payload copies. The caller still writes it through the shared stage persistence guard and reserved final write.

`hydrateReferencedSeal` requires the externally expected fixed slot bindings, verifies the record digest and each source, reruns result validation and recomputes the summary. Tampered summaries are rejected even if their envelope digest is recomputed. Source paths must remain inside a canonical root with no symlink components. These hashes bind integrity; they are not authentication or authority.

The helper does not invent missing slot results, enforce benchmark-specific usage semantics or recover an incomplete transport. The live wrapper must persist every fixed slot, including failures and undispatched placeholders, validate its domain schema/accounting and settle requests before constructing the final record. A partial result must remain labelled partial. Source files must remain available; pruning them invalidates hydration. No original seal is fabricated by this helper.

Three test groups pass. The large-data test writes 16 synthetic slot results totaling over 12.8 MB through the real shared stage guard, writes a final reference record smaller than 8 KiB and hydrates all payloads without loss. Other cases reject source drift, duplicate/mismatched slots, invalid result validation, path escape, symlinks, oversized summaries, lossy JSON values and both ordinary and rehashed summary tampering. Test directories are removed after verification.

## Remaining gates and open questions

Independent review and actual live-wrapper integration are pending. Which exact full-trajectory result schema supplies the validator and summary? How will interrupted/undispatched results be persisted and reconciled before final sealing? How will scorer entry points hydrate compact records under the same source freeze? These joins must be implemented and reviewed before live generation. This helper alone proves neither benchmark completion nor improved model quality/token efficiency.
