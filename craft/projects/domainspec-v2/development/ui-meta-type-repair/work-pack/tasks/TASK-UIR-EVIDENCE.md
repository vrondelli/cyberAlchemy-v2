# TASK-UIR-EVIDENCE

## SWU-UIR-005 - Reroute Receipt

Evaluate one normalized specimen independently under source and destination
contracts. Record both outcomes, versions, and owner handles. Test source reject
plus destination accept, source reject plus destination reject, pending external
owner, invalid specimen, and not-testable destination. Write only reroute
contracts/fixtures/results. Done: no receipt derives destination identity.

## SWU-UIR-006 - Corpus Receipt

Normalize pinned source facts without adding DomainSpec metadata. Preserve
revision/path/file/selector/excerpt/extractor digests and separate literal facts
from reviewer projections. Test moved selector, changed source digest, missing
excerpt, two styles, and `not-observed`. Write only corpus contracts/fixtures/results.
Done: every fact is reproducible or explicitly unavailable; no absence overclaim.

## SWU-UIR-007 - Relationship-Owner Packet

Build a finite packet from exact authority state, question, signatures, options,
examples, changed consequences, owner, closure evidence, and prohibited
inferences. Test incomplete owner, empty alternatives, endpoint-only evidence,
acknowledgement without decision, and superseded authority digest. Write only
packet contracts/fixtures/results. Done: packet validates and resolves nothing.

All three SWUs depend on 001; 005 also depends on 002. They may run in parallel
only with disjoint paths and separate receipts.
